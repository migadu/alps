package alpsbase

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider/maildir"
)

// These tests run the real server, with the base plugin's routes, middleware
// and session manager, over a maildir in a temporary directory, and talk to it
// over HTTP the way the frontend does.

const (
	testUser     = "ada@example.com"
	testPassword = "correct horse"
)

type rawMessage []byte

func (m rawMessage) WriteTo(w io.Writer) (int64, error) {
	n, err := w.Write(m)
	return int64(n), err
}

type testServer struct {
	t      *testing.T
	url    string
	client *http.Client
	store  *maildir.Provider
}

func newTestServer(t *testing.T) *testServer {
	t.Helper()
	base := t.TempDir()
	passwd := filepath.Join(base, "passwd")
	if err := os.WriteFile(passwd, []byte(testUser+":{PLAIN}"+testPassword+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	// Seed the mailbox directly through the provider the server will use.
	store := maildir.NewProvider(filepath.Join(base, "ada"), testUser)
	for _, name := range []string{"INBOX", "Trash", "Archive"} {
		if err := store.CreateMailbox(name); err != nil {
			t.Fatal(err)
		}
	}
	for _, subject := range []string{"Engines", "Looms"} {
		msg := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: " + subject + "\r\nDate: Mon, 02 Jan 2006 15:04:05 +0000\r\n\r\nbody of " + subject + "\r\n"
		if _, _, _, err := store.AppendMessage("INBOX", rawMessage(msg), 0); err != nil {
			t.Fatal(err)
		}
	}

	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	opts := &alps.Options{
		Provider: alps.ProviderOptions{
			Type:    "maildir",
			IMAP:    alps.IMAPProviderOptions{Server: "imap://127.0.0.1:1"},
			Maildir: alps.MaildirProviderOptions{Path: filepath.Join(base, "%u"), AuthPasswdFile: passwd},
		},
		SMTP:         alps.SMTPOptions{Server: "smtp://127.0.0.1:1"},
		LoginKey:     &key,
		CacheEnabled: true,
		CacheTTL:     time.Minute,
	}
	srv, err := alps.New(alps.NewLogger(), opts)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() {
		ts.Close()
		srv.Close()
	})

	jar, _ := cookiejar.New(nil)
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}, store: store}
}

type response struct {
	status int
	header http.Header
	body   []byte
}

func (r response) json(t *testing.T, v any) {
	t.Helper()
	if err := json.Unmarshal(r.body, v); err != nil {
		t.Fatalf("decoding %q: %v", r.body, err)
	}
}

// do sends a request as the frontend would: JSON bodies, and the page's own
// Origin on anything that changes state.
func (s *testServer) do(method, path string, body any, headers ...string) response {
	s.t.Helper()
	var reader io.Reader
	contentType := ""
	switch b := body.(type) {
	case nil:
	case url.Values:
		reader = strings.NewReader(b.Encode())
		contentType = "application/x-www-form-urlencoded"
	default:
		data, err := json.Marshal(b)
		if err != nil {
			s.t.Fatal(err)
		}
		reader = bytes.NewReader(data)
		contentType = "application/json"
	}
	req, err := http.NewRequest(method, s.url+path, reader)
	if err != nil {
		s.t.Fatal(err)
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	if method != http.MethodGet {
		req.Header.Set("Origin", s.url)
	}
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	res, err := s.client.Do(req)
	if err != nil {
		s.t.Fatal(err)
	}
	defer res.Body.Close()
	data, _ := io.ReadAll(res.Body)
	return response{status: res.StatusCode, header: res.Header, body: data}
}

func (s *testServer) expect(r response, status int) {
	s.t.Helper()
	if r.status != status {
		s.t.Fatalf("status %d, want %d: %s", r.status, status, r.body)
	}
}

func (s *testServer) login() {
	s.t.Helper()
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusOK)
}

type mailboxPage struct {
	Mailboxes []struct {
		Mailbox string
	}
	Messages []struct {
		UID      string
		Flags    []string
		Envelope struct {
			Subject string
		}
	}
	Total int
}

func (s *testServer) mailbox(name string) mailboxPage {
	s.t.Helper()
	r := s.do("GET", "/mailboxes/"+url.PathEscape(url.PathEscape(name)), nil)
	s.expect(r, http.StatusOK)
	var page mailboxPage
	r.json(s.t, &page)
	return page
}

func (p mailboxPage) names() []string {
	var out []string
	for _, m := range p.Mailboxes {
		out = append(out, m.Mailbox)
	}
	return out
}

