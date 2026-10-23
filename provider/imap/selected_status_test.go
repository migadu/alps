package imap

import (
	"regexp"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

// statusesSent matches a STATUS the provider sends.
var statusesSent = regexp.MustCompile(`(?m)^[^*\s]\S* STATUS `)

// numberedInbox serves INBOX with messages on a server that numbers its
// changes, and returns a provider made as a session's is, with changes
// numbered and INBOX selected, and another client of the same account.
func numberedInbox(t *testing.T, caps imap.CapSet, messages ...string) (*memServer, *IMAPProvider, *imapclient.Client) {
	t.Helper()
	s := &memServer{caps: caps}
	memIMAP(t, s, messages...)
	p := signedIn(t, s.addr, 2*time.Second)
	if caps.Has(imap.CapCondStore) {
		if tracked, err := p.TrackChanges(); err != nil || !tracked {
			t.Fatalf("TrackChanges: %v, %v", tracked, err)
		}
	}
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Fatal(err)
	}
	other, err := imapclient.DialInsecure(s.addr, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { other.Close() })
	if err := other.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	return s, p, other
}

func statusesSince(s *memServer, before int) int {
	return len(statusesSent.FindAllString(s.traffic.String()[before:], -1))
}

// RFC 9051 asks a client not to send STATUS for the mailbox it has
// selected. With changes numbered, the selected mailbox's status is asked
// with a NOOP while nothing changed in it, and answers the status read last.
func TestTheSelectedMailboxIsAskedWithANoop(t *testing.T) {
	s, p, _ := numberedInbox(t, condStoreCaps(), brandMessage("one", ""), brandMessage("two", ""))
	first, err := p.GetMailboxStatus("INBOX")
	if err != nil {
		t.Fatal(err)
	}

	before := len(s.traffic.String())
	again, err := p.GetMailboxStatus("INBOX")
	if err != nil {
		t.Fatal(err)
	}
	if n := statusesSince(s, before); n != 0 {
		t.Errorf("%d STATUS commands for the selected mailbox, which did not change; want a NOOP", n)
	}
	if !noopCommands.MatchString(s.traffic.String()[before:]) {
		t.Error("no NOOP asked the server what changed")
	}
	if again.NumMessages != first.NumMessages || again.NumUnseen != first.NumUnseen || again.UIDNext != first.UIDNext ||
		again.UIDValidity != first.UIDValidity || again.HighestModSeq != first.HighestModSeq {
		t.Errorf("the status is %+v, want %+v", *again, *first)
	}
}

