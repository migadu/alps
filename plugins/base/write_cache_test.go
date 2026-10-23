// A write drops what it changed from the session's cache, and keeps the rest.
//
// A move, a delete or a send used to drop every message body the session held
// of each folder it touched, and the folder list with every folder's counts. A
// body never changes under its UID, so archiving one message cost the next one
// opened in that folder a fetch, and the listing that followed read every
// folder's counts again. What is kept has to stay true, though: the flags each
// kept copy of a message carries, the counts the sidebar shows, and the
// conversations a reply joins.
//
// A message rewritten in the maildir behind alps's back tells a body or a
// page served from the session from one read again; a folder created behind
// its back tells a folder list kept from one read again.
package alpsbase

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// rewriteInMaildir replaces from with to in the one message of dir that holds
// it, behind alps's back.
func (s *testServer) rewriteInMaildir(dir, from, to string) {
	s.t.Helper()
	var files []string
	for _, sub := range []string{"cur", "new"} {
		found, err := filepath.Glob(filepath.Join(dir, sub, "*"))
		if err != nil {
			s.t.Fatal(err)
		}
		files = append(files, found...)
	}
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			s.t.Fatal(err)
		}
		if !strings.Contains(string(data), from) {
			continue
		}
		if err := os.WriteFile(file, []byte(strings.Replace(string(data), from, to, 1)), 0o600); err != nil {
			s.t.Fatal(err)
		}
		return
	}
	s.t.Fatalf("no message in %s holds %q", dir, from)
}

func (s *testServer) bodyOf(mailbox, uid string) response {
	s.t.Helper()
	return s.do("GET", "/mailboxes/"+mailbox+"/messages/"+uid+"/raw", nil)
}

type sidebarPage struct {
	Mailboxes []struct {
		Mailbox string
		Total   int
		Unseen  int
	}
	Messages []struct {
		UID      string
		Flags    []string
		Envelope struct {
			Subject string
		}
	}
}

func (s *testServer) sidebarPage(path string) sidebarPage {
	s.t.Helper()
	r := s.do("GET", path, nil)
	s.expect(r, http.StatusOK)
	var page sidebarPage
	r.json(s.t, &page)
	return page
}

// folder returns the sidebar's entry for name, and whether there is one.
func (p sidebarPage) folder(name string) (total, unseen int, listed bool) {
	for _, m := range p.Mailboxes {
		if m.Mailbox == name {
			return m.Total, m.Unseen, true
		}
	}
	return 0, 0, false
}

func TestHTTP_FilingAMessageAwayKeepsTheOthersBodies(t *testing.T) {
	s := newTestServer(t)
	s.login()
	engines := uidOfSubject(t, s, "Engines")
	looms := uidOfSubject(t, s, "Looms")

	if r := s.bodyOf("INBOX", looms); r.status != http.StatusOK || !strings.Contains(string(r.body), "body of Looms") {
		t.Fatalf("the body reads %d %q", r.status, r.body)
	}
	s.rewriteInMaildir(s.dir, "body of Looms", "body rewritten")

	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{engines}, "to": "Archive",
	}), http.StatusOK)

	r := s.bodyOf("INBOX", looms)
	s.expect(r, http.StatusOK)
	if !strings.Contains(string(r.body), "body of Looms") {
		t.Errorf("the body of a message the move did not touch was fetched again: %q", r.body)
	}
}

// What leaves a folder does not stay readable from the session under the UID
// it had there.
func TestHTTP_AMessageFiledAwayOrDeletedIsNotReadFromTheSession(t *testing.T) {
	s := newTestServer(t)
	s.login()
	engines := uidOfSubject(t, s, "Engines")
	looms := uidOfSubject(t, s, "Looms")
	s.expect(s.bodyOf("INBOX", engines), http.StatusOK)
	s.expect(s.bodyOf("INBOX", looms), http.StatusOK)

	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{engines}, "to": "Archive",
	}), http.StatusOK)
	s.expect(s.do("DELETE", "/mailboxes/INBOX/messages", map[string]any{"uids": []string{looms}}), http.StatusOK)

	for name, uid := range map[string]string{"moved": engines, "deleted": looms} {
		if r := s.bodyOf("INBOX", uid); r.status != http.StatusNotFound {
			t.Errorf("the %s message's body is answered with %d: %s", name, r.status, r.body)
		}
	}
}

