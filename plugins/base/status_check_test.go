// A check for new mail reads one folder's counts, and what it learns is about
// that folder alone.
//
// The check used to compare the counts it read with the ones the session held
// and, finding none, take the earlier counts as zero: every first check of a
// folder read as a change. A change then dropped every folder's counts with
// the folder list, so the next check of each other folder found none, and read
// as a change too. A check of the INBOX that found new mail cost the folder on
// screen its pages, though nothing in it had moved.
//
// A folder made behind alps's back marks whether the folder list was read
// again: it is listed only by a list read from the server after it was made.
package alpsbase

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/migadu/alps/provider"
)

// deliver files a message into mailbox behind alps's back, as mail arriving
// from elsewhere is.
func (s *testServer) deliver(mailbox, subject string) {
	s.t.Helper()
	msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: " + subject + "\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <" + strings.ToLower(subject) + "@remote.test>\r\n\r\nJust in.\r\n"
	if _, _, _, err := s.store.AppendMessage(mailbox, rawMessage(msg), 0); err != nil {
		s.t.Fatal(err)
	}
}

// rewriteSubject changes a message's subject in the maildir, behind alps's
// back: a page read from the server shows the new subject, and a page the
// session kept shows the old one.
func (s *testServer) rewriteSubject(dir, from, to string) {
	s.t.Helper()
	var files []string
	for _, sub := range []string{"cur", "new"} {
		found, err := filepath.Glob(filepath.Join(dir, sub, "*"))
		if err != nil {
			s.t.Fatal(err)
		}
		files = append(files, found...)
	}
	old := "Subject: " + from + "\r\n"
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			s.t.Fatal(err)
		}
		if !strings.Contains(string(data), old) {
			continue
		}
		data = []byte(strings.Replace(string(data), old, "Subject: "+to+"\r\n", 1))
		if err := os.WriteFile(file, data, 0o600); err != nil {
			s.t.Fatal(err)
		}
		return
	}
	s.t.Fatalf("no message in %s has the subject %q", dir, from)
}

type statusPage struct {
	Mailboxes []struct {
		Mailbox string
		Total   int
		Unseen  int
	}
	Inbox struct {
		NumMessages int
		NumUnseen   int
	}
	Messages []struct {
		Envelope struct {
			Subject string
		}
	}
}

func (p statusPage) lists(name string) bool {
	for _, m := range p.Mailboxes {
		if m.Mailbox == name {
			return true
		}
	}
	return false
}

func (p statusPage) counts(name string) (total, unseen int) {
	for _, m := range p.Mailboxes {
		if m.Mailbox == name {
			return m.Total, m.Unseen
		}
	}
	return -1, -1
}

func (s *testServer) statusPage(path string) statusPage {
	s.t.Helper()
	r := s.do("GET", path, nil)
	s.expect(r, http.StatusOK)
	var page statusPage
	r.json(s.t, &page)
	return page
}

// Mail arrives in the INBOX while Archive is on screen. The check of the
// INBOX finds it, and the check of Archive that follows finds Archive as it
// was, so Archive's page is still the one the session holds.
//
// The folder list is read again after the arrival, as it was: mail that
// reaches the INBOX may have been filed into other folders as well, and their
// counts in the sidebar are read with the list.
func TestHTTP_NewMailInTheInboxLeavesTheOtherFolderAlone(t *testing.T) {
	s := newTestServer(t)
	s.deliver("Archive", "Filed")
	s.login()

	before := s.statusPage("/mailboxes/Archive?page=0")
	if len(before.Messages) != 1 || before.Messages[0].Envelope.Subject != "Filed" {
		t.Fatalf("Archive lists %+v", before.Messages)
	}

	s.rewriteSubject(filepath.Join(s.dir, ".Archive"), "Filed", "Rewritten")
	s.deliver("INBOX", "Arrival")
	s.deliver("Trash", "Elsewhere")

	// The poll, as the list makes it with Archive on screen.
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	s.expect(s.do("GET", "/mailboxes/Archive/status", nil), http.StatusOK)
	after := s.statusPage("/mailboxes/Archive?page=0")

	if len(after.Messages) != 1 || after.Messages[0].Envelope.Subject != "Filed" {
		t.Errorf("Archive was read again although nothing in it changed: %+v", after.Messages)
	}
	if after.Inbox.NumMessages != 3 || after.Inbox.NumUnseen != 3 {
		t.Errorf("the INBOX is answered at %d messages, %d unseen; want the 3 and 3 the check read", after.Inbox.NumMessages, after.Inbox.NumUnseen)
	}
	if total, unseen := after.counts("Trash"); total != 1 || unseen != 1 {
		t.Errorf("the sidebar counts Trash at %d, %d unseen, after new mail; want the 1 and 1 it holds", total, unseen)
	}
}