func contains(list []string, want string) bool {
	for _, v := range list {
		if v == want {
			return true
		}
	}
	return false
}

func TestHTTP_Login(t *testing.T) {
	s := newTestServer(t)

	r := s.do("POST", "/session", map[string]string{})
	s.expect(r, http.StatusBadRequest)

	r = s.do("POST", "/session", map[string]string{"username": testUser, "password": "wrong"})
	s.expect(r, http.StatusUnauthorized)
	if strings.Contains(r.header.Get("Set-Cookie"), "alps_session=") {
		t.Error("a failed login set a session cookie")
	}

	r = s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword})
	s.expect(r, http.StatusOK)
	var session, loggedIn *http.Cookie
	for _, c := range (&http.Response{Header: r.header}).Cookies() {
		switch c.Name {
		case "alps_session":
			session = c
		case "alps_logged_in":
			loggedIn = c
		}
	}
	if session == nil || !session.HttpOnly || session.SameSite != http.SameSiteStrictMode {
		t.Errorf("session cookie = %+v, want HttpOnly and SameSite=Strict", session)
	}
	if loggedIn == nil || loggedIn.HttpOnly {
		t.Errorf("logged-in marker = %+v, want one the page can read", loggedIn)
	}

	var info struct {
		Username       string
		EnabledPlugins []string
	}
	r = s.do("GET", "/session", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &info)
	if info.Username != testUser || !contains(info.EnabledPlugins, "base") {
		t.Errorf("session = %+v", info)
	}
}

func TestHTTP_EverythingElseNeedsASession(t *testing.T) {
	s := newTestServer(t)
	for _, path := range []string{"/mailboxes/INBOX", "/settings", "/proxy?url=https://example.com/a.png", "/bimi/avatar?domain=example.com"} {
		s.expect(s.do("GET", path, nil), http.StatusUnauthorized)
	}
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Receipts"}}), http.StatusUnauthorized)
}

func TestHTTP_RefusesAForeignOrigin(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Receipts"}}, "Origin", "https://evil.example"), http.StatusForbidden)
	if contains(s.mailbox("INBOX").names(), "Receipts") {
		t.Fatal("the cross-site request created the folder")
	}
}

func TestHTTP_ListsMailboxesAndMessages(t *testing.T) {
	s := newTestServer(t)
	s.login()
	page := s.mailbox("INBOX")
	for _, name := range []string{"INBOX", "Trash", "Archive"} {
		if !contains(page.names(), name) {
			t.Errorf("mailboxes %v lack %s", page.names(), name)
		}
	}
	if page.Total != 2 || len(page.Messages) != 2 {
		t.Fatalf("total %d, %d messages", page.Total, len(page.Messages))
	}
	var subjects []string
	for _, m := range page.Messages {
		subjects = append(subjects, m.Envelope.Subject)
		if m.UID == "" {
			t.Error("a message has no UID")
		}
	}
	if !contains(subjects, "Engines") || !contains(subjects, "Looms") {
		t.Errorf("subjects %v", subjects)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX?page=-1", nil), http.StatusBadRequest)
}

func TestHTTP_Flags(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := s.mailbox("INBOX").Messages[0].UID
	flag := func(body map[string]any) response {
		return s.do("PUT", "/mailboxes/INBOX/messages/flag", body)
	}

	s.expect(flag(map[string]any{"uids": []string{uid}, "flags": []string{`\Seen`}, "action": "add"}), http.StatusOK)
	seen := false
	for _, m := range s.mailbox("INBOX").Messages {
		if m.UID == uid && contains(m.Flags, `\Seen`) {
			seen = true
		}
	}
	if !seen {
		t.Error("the listing does not show the flag just set")
	}

	var refusal struct {
		Error    string
		Rejected []string
	}
	r := flag(map[string]any{"uids": []string{uid}, "flags": []string{"receipts"}, "action": "add"})
	s.expect(r, http.StatusBadRequest)
	r.json(t, &refusal)
	if refusal.Error != "unsupported_flags" || len(refusal.Rejected) != 1 || refusal.Rejected[0] != "receipts" {
		t.Errorf("refusal = %+v", refusal)
	}

	s.expect(flag(map[string]any{"uids": []string{}, "flags": []string{`\Seen`}, "action": "add"}), http.StatusBadRequest)
	s.expect(flag(map[string]any{"uids": []string{uid}, "flags": []string{`\Seen`}, "action": "toggle"}), http.StatusBadRequest)

	many := make([]string, maxFlagUIDs+1)
	for i := range many {
		many[i] = uid
	}
	s.expect(flag(map[string]any{"uids": many, "flags": []string{`\Seen`}, "action": "add"}), http.StatusRequestEntityTooLarge)
}

func TestHTTP_MoveAndDeleteMessages(t *testing.T) {
	s := newTestServer(t)
	s.login()
	msgs := s.mailbox("INBOX").Messages

	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{msgs[0].UID}, "to": "Archive"}), http.StatusOK)
	if got := s.mailbox("Archive").Total; got != 1 {
		t.Errorf("Archive holds %d messages after the move", got)
	}
	if got := s.mailbox("INBOX").Total; got != 1 {
		t.Errorf("INBOX holds %d messages after the move", got)
	}

	s.expect(s.do("DELETE", "/mailboxes/INBOX/messages", map[string]any{"uids": []string{msgs[1].UID}}), http.StatusOK)
	if got := s.mailbox("INBOX").Total; got != 0 {
		t.Errorf("INBOX holds %d messages after the delete", got)
	}

	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{}, "to": "Archive"}), http.StatusBadRequest)
	s.expect(s.do("DELETE", "/mailboxes/INBOX/messages", map[string]any{"uids": []string{}}), http.StatusBadRequest)
}

