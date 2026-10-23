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

// A conversation opened from the Inbox holds the user's reply from Sent, and
// is kept under the Inbox's keys. A write in Sent that took the reply away, or
// changed the flags of the whole folder, dropped only the conversations kept
// under Sent's, and reopened from the Inbox, the reply was shown as it had
// been: there after it was deleted or moved, unread after Sent was read.
func TestHTTP_AWriteInSentReachesTheInboxConversation(t *testing.T) {
	opened := func(t *testing.T) (s *testServer, uid, reply string) {
		t.Helper()
		s = newTestServer(t)
		s.login()
		uid = uidOfSubject(t, s, "Engines")
		fileSentReply(t, s, "engines@remote.test")
		page := threadOf(t, s, "INBOX", uid)
		if len(page.Messages) != 2 || page.Messages[1].Mailbox != "Sent" || contains(page.Messages[1].Flags, `\Seen`) {
			t.Fatalf("the conversation holds %+v, want the message and the unread reply from Sent", page.Messages)
		}
		return s, uid, page.Messages[1].UID
	}

	for _, write := range []struct {
		name string
		do   func(s *testServer, reply string) response
	}{
		{"deleted", func(s *testServer, reply string) response {
			return s.do("DELETE", "/mailboxes/Sent/messages", map[string]any{"uids": []string{reply}})
		}},
		{"moved", func(s *testServer, reply string) response {
			return s.do("PUT", "/mailboxes/Sent/messages/move", map[string]any{"uids": []string{reply}, "to": "Archive"})
		}},
	} {
		t.Run("the reply "+write.name, func(t *testing.T) {
			s, uid, reply := opened(t)
			s.expect(write.do(s, reply), http.StatusOK)

			if got := threadOf(t, s, "INBOX", uid).Messages; len(got) != 1 {
				t.Errorf("with the reply %s from Sent, the Inbox's conversation holds %+v, want the message alone", write.name, got)
			}
		})
	}

	t.Run("Sent marked read", func(t *testing.T) {
		s, uid, _ := opened(t)
		s.expect(s.do("PUT", "/mailboxes/Sent/messages/flag", map[string]any{
			"all": true, "flags": []string{`\Seen`}, "action": "add",
		}), http.StatusOK)

		got := threadOf(t, s, "INBOX", uid).Messages
		if len(got) != 2 || !contains(got[1].Flags, `\Seen`) {
			t.Errorf("with the whole of Sent marked read, the Inbox's conversation holds %+v, want the reply read", got)
		}
	})
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

// A folder's listings go with every conversation that holds one of its
// messages, whichever folder's keys it is kept under: a conversation of the
// Inbox, or of Archive, holds the user's replies from Sent. One that holds
// none of Sent's stays, and so does one that holds a message of a folder whose
// name goes on from Sent's with a colon, which is not Sent's.
func TestDropMailboxListingsReachesOtherFoldersConversations(t *testing.T) {
	cache := alps.NewCache(time.Minute)
	defer cache.Close()

	member := func(mailbox, uid string) IMAPMessage {
		return IMAPMessage{FetchMessageBuffer: &imapclient.FetchMessageBuffer{}, AlpsUID: uid, Mailbox: mailbox}
	}
	cache.Set(threadCacheKey("Sent", "7"), []IMAPMessage{member("Sent", "7")})
	cache.Set(threadCacheKey("INBOX", "5"), []IMAPMessage{member("INBOX", "5"), member("Sent", "7")})
	cache.Set(threadCacheKey("Archive", "2"), []IMAPMessage{member("Archive", "2"), member("Sent", "3")})
	cache.Set(threadCacheKey("INBOX", "6"), []IMAPMessage{member("INBOX", "6")})
	cache.Set(threadCacheKey("INBOX", "8"), []IMAPMessage{member("INBOX", "8"), member("Sent:Old", "7")})

	dropMailboxListings(cache, "Sent")

	for _, key := range []string{threadCacheKey("Sent", "7"), threadCacheKey("INBOX", "5"), threadCacheKey("Archive", "2")} {
		if _, ok := cache.Get(key); ok {
			t.Errorf("the conversation kept under %s holds a message of Sent, and was kept", key)
		}
	}
	for _, key := range []string{threadCacheKey("INBOX", "6"), threadCacheKey("INBOX", "8")} {
		if _, ok := cache.Get(key); !ok {
			t.Errorf("the conversation kept under %s holds no message of Sent, and was dropped", key)
		}
	}
}

// The pages of Work:Sub have keys under Work's prefix (see
// CachedMessages.Mailbox), and their rows name Work:Sub's messages. A
// conversation of UIDs 3 and 7 there is not one of Work's: taken for Work's,
// opening UID 7 of Work read UIDs 3 and 7 of Work as its conversation.
func TestListedThreadUIDsDoesNotUseColonSibling(t *testing.T) {
	cache := alps.NewCache(time.Minute)
	defer cache.Close()
	p := &provider.MockProvider{}

	cache.Set("messages:Work:Sub:page0", CachedMessages{
		Mailbox:  "Work:Sub",
		Messages: []provider.Message{{ID: testUID("7"), ThreadUIDs: []string{"3", "7"}}},
	})
	if got := listedThreadUIDs(p, cache, "Work", "7"); got != nil {
		t.Errorf("the conversation of UID 7 in Work is %v, read from the page of Work:Sub", got)
	}

	cache.Set("messages:Work:page0", CachedMessages{
		Mailbox:  "Work",
		Messages: []provider.Message{{ID: testUID("7"), ThreadUIDs: []string{"7", "9"}}},
	})
	got := listedThreadUIDs(p, cache, "Work", "7")
	if len(got) != 2 || got[0].String() != "7" || got[1].String() != "9" {
		t.Errorf("the conversation of UID 7 in Work is %v, want 7 and 9 from Work's own page", got)
	}
}

// A conversation is patched where its member is the message changed: the
// same UID, in the same folder. The conversations of Work:Sub are kept under
// keys that begin with Work's prefix, and a conversation of Work carries the
// user's own messages from Sent under their UIDs in Sent. Starring UID 7 of
// Work starred UID 7 of Work:Sub, and in a conversation the user began, the
// message they sent, UID 7 in Sent, in place of the answer in Work.
func TestPatchCachedConversationsLeavesOtherFoldersMessagesAlone(t *testing.T) {
	cache := alps.NewCache(time.Minute)
	defer cache.Close()

	member := func(mailbox string) IMAPMessage {
		return IMAPMessage{FetchMessageBuffer: &imapclient.FetchMessageBuffer{}, AlpsUID: "7", Mailbox: mailbox}
	}
	cache.Set(threadCacheKey("Work", "7"), []IMAPMessage{member("Sent"), member("Work")})
	cache.Set(threadCacheKey("Work:Sub", "7"), []IMAPMessage{member("Work:Sub")})

	patchCachedConversations(cache, noDebug, "Work", "7", []imap.Flag{imap.FlagFlagged}, nil)

	held, _ := cache.Get(threadCacheKey("Work", "7"))
	work := held.([]IMAPMessage)
	if len(work[0].Flags) != 0 {
		t.Errorf("the message from Sent, UID 7 there, carries %v, want it left as it was", work[0].Flags)
	}
	if !slices.Contains(work[1].Flags, imap.FlagFlagged) {
		t.Errorf("UID 7 of Work carries %v in its conversation, want it starred", work[1].Flags)
	}
	held, _ = cache.Get(threadCacheKey("Work:Sub", "7"))
	if flags := held.([]IMAPMessage)[0].Flags; len(flags) != 0 {
		t.Errorf("UID 7 of Work:Sub carries %v in its conversation, want it left as it was", flags)
	}
}
