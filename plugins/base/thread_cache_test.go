// A conversation is assembled once per session, not once per open.
//
// Reading a long conversation means opening one member after another, and each
// open used to ask for the whole thing again: the same THREAD over the mailbox,
// the same search through Sent, the same envelopes. The answer is kept under
// every member that lives in the mailbox, and dropped with that mailbox's
// listings — by any write, any count change and any explicit refresh.
package alpsbase

import (
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

func threadOf(t *testing.T, s *testServer, mailbox, uid string) conversationPage {
	t.Helper()
	r := s.do("GET", "/mailboxes/"+mailbox+"/messages/"+uid+"/thread", nil)
	s.expect(r, http.StatusOK)
	var page conversationPage
	r.json(t, &page)
	return page
}

func uidOfSubject(t *testing.T, s *testServer, subject string) string {
	t.Helper()
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == subject {
			return m.UID
		}
	}
	t.Fatalf("no message subject %q in the INBOX", subject)
	return ""
}

// A reply filed in Sent WITHOUT alps being told, so what the reader is shown
// says whether the conversation was assembled again or served from the session.
func fileSentReply(t *testing.T, s *testServer, inReplyTo string) {
	t.Helper()
	if err := s.store.CreateMailbox("Sent"); err != nil && !strings.Contains(err.Error(), "exist") {
		t.Fatal(err)
	}
	msg := "From: " + testUser + "\r\nTo: charles@remote.test\r\nSubject: Re: Engines\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <reply@example.com>\r\n" +
		"In-Reply-To: <" + inReplyTo + ">\r\nReferences: <" + inReplyTo + ">\r\n\r\nAgreed.\r\n"
	if _, _, _, err := s.store.AppendMessage("Sent", rawMessage(msg), 0); err != nil {
		t.Fatal(err)
	}
}

func TestHTTP_AConversationIsAssembledOncePerSession(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := uidOfSubject(t, s, "Engines")

	if got := len(threadOf(t, s, "INBOX", uid).Messages); got != 1 {
		t.Fatalf("the conversation opens with %d messages, want the one message", got)
	}

	fileSentReply(t, s, "engines@remote.test")

	// Served from the session, so the reply filed behind alps's back is not
	// there yet. That is the staleness the listing pages already carry — and
	// the reader was given this same conversation by the row it opened.
	if got := len(threadOf(t, s, "INBOX", uid).Messages); got != 1 {
		t.Errorf("the conversation was read again (%d messages); want the one already assembled", got)
	}

	// A write on the mailbox drops it — here another message being filed away,
	// which changes what the INBOX holds and so what its conversations are.
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{uidOfSubject(t, s, "Looms")}, "to": "Archive",
	}), http.StatusOK)

	page := threadOf(t, s, "INBOX", uid)
	if len(page.Messages) != 2 {
		t.Fatalf("after a write the conversation holds %d messages, want it read again with the reply: %+v", len(page.Messages), page.Messages)
	}
	if page.Messages[1].Mailbox != "Sent" {
		t.Errorf("the second message is in %q, want the reply from Sent", page.Messages[1].Mailbox)
	}
}

// One conversation's answer is not another's.
func TestHTTP_AnotherMessagesConversationIsItsOwn(t *testing.T) {
	s := newTestServer(t)
	s.login()
	engines := uidOfSubject(t, s, "Engines")
	looms := uidOfSubject(t, s, "Looms")

	threadOf(t, s, "INBOX", engines)
	fileSentReply(t, s, "engines@remote.test")

	if got := threadOf(t, s, "INBOX", looms).Messages; len(got) != 1 || got[0].UID != looms {
		t.Errorf("the other message's conversation is %+v, want its own", got)
	}
}

// A refresh is the reader saying they want to be told again.
func TestHTTP_ARefreshDropsTheAssembledConversation(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := uidOfSubject(t, s, "Engines")

	threadOf(t, s, "INBOX", uid)
	fileSentReply(t, s, "engines@remote.test")

	r := s.do("GET", "/mailboxes/INBOX?page=0&refresh=true", nil)
	s.expect(r, http.StatusOK)

	if got := len(threadOf(t, s, "INBOX", uid).Messages); got != 2 {
		t.Errorf("after a refresh the conversation holds %d messages, want it read again with the reply", got)
	}
}

type testUID string

func (u testUID) String() string   { return string(u) }
func (u testUID) Provider() string { return "test" }