// The listing after a move is read with the folder list the session holds,
// with the counts of the two folders the move changed read again.
func TestHTTP_FilingAMessageAwayKeepsTheFolderList(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.sidebarPage("/mailboxes/INBOX?page=0")
	if err := s.store.CreateMailbox("Lists"); err != nil {
		t.Fatal(err)
	}

	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{uidOfSubject(t, s, "Engines")}, "to": "Archive",
	}), http.StatusOK)

	after := s.sidebarPage("/mailboxes/INBOX?page=0")
	if _, _, listed := after.folder("Lists"); listed {
		t.Error("the folder list was read again after a move")
	}
	if total, unseen, _ := after.folder("INBOX"); total != 1 || unseen != 1 {
		t.Errorf("the sidebar counts the INBOX at %d, %d unseen; want 1 and 1", total, unseen)
	}
	if total, unseen, _ := after.folder("Archive"); total != 1 || unseen != 1 {
		t.Errorf("the sidebar counts Archive at %d, %d unseen; want 1 and 1", total, unseen)
	}
	if len(after.Messages) != 1 || after.Messages[0].Envelope.Subject != "Looms" {
		t.Errorf("the INBOX lists %+v; want Looms alone", after.Messages)
	}
}

// A write to a folder the session's folder list does not hold reads the list
// again, so the sidebar shows the folder.
func TestHTTP_AMoveIntoAFolderTheListDoesNotHoldReadsTheList(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.sidebarPage("/mailboxes/INBOX?page=0")
	if err := s.store.CreateMailbox("Lists"); err != nil {
		t.Fatal(err)
	}

	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{uidOfSubject(t, s, "Engines")}, "to": "Lists",
	}), http.StatusOK)

	after := s.sidebarPage("/mailboxes/INBOX?page=0")
	if total, _, listed := after.folder("Lists"); !listed || total != 1 {
		t.Errorf("the sidebar lists Lists %v, with %d messages; want it, with the 1 moved there", listed, total)
	}
}

// A reply marks its message answered in the pages the session holds, rather
// than having the message's folder read again for the mark.
func TestHTTP_AReplyPatchesTheAnsweredMarkIntoThePage(t *testing.T) {
	smtpServer, _ := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	engines := uidOfSubject(t, s, "Engines")
	s.rewriteInMaildir(s.dir, "Subject: Looms\r\n", "Subject: Rewritten\r\n")

	s.expect(s.do("POST", "/messages", url.Values{
		"to":            {"charles@remote.test"},
		"subject":       {"Re: Engines"},
		"text":          {"Agreed."},
		"in_reply_to":   {"engines@remote.test"},
		"reply_mailbox": {"INBOX"},
		"reply_uid":     {engines},
	}), http.StatusOK)

	after := s.sidebarPage("/mailboxes/INBOX?page=0")
	subjects := map[string][]string{}
	for _, m := range after.Messages {
		subjects[m.Envelope.Subject] = m.Flags
	}
	if _, ok := subjects["Looms"]; !ok {
		t.Errorf("the INBOX was read again for a reply's mark: %+v", after.Messages)
	}
	if flags, ok := subjects["Engines"]; !ok || !contains(flags, `\Answered`) {
		t.Errorf("the answered message is listed with %v; want \\Answered", flags)
	}
	if total, _, listed := after.folder("Sent"); !listed || total != 1 {
		t.Errorf("the sidebar lists Sent %v, with %d messages; want it, with the reply", listed, total)
	}
}

// A reply joins its message's conversation, and reopened, the conversation
// shows it. The answered message's folder keeps its pages, so the
// conversations assembled from it are dropped on their own.
func TestHTTP_AReplyIsInItsConversationReopened(t *testing.T) {
	smtpServer, _ := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	engines := uidOfSubject(t, s, "Engines")
	if got := len(threadOf(t, s, "INBOX", engines).Messages); got != 1 {
		t.Fatalf("the conversation opens with %d messages, want the one message", got)
	}

	s.expect(s.do("POST", "/messages", url.Values{
		"to":            {"charles@remote.test"},
		"subject":       {"Re: Engines"},
		"text":          {"Agreed."},
		"in_reply_to":   {"<engines@remote.test>"},
		"reply_mailbox": {"INBOX"},
		"reply_uid":     {engines},
	}), http.StatusOK)

	if got := len(threadOf(t, s, "INBOX", engines).Messages); got != 2 {
		t.Errorf("the conversation reopens with %d messages after the reply; want the reply in it", got)
	}
}

