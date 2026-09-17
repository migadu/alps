package alpsbase

import (
	"net/http"
	"net/url"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

type conversationPage struct {
	Messages []struct {
		UID      string
		Mailbox  string
		Envelope struct {
			Subject string
		}
	}
}

// Threading sees one mailbox, and the reply a user sends is filed in Sent. A
// message's conversation holds that reply all the same, after the message it
// answers; and opened from Sent, the reply is not listed twice.
func TestHTTP_TheConversationHoldsTheSentReply(t *testing.T) {
	smtpServer, _ := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	var original string
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == "Engines" {
			original = m.UID
		}
	}
	s.expect(s.do("POST", "/messages", url.Values{
		"to":          {"charles@remote.test"},
		"subject":     {"Re: Engines"},
		"text":        {"Agreed."},
		"in_reply_to": {"engines@remote.test"},
	}), http.StatusOK)

	conversation := func(mailbox, uid string) conversationPage {
		t.Helper()
		r := s.do("GET", "/mailboxes/"+mailbox+"/messages/"+uid+"/thread", nil)
		s.expect(r, http.StatusOK)
		var page conversationPage
		r.json(t, &page)
		return page
	}

	page := conversation("INBOX", original)
	if len(page.Messages) != 2 {
		t.Fatalf("the conversation holds %d messages, want the message and the reply: %+v", len(page.Messages), page.Messages)
	}
	first, second := page.Messages[0], page.Messages[1]
	if first.Mailbox != "INBOX" || first.UID != original || first.Envelope.Subject != "Engines" {
		t.Errorf("first = %+v, want the message answered", first)
	}
	if second.Mailbox != "Sent" || second.Envelope.Subject != "Re: Engines" {
		t.Errorf("second = %+v, want the reply, from Sent", second)
	}

	if page := conversation("Sent", second.UID); len(page.Messages) != 1 {
		t.Errorf("opened from Sent, the conversation holds %d messages: %+v", len(page.Messages), page.Messages)
	}

	// The message the reply does not answer has no one else in its conversation.
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == "Looms" {
			if page := conversation("INBOX", m.UID); len(page.Messages) != 1 {
				t.Errorf("Looms' conversation holds %d messages", len(page.Messages))
			}
		}
	}
}

// A message sent to oneself is in the thread and in Sent; it is shown once,
// from the thread, and the whole is in date order.
func TestMergeConversation(t *testing.T) {
	at := func(day int) time.Time { return time.Date(2026, 9, day, 0, 0, 0, 0, time.UTC) }
	msg := func(mailbox, id string, day int) provider.Message {
		return provider.Message{Mailbox: mailbox, Envelope: &provider.Envelope{MessageID: id, Date: at(day)}}
	}
	thread := []provider.Message{msg("INBOX", "root@x", 1), msg("INBOX", "note-to-self@x", 3)}
	sent := []provider.Message{msg("Sent", "<note-to-self@x>", 3), msg("Sent", "reply@x", 2)}

	var got []string
	for _, m := range mergeConversation(thread, sent) {
		got = append(got, m.Mailbox+" "+m.Envelope.MessageID)
	}
	want := []string{"INBOX root@x", "Sent reply@x", "INBOX note-to-self@x"}
	if len(got) != len(want) {
		t.Fatalf("merged %q, want %q", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("merged %q, want %q", got, want)
		}
	}
}