// A check that finds no earlier counts for the folder has nothing to compare
// with, so it learns the counts and drops nothing else.
//
// Here the counts are missing because a message no page holds was marked
// read, as the earlier messages of a conversation are when it is opened: what
// it was before is unknown, so the unread count is dropped (applyFlagsToCache).
func TestHTTP_ACheckWithNoEarlierCountsKeepsTheFolderList(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("PUT", "/settings", map[string]any{"messages_per_page": 1}), http.StatusOK)
	s.statusPage("/mailboxes/INBOX?page=0")

	older, _, err := s.store.ListMessages("INBOX", "desc", 1, 1)
	if err != nil || len(older) != 1 {
		t.Fatalf("older message: %v %v", older, err)
	}
	s.markRead("INBOX", older[0].ID)
	// Simulate this status expiring while the page and folder list remain.
	s.forgetStatus("INBOX")

	if err := s.store.CreateMailbox("Lists"); err != nil {
		t.Fatal(err)
	}

	r := s.do("GET", "/mailboxes/INBOX/status", nil)
	s.expect(r, http.StatusOK)
	var status MailboxStatusResponse
	r.json(t, &status)
	if status.Total != 2 || status.Unseen != 1 {
		t.Fatalf("the check answers %+v; want 2 messages, 1 unseen", status)
	}

	after := s.statusPage("/mailboxes/INBOX?page=0")
	if after.lists("Lists") {
		t.Error("the folder list was read again after a check that found no earlier counts")
	}
	if after.Inbox.NumMessages != 2 || after.Inbox.NumUnseen != 1 {
		t.Errorf("the INBOX is answered at %d messages, %d unseen; want 2 and 1", after.Inbox.NumMessages, after.Inbox.NumUnseen)
	}
}

// A listing that finds the folder list cached and one folder's counts missing
// asks for that folder's counts, not for the whole folder list again.
func TestHTTP_AMissingCountIsReadForItsFolderAlone(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("PUT", "/settings", map[string]any{"messages_per_page": 1}), http.StatusOK)
	s.statusPage("/mailboxes/INBOX?page=0")

	older, _, err := s.store.ListMessages("INBOX", "desc", 1, 1)
	if err != nil || len(older) != 1 {
		t.Fatalf("older message: %v %v", older, err)
	}
	s.markRead("INBOX", older[0].ID)
	// Simulate this status expiring while the page and folder list remain.
	s.forgetStatus("INBOX")

	if err := s.store.CreateMailbox("Lists"); err != nil {
		t.Fatal(err)
	}

	after := s.statusPage("/mailboxes/INBOX?page=0")
	if after.lists("Lists") {
		t.Error("the whole folder list was read again for one folder's missing counts")
	}
	if after.Inbox.NumMessages != 2 || after.Inbox.NumUnseen != 1 {
		t.Errorf("the INBOX is answered at %d messages, %d unseen; want 2 and 1", after.Inbox.NumMessages, after.Inbox.NumUnseen)
	}
	if total, unseen := after.counts("INBOX"); total != 2 || unseen != 1 {
		t.Errorf("the folder list counts the INBOX at %d, %d unseen; want 2 and 1", total, unseen)
	}
}

// A check that finds no earlier counts, and a page read at another message
// count, has seen mail come or go as surely as one with earlier counts to
// compare with: the folder list is read again, as for any real change.
func TestHTTP_ACheckWithNoEarlierCountsSeesNewMailByThePages(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("PUT", "/settings", map[string]any{"messages_per_page": 1}), http.StatusOK)
	s.statusPage("/mailboxes/INBOX?page=0")

	older, _, err := s.store.ListMessages("INBOX", "desc", 1, 1)
	if err != nil || len(older) != 1 {
		t.Fatalf("older message: %v %v", older, err)
	}
	s.markRead("INBOX", older[0].ID)
	// Simulate this status expiring while the page and folder list remain.
	s.forgetStatus("INBOX")

	s.deliver("INBOX", "Arrival")
	if err := s.store.CreateMailbox("Lists"); err != nil {
		t.Fatal(err)
	}

	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	after := s.statusPage("/mailboxes/INBOX?page=0")
	if !after.lists("Lists") {
		t.Error("the folder list was not read again after a check that found new mail")
	}
	if after.Inbox.NumMessages != 3 || after.Inbox.NumUnseen != 2 {
		t.Errorf("the INBOX is answered at %d messages, %d unseen; want 3 and 2", after.Inbox.NumMessages, after.Inbox.NumUnseen)
	}
}

