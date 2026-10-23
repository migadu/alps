package alpsbase

import (
	"net/http"
	"strings"
	"testing"
)

// A message whose text is base64, opened and downloaded over maildir, is
// decoded once. The maildir provider gave the part's bytes already decoded,
// under the header that says base64: the reader decoded them again and showed
// no text, a download of the part answered 500, and the whole message's .eml
// said base64 over plain text.
func TestHTTP_AnEncodedMessageIsDecodedOnce(t *testing.T) {
	s := newTestServer(t)
	encoded := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\nDate: Tue, 03 Jan 2006 15:04:05 +0000\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
		"U2VlIHlvdS4NCg==\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(encoded), 0); err != nil {
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

	r := s.do("GET", "/mailboxes/INBOX/messages/"+uid, nil)
	s.expect(r, http.StatusOK)
	var opened struct{ Body string }
	r.json(t, &opened)
	if opened.Body != "See you.\r\n" {
		t.Errorf("the reader shows %q", opened.Body)
	}

	r = s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw?part=1", nil)
	if r.status != http.StatusOK || string(r.body) != "See you.\r\n" {
		t.Errorf("the part downloads as %d %q", r.status, r.body)
	}

	r = s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw", nil)
	s.expect(r, http.StatusOK)
	if !strings.HasSuffix(string(r.body), "Content-Transfer-Encoding: base64\r\n\r\nU2VlIHlvdS4NCg==\r\n") {
		t.Errorf("the message downloads as %q", r.body)
	}
}

// A Latin-1 text over maildir reads as it was written. Converted to UTF-8 by
// the provider, and converted again by the reader under its Latin-1 header,
// "café" showed as "cafÃ©".
func TestHTTP_ALatin1MessageReadsAsWritten(t *testing.T) {
	s := newTestServer(t)
	latin1 := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\nDate: Tue, 03 Jan 2006 15:04:05 +0000\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: text/plain; charset=iso-8859-1\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" +
		"caf=E9\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(latin1), 0); err != nil {
		t.Fatal(err)
	}
	s.login()
	var uid string
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == "Gears" {
			uid = m.UID
		}
	}
	r := s.do("GET", "/mailboxes/INBOX/messages/"+uid, nil)
	s.expect(r, http.StatusOK)
	var opened struct{ Body string }
	r.json(t, &opened)
	if opened.Body != "café\r\n" {
		t.Errorf("the reader shows %q", opened.Body)
	}
}
