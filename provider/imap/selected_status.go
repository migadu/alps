package imap

import (
	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// keptStatus is the status the last STATUS answered of the mailbox selected
// then, with what was known of that selection: which select of it it was, and
// how many arrivals and removals the server had told of (mailboxNews.told).
type keptStatus struct {
	mailbox string
	status  provider.MailboxStatus
	selects uint64
	told    uint64
}

// statusOf asks the server for a mailbox's status with STATUS, and keeps the
// answer when the mailbox is selected here and changes are numbered, for
// selectedStatus to answer from next time.
func (p *IMAPProvider) statusOf(name string) (*provider.MailboxStatus, error) {
	selected := p.condstore && p.news != nil && p.isSelected(name)
	var told uint64
	if selected {
		// Read before the STATUS is sent: news told while it runs may be
		// newer than its answer, and makes the next check ask again.
		told = p.news.told.Load()
	}
	selects := p.selects
	status, err := mailboxStatusOf(p.client.Status(name, p.statusItems()))
	if selected {
		p.kept = nil
		if err == nil && status.HighestModSeq != 0 {
			p.kept = &keptStatus{mailbox: name, status: *status, selects: selects, told: told}
		}
	}
	return status, err
}

// isSelected reports whether mailbox is the one selected on the connection.
func (p *IMAPProvider) isSelected(mailbox string) bool {
	mbox := p.selectedMailbox()
	return mbox != nil && mbox.Name == mailbox
}

// selectedStatus answers the status of mailbox, selected on this connection,
// without a STATUS, where nothing changed in it since the status kept from
// the last one (statusOf). RFC 9051 §6.3.11 asks a client not to send STATUS
// for the mailbox it has selected: the server tells it what changes there,
// when it is asked with a NOOP.
//
// A NOOP has the server tell of the messages that arrived or went (EXISTS,
// EXPUNGE), which the client hears before the NOOP's answer and counts
// (mailboxNews.told). A flag changed, which may move the unread count, is
// told too, but the client hands that news to a goroutine of its own, which
// may run after the NOOP's answer. So beside the NOOP, in the same round
// trip, a UID FETCH asks which messages changed since the change number kept
// (CHANGEDSINCE, RFC 7162 §3.1.4): every change to a message numbers it
// anew, the connection's own included, and a message stored here is a new
// one.
//
// The kept status still stands when no message was told of as arriving or
// going, the client counts as many messages as it did, and the FETCH answers
// none. A message that arrived and went again before the server told of it
// leaves the mailbox holding what it held, and the status kept says so,
// although the mailbox's UIDNEXT and change number moved. Anything else is
// asked with a STATUS, and kept again. The connection must have numbered
// changes from its start (TrackChanges), and hear the server unasked (made
// by CreateFactory).
func (p *IMAPProvider) selectedStatus(name string) (*provider.MailboxStatus, bool) {
	kept := p.kept
	if kept == nil || !p.condstore || p.news == nil || kept.mailbox != name || kept.selects != p.selects ||
		!p.isSelected(name) || p.news.told.Load() != kept.told {
		return nil, false
	}
	noop := p.client.Noop()
	changed := p.client.Fetch(imap.UIDSet{imap.UIDRange{Start: 1, Stop: 0}},
		&imap.FetchOptions{UID: true, Flags: true, ChangedSince: kept.status.HighestModSeq})
	noopErr := noop.Wait()
	msgs, fetchErr := changed.Collect()
	if noopErr != nil || fetchErr != nil || len(msgs) > 0 {
		return nil, false
	}
	if mbox := p.selectedMailbox(); mbox == nil || mbox.Name != name || mbox.NumMessages != kept.status.NumMessages ||
		p.news.told.Load() != kept.told || p.selects != kept.selects {
		return nil, false
	}
	status := kept.status
	return &status, true
}
