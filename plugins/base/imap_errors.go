package alpsbase

import (
	"errors"
	"net/http"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
)

// mailboxErrorStatus turns an IMAP failure into the HTTP status and stable slug
// the UI can act on.
//
// Every mailbox mutation used to answer `500` with `err.Error()` in the body,
// which was wrong twice over.
//
// Wrong as a STATUS, because the most likely way these calls fail is not a
// server fault at all: creating or renaming a folder onto a name that already
// exists is an ordinary user mistake and the server said so, with
// `[ALREADYEXISTS]`. A 500 gives the client nothing to distinguish "pick
// another name" from "the mail server is down", so the UI could only fall back
// to silence — which is exactly what it did.
//
// Wrong as a BODY, because `err.Error()` on an *imap.Error renders the remote
// server's own status text verbatim. That is a description of the backend's
// software and configuration, echoed to anyone who can reach the web UI, in
// service of a string no user could act on anyway. The detail belongs in the
// log; the client gets a slug it can translate.
func mailboxErrorStatus(err error) (int, string) {
	var imapErr *imap.Error
	if !errors.As(err, &imapErr) {
		return http.StatusInternalServerError, "server_error"
	}

	switch imapErr.Code {
	case imap.ResponseCodeAlreadyExists:
		return http.StatusConflict, "already_exists"
	case imap.ResponseCodeNonExistent:
		return http.StatusNotFound, "not_found"
	case imap.ResponseCodeNoPerm:
		return http.StatusForbidden, "forbidden"
	case imap.ResponseCodeCannot:
		// The server understood the request and refuses it permanently — an
		// illegal name, a delimiter in the wrong place. Retrying cannot help,
		// so it is the client's error, not ours.
		return http.StatusBadRequest, "cannot"
	case imap.ResponseCodeOverQuota:
		return http.StatusInsufficientStorage, "over_quota"
	default:
		return http.StatusInternalServerError, "server_error"
	}
}

// respondMailboxError writes the mapped status and slug, and logs what actually
// happened so the detail is not lost by being kept out of the response.
func respondMailboxError(ctx *alps.Context, op string, err error) error {
	status, slug := mailboxErrorStatus(err)
	ctx.Server.Logger().Printf("%s failed: %v", op, err)
	return ctx.JSON(status, map[string]string{"error": slug})
}