// The sidebar shows every folder's counts as the session holds them. The
// folder list outlives writes, and reading a message moves only its folder's
// cached counts: read and left, a folder kept its old unread count in the
// sidebar through every write elsewhere.
func TestHTTP_AFolderReadAndLeftShowsItsCountInTheSidebar(t *testing.T) {
	s := newTestServer(t)
	msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Filed\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <filed@remote.test>\r\n\r\nJust in.\r\n"
	if _, _, _, err := s.store.AppendMessage("Archive", rawMessage(msg), 0); err != nil {
		t.Fatal(err)
	}
	s.login()

	archive := s.sidebarPage("/mailboxes/Archive?page=0")
	if len(archive.Messages) != 1 {
		t.Fatalf("Archive lists %+v", archive.Messages)
	}
	s.expect(s.do("PUT", "/mailboxes/Archive/messages/flag", map[string]any{
		"uids": []string{archive.Messages[0].UID}, "flags": []string{`\Seen`}, "action": "add",
	}), http.StatusOK)

	s.sidebarPage("/mailboxes/INBOX?page=0")
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/copy", map[string]any{
		"uids": []string{uidOfSubject(t, s, "Engines")}, "to": "Trash",
	}), http.StatusOK)

	after := s.sidebarPage("/mailboxes/INBOX?page=0")
	if _, unseen, _ := after.folder("Archive"); unseen != 0 {
		t.Errorf("the sidebar counts %d unread in Archive; want 0, its one message read", unseen)
	}
}

// So does a search across every folder, whose listing is answered with the
// folder list as the session holds it. A folder read there kept its old unread
// count in the sidebar through every write elsewhere, until the list expired.
func TestHTTP_ASearchAcrossEveryFolderShowsAReadFoldersCount(t *testing.T) {
	s := newTestServer(t)
	msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Filed\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <filed@remote.test>\r\n\r\nJust in.\r\n"
	if _, _, _, err := s.store.AppendMessage("Archive", rawMessage(msg), 0); err != nil {
		t.Fatal(err)
	}
	s.login()
	// Both UIDs before the search: a listing of a folder after it would draw
	// the counts into the session's folder list itself.
	filed := s.mailbox("Archive").Messages[0].UID
	engines := uidOfSubject(t, s, "Engines")

	if _, unseen, _ := s.sidebarPage("/mailboxes/*?page=0&query=Filed").folder("Archive"); unseen != 1 {
		t.Fatalf("Archive starts at %d unread", unseen)
	}
	s.expect(s.do("PUT", "/mailboxes/Archive/messages/flag", map[string]any{
		"uids": []string{filed}, "flags": []string{`\Seen`}, "action": "add",
	}), http.StatusOK)
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{engines}, "to": "Trash",
	}), http.StatusOK)
	// The re-read after the write: the INBOX's counts, then the search.
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)

	after := s.sidebarPage("/mailboxes/*?page=0&query=Filed")
	if _, unseen, _ := after.folder("Archive"); unseen != 0 {
		t.Errorf("the search across every folder counts %d unread in Archive; want 0, its one message read", unseen)
	}
}

// A folder list read again, after a subscription changed it, brings every
// folder's newest counts, and the listings after it keep them: the counts the
// session held from before are not laid over it.
func TestHTTP_AFolderListReadAgainKeepsItsCounts(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.sidebarPage("/mailboxes/INBOX?page=0")
	msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Filed\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <filed@remote.test>\r\n\r\nJust in.\r\n"
	if _, _, _, err := s.store.AppendMessage("Archive", rawMessage(msg), 0); err != nil {
		t.Fatal(err)
	}

	s.expect(s.do("PUT", "/mailboxes/Archive/subscribe", nil), http.StatusOK)
	if total, unseen, _ := s.sidebarPage("/mailboxes").folder("Archive"); total != 1 || unseen != 1 {
		t.Errorf("the folder list read again counts Archive at %d, %d unread; want 1 and 1", total, unseen)
	}

	after := s.sidebarPage("/mailboxes/INBOX?page=0")
	if total, unseen, _ := after.folder("Archive"); total != 1 || unseen != 1 {
		t.Errorf("the listing after it counts Archive at %d, %d unread; want 1 and 1", total, unseen)
	}
}

