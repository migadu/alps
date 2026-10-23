package alpsbase

import (
	"net/http"
	"testing"
)

// An unread message with a text and an HTML version, as most mail is.
const gears = "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\n" +
	"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMIME-Version: 1.0\r\n" +
	"Content-Type: multipart/alternative; boundary=b\r\n\r\n" +
	"--b\r\nContent-Type: text/plain\r\n\r\nbody of Gears\r\n" +
	"--b\r\nContent-Type: text/html\r\n\r\n<p>body of Gears</p>\r\n" +
	"--b--\r\n"

// Opening a message reads its body and leaves \Seen to the reader, which
// sets it by the "Mark as read" setting with a flag write of its own. The
// session's cached copies used to be marked read by the read itself, on the
// grounds that the body fetch had set \Seen on the server: the listing then
// showed a message read that the server, and every other client, had unread.
func TestHTTP_OpeningAMessageLeavesItUnread(t *testing.T) {
	s := newTestServer(t)
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(gears), 0); err != nil {
		t.Fatal(err)
	}
	s.login()

	listed := func() (uid string, flags []string) {
		t.Helper()
		for _, m := range s.mailbox("INBOX").Messages {
			if m.Envelope.Subject == "Gears" {
				return m.UID, m.Flags
			}
		}
		t.Fatal("the message is not listed")
		return "", nil
	}
	uid, _ := listed()

	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+uid+"?view=html", nil), http.StatusOK)
	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw?part=2", nil), http.StatusOK)
	if _, flags := listed(); contains(flags, `\Seen`) {
		t.Errorf("after opening it the listing shows the message read: flags %v", flags)
	}

	// The reader's own write is what marks it read, and the listing follows.
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
		"uids": []string{uid}, "flags": []string{`\Seen`}, "action": "add",
	}), http.StatusOK)
	if _, flags := listed(); !contains(flags, `\Seen`) {
		t.Errorf("marked read, the listing shows flags %v", flags)
	}
}

// A message opened again in the session is answered from the part its first
// read cached, flags included, and that read leaves \Seen as it found it. The
// reader's own write is what marks the message read or unread, and the cached
// part has to follow it as the listing does. It kept the flags of the first
// read: a message the reader had just marked read reopened unread, offering
// "Mark as read" and marked read once more, and one marked unread reopened
// read. The part is also asked for by name, as no reader open does: that
// request reads nothing else from the server, and only the cached part can
// say what the flags are.
func TestHTTP_AReopenedMessageHasTheFlagsItWasLastGiven(t *testing.T) {
	type answer struct {
		Message struct{ Flags []string }
		Flags   map[string]bool
	}
	for _, c := range []struct {
		name        string
		before      string // the write before the first open, if any
		write       string // the write between the two opens
		seenAtFirst bool
		seenAfter   bool
	}{
		{name: "marked read", write: "add", seenAfter: true},
		{name: "marked unread", before: "add", write: "remove", seenAtFirst: true},
	} {
		t.Run(c.name, func(t *testing.T) {
			s := newTestServer(t)
			if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(gears), 0); err != nil {
				t.Fatal(err)
			}
			s.login()
			uid := s.mailbox("INBOX").Messages[0].UID

			read := func(query string) answer {
				t.Helper()
				r := s.do("GET", "/mailboxes/INBOX/messages/"+uid+query, nil)
				s.expect(r, http.StatusOK)
				var a answer
				r.json(t, &a)
				return a
			}
			open := func() answer { t.Helper(); return read("?view=html") }
			mark := func(action string) {
				t.Helper()
				s.expect(s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
					"uids": []string{uid}, "flags": []string{`\Seen`}, "action": action,
				}), http.StatusOK)
			}

			if c.before != "" {
				mark(c.before)
			}
			if a := open(); contains(a.Message.Flags, `\Seen`) != c.seenAtFirst {
				t.Fatalf("opened for the first time, the message has flags %v", a.Message.Flags)
			}
			mark(c.write)
			for how, a := range map[string]answer{"reopened": open(), "its part read by name": read("?part=2")} {
				if contains(a.Message.Flags, `\Seen`) != c.seenAfter || a.Flags[`\Seen`] != c.seenAfter {
					t.Errorf("%s after it was %s, the answer has flags %v and says seen=%v", how, c.name, a.Message.Flags, a.Flags[`\Seen`])
				}
			}
		})
	}
}