// A change in one folder costs that folder its pages and the folder list, and
// no other folder its counts.
func TestHTTP_AChangeInOneFolderKeepsTheOthersCounts(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.statusPage("/mailboxes/Archive?page=0")

	s.deliver("INBOX", "Arrival")
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)

	if _, ok := s.signedInSession().Cache().Get("status:Archive"); !ok {
		t.Error("new mail in the INBOX dropped Archive's counts")
	}
}

// A check with no earlier counts and no page of the folder has nothing to say
// that the folder did not move under the conversations assembled from it, and
// drops them.
func TestHTTP_ACheckWithNothingToCompareDropsTheConversations(t *testing.T) {
	s := newTestServer(t)
	s.login()
	msgs, _, err := s.store.ListMessages("INBOX", "desc", 0, 2)
	if err != nil {
		t.Fatal(err)
	}
	uid := ""
	for _, m := range msgs {
		if m.Envelope != nil && m.Envelope.Subject == "Engines" {
			uid = m.ID.String()
		}
	}
	if uid == "" {
		t.Fatalf("no message subject Engines in %+v", msgs)
	}
	if got := len(threadOf(t, s, "INBOX", uid).Messages); got != 1 {
		t.Fatalf("the conversation opens with %d messages, want the one message", got)
	}

	fileSentReply(t, s, "engines@remote.test")
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)

	if got := len(threadOf(t, s, "INBOX", uid).Messages); got != 2 {
		t.Errorf("the conversation opens with %d messages after the check, want it read again with the reply", got)
	}
}

// Without LIST-STATUS, a listing reads the counts of the subscribed folders,
// the INBOX and the folder on screen, and no others. A folder it does not read
// again forgets the counts the session held for it, so that, opened later, it
// is read from the server rather than from a page those counts vouched for.
//
// Dropping every folder's counts on a change, as a check did before, did this
// too, so this guards the counts a change now keeps.
func TestHTTP_AFolderTheListDoesNotCountIsReadAgain(t *testing.T) {
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	for _, name := range []string{"INBOX", "Hidden"} {
		if err := user.Create(ctx, name, nil); err != nil {
			t.Fatal(err)
		}
	}
	if err := user.Subscribe(ctx, "INBOX"); err != nil {
		t.Fatal(err)
	}
	deliver := func(mailbox, subject string) {
		t.Helper()
		msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: " + subject + "\r\n" +
			"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <" + strings.ToLower(subject) + "@remote.test>\r\n\r\nJust in.\r\n"
		if _, err := user.Append(ctx, mailbox, strings.NewReader(msg), &imap.AppendOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	deliver("INBOX", "First")
	deliver("Hidden", "Old")
	s := newIMAPUserTestServer(t, user, nil)
	s.login()

	if page := s.statusPage("/mailboxes/Hidden?page=0"); len(page.Messages) != 1 {
		t.Fatalf("Hidden lists %+v", page.Messages)
	}
	s.statusPage("/mailboxes/INBOX?page=0")

	deliver("INBOX", "Arrival")
	deliver("Hidden", "Filed")

	// The poll with the INBOX on screen finds the arrival, and the listing
	// after it reads the folder list again.
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	s.statusPage("/mailboxes/INBOX?page=0")

	if page := s.statusPage("/mailboxes/Hidden?page=0"); len(page.Messages) != 2 {
		t.Errorf("Hidden lists %d messages after mail reached it; want 2: %+v", len(page.Messages), page.Messages)
	}
}

func (s *testServer) markRead(mailbox string, id provider.MessageID) {
	s.t.Helper()
	s.expect(s.do("PUT", "/mailboxes/"+mailbox+"/messages/flag", map[string]any{
		"uids": []string{id.String()}, "flags": []string{`\Seen`}, "action": "add",
	}), http.StatusOK)
}

// forgetStatus makes the cold-status path explicit: successful writes now
// re-read unknown counts rather than leaving this entry absent.
func (s *testServer) forgetStatus(mailbox string) {
	s.t.Helper()
	session, err := s.server.Sessions.Get(s.sessionToken())
	if err != nil {
		s.t.Fatal(err)
	}
	session.Cache().Delete("status:" + mailbox)
}