// Whatever changed in the selected mailbox since its status was read has it
// read again: a star or a message read in another client, which may leave
// every count as it was, mail that arrives or goes, a message that arrived
// and went again, which moved UIDNEXT alone, and a change of the
// connection's own.
func TestAChangeInTheSelectedMailboxHasItsStatusReadAgain(t *testing.T) {
	changes := []struct {
		name   string
		change func(t *testing.T, p *IMAPProvider, other *imapclient.Client)
		moved  func(was, now *provider.MailboxStatus) bool
	}{
		{"a star elsewhere", func(t *testing.T, _ *IMAPProvider, other *imapclient.Client) {
			storeElsewhere(t, other, 1, imap.FlagFlagged)
		}, func(was, now *provider.MailboxStatus) bool { return now.HighestModSeq > was.HighestModSeq }},
		{"a read elsewhere", func(t *testing.T, _ *IMAPProvider, other *imapclient.Client) {
			storeElsewhere(t, other, 1, imap.FlagSeen)
		}, func(was, now *provider.MailboxStatus) bool { return now.NumUnseen == was.NumUnseen-1 }},
		{"an arrival", func(t *testing.T, _ *IMAPProvider, other *imapclient.Client) {
			appendElsewhere(t, other, brandMessage("three", ""))
		}, func(was, now *provider.MailboxStatus) bool { return now.NumMessages == was.NumMessages+1 }},
		{"a removal elsewhere", func(t *testing.T, _ *IMAPProvider, other *imapclient.Client) {
			storeElsewhere(t, other, 1, imap.FlagDeleted)
			if _, err := other.Select("INBOX", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			if err := other.Expunge().Close(); err != nil {
				t.Fatal(err)
			}
		}, func(was, now *provider.MailboxStatus) bool { return now.NumMessages == was.NumMessages-1 }},
		{"an arrival that went again", func(t *testing.T, _ *IMAPProvider, other *imapclient.Client) {
			// Moved on, which changes no flag: the server tells only of the
			// message arriving and going.
			if err := other.Create("Work", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			appendElsewhere(t, other, brandMessage("three", ""))
			if _, err := other.Select("INBOX", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			if _, err := other.Move(imap.UIDSetNum(3), "Work").Wait(); err != nil {
				t.Fatal(err)
			}
		}, func(was, now *provider.MailboxStatus) bool { return now.UIDNext > was.UIDNext }},
		{"a star of its own", func(t *testing.T, p *IMAPProvider, _ *imapclient.Client) {
			star := provider.FlagOperation{Op: provider.FlagOpAdd, Silent: true, Flags: []provider.Flag{provider.Flag(imap.FlagFlagged)}}
			if err := p.SetMessagesFlags("INBOX", []provider.MessageID{IMAPUID(2)}, star); err != nil {
				t.Fatal(err)
			}
		}, func(was, now *provider.MailboxStatus) bool { return now.HighestModSeq > was.HighestModSeq }},
		{"a removal of its own", func(t *testing.T, p *IMAPProvider, _ *imapclient.Client) {
			if err := p.DeleteMessages("INBOX", []provider.MessageID{IMAPUID(2)}); err != nil {
				t.Fatal(err)
			}
		}, func(was, now *provider.MailboxStatus) bool { return now.NumMessages == was.NumMessages-1 }},
	}
	for _, c := range changes {
		t.Run(c.name, func(t *testing.T) {
			s, p, other := numberedInbox(t, condStoreCaps(imap.CapMove), brandMessage("one", ""), brandMessage("two", ""))
			was, err := p.GetMailboxStatus("INBOX")
			if err != nil {
				t.Fatal(err)
			}
			c.change(t, p, other)

			before := len(s.traffic.String())
			now, err := p.GetMailboxStatus("INBOX")
			if err != nil {
				t.Fatal(err)
			}
			if n := statusesSince(s, before); n != 1 {
				t.Errorf("%d STATUS commands after %s, want 1", n, c.name)
			}
			if !c.moved(was, now) {
				t.Errorf("after %s the status is %+v, was %+v", c.name, *now, *was)
			}
		})
	}
}

// A mailbox not selected, and any mailbox where changes are not numbered, is
// asked with STATUS as before.
func TestAMailboxIsAskedWithStatusElsewhere(t *testing.T) {
	s, p, other := numberedInbox(t, condStoreCaps())
	if err := other.Create("Work", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		before := len(s.traffic.String())
		if _, err := p.GetMailboxStatus("Work"); err != nil {
			t.Fatal(err)
		}
		if n := statusesSince(s, before); n != 1 {
			t.Errorf("%d STATUS commands for a mailbox not selected, want 1", n)
		}
	}

	plain, q, _ := numberedInbox(t, imap.CapSet{imap.CapIMAP4rev1: {}})
	for i := 0; i < 2; i++ {
		before := len(plain.traffic.String())
		if _, err := q.GetMailboxStatus("INBOX"); err != nil {
			t.Fatal(err)
		}
		if n := statusesSince(plain, before); n != 1 {
			t.Errorf("%d STATUS commands where changes are not numbered, want 1", n)
		}
	}
}

func storeElsewhere(t *testing.T, c *imapclient.Client, uid imap.UID, flag imap.Flag) {
	t.Helper()
	if _, err := c.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := c.Store(imap.UIDSetNum(uid), &imap.StoreFlags{Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{flag}}, nil).Close(); err != nil {
		t.Fatal(err)
	}
	if err := c.Unselect().Wait(); err != nil {
		t.Fatal(err)
	}
}

func appendElsewhere(t *testing.T, c *imapclient.Client, message string) {
	t.Helper()
	cmd := c.Append("INBOX", int64(len(message)), nil)
	if _, err := cmd.Write([]byte(message)); err != nil {
		t.Fatal(err)
	}
	if err := cmd.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := cmd.Wait(); err != nil {
		t.Fatal(err)
	}
}
