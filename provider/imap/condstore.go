package imap

import (
	"errors"
	"fmt"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// TrackChanges: see provider.ChangeTracker. It turns on CONDSTORE (RFC 7162)
// where the server lists it, with ENABLE (RFC 5161) where the server takes
// it. Without ENABLE, the first STATUS asking for HIGHESTMODSEQ turns it on
// (RFC 7162 §3.1).
//
// The server's own list is read, not CapSet.Has: the go-imap client takes
// IMAP4rev2 to imply CONDSTORE and QRESYNC, and RFC 9051 includes neither.
//
// QRESYNC is not enabled, even where the server lists it. Under it the
// server tells of messages taken out of the selected mailbox with VANISHED
// instead of EXPUNGE (RFC 7162 §3.2.10), and the go-imap client keeps the
// selected mailbox's message count from EXPUNGE alone: the count would stay
// as it was, and what reads it by number (the last message's UID that keys
// the conversations, a listing by number) would read past the end. What
// QRESYNC adds beside that, a SELECT that brings a mailbox up to date, is not
// something alps asks.
func (p *IMAPProvider) TrackChanges() (bool, error) {
	caps := p.client.Caps()
	if caps == nil {
		return false, p.lostIf(errors.New("imap: the server's capabilities could not be read"))
	}
	listed := func(c imap.Cap) bool {
		_, ok := caps[c]
		return ok
	}
	// A server with QRESYNC has CONDSTORE (RFC 7162 §3.2), listed or not.
	if !listed(imap.CapCondStore) && !listed(imap.CapQResync) {
		return false, nil
	}
	if listed(imap.CapEnable) || listed(imap.CapIMAP4rev2) {
		var enabled imap.CapSet
		err := p.answeredWithin("ENABLE", func() error {
			data, err := p.client.Enable(imap.CapCondStore).Wait()
			if data != nil {
				enabled = data.Caps
			}
			return err
		})
		if err != nil {
			var refused *imap.Error
			if errors.As(err, &refused) {
				return false, nil
			}
			return false, p.lostIf(err)
		}
		if _, ok := enabled[imap.CapCondStore]; !ok {
			return false, nil
		}
	}
	p.condstore = true
	return true, nil
}

// statusItems is what a STATUS of a mailbox asks for: the counts, and
// HIGHESTMODSEQ where changes are tracked (see TrackChanges).
func (p *IMAPProvider) statusItems() *imap.StatusOptions {
	if !p.condstore {
		return mailboxStatusItems
	}
	items := *mailboxStatusItems
	items.HighestModSeq = true
	return &items
}

// ChangedFlags: see provider.ChangeTracker. One UID FETCH of the messages
// named, for their flags, with CHANGEDSINCE (RFC 7162 §3.1.4): the server
// answers only the messages whose flags changed after since.
func (p *IMAPProvider) ChangedFlags(mailbox string, ids []provider.MessageID, since uint64) ([]provider.Message, error) {
	if !p.condstore {
		return nil, errors.New("imap: changes are not tracked on this connection")
	}
	if since == 0 {
		return nil, errors.New("imap: no change to compare with")
	}
	var uids imap.UIDSet
	for _, id := range ids {
		uid, ok := id.(IMAPUID)
		if !ok {
			return nil, fmt.Errorf("imap: %v is not a UID", id)
		}
		uids.AddNum(imap.UID(uid))
	}
	if len(uids) == 0 {
		return nil, nil
	}
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, err
	}
	msgs, err := p.client.Fetch(uids, &imap.FetchOptions{UID: true, Flags: true, ChangedSince: since}).Collect()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch the flags changed since %d: %w", since, err)
	}
	changed := make([]provider.Message, 0, len(msgs))
	for _, msg := range msgs {
		// A FETCH the server sends unasked of another message in the set,
		// for a change while this one ran, is answered to this command.
		if msg.UID == 0 {
			continue
		}
		flags := make([]provider.Flag, len(msg.Flags))
		for i, f := range msg.Flags {
			flags[i] = provider.Flag(f)
		}
		changed = append(changed, provider.Message{ID: IMAPUID(msg.UID), Flags: flags})
	}
	return changed, nil
}