func TestRowHoldsUID(t *testing.T) {
	row := provider.Message{ID: testUID("7"), ThreadUIDs: []string{"3", "7"}}
	for _, uid := range []string{"7", "3"} {
		if !rowHoldsUID(row, uid) {
			t.Errorf("the row does not hold %q, want it named by its own UID or its thread's", uid)
		}
	}
	if rowHoldsUID(row, "4") {
		t.Error("the row holds a UID that is neither its own nor in its thread")
	}
	if rowHoldsUID(provider.Message{ID: testUID("7")}, "3") {
		t.Error("a row with no thread holds another message's UID")
	}
}

func TestCachedSentMailbox(t *testing.T) {
	cache := alps.NewCache(time.Minute)
	defer cache.Close()

	if got := cachedSentMailbox(cache); got != "" {
		t.Errorf("named %q with nothing cached, want the provider left to ask", got)
	}

	cache.Set("mailboxes", []MailboxInfo{
		{ListData: &imap.ListData{Mailbox: "INBOX"}},
		{ListData: &imap.ListData{Mailbox: "Outbox", Attrs: []imap.MailboxAttr{imap.MailboxAttrSent}}},
	})
	if got := cachedSentMailbox(cache); got != "Outbox" {
		t.Errorf("named %q, want the mailbox the server marks \\Sent whatever it is called", got)
	}

	cache.Set("mailboxes", []MailboxInfo{
		{ListData: &imap.ListData{Mailbox: "INBOX"}},
		{ListData: &imap.ListData{Mailbox: "Sent"}},
	})
	if got := cachedSentMailbox(cache); got != "Sent" {
		t.Errorf("named %q, want the name as a fallback when no attribute says", got)
	}

	cache.Set("mailboxes", "not a mailbox list")
	if got := cachedSentMailbox(cache); got != "" {
		t.Errorf("named %q from a cache entry that is not a mailbox list", got)
	}
}

// A star or a read patches the conversations that hold the message, and leaves
// the ones that do not. Dropping them all would empty the cache on the very
// gesture a reader makes as it opens a conversation.
func TestPatchCachedConversations(t *testing.T) {
	cache := alps.NewCache(time.Minute)
	defer cache.Close()

	member := func(uid string, flags ...imap.Flag) IMAPMessage {
		return IMAPMessage{
			FetchMessageBuffer: &imapclient.FetchMessageBuffer{Flags: flags},
			AlpsUID:            uid,
			Mailbox:            "INBOX",
		}
	}
	engines := []IMAPMessage{member("1", imap.FlagSeen), member("2")}
	looms := []IMAPMessage{member("5", imap.FlagSeen)}
	cache.Set(threadCacheKey("INBOX", "1"), engines)
	cache.Set(threadCacheKey("INBOX", "2"), engines)
	cache.Set(threadCacheKey("INBOX", "5"), looms)

	quiet := func(string, ...interface{}) {}
	patchCachedConversations(cache, quiet, "INBOX", "2", []imap.Flag{imap.FlagSeen, imap.FlagFlagged}, nil)

	held, ok := cache.Get(threadCacheKey("INBOX", "1"))
	if !ok {
		t.Fatal("the conversation was dropped; want it patched")
	}
	got := held.([]IMAPMessage)[1].Flags
	if len(got) != 2 || !slices.Contains(got, imap.FlagSeen) || !slices.Contains(got, imap.FlagFlagged) {
		t.Errorf("the member carries %v, want the flags just written", got)
	}

	patchCachedConversations(cache, quiet, "INBOX", "2", nil, []imap.Flag{imap.FlagFlagged})
	held, _ = cache.Get(threadCacheKey("INBOX", "1"))
	got = held.([]IMAPMessage)[1].Flags
	if slices.Contains(got, imap.FlagFlagged) {
		t.Errorf("the member carries %v, want the star taken off again", got)
	}

	// Another conversation says nothing about this message, so it stands.
	if _, ok := cache.Get(threadCacheKey("INBOX", "5")); !ok {
		t.Error("a conversation that does not hold the message was dropped")
	}

	// Anything else under the key is not a conversation this can mend.
	cache.Set(threadCacheKey("INBOX", "9"), "not a conversation")
	patchCachedConversations(cache, quiet, "INBOX", "9", []imap.Flag{imap.FlagSeen}, nil)
	if _, ok := cache.Get(threadCacheKey("INBOX", "9")); ok {
		t.Error("an entry that could not be patched was kept")
	}
}
