package alpsbase

import (
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/emersion/go-message/mail"
)

// A recipient's display name is free text, and "Lovelace, Ada" is how a
// company directory writes one. The composer sends each field as one string,
// its recipients joined by commas, and the field was split at every comma,
// the one inside the quoted name too: neither half was an address, and the
// message could neither be sent nor saved as a draft. Whatever the names
// hold, the message goes to each address and names each recipient as given.
func TestHTTP_ARecipientNameWithACommaIsSentAsWritten(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	type recipient struct{ name, address string }
	to := []recipient{
		{"Lovelace, Ada", "ada@remote.test"},
		{"", "bob@remote.test"},
		{`Jane "JJ" Doe`, "jj@remote.test"},
		{`=?x?q?a?=`, "literal@remote.test"},
		{`=?UTF-8?Q?Ada?=`, "encoded@remote.test"},
	}
	cc := []recipient{
		{"Hopper, Grace (Navy)", "grace@remote.test"},
		{`Back\slash`, "slash@remote.test"},
		{"Døe, Jöhn", "john@remote.test"},
	}
	check := func(what, raw string) {
		t.Helper()
		r, err := mail.CreateReader(strings.NewReader(raw))
		if err != nil {
			t.Fatalf("%s: %v", what, err)
		}
		for name, want := range map[string][]recipient{"To": to, "Cc": cc} {
			list, err := r.Header.AddressList(name)
			if err != nil || len(list) != len(want) {
				t.Errorf("%s: %s is %q (%v)", what, name, r.Header.Get(name), err)
				continue
			}
			for i, a := range list {
				if a.Name != want[i].name || a.Address != want[i].address {
					t.Errorf("%s: %s[%d] = %q <%s>, want %q <%s>", what, name, i, a.Name, a.Address, want[i].name, want[i].address)
				}
			}
		}
	}

	form := url.Values{
		// As the composer writes them: a name in quotes when it holds a
		// comma or a quote, a quote or a backslash in it escaped.
		"to":      {`"Lovelace, Ada" <ada@remote.test>, bob@remote.test, "Jane \"JJ\" Doe" <jj@remote.test>, "=?x?q?a?=" <literal@remote.test>, "=?UTF-8?Q?Ada?=" <encoded@remote.test>`},
		"cc":      {`"Hopper, Grace (Navy)" <grace@remote.test>, "Back\\slash" <slash@remote.test>, "Døe, Jöhn" <john@remote.test>`},
		"bcc":     {`"Babbage, Charles" <charles@remote.test>, `},
		"subject": {"Notes"},
		"text":    {"See you."},
	}
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
	rec.mu.Lock()
	data, rcpt := rec.data, rec.rcpt
	rec.mu.Unlock()
	want := "ada@remote.test bob@remote.test jj@remote.test literal@remote.test encoded@remote.test charles@remote.test grace@remote.test slash@remote.test john@remote.test"
	if strings.Join(rcpt, " ") != want {
		t.Errorf("RCPT TO %v, want %s", rcpt, want)
	}
	check("sent", data)

	form.Set("save_as_draft", "1")
	r := s.do("POST", "/messages", form)
	s.expect(r, http.StatusOK)
	var saved struct {
		Mailbox string `json:"draft_mailbox"`
	}
	r.json(t, &saved)
	drafts := s.mailbox(saved.Mailbox).Messages
	if len(drafts) != 1 {
		t.Fatalf("%s holds %d messages", saved.Mailbox, len(drafts))
	}
	r = s.do("GET", "/mailboxes/"+url.PathEscape(url.PathEscape(saved.Mailbox))+"/messages/"+drafts[0].UID+"/raw", nil)
	s.expect(r, http.StatusOK)
	check("draft", string(r.body))
}

// A field that does not read as addresses is refused for what it is, before
// anything is sent or stored, rather than failing the send as an outage.
func TestHTTP_AnUnreadableRecipientFieldIsRefused(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	// The name bare, as a reply's recipients were once written: the comma
	// ends an address that has no address part.
	form := url.Values{"to": {"Lovelace, Ada <ada@remote.test>"}, "subject": {"Notes"}, "text": {"See you."}}
	r := s.do("POST", "/messages", form)
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "invalid to address") {
		t.Errorf("the refusal says %s", r.body)
	}
	rec.mu.Lock()
	if rec.data != "" || len(rec.rcpt) != 0 {
		t.Errorf("sent anyway: RCPT TO %v", rec.rcpt)
	}
	rec.mu.Unlock()

	// A draft does not carry Bcc, so an unreadable Bcc is refused when the
	// message is sent and does not stop the draft being saved.
	form = url.Values{"to": {"charles@remote.test"}, "bcc": {"hidden@remote.test;"}, "subject": {"Notes"}, "text": {"See you."}}
	r = s.do("POST", "/messages", form)
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "invalid bcc address") {
		t.Errorf("the refusal says %s", r.body)
	}
	form.Set("save_as_draft", "1")
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
}
