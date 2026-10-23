package alpsbase

import (
	"net/http"
	"net/url"
	"testing"
)

// The two ways a part's text cannot be decoded: a charset alps does not know,
// and a transfer encoding it does not know.
var undecodableHeads = []struct{ name, head string }{
	{"unknown charset", "Content-Type: text/plain; charset=x-unknown-charset\r\n"},
	{"unknown transfer encoding", "Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: x-unknown\r\n"},
}

func undecodableMessage(head string) string {
	return "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMIME-Version: 1.0\r\n" + head + "\r\nstored-bytes\r\n"
}

// opensWithoutItsText opens a message as the reader does, and reads the part
// again with /raw, as the reader does when the answer leaves its text out.
func opensWithoutItsText(t *testing.T, s *testServer, uid string) {
	t.Helper()
	r := s.do("GET", "/mailboxes/INBOX/messages/"+uid+"?view=text", nil)
	if r.status != http.StatusOK {
		t.Errorf("opening the message answered %d: %s", r.status, r.body)
		return
	}
	var opened openedMessage
	r.json(t, &opened)
	if opened.Part == nil {
		t.Errorf("the answer names no part to show")
	}
	if opened.Body != nil {
		t.Errorf("the answer carries %q, a text it could not decode", *opened.Body)
	}
	r = s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw?part=1", nil)
	if r.status != http.StatusOK || string(r.body) != "stored-bytes\r\n" {
		t.Errorf("/raw?part=1 answered %d %q, want the bytes as stored", r.status, r.body)
	}
}

// A message whose text cannot be decoded opens all the same: the answer
// names the part and leaves its text out, and /raw serves the part's bytes as
// they are stored. Over maildir the open answered 500, listed or not: the part
// was read through a step that decodes it, for an answer that never uses the
// decoded part. So did /raw, which decoded the part to serve it.
func TestHTTP_AnUndecodableMessageOpensOverMaildir(t *testing.T) {
	for _, tc := range undecodableHeads {
		t.Run(tc.name, func(t *testing.T) {
			s := newTestServer(t)
			if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(undecodableMessage(tc.head)), 0); err != nil {
				t.Fatal(err)
			}
			s.login()
			var uid string
			for _, m := range s.mailbox("INBOX").Messages {
				if m.Envelope.Subject == "Gears" {
					uid = m.UID
				}
			}
			if uid == "" {
				t.Fatal("the message is not listed")
			}
			t.Run("listed", func(t *testing.T) { opensWithoutItsText(t, s, uid) })

			// A session that has not listed the folder, as for a link.
			s.expect(s.do("DELETE", "/session", nil), http.StatusOK)
			s.login()
			t.Run("not listed", func(t *testing.T) { opensWithoutItsText(t, s, uid) })
		})
	}
}

// Over IMAP, a listed message opened, as its part was read without decoding.
// One the session had not listed, opened from a link or a search or after the
// listing had left the cache, was read through the decoding step and
// answered 500.
func TestHTTP_AnUndecodableMessageOpensOverIMAP(t *testing.T) {
	for _, tc := range undecodableHeads {
		t.Run(tc.name, func(t *testing.T) {
			s, _ := newReaderIMAPTestServer(t, undecodableMessage(tc.head))
			s.login()
			t.Run("not listed", func(t *testing.T) { opensWithoutItsText(t, s, "1") })
		})
	}
}

// A message forwarded as an attachment is named after its subject even when
// its own text is in a charset alps does not know. Over maildir, reading the
// forwarded message failed on its charset, and it was listed without its
// envelope, so without a name.
func TestHTTP_AnAttachedMessageInAnUnknownCharsetIsNamed(t *testing.T) {
	s := newTestServer(t)
	forward := "From: ada@example.com\r\nTo: " + testUser + "\r\nSubject: Fwd: Gears\r\nDate: Tue, 03 Jan 2006 15:04:05 +0000\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=outer\r\n\r\n" +
		"--outer\r\nContent-Type: text/plain\r\n\r\nSee below.\r\n" +
		"--outer\r\nContent-Type: message/rfc822\r\n\r\n" +
		"From: Charles <charles@remote.test>\r\nSubject: Gears\r\nContent-Type: text/plain; charset=x-unknown-charset\r\n\r\nbody of Gears\r\n" +
		"\r\n--outer--\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(forward), 0); err != nil {
		t.Fatal(err)
	}
	s.login()
	var uid string
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == "Fwd: Gears" {
			uid = m.UID
		}
	}
	r := s.do("GET", "/mailboxes/INBOX/messages/"+uid, nil)
	s.expect(r, http.StatusOK)
	var opened struct {
		Attachments []struct{ MIMEType, Filename string }
	}
	r.json(t, &opened)
	if len(opened.Attachments) != 1 || opened.Attachments[0].Filename != "Gears.eml" {
		t.Errorf("the attachments are %+v, want the forwarded message as Gears.eml", opened.Attachments)
	}
}

// A file in a charset alps does not know is kept by a draft that carries it
// forward, as its bytes are stored. Reading it to carry it failed on its
// charset, and the save answered 500, over maildir and over IMAP.
const unknownCharsetFileMessage = "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Ledger\r\n" +
	"Date: Mon, 02 Jan 2006 15:04:05 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=outer\r\n\r\n" +
	"--outer\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nThe ledger.\r\n" +
	"--outer\r\nContent-Type: text/plain; charset=x-unknown-charset\r\nContent-Disposition: attachment; filename=ledger.txt\r\n\r\n" +
	"one two three\r\n--outer--\r\n"

func savesDraftCarrying(t *testing.T, s *testServer, uid string) {
	t.Helper()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
	r := s.do("POST", "/messages", url.Values{
		"to":               {"mary@remote.test"},
		"subject":          {"Fwd: Ledger"},
		"text":             {"See the ledger."},
		"prev_attachments": {"2"},
		"source_mailbox":   {"INBOX"},
		"source_uid":       {uid},
		"save_as_draft":    {"1"},
	})
	if r.status != http.StatusOK {
		t.Fatalf("the draft save answered %d: %s", r.status, r.body)
	}
	var saved struct {
		Attachments []struct {
			Name string `json:"name"`
		} `json:"attachments"`
	}
	r.json(t, &saved)
	if len(saved.Attachments) != 1 || saved.Attachments[0].Name != "ledger.txt" {
		t.Errorf("the draft holds %+v, want ledger.txt", saved.Attachments)
	}
}

func TestHTTP_ADraftCarriesAFileInAnUnknownCharset(t *testing.T) {
	t.Run("maildir", func(t *testing.T) {
		s := newTestServer(t)
		if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(unknownCharsetFileMessage), 0); err != nil {
			t.Fatal(err)
		}
		s.login()
		var uid string
		for _, m := range s.mailbox("INBOX").Messages {
			if m.Envelope.Subject == "Ledger" {
				uid = m.UID
			}
		}
		savesDraftCarrying(t, s, uid)
	})
	t.Run("imap", func(t *testing.T) {
		s, _ := newRecordedIMAPTestServer(t, unknownCharsetFileMessage)
		s.login()
		savesDraftCarrying(t, s, s.mailbox("INBOX").Messages[0].UID)
	})
}