// foundAcrossEveryFolder files an unread message in Archive, signs in, and
// shows it in a search across every folder. It returns the message's UID in
// Archive, as the store names it: a listing of Archive would hold a copy of
// it, and the search's own copy is not held under the folder.
func foundAcrossEveryFolder(t *testing.T, s *testServer) string {
	t.Helper()
	msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Filed\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <filed@remote.test>\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=b\r\n\r\n--b\r\nContent-Type: text/plain\r\n\r\nJust in.\r\n--b--\r\n"
	if _, _, _, err := s.store.AppendMessage("Archive", rawMessage(msg), 0); err != nil {
		t.Fatal(err)
	}
	s.login()
	if _, unseen, _ := s.sidebarPage("/mailboxes/*?page=0&query=Filed").folder("Archive"); unseen != 1 {
		t.Fatalf("Archive starts at %d unread", unseen)
	}
	stored, _, err := s.store.ListMessages("Archive", "desc", 0, 10)
	if err != nil || len(stored) != 1 {
		t.Fatalf("Archive holds %v (%v)", stored, err)
	}
	return stored[0].ID.String()
}

// countedAfterAWriteElsewhere moves a message out of the INBOX, checks the
// INBOX as the re-read after a write does, and returns Archive's unread count
// as the search across every folder and the INBOX's listing show it.
func countedAfterAWriteElsewhere(t *testing.T, s *testServer, engines string) map[string]int {
	t.Helper()
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{engines}, "to": "Trash",
	}), http.StatusOK)
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	counted := map[string]int{}
	for _, path := range []string{"/mailboxes/*?page=0&query=Filed", "/mailboxes/INBOX?page=0"} {
		_, counted[path], _ = s.sidebarPage(path).folder("Archive")
	}
	return counted
}

// A message marked read from a search across every folder is held under the
// search, not under its folder, so nothing the session holds says what it was
// before, and its folder's count is read again. Dropped and not read, the
// folder list's own count stood in for it, and the list outlives writes: the
// folder showed the message unread through every write elsewhere until the
// list expired.
func TestHTTP_AMessageMarkedReadFromASearchAcrossEveryFolderIsCountedRead(t *testing.T) {
	s := newTestServer(t)
	filed := foundAcrossEveryFolder(t, s)
	engines := uidOfSubject(t, s, "Engines")

	s.expect(s.do("PUT", "/mailboxes/Archive/messages/flag", map[string]any{
		"uids": []string{filed}, "flags": []string{`\Seen`}, "action": "add",
	}), http.StatusOK)

	for path, unseen := range countedAfterAWriteElsewhere(t, s, engines) {
		if unseen != 0 {
			t.Errorf("%s counts %d unread in Archive; want 0, its one message read", path, unseen)
		}
	}
}

// Opening a search result peeks at its body, then the reader explicitly
// marks it read. The sidebar keeps that count through later writes elsewhere.
func TestHTTP_AMessageOpenedFromASearchAcrossEveryFolderIsCountedRead(t *testing.T) {
	s := newTestServer(t)
	filed := foundAcrossEveryFolder(t, s)
	engines := uidOfSubject(t, s, "Engines")
	s.expect(s.do("GET", "/mailboxes/Archive/messages/"+filed, nil), http.StatusOK)
	s.expect(s.do("PUT", "/mailboxes/Archive/messages/flag", map[string]any{
		"uids": []string{filed}, "flags": []string{`\Seen`}, "action": "add",
	}), http.StatusOK)
	for path, unseen := range countedAfterAWriteElsewhere(t, s, engines) {
		if unseen != 0 {
			t.Errorf("%s counts %d unread in Archive; want 0, its one message read", path, unseen)
		}
	}
}

// A message starred after it was first opened opens again starred: each part
// the session holds of it carries its flags, and the reader shows them. The
// parts outlive writes in their folder now, so a part that kept its old flags
// showed them until the session ended.
func TestHTTP_AMessageStarredOpensAgainStarred(t *testing.T) {
	s := newTestServer(t)
	gearsMsg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\nDate: Tue, 03 Jan 2006 15:04:05 +0000\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=b\r\n\r\n--b\r\nContent-Type: text/plain\r\n\r\nbody of Gears\r\n--b--\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(gearsMsg), 0); err != nil {
		t.Fatal(err)
	}
	s.login()
	gears := uidOfSubject(t, s, "Gears")
	open := func() []string {
		t.Helper()
		r := s.do("GET", "/mailboxes/INBOX/messages/"+gears, nil)
		s.expect(r, http.StatusOK)
		var page struct{ Message struct{ Flags []string } }
		r.json(t, &page)
		return page.Message.Flags
	}
	open()

	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
		"uids": []string{gears}, "flags": []string{`\Flagged`}, "action": "add",
	}), http.StatusOK)
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{
		"uids": []string{uidOfSubject(t, s, "Looms")}, "to": "Archive",
	}), http.StatusOK)

	if flags := open(); !contains(flags, `\Flagged`) {
		t.Errorf("the starred message opens again with %v; want \\Flagged", flags)
	}
}
