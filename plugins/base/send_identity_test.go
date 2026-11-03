package alpsbase

import (
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/emersion/go-message/mail"
)

// fromHeader is the From of a raw message.
func fromHeader(t *testing.T, raw string) *mail.Address {
	t.Helper()
	r, err := mail.CreateReader(strings.NewReader(raw))
	if err != nil {
		t.Fatalf("reading the message: %v", err)
	}
	list, err := r.Header.AddressList("From")
	if err != nil || len(list) != 1 {
		t.Fatalf("From is %q: %v", r.Header.Get("From"), err)
	}
	return list[0]
}

// savedDraft is the raw draft a save stored under subject.
func (s *testServer) savedDraft(subject string, r response) string {
	s.t.Helper()
	s.expect(r, http.StatusOK)
	var saved struct {
		Mailbox string `json:"draft_mailbox"`
		UID     string `json:"draft_uid"`
	}
	r.json(s.t, &saved)
	raw := s.do("GET", "/mailboxes/"+url.PathEscape(url.PathEscape(saved.Mailbox))+"/messages/"+saved.UID+"/raw", nil)
	s.expect(raw, http.StatusOK)
	if !strings.Contains(string(raw.body), "Subject: "+subject) {
		s.t.Fatalf("draft %s/%s is not %q", saved.Mailbox, saved.UID, subject)
	}
	return string(raw.body)
}

// A message sent, or a draft saved, from one of the identities says From that
// identity, under its own name or, without one, the account's display name,
// and goes to the server under its address. The account's own address, in
// any case, is the account.
func TestHTTP_AMessageIsSentFromTheIdentityItNames(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	s.expect(s.do("PUT", "/settings", map[string]any{
		"from": "Ada Lovelace",
		"identities": []Identity{
			{Name: "Lovelace, Analytical Engines", Address: "engines@work.example"},
			{Address: "ada@lists.example"},
		},
	}), http.StatusOK)

	for i, tc := range []struct {
		from, name, address string
	}{
		{"engines@work.example", "Lovelace, Analytical Engines", "engines@work.example"},
		{"ENGINES@work.example", "Lovelace, Analytical Engines", "engines@work.example"},
		{"ada@lists.example", "Ada Lovelace", "ada@lists.example"},
		{strings.ToUpper(testUser), "Ada Lovelace", testUser},
		{"", "Ada Lovelace", testUser},
	} {
		subject := "Notes " + string(rune('A'+i))
		form := url.Values{"to": {"charles@remote.test"}, "subject": {subject}, "text": {"See you."}, "from": {tc.from}}
		s.expect(s.do("POST", "/messages", form), http.StatusOK)
		rec.mu.Lock()
		data, envelopeFrom := rec.data, rec.from
		rec.mu.Unlock()
		if got := fromHeader(t, data); got.Name != tc.name || got.Address != tc.address {
			t.Errorf("sent from %q: From %+v, want %q <%s>", tc.from, got, tc.name, tc.address)
		}
		if envelopeFrom != tc.address {
			t.Errorf("sent from %q: MAIL FROM %q, want %q", tc.from, envelopeFrom, tc.address)
		}

		form.Set("save_as_draft", "1")
		draft := s.savedDraft(subject, s.do("POST", "/messages", form))
		if got := fromHeader(t, draft); got.Name != tc.name || got.Address != tc.address {
			t.Errorf("draft saved from %q: From %+v, want %q <%s>", tc.from, got, tc.name, tc.address)
		}
	}

	// Without a display name of its own or the account's, the address alone.
	s.expect(s.do("PUT", "/settings", map[string]any{"from": ""}), http.StatusOK)
	form := url.Values{"to": {"charles@remote.test"}, "subject": {"Bare"}, "text": {"See you."}, "from": {"ada@lists.example"}}
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()
	if got := fromHeader(t, data); got.Name != "" || got.Address != "ada@lists.example" {
		t.Errorf("From %+v, want the address alone", got)
	}
}

