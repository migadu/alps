package alpsbase

import (
	"net/http"
	"net/url"
	"strings"
	"testing"
)

// A message with the two kinds of part a forward carries: a file, and an
// image its HTML shows by Content-ID.
//
//	1    multipart/related
//	1.1    text/html
//	1.2    image/png  <chart@remote.test>
//	2    text/plain  ledger.txt
const figuresMessage = "From: Charles <charles@remote.test>\r\n" +
	"To: " + testUser + "\r\n" +
	"Subject: Figures\r\n" +
	"Date: Mon, 02 Jan 2006 15:04:05 +0000\r\n" +
	"Message-ID: <figures@remote.test>\r\n" +
	"MIME-Version: 1.0\r\n" +
	"Content-Type: multipart/mixed; boundary=outer\r\n" +
	"\r\n" +
	"--outer\r\n" +
	"Content-Type: multipart/related; boundary=inner\r\n" +
	"\r\n" +
	"--inner\r\n" +
	"Content-Type: text/html; charset=utf-8\r\n" +
	"\r\n" +
	"<p>Figures <img src=\"cid:chart@remote.test\"></p>\r\n" +
	"--inner\r\n" +
	"Content-Type: image/png; name=chart.png\r\n" +
	"Content-ID: <chart@remote.test>\r\n" +
	"Content-Transfer-Encoding: base64\r\n" +
	"\r\n" +
	"iVBORw0KGgo=\r\n" +
	"--inner--\r\n" +
	"--outer\r\n" +
	"Content-Type: text/plain; charset=utf-8\r\n" +
	"Content-Disposition: attachment; filename=ledger.txt\r\n" +
	"\r\n" +
	"one two three\r\n" +
	"--outer--\r\n"

func seedFigures(t *testing.T, s *testServer) string {
	t.Helper()
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(figuresMessage), 0); err != nil {
		t.Fatal(err)
	}
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == "Figures" {
			return m.UID
		}
	}
	t.Fatal("the seeded message is not listed")
	return ""
}

func forwardForm(uid string) url.Values {
	return url.Values{
		"to":               {"mary@remote.test"},
		"subject":          {"Fwd: Figures"},
		"text":             {"See below."},
		"html":             {`<p>See below.</p><blockquote><img src="cid:chart@remote.test"></blockquote>`},
		"prev_attachments": {"2,1.2"},
		"source_mailbox":   {"INBOX"},
		"source_uid":       {uid},
	}
}

// A forward answers no message, so the parts it carries are taken from the
// message it quotes. They used to be dropped without a word: the chips on
// screen, the message sent without them.
func TestHTTP_AForwardCarriesTheOriginalsParts(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	uid := seedFigures(t, s)

	s.expect(s.do("POST", "/messages", forwardForm(uid)), http.StatusOK)

	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()
	want := "multipart/mixed[multipart/related[multipart/alternative[text/plain;inline text/html;inline] image/png;inline<chart@remote.test>] text/plain;attachment]"
	if got := structure(t, data); got != want {
		t.Errorf("structure\n got %s\nwant %s", got, want)
	}
	if !strings.Contains(data, "filename=ledger.txt") {
		t.Error("the file lost its name")
	}

	// Nothing was answered.
	for _, m := range s.mailbox("INBOX").Messages {
		if m.UID == uid && contains(m.Flags, `\Answered`) {
			t.Error("forwarding marked the original answered")
		}
	}
}

// Parts named with no message to take them from are refused, not skipped.
func TestHTTP_PartsWithNoSourceAreRefused(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	form := forwardForm("1")
	form.Del("source_mailbox")
	form.Del("source_uid")
	s.expect(s.do("POST", "/messages", form), http.StatusBadRequest)

	rec.mu.Lock()
	defer rec.mu.Unlock()
	if rec.data != "" {
		t.Error("the message was sent without its parts")
	}
}