func TestHTTP_FolderVerbs(t *testing.T) {
	s := newTestServer(t)
	s.login()

	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {""}}), http.StatusBadRequest)
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Receipts"}}), http.StatusOK)
	if !contains(s.mailbox("INBOX").names(), "Receipts") {
		t.Fatal("the new folder is not listed")
	}

	s.expect(s.do("PUT", "/mailboxes/Receipts/rename", map[string]string{"new_name": ""}), http.StatusBadRequest)
	s.expect(s.do("PUT", "/mailboxes/Receipts/rename", map[string]string{"new_name": "Invoices"}), http.StatusOK)
	names := s.mailbox("INBOX").names()
	if contains(names, "Receipts") || !contains(names, "Invoices") {
		t.Fatalf("after the rename the folders are %v", names)
	}

	s.expect(s.do("DELETE", "/mailboxes/Invoices", nil), http.StatusOK)
	if contains(s.mailbox("INBOX").names(), "Invoices") {
		t.Fatal("the deleted folder is still listed")
	}
}

func TestHTTP_AFailureDoesNotDescribeTheServer(t *testing.T) {
	s := newTestServer(t)
	s.login()
	r := s.do("DELETE", "/mailboxes/INBOX", nil)
	s.expect(r, http.StatusInternalServerError)
	var body map[string]string
	r.json(t, &body)
	if body["error"] != "server_error" || len(body) != 1 {
		t.Errorf("body = %s, want only the slug", r.body)
	}
}

func TestHTTP_EmptyOnlyTrashOrJunk(t *testing.T) {
	s := newTestServer(t)
	s.login()
	msgs := s.mailbox("INBOX").Messages
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{msgs[0].UID}, "to": "Archive"}), http.StatusOK)
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{msgs[1].UID}, "to": "Trash"}), http.StatusOK)

	r := s.do("POST", "/mailboxes/Archive/empty", nil)
	s.expect(r, http.StatusForbidden)
	if !strings.Contains(string(r.body), "not_discardable") {
		t.Errorf("body = %s", r.body)
	}
	if got := s.mailbox("Archive").Total; got != 1 {
		t.Errorf("Archive holds %d messages after a refused empty", got)
	}

	s.expect(s.do("POST", "/mailboxes/Trash/empty", nil), http.StatusOK)
	if got := s.mailbox("Trash").Total; got != 0 {
		t.Errorf("Trash holds %d messages after emptying", got)
	}
}

func TestHTTP_Logout(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("DELETE", "/session", nil), http.StatusOK)
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusUnauthorized)
}

func TestHTTP_ProxyRefusals(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("GET", "/proxy", nil), http.StatusBadRequest)
	for _, target := range []string{"file:///etc/passwd", "javascript:alert(1)", "ftp://example.com/a.png", "not a url"} {
		s.expect(s.do("GET", "/proxy?url="+url.QueryEscape(target), nil), http.StatusBadRequest)
	}
	// This test server is on loopback, which the proxy must not reach.
	s.expect(s.do("GET", "/proxy?url="+url.QueryEscape(s.url+"/session"), nil), http.StatusBadGateway)
}

func TestHTTP_BIMIAvatarNeedsADomain(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("GET", "/bimi/avatar", nil), http.StatusBadRequest)
}
