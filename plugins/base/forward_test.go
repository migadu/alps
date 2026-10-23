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

// A message whose body shows an image filed as an attachment, as Outlook and
// Apple Mail file their inline images.
const filedImageMessage = "From: Charles <charles@remote.test>\r\n" +
	"To: " + testUser + "\r\n" +
	"Subject: Logo\r\n" +
	"Date: Mon, 02 Jan 2006 15:04:05 +0000\r\n" +
	"Message-ID: <logo@remote.test>\r\n" +
	"MIME-Version: 1.0\r\n" +
	"Content-Type: multipart/related; boundary=inner\r\n" +
	"\r\n" +
	"--inner\r\n" +
	"Content-Type: text/html; charset=utf-8\r\n" +
	"\r\n" +
	"<p>Our logo <img src=\"cid:logo@remote.test\"></p>\r\n" +
	"--inner\r\n" +
	"Content-Type: image/png; name=logo.png\r\n" +
	"Content-Disposition: attachment; filename=logo.png\r\n" +
	"Content-ID: <logo@remote.test>\r\n" +
	"Content-Transfer-Encoding: base64\r\n" +
	"\r\n" +
	"iVBORw0KGgo=\r\n" +
	"--inner--\r\n"

// replyForm answers the filed-image message, quoting its image, as the
// composer does: the image carried by its path, and named among the inline
// parts when `inline` is set.
func replyForm(uid string, inline bool) url.Values {
	form := url.Values{
		"to":               {"charles@remote.test"},
		"subject":          {"Re: Logo"},
		"text":             {"Nice."},
		"html":             {`<p>Nice.</p><blockquote><img src="cid:logo@remote.test"></blockquote>`},
		"prev_attachments": {"2"},
		"source_mailbox":   {"INBOX"},
		"source_uid":       {uid},
	}
	if inline {
		form.Set("inline_attachments", "2")
	}
	return form
}

// A part the composer carries inline, because its quote shows it, is written
// into the body whatever its disposition in the message it came from. Taken
// for a file by that disposition, the image went out as an attachment beside
// the body, and a saved draft answered with it as a file: the composer, which
// had carried it unseen, showed it as a chip.
func TestHTTP_APartTheComposerCarriesInlineIsWrittenIntoTheBody(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(filedImageMessage), 0); err != nil {
		t.Fatal(err)
	}
	uid := s.mailbox("INBOX").Messages[0].UID

	s.expect(s.do("POST", "/messages", replyForm(uid, true)), http.StatusOK)

	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()
	want := "multipart/related[multipart/alternative[text/plain;inline text/html;inline] image/png;inline<logo@remote.test>]"
	if got := structure(t, data); got != want {
		t.Errorf("structure\n got %s\nwant %s", got, want)
	}
}

// And a saved draft answers with it as one of the body's parts.
func TestHTTP_ADraftSaveAnswersWithAPartCarriedInlineAsInline(t *testing.T) {
	s := newIMAPTestServer(t, filedImageMessage)
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
	uid := s.mailbox("INBOX").Messages[0].UID

	saved := s.saveDraft(replyForm(uid, true))

	logo, ok := byName(t, saved.Attachments)["logo.png"]
	if !ok || !logo.Inline {
		t.Errorf("the draft answers with %+v, want logo.png inline", saved.Attachments)
	}
}

// A client that names no part inline keeps the rule it had: the part's own
// disposition decides.
func TestHTTP_APartNamedInlineByNoOneKeepsItsDisposition(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(filedImageMessage), 0); err != nil {
		t.Fatal(err)
	}
	uid := s.mailbox("INBOX").Messages[0].UID

	s.expect(s.do("POST", "/messages", replyForm(uid, false)), http.StatusOK)

	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()
	want := "multipart/mixed[multipart/alternative[text/plain;inline text/html;inline] image/png;attachment<logo@remote.test>]"
	if got := structure(t, data); got != want {
		t.Errorf("structure\n got %s\nwant %s", got, want)
	}
}
