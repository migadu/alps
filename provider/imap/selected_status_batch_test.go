package imap

import (
	"regexp"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// The check for new mail asks for its folders together (GetMailboxStatuses):
// the folder on screen, the poll's Inbox, the folders other tabs show. The
// batch sent a STATUS for each, the selected mailbox's too, so the NOOP that
// GetMailboxStatus sends for an unchanged selected mailbox was never sent
// from a check, and a STATUS the batch read of it was not kept for one.

var (
	inboxStatuses = regexp.MustCompile(`(?m)^[^*\s]\S* STATUS "?INBOX"? `)
	workStatuses  = regexp.MustCompile(`(?m)^[^*\s]\S* STATUS "?Work"? `)
)

func statusesOf(t *testing.T, p *IMAPProvider, names ...string) []*provider.MailboxStatus {
	t.Helper()
	statuses, errs := p.GetMailboxStatuses(names)
	for i, err := range errs {
		if err != nil {
			t.Fatalf("the status of %s: %v", names[i], err)
		}
	}
	return statuses
}

func sameStatus(a, b *provider.MailboxStatus) bool {
	return a.Name == b.Name && a.NumMessages == b.NumMessages && a.NumUnseen == b.NumUnseen &&
		a.UIDNext == b.UIDNext && a.UIDValidity == b.UIDValidity && a.HighestModSeq == b.HighestModSeq
}

// In a batch, the selected mailbox is asked with a NOOP while nothing changed
// in it, wherever it stands in the batch, and the others with STATUS.
func TestABatchAsksTheSelectedMailboxWithANoop(t *testing.T) {
	for _, names := range [][]string{{"INBOX", "Work"}, {"Work", "INBOX"}} {
		t.Run(names[0]+" first", func(t *testing.T) {
			s, p, other := numberedInbox(t, condStoreCaps(), brandMessage("one", ""), brandMessage("two", ""))
			if err := other.Create("Work", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			first := statusesOf(t, p, names...)

			before := len(s.traffic.String())
			again := statusesOf(t, p, names...)
			sent := s.traffic.String()[before:]
			if n := len(inboxStatuses.FindAllString(sent, -1)); n != 0 {
				t.Errorf("%d STATUS commands for the selected mailbox, which did not change; want a NOOP:\n%s", n, sent)
			}
			if !noopCommands.MatchString(sent) {
				t.Errorf("no NOOP asked the server what changed:\n%s", sent)
			}
			if n := len(workStatuses.FindAllString(sent, -1)); n != 1 {
				t.Errorf("%d STATUS commands for Work, which is not selected; want 1", n)
			}
			for i, name := range names {
				if !sameStatus(again[i], first[i]) {
					t.Errorf("the status of %s is %+v, want %+v", name, *again[i], *first[i])
				}
			}
		})
	}
}

// A status a batch read is kept for the next check, as one GetMailboxStatus
// read is, and the other way about.
func TestABatchAndASingleCheckKeepTheStatusForEachOther(t *testing.T) {
	t.Run("read by a batch, then checked alone", func(t *testing.T) {
		s, p, _ := numberedInbox(t, condStoreCaps(), brandMessage("one", ""))
		first := statusesOf(t, p, "INBOX")

		before := len(s.traffic.String())
		again, err := p.GetMailboxStatus("INBOX")
		if err != nil {
			t.Fatal(err)
		}
		if n := statusesSince(s, before); n != 0 {
			t.Errorf("%d STATUS commands for the selected mailbox a batch read, which did not change; want a NOOP", n)
		}
		if !sameStatus(again, first[0]) {
			t.Errorf("the status is %+v, want %+v", *again, *first[0])
		}
	})
	t.Run("read alone, then checked in a batch", func(t *testing.T) {
		s, p, other := numberedInbox(t, condStoreCaps(), brandMessage("one", ""))
		if err := other.Create("Work", nil).Wait(); err != nil {
			t.Fatal(err)
		}
		first, err := p.GetMailboxStatus("INBOX")
		if err != nil {
			t.Fatal(err)
		}

		before := len(s.traffic.String())
		again := statusesOf(t, p, "Work", "INBOX")
		if n := len(inboxStatuses.FindAllString(s.traffic.String()[before:], -1)); n != 0 {
			t.Errorf("%d STATUS commands for the selected mailbox read before, which did not change; want a NOOP", n)
		}
		if !sameStatus(again[1], first) {
			t.Errorf("the status is %+v, want %+v", *again[1], *first)
		}
	})
}

// Whatever changed in the selected mailbox has a batch read its status
// again, as a check alone does.
func TestAChangeInTheSelectedMailboxHasABatchReadItAgain(t *testing.T) {
	changes := []struct {
		name  string
		moved func(was, now *provider.MailboxStatus) bool
	}{
		{"a star elsewhere", func(was, now *provider.MailboxStatus) bool { return now.HighestModSeq > was.HighestModSeq }},
		{"an arrival", func(was, now *provider.MailboxStatus) bool { return now.NumMessages == was.NumMessages+1 }},
	}
	for _, c := range changes {
		t.Run(c.name, func(t *testing.T) {
			s, p, other := numberedInbox(t, condStoreCaps(), brandMessage("one", ""), brandMessage("two", ""))
			if err := other.Create("Work", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			was := statusesOf(t, p, "INBOX", "Work")
			if c.name == "an arrival" {
				appendElsewhere(t, other, brandMessage("three", ""))
			} else {
				storeElsewhere(t, other, 1, imap.FlagFlagged)
			}

			before := len(s.traffic.String())
			now := statusesOf(t, p, "INBOX", "Work")
			sent := s.traffic.String()[before:]
			if n := len(inboxStatuses.FindAllString(sent, -1)); n != 1 {
				t.Errorf("%d STATUS commands for the selected mailbox after %s, want 1:\n%s", n, c.name, sent)
			}
			if n := len(workStatuses.FindAllString(sent, -1)); n != 1 {
				t.Errorf("%d STATUS commands for Work, want 1", n)
			}
			if !c.moved(was[0], now[0]) {
				t.Errorf("after %s the status is %+v, was %+v", c.name, *now[0], *was[0])
			}
		})
	}
}

// Where changes are not numbered, a batch asks every mailbox with STATUS,
// the selected one too. A mailbox of the batch that cannot be read answers
// its error, and the others their status.
func TestABatchAsksWithStatusWhereChangesAreNotNumbered(t *testing.T) {
	s, p, _ := numberedInbox(t, imap.CapSet{imap.CapIMAP4rev1: {}}, brandMessage("one", ""))
	for i := 0; i < 2; i++ {
		before := len(s.traffic.String())
		statusesOf(t, p, "INBOX")
		if n := statusesSince(s, before); n != 1 {
			t.Errorf("%d STATUS commands where changes are not numbered, want 1", n)
		}
	}

	_, q, _ := numberedInbox(t, condStoreCaps(), brandMessage("one", ""))
	statusesOf(t, q, "INBOX")
	statuses, errs := q.GetMailboxStatuses([]string{"Gone", "INBOX"})
	if errs[0] == nil || statuses[0] != nil {
		t.Errorf("a mailbox that does not exist answers %v, %v; want an error", statuses[0], errs[0])
	}
	if errs[1] != nil || statuses[1] == nil || statuses[1].NumMessages != 1 {
		t.Errorf("the selected mailbox beside it answers %v, %v; want its status", statuses[1], errs[1])
	}
}
