package alpsbase

import (
	"errors"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/emersion/go-message/mail"
	"github.com/fernet/fernet-go"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider/maildir"
	"github.com/migadu/alps/provider/multi"
)

// newBareLoginServer is newTestServerWithSMTP for an account that signs in
// as "ada", with no domain. With defaultDomain set, the server routes logins
// through the multi provider, which completes a bare login with it.
func newBareLoginServer(t *testing.T, smtpServer, defaultDomain string) *testServer {
	t.Helper()
	base := t.TempDir()
	passwd := filepath.Join(base, "passwd")
	if err := os.WriteFile(passwd, []byte("ada:{PLAIN}"+testPassword+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	store := maildir.NewProvider(filepath.Join(base, "ada"), "ada")
	if err := store.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	popt, err := (&maildir.Config{Path: filepath.Join(base, "%u"), AuthPasswdFile: passwd}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	if defaultDomain != "" {
		popt = &multi.Options{DefaultDomain: defaultDomain, Default: popt}
	}
	srv, err := alps.New(alps.NewLogger(), &alps.Options{
		Provider: popt,
		SMTP:     alps.SMTPOptions{Server: smtpServer},
		LoginKey: &key,
	})
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() {
		ts.Close()
		srv.Close()
	})
	jar, _ := cookiejar.New(nil)
	s := &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}, store: store, dir: filepath.Join(base, "ada"), server: srv}
	s.expect(s.do("POST", "/session", map[string]string{"username": "ada", "password": testPassword}), http.StatusOK)
	return s
}

// A login is not always an email address. Some IMAP servers sign users in
// with a plain user name, and the multi provider takes one under its
// default_domain, which it uses to choose the backend. The login was used as
// the From address all the same, and "ada" does not read as an address: every
// send failed, and so did every draft save. The address is the login with
// that domain, worked out at sign-in, and a message is sent from it.
func TestHTTP_ABareLoginSendsFromItsAddress(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newBareLoginServer(t, smtpServer, "example.com")
	s.expect(s.do("PUT", "/settings", map[string]any{"from": "Ada Lovelace"}), http.StatusOK)

	form := url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"See you."}}
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
	rec.mu.Lock()
	data, envelopeFrom := rec.data, rec.from
	rec.mu.Unlock()
	if envelopeFrom != "ada@example.com" {
		t.Errorf("MAIL FROM %q", envelopeFrom)
	}
	if addr, err := fromOf(data); err != nil || addr.Name != "Ada Lovelace" || addr.Address != "ada@example.com" {
		t.Errorf("From %+v, %v", addr, err)
	}

	form.Set("save_as_draft", "1")
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
}

// fromOf reads the one address a message's From names.
func fromOf(raw string) (*mail.Address, error) {
	r, err := mail.CreateReader(strings.NewReader(raw))
	if err != nil {
		return nil, err
	}
	list, err := r.Header.AddressList("From")
	if err != nil || len(list) != 1 {
		return nil, errors.New("From is " + r.Header.Get("From"))
	}
	return list[0], nil
}
