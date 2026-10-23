package alpsbase

import (
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/emersion/go-message/mail"
)

// mail.ParseAddress returns an unquoted local part. SMTP still needs its
// quoted-string form in MAIL FROM and RCPT TO.
func TestSendMessage_KeepsQuotedLocalPartsInTheEnvelope(t *testing.T) {
	for _, role := range []string{"From", "To", "Cc", "Bcc"} {
		t.Run(role, func(t *testing.T) {
			c, rec := dialRecorder(t)
			msg := outgoing()
			addr := `"a; b\"\\c"@remote.test`
			switch role {
			case "From":
				msg.From = addr
			case "To":
				msg.To = []string{addr}
			case "Cc":
				msg.Cc = []string{addr}
			case "Bcc":
				msg.Bcc = []string{addr}
			}
			if err := sendMessage(c, msg); err != nil {
				t.Fatal(err)
			}
			rec.mu.Lock()
			defer rec.mu.Unlock()
			from, _ := mail.ParseAddress(msg.From)
			if rec.from != from.Address {
				t.Errorf("MAIL FROM %q, want %q", rec.from, from.Address)
			}
			var want []string
			for _, s := range append(append(append([]string{}, msg.To...), msg.Bcc...), msg.Cc...) {
				a, _ := mail.ParseAddress(s)
				want = append(want, a.Address)
			}
			if strings.Join(rec.rcpt, "\n") != strings.Join(want, "\n") {
				t.Errorf("RCPT TO %q, want %q", rec.rcpt, want)
			}
			r, err := mail.CreateReader(strings.NewReader(rec.data))
			if err != nil {
				t.Fatal(err)
			}
			if r.Header.Get("Bcc") != "" {
				t.Fatal("DATA names Bcc")
			}
			if role == "Bcc" && strings.Contains(rec.data, `a; b`) {
				t.Fatal("DATA leaks the blind recipient")
			}
		})
	}
}

func TestHTTP_AQuotedLocalPartIsDeliveredWithoutExposingBcc(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	s.expect(s.do("POST", "/messages", url.Values{
		"to": {"visible@remote.test"}, "bcc": {`"a;b"@remote.test`}, "subject": {"Quoted local"}, "text": {"Notes"},
	}), http.StatusOK)
	rec.mu.Lock()
	defer rec.mu.Unlock()
	if strings.Join(rec.rcpt, " ") != "visible@remote.test a;b@remote.test" {
		t.Fatalf("RCPT TO %v", rec.rcpt)
	}
	if strings.Contains(rec.data, "a;b") {
		t.Fatal("delivered DATA exposes the Bcc")
	}
	sent := s.mailbox("Sent").Messages
	if len(sent) != 1 {
		t.Fatalf("Sent holds %d messages", len(sent))
	}
	r := s.do("GET", "/mailboxes/Sent/messages/"+sent[0].UID+"/raw", nil)
	s.expect(r, http.StatusOK)
	if strings.Contains(string(r.body), "a;b") {
		t.Fatal("Sent copy exposes the Bcc")
	}
}
