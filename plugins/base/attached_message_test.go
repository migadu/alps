package alpsbase

import (
	"net/http"
	"testing"
)

// A message forwarded as an attachment is listed under its subject, over the
// maildir provider as over IMAP. The maildir provider described the forwarded
// message as one opaque part, without its envelope, and the reader had no name
// to give it.
func TestHTTP_AnAttachedMessageIsNamedAfterItsSubject(t *testing.T) {
	s := newTestServer(t)
	forward := "From: ada@example.com\r\nTo: " + testUser + "\r\nSubject: Fwd: Gears\r\nDate: Tue, 03 Jan 2006 15:04:05 +0000\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=outer\r\n\r\n" +
		"--outer\r\nContent-Type: text/plain\r\n\r\nSee below.\r\n" +
		"--outer\r\nContent-Type: message/rfc822\r\n\r\n" +
		"From: Charles <charles@remote.test>\r\nSubject: Gears\r\n\r\nbody of Gears\r\n" +
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
	if uid == "" {
		t.Fatal("the forward is not listed")
	}
	r := s.do("GET", "/mailboxes/INBOX/messages/"+uid, nil)
	s.expect(r, http.StatusOK)
	var opened struct {
		Attachments []struct{ MIMEType, Filename string }
	}
	r.json(t, &opened)
	if len(opened.Attachments) != 1 || opened.Attachments[0].MIMEType != "message/rfc822" || opened.Attachments[0].Filename != "Gears.eml" {
		t.Errorf("the attachments are %+v, want the forwarded message as Gears.eml", opened.Attachments)
	}
}
