package imap

import (
	"slices"
	"testing"

	"github.com/migadu/alps/provider"
)

// Reading any part of a message leaves it unread. A body section fetched
// without PEEK sets \Seen on the server as it is read (RFC 3501, 6.4.5), and
// the reader reads a body the moment a message opens: every message opened
// was marked read whatever the "Mark as read" setting said, and so was every
// inline image, attachment and printout asked for. Whether, and when, a
// message is read is the client's to say, with a flag write of its own.
func TestReadingAMessageLeavesItUnread(t *testing.T) {
	const alternative = "From: Ada <ada@example.test>\r\nSubject: Engines\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=b\r\n\r\n" +
		"--b\r\nContent-Type: text/plain\r\n\r\nHello\r\n" +
		"--b\r\nContent-Type: text/html\r\n\r\n<p>Hello</p>\r\n" +
		"--b--\r\n"

	reads := []struct {
		how  string
		read func(p *IMAPProvider, uid IMAPUID) (*provider.Message, error)
	}{
		{"part", func(p *IMAPProvider, uid IMAPUID) (*provider.Message, error) {
			msg, _, err := p.GetMessagePart("INBOX", uid, []int{2})
			return msg, err
		}},
		{"part with data", func(p *IMAPProvider, uid IMAPUID) (*provider.Message, error) {
			msg, _, _, _, err := p.GetMessagePartWithData("INBOX", uid, []int{1})
			return msg, err
		}},
		{"raw part", func(p *IMAPProvider, uid IMAPUID) (*provider.Message, error) {
			msg, _, _, err := p.GetMessagePartRaw("INBOX", uid, []int{2}, 0)
			return msg, err
		}},
		{"raw part, cut short", func(p *IMAPProvider, uid IMAPUID) (*provider.Message, error) {
			msg, _, _, err := p.GetMessagePartRaw("INBOX", uid, []int{1}, 3)
			return msg, err
		}},
		// The reader opening a listed message: the part, with the two header
		// fields it shows beside it, in the one FETCH.
		{"for reader", func(p *IMAPProvider, uid IMAPUID) (*provider.Message, error) {
			msg, _, _, err := p.GetMessagePartForReader("INBOX", uid, []int{1})
			return msg, err
		}},
		// The whole message, as a download or a printout reads it.
		{"whole message", func(p *IMAPProvider, uid IMAPUID) (*provider.Message, error) {
			msg, _, _, err := p.GetMessagePartRaw("INBOX", uid, nil, 0)
			return msg, err
		}},
	}
	for _, r := range reads {
		t.Run(r.how, func(t *testing.T) {
			p := memIMAP(t, &memServer{}, alternative)
			msg, err := r.read(p, IMAPUID(1))
			if err != nil {
				t.Fatalf("reading: %v", err)
			}
			if slices.Contains(msg.Flags, provider.FlagSeen) {
				t.Errorf("the read answered with flags %v, want no \\Seen", msg.Flags)
			}
			after, err := p.GetMessageMetadata("INBOX", IMAPUID(1))
			if err != nil {
				t.Fatalf("reading the flags back: %v", err)
			}
			if slices.Contains(after.Flags, provider.FlagSeen) {
				t.Errorf("after the read the message has flags %v, want it still unread", after.Flags)
			}
		})
	}
}
