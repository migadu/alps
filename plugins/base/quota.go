package alpsbase

import (
	"errors"
	"net/http"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// quotaAnswer is what GET /quota answers. Supported says that the mail server
// keeps quotas. Used and Limit, in bytes, are there when one of them limits
// the storage of the account's mail, and left out when none does.
//
// Neither "no" is a failure. A server without quotas, or with none on
// storage, holds as much mail as it is given, and there is nothing to show
// for it: a bar drawn against no limit would say the mailbox is empty.
type quotaAnswer struct {
	Supported bool   `json:"supported"`
	Used      *int64 `json:"used,omitempty"`
	Limit     *int64 `json:"limit,omitempty"`
}

// handleQuota answers how much of its storage the account's mail takes (see
// provider.QuotaReader).
//
// It is read on the background connection, as the check for new mail is:
// nobody is waiting on it, and the session's own connection keeps the folder
// it has selected. It is read from the server each time, as the counts are:
// what the session last read is out of date after every message that came,
// went or was sent, and the asker reads it no more often than it needs to.
func handleQuota(ctx *alps.Context) error {
	var answer quotaAnswer
	err := ctx.Session.DoBackgroundMail(ctx.Request.Context(), func(p provider.MailProvider) error {
		// Afresh: f runs again on the session's own connection when the
		// background one fails under it.
		answer = quotaAnswer{}
		reader, ok := p.(provider.QuotaReader)
		if !ok {
			return nil
		}
		kept, err := reader.HasQuotas()
		if err != nil || !kept {
			return err
		}
		answer.Supported = true
		quota, err := reader.StorageQuota()
		if err != nil || quota == nil {
			return err
		}
		answer.Used, answer.Limit = &quota.Used, &quota.Limit
		return nil
	})
	// A refusal from the mail server is mapped as the folder verbs map theirs,
	// its own words kept for the log. Anything else is left to the server's
	// handler, which signs out a session whose password the server no longer
	// takes and says when the server cannot be reached.
	var refused *imap.Error
	if errors.As(err, &refused) {
		return respondMailboxError(ctx, "read quota", err)
	}
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, answer)
}