// A send or a draft save from an address that is neither the account's nor
// one of its identities is refused, as such, and nothing is sent or stored.
func TestHTTP_AMessageFromAnotherAddressIsRefused(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()
	s.expect(s.do("PUT", "/settings", map[string]any{"identities": []Identity{{Address: "engines@work.example"}}}), http.StatusOK)

	for _, from := range []string{"charles@remote.test", "Ada <engines@work.example>", "someone@work.example"} {
		form := url.Values{"to": {"charles@remote.test"}, "subject": {"Spoofed"}, "text": {"See you."}, "from": {from}}
		r := s.do("POST", "/messages", form)
		s.expect(r, http.StatusForbidden)
		var refusal struct{ Code string }
		r.json(t, &refusal)
		if refusal.Code != "sender_not_allowed" {
			t.Errorf("sent from %q: answered %s", from, r.body)
		}

		form.Set("save_as_draft", "1")
		r = s.do("POST", "/messages", form)
		s.expect(r, http.StatusForbidden)
		r.json(t, &refusal)
		if refusal.Code != "sender_not_allowed" {
			t.Errorf("saved from %q: answered %s", from, r.body)
		}
	}
	rec.mu.Lock()
	defer rec.mu.Unlock()
	if rec.from != "" || rec.data != "" {
		t.Errorf("a refused message reached the server: MAIL FROM %q", rec.from)
	}
	for _, name := range s.mailbox("INBOX").names() {
		for _, m := range s.mailbox(name).Messages {
			if m.Envelope.Subject == "Spoofed" {
				t.Errorf("a refused draft was stored in %s", name)
			}
		}
	}
}

// A mail server that will not take an identity as the sender says so, by the
// answer to MAIL FROM or, as Postfix does, to the first recipient; the
// composer is told it is the sender that was refused. The same answer for
// the account's own address is some other trouble, and is said as before.
func TestHTTP_TheServerRefusingAnIdentityIsSaidAsSuch(t *testing.T) {
	for name, refuse := range map[string]struct{ cmd, reply string }{
		"MAIL FROM":            {"MAIL", "553 5.7.1 Sender address not allowed"},
		"RCPT TO, by its code": {"RCPT", "550 5.1.8 Bad sender's system address"},
		"RCPT TO, in words":    {"RCPT", "553 5.7.1 <engines@work.example>: Sender address rejected: not owned by user ada@example.com"},
	} {
		t.Run(name, func(t *testing.T) {
			addr, _ := listenScripted(t, func(_ int, cmd string) string {
				if cmd == refuse.cmd {
					return refuse.reply
				}
				return ""
			})
			s := newTestServerWithSMTP(t, addr)
			s.login()
			s.expect(s.do("PUT", "/settings", map[string]any{"identities": []Identity{{Address: "engines@work.example"}}}), http.StatusOK)

			form := sendForm()
			form.Set("from", "engines@work.example")
			r := s.do("POST", "/messages", form)
			s.expect(r, http.StatusForbidden)
			var refusal struct{ Error, Code string }
			r.json(t, &refusal)
			if refusal.Code != "sender_not_allowed" || !strings.Contains(refusal.Error, refuse.reply[:3]) {
				t.Errorf("answered %s", r.body)
			}

			form.Del("from")
			s.expect(s.do("POST", "/messages", form), http.StatusInternalServerError)
		})
	}

	// A recipient refused for itself is no refusal of the sender.
	addr, _ := listenScripted(t, func(_ int, cmd string) string {
		if cmd == "RCPT" {
			return "550 5.1.1 No such user"
		}
		return ""
	})
	s := newTestServerWithSMTP(t, addr)
	s.login()
	s.expect(s.do("PUT", "/settings", map[string]any{"identities": []Identity{{Address: "engines@work.example"}}}), http.StatusOK)
	form := sendForm()
	form.Set("from", "engines@work.example")
	s.expect(s.do("POST", "/messages", form), http.StatusInternalServerError)
}
