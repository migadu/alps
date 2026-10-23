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

// A draft keeps its Bcc. It was stored with From, To and Cc only, so a draft
// reopened from Drafts, on another device or after a reload, had none, and
// was sent without the Bcc recipients the user had added. The message sent
// still names none of them, and neither does its copy in Sent; they receive
// it from the SMTP envelope alone.
func TestHTTP_ADraftKeepsItsBccAndTheMessageSentNamesNone(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	raw := func(mailbox, uid string) mail.Header {
		t.Helper()
		r := s.do("GET", "/mailboxes/"+url.PathEscape(url.PathEscape(mailbox))+"/messages/"+uid+"/raw", nil)
		s.expect(r, http.StatusOK)
		m, err := mail.CreateReader(strings.NewReader(string(r.body)))
		if err != nil {
			t.Fatalf("%s/%s: %v", mailbox, uid, err)
		}
		return m.Header
	}

	form := url.Values{
		"to":            {"charles@remote.test"},
		"bcc":           {`"Hopper, Grace" <grace@remote.test>, hidden@remote.test`},
		"subject":       {"Notes"},
		"text":          {"See you."},
		"save_as_draft": {"1"},
	}
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
	uid := drafts[0].UID

	stored := raw(saved.Mailbox, uid)
	bcc, err := stored.AddressList("Bcc")
	if err != nil || len(bcc) != 2 || bcc[0].Name != "Hopper, Grace" || bcc[0].Address != "grace@remote.test" || bcc[1].Address != "hidden@remote.test" {
		t.Fatalf("the draft is stored with Bcc %v (%v), want Grace and hidden@remote.test", bcc, err)
	}

	// Edit Draft reopens a draft from its envelope, as Drafts lists it.
	r = s.do("GET", "/mailboxes/"+url.PathEscape(url.PathEscape(saved.Mailbox)), nil)
	s.expect(r, http.StatusOK)
	var listed struct {
		Messages []struct {
			Envelope struct {
				Bcc []struct{ Name, Mailbox, Host string }
			}
		}
	}
	r.json(t, &listed)
	if got := listed.Messages[0].Envelope.Bcc; len(got) != 2 || got[0].Name != "Hopper, Grace" || got[0].Mailbox != "grace" || got[1].Mailbox != "hidden" || got[1].Host != "remote.test" {
		t.Errorf("the draft's envelope names Bcc %+v", got)
	}

	// Sent from the draft, as the composer sends it.
	form.Del("save_as_draft")
	form.Set("draft_uid", uid)
	form.Set("draft_mailbox", saved.Mailbox)
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
	rec.mu.Lock()
	data, rcpt := rec.data, rec.rcpt
	rec.mu.Unlock()
	if strings.Join(rcpt, " ") != "charles@remote.test grace@remote.test hidden@remote.test" {
		t.Errorf("RCPT TO %v", rcpt)
	}
	if strings.Contains(data, "grace@remote.test") || strings.Contains(data, "hidden@remote.test") {
		t.Errorf("the message sent names a Bcc recipient:\n%s", headerSection(data))
	}
	sent := s.mailbox("Sent").Messages
	if len(sent) != 1 {
		t.Fatalf("Sent holds %d messages", len(sent))
	}
	if h := raw("Sent", sent[0].UID); h.Get("Bcc") != "" {
		t.Errorf("the copy in Sent names Bcc %q", h.Get("Bcc"))
	}
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

	// An unreadable Bcc is refused when the message is sent, and does not
	// stop the draft being saved, which is stored without it.
	form = url.Values{"to": {"charles@remote.test"}, "bcc": {"hidden@remote.test;"}, "subject": {"Notes"}, "text": {"See you."}}
	r = s.do("POST", "/messages", form)
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "invalid bcc address") {
		t.Errorf("the refusal says %s", r.body)
	}
	form.Set("save_as_draft", "1")
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
}
