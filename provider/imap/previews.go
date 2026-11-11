package imap

import (
	"strconv"

	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
	"github.com/migadu/go-imap/imapclient"
)

// Message previews come from the server (RFC 8970 PREVIEW) in two steps, so a
// listing costs the server nothing it does not have to hand:
//
//   - a listing asks PREVIEW (LAZY), which a server answers only when it can
//     without delay (a Sora backend: when the body is on its disk) and NIL
//     otherwise. Those messages are marked PreviewPending;
//   - the frontend then asks for those few, in the background, through
//     Previews, which asks PREVIEW without LAZY.
//
// Both keep what they read in the session's PreviewCache, so a message's
// preview is asked for once per session.

// listingPreview is the PREVIEW item a listing asks for: LAZY, and only of a
// server that offers PREVIEW.
func (p *IMAPProvider) listingPreview() *imap.FetchItemPreview {
	if p.client == nil || !p.client.Caps().Has(imap.CapPreview) {
		return nil
	}
	return &imap.FetchItemPreview{Lazy: true}
}

// convertListedMessage is convertIMAPMessage for a row of a listing whose FETCH
// asked for previews when preview is true.
func (p *IMAPProvider) convertListedMessage(msg *imapclient.FetchMessageBuffer, mailbox string, preview bool) provider.Message {
	m := p.convertIMAPMessage(msg, mailbox)
	if !preview {
		return m
	}
	m.PreviewScope = strconv.FormatUint(uint64(p.selectedUIDValidity), 10)
	if msg.Preview != nil {
		m.Preview = *msg.Preview
		p.rememberPreview(mailbox, msg.UID, *msg.Preview)
	} else if text, ok := p.keptPreview(mailbox, msg.UID); ok {
		m.Preview = text
	} else {
		m.PreviewPending = true
	}
	return m
}

// Previews answers PreviewProvider: the previews of the messages among ids,
// from the session's cache or asked of the server without LAZY. The messages
// the server answers are kept even when the command then fails, so a slow or
// refused message costs only itself.
func (p *IMAPProvider) Previews(mailbox string, ids []provider.MessageID) (map[string]string, string, bool, error) {
	if p.client == nil || !p.client.Caps().Has(imap.CapPreview) {
		return nil, "", false, nil
	}
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, "", true, err
	}
	scope := strconv.FormatUint(uint64(p.selectedUIDValidity), 10)

	previews := make(map[string]string, len(ids))
	var missing imap.UIDSet
	for _, id := range ids {
		uid, ok := id.(IMAPUID)
		if !ok {
			continue
		}
		if text, ok := p.previews.Get(mailbox, scope, uid.String()); ok {
			previews[uid.String()] = text
		} else {
			missing.AddNum(imap.UID(uid))
		}
	}
	if len(missing) == 0 {
		return previews, scope, true, nil
	}

	fetched, err := p.client.Fetch(missing, &imap.FetchOptions{
		UID:     true,
		Preview: &imap.FetchItemPreview{},
	}).Collect()
	for _, f := range fetched {
		if f.Preview == nil {
			continue
		}
		id := IMAPUID(f.UID).String()
		p.previews.Put(mailbox, scope, id, *f.Preview)
		previews[id] = *f.Preview
	}
	return previews, scope, true, err
}

// SharePreviews has the provider keep the previews it reads in c, the
// session's cache: see provider.PreviewCache.
func (p *IMAPProvider) SharePreviews(c *provider.PreviewCache) {
	p.previews = c
}

// rememberPreview keeps a preview a listing of the selected mailbox carried.
func (p *IMAPProvider) rememberPreview(mailbox string, uid imap.UID, text string) {
	if uid == 0 || p.client == nil || !p.isSelected(mailbox) {
		return
	}
	p.previews.Put(mailbox, strconv.FormatUint(uint64(p.selectedUIDValidity), 10), IMAPUID(uid).String(), text)
}

// keptPreview is the preview the session read earlier for a message of the
// selected mailbox, if any.
func (p *IMAPProvider) keptPreview(mailbox string, uid imap.UID) (string, bool) {
	if uid == 0 || p.client == nil || !p.isSelected(mailbox) {
		return "", false
	}
	return p.previews.Get(mailbox, strconv.FormatUint(uint64(p.selectedUIDValidity), 10), IMAPUID(uid).String())
}
