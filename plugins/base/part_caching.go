package alpsbase

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// rawPartCacheControl lets the browser keep what /raw serves, and only the
// browser: a shared cache must never hold someone's mail. no-cache makes it
// ask before every reuse, because the URL does not say whose mail it is, nor
// under which UIDVALIDITY its UID was given: another account signed in to the
// same browser, or a mailbox deleted and made again, has the same URLs for
// other mail. Asking is cheap, as the answer is a 304 that fetches nothing.
const rawPartCacheControl = "private, no-cache"

// rawPartFormat is part of every ETag /raw gives. Raise it when what /raw
// sends for a part changes (its type, its decoding, its disposition): a 304
// refreshes only the headers it carries, so without a new ETag a browser
// would keep the copy it was sent the old way.
const rawPartFormat = 1

// rawPartETag names what a /raw request answers: this URL, for this account,
// in its mailbox under the given UIDVALIDITY. A UID is never given to another
// message under one UIDVALIDITY, so while the ETag stays the same the part
// does too. It is empty when the mailbox's UIDVALIDITY is not known (zero).
func rawPartETag(ctx *alps.Context, validity uint32) string {
	if validity == 0 {
		return ""
	}
	sum := sha256.Sum256(fmt.Appendf(nil, "%d\x00%s\x00%d\x00%s", rawPartFormat, ctx.Session.Username(), validity, ctx.Request.URL.RequestURI()))
	return `"` + hex.EncodeToString(sum[:12]) + `"`
}

// mailboxUIDValidity is a mailbox's UIDVALIDITY, from the session cache or
// else from a STATUS. It is zero for a provider that has none. A mailbox the
// server cannot report on is not an error here: the request goes on and
// fails, if it must, the way it always has.
func mailboxUIDValidity(ctx *alps.Context, mailbox string) (uint32, error) {
	if mailbox == allMailboxes {
		return 0, nil
	}
	key := "uidvalidity:" + mailbox
	if cached, ok := ctx.Session.Cache().Get(key); ok {
		return cached.(uint32), nil
	}
	var validity uint32
	err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		// Asked again with the connection held: the inline images of a
		// message are asked for at once, and the request that held it
		// before this one may have just read it.
		if cached, ok := ctx.Session.Cache().Get(key); ok {
			validity = cached.(uint32)
			return nil
		}
		status, err := p.GetMailboxStatus(mailbox)
		if err != nil {
			return err
		}
		validity = status.UIDValidity
		// Dropped with the rest of the cache when a mailbox is made, deleted
		// or renamed here. A mailbox made again by another client is noticed
		// once this expires, or once a part is read from it again (see
		// partUIDValidity).
		ctx.Session.Cache().Set(key, validity)
		return nil
	})
	if err != nil {
		if errors.Is(err, alps.ErrMailProviderUnavailable) || ctx.Request.Context().Err() != nil {
			return 0, err
		}
		ctx.Server.Logger().Debugf("No UIDVALIDITY for %q: %v", mailbox, err)
		return 0, nil
	}
	return validity, nil
}

// partUIDValidity is the UIDVALIDITY a part p has just read from mailbox was
// read under. A provider that says which UIDVALIDITY it has the mailbox
// selected under knows it for certain, whichever request did the read, and
// the session cache takes it from there in place of what it held, which can
// be older. From another provider it is what the request looked up, or zero.
func partUIDValidity(ctx *alps.Context, p provider.MailProvider, mailbox string, looked uint32) uint32 {
	type selectionReporter interface {
		SelectedUIDValidity(mailbox string) uint32
	}
	sr, ok := p.(selectionReporter)
	if !ok {
		return looked
	}
	validity := sr.SelectedUIDValidity(mailbox)
	if validity == 0 {
		return looked
	}
	ctx.Session.Cache().Set("uidvalidity:"+mailbox, validity)
	return validity
}

// setRawPartCaching marks an answer from /raw as cacheable by the browser.
func setRawPartCaching(h http.Header, etag string) {
	h.Set("Cache-Control", rawPartCacheControl)
	if etag != "" {
		h.Set("ETag", etag)
	}
}

// etagListed reports whether an If-None-Match header names etag. Weak
// validators compare equal to strong ones here, as RFC 9110 has it for
// If-None-Match. "*" is not taken as a match: the 304 would then claim the
// part exists, which nothing here has checked.
func etagListed(header, etag string) bool {
	for _, candidate := range strings.Split(header, ",") {
		if strings.TrimPrefix(strings.TrimSpace(candidate), "W/") == etag {
			return true
		}
	}
	return false
}
