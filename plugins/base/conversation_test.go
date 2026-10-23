package alpsbase

import (
	"net/http"
	"net/url"
	"slices"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

type conversationPage struct {
	Messages []struct {
		UID      string
		Mailbox  string
		Flags    []string
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

// A provider that names no message's folder, as a provider need not.
type namelessProvider struct {
	*provider.MockProvider
	thread, sent []provider.Message
}

func (p namelessProvider) GetThreadMembers(string, []provider.MessageID) ([]provider.Message, error) {
	return slices.Clone(p.thread), nil
}

func (p namelessProvider) FindByReferences(string, []string) ([]provider.Message, error) {
	return slices.Clone(p.sent), nil
}

// A conversation holds the messages of two folders, under ids that name a
// message only within its own, so each is named with the folder it was read
// from when the provider does not name it. Without one, a member was taken
// for one of the folder the conversation was opened from, the user's reply
// from Sent among them: kept under that folder's UID, starred with its
// message, and left behind when Sent's own changed.
func TestAConversationNamesEveryMembersFolder(t *testing.T) {
	msg := func(uid, id string) provider.Message {
		return provider.Message{ID: testUID(uid), Envelope: &provider.Envelope{MessageID: id}}
	}
	p := namelessProvider{
		MockProvider: &provider.MockProvider{},
		thread:       []provider.Message{msg("9", "root@x"), msg("7", "answer@x")},
		sent:         []provider.Message{msg("7", "reply@x")},
	}

	thread, err := messageThreadWithProvider(p, "Work:Sub", testUID("9"), []provider.MessageID{testUID("9"), testUID("7")})
	if err != nil || len(thread) != 2 {
		t.Fatalf("the thread is %+v, %v, want its two messages", thread, err)
	}
	for _, m := range thread {
		if m.Mailbox != "Work:Sub" {
			t.Errorf("UID %s of the thread names %q, want Work:Sub, where it was read", m.ID, m.Mailbox)
		}
	}

	sent, err := sentOfConversation(p, "Work:Sub", thread, "Sent")
	if err != nil || len(sent) != 1 {
		t.Fatalf("the replies are %+v, %v, want the one from Sent", sent, err)
	}
	if sent[0].Mailbox != "Sent" {
		t.Errorf("the reply names %q, want Sent, where it was read", sent[0].Mailbox)
	}
}
