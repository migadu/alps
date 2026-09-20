// Reading a conversation whose members are already known.
//
// THREAD is answered for the whole mailbox, so its cost is the mailbox's size
// and not the conversation's — and a threaded listing has already paid it and
// handed every row its thread's UIDs. These tests pin that naming the members
// reads exactly those messages and asks the server to thread nothing.
package imap

import (
	"regexp"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// A THREAD command on the wire, whichever algorithm was chosen.
var threadCommands = regexp.MustCompile(`(?i)UID THREAD `)

func conversation(subject, messageID, inReplyTo string) string {
	msg := "From: Ada <ada@example.test>\r\nSubject: " + subject + "\r\nMessage-ID: <" + messageID + ">\r\n"
	if inReplyTo != "" {
		msg += "In-Reply-To: <" + inReplyTo + ">\r\nReferences: <" + inReplyTo + ">\r\n"
	}
	return msg + "\r\nHello\r\n"
}

func uids(msgs []provider.Message) []string {
	out := make([]string, 0, len(msgs))
	for _, m := range msgs {
		out = append(out, m.ID.String())
	}
	return out
}

func TestGetThreadMembers_ReadsTheNamedMessagesWithoutThreading(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFS"): {}}}
	p := memIMAP(t, s,
		conversation("Engines", "one@remote.test", ""),
		conversation("Off topic", "loose@remote.test", ""),
		conversation("Re: Engines", "two@remote.test", "one@remote.test"),
	)

	before := s.traffic.String()
	msgs, err := p.GetThreadMembers("INBOX", []provider.MessageID{IMAPUID(1), IMAPUID(3)})
	if err != nil {
		t.Fatalf("reading the named members: %v", err)
	}

	if got := uids(msgs); strings.Join(got, ",") != "1,3" {
		t.Errorf("read %v, want the two named members oldest first", got)
	}
	if msgs[0].Envelope.Subject != "Engines" || msgs[1].Envelope.Subject != "Re: Engines" {
		t.Errorf("read %q and %q, want the conversation", msgs[0].Envelope.Subject, msgs[1].Envelope.Subject)
	}
	// The point of naming them: the mailbox is not threaded to find them again.
	if sent := strings.TrimPrefix(s.traffic.String(), before); threadCommands.MatchString(sent) {
		t.Errorf("a THREAD command was sent for a conversation whose members were named:\n%s", sent)
	}
}

// The members come from a cached listing, so by the time they are read one of
// them may be gone. A short answer is the caller's signal to thread properly
// rather than show a conversation with a hole in it.
func TestGetThreadMembers_IsShortWhenAMemberIsGone(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFS"): {}}}
	p := memIMAP(t, s, conversation("Engines", "one@remote.test", ""))

	msgs, err := p.GetThreadMembers("INBOX", []provider.MessageID{IMAPUID(1), IMAPUID(99)})
	if err != nil {
		t.Fatalf("reading the named members: %v", err)
	}
	if len(msgs) != 1 {
		t.Errorf("read %v, want only the member that is still there", uids(msgs))
	}
}

func TestGetThreadMembers_RefusesWhenNothingIsNamed(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}}}
	p := memIMAP(t, s, conversation("Engines", "one@remote.test", ""))

	if _, err := p.GetThreadMembers("INBOX", nil); err == nil {
		t.Error("naming no members answered a conversation; want an error, so the caller threads instead")
	}
	if _, err := p.GetThreadMembers("INBOX", []provider.MessageID{IMAPUID(99)}); err == nil {
		t.Error("naming only a message that is gone answered a conversation; want an error")
	}
}
