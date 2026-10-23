package alpsbase

import (
	"context"
	"errors"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// slowMailServer is an in-memory IMAP server that can be slow to answer one
// command, and can limit how many connections the account holds at once, as
// mail servers do. It records which mailboxes each connection selects.
type slowMailServer struct {
	mu        sync.Mutex
	armed     string        // the kind of command to hold back; empty for none
	held      chan struct{} // closed once that command has reached the server
	release   chan struct{} // closed to let it go on
	maxLogins int           // 0 for no limit
	logins    int           // connections signed in now
	refused   int           // sign-ins refused for the limit
	conns     int
	selected  map[int][]string // by connection, in order
	// dropPart has the server drop the connection, as one reset mid-command,
	// at the first FETCH of this part; nil for none. dropped says it did.
	dropPart []int
	dropped  bool
}

func newSlowMailServer() *slowMailServer {
	return &slowMailServer{
		held:     make(chan struct{}),
		release:  make(chan struct{}),
		selected: make(map[int][]string),
	}
}

// hold has the next command of kind ("status", "fetch", "search" or "append")
// wait at the server until the returned func is called.
func (m *slowMailServer) hold(t *testing.T, kind string) (release func()) {
	t.Helper()
	m.mu.Lock()
	m.armed = kind
	m.mu.Unlock()
	var once sync.Once
	return func() { once.Do(func() { close(m.release) }) }
}

func (m *slowMailServer) wait(kind string) {
	m.mu.Lock()
	take := m.armed == kind
	if take {
		m.armed = ""
	}
	m.mu.Unlock()
	if take {
		close(m.held)
		<-m.release
	}
}

type slowMailSession struct {
	imapserver.Session
	server   *slowMailServer
	netConn  net.Conn
	conn     int
	signedIn bool
}

func (s *slowMailSession) Login(ctx context.Context, username, password string) error {
	m := s.server
	m.mu.Lock()
	if m.maxLogins > 0 && m.logins >= m.maxLogins {
		m.refused++
		m.mu.Unlock()
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeLimit, Text: "Maximum connections reached"}
	}
	m.mu.Unlock()
	if err := s.Session.Login(ctx, username, password); err != nil {
		return err
	}
	m.mu.Lock()
	m.logins++
	s.signedIn = true
	m.mu.Unlock()
	return nil
}

func (s *slowMailSession) Close() error {
	m := s.server
	m.mu.Lock()
	if s.signedIn {
		m.logins--
		s.signedIn = false
	}
	m.mu.Unlock()
	return s.Session.Close()
}

func (s *slowMailSession) Select(ctx context.Context, mailbox string, options *imap.SelectOptions) (*imap.SelectData, error) {
	s.server.mu.Lock()
	s.server.selected[s.conn] = append(s.server.selected[s.conn], mailbox)
	s.server.mu.Unlock()
	return s.Session.Select(ctx, mailbox, options)
}

func (s *slowMailSession) Status(ctx context.Context, mailbox string, options *imap.StatusOptions) (*imap.StatusData, error) {
	s.server.wait("status")
	return s.Session.Status(ctx, mailbox, options)
}

func (s *slowMailSession) Fetch(ctx context.Context, w *imapserver.FetchWriter, numSet imap.NumSet, options *imap.FetchOptions) error {
	s.server.wait("fetch")
	if s.server.drops(options) {
		// Reset rather than closed, as a connection that times out at a
		// firewall is: the client reads "connection reset by peer".
		if tcp, ok := s.netConn.(*net.TCPConn); ok {
			tcp.SetLinger(0)
		}
		s.netConn.Close()
		return errors.New("connection dropped")
	}
	return s.Session.Fetch(ctx, w, numSet, options)
}

// drops reports whether a FETCH of these items is the one to drop the
// connection at, and stops dropping once it is.
func (m *slowMailServer) drops(options *imap.FetchOptions) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.dropPart == nil {
		return false
	}
	for _, section := range options.BodySection {
		if slices.Equal(section.Part, m.dropPart) {
			m.dropPart, m.dropped = nil, true
			return true
		}
	}
	return false
}

func (s *slowMailSession) Search(ctx context.Context, kind imapserver.NumKind, criteria *imap.SearchCriteria, options *imap.SearchOptions) (*imap.SearchData, error) {
	s.server.wait("search")
	return s.Session.Search(ctx, kind, criteria, options)
}

func (s *slowMailSession) Append(ctx context.Context, mailbox string, r imap.LiteralReader, options *imap.AppendOptions) (*imap.AppendData, error) {
	s.server.wait("append")
	return s.Session.Append(ctx, mailbox, r, options)
}

// A message in INBOX, a reply to it filed in Sent, and another message.
var slowServerMail = map[string][]string{
	"INBOX": {
		"From: Ada <ada@remote.test>\r\nSubject: Engines\r\nMessage-ID: <engines@remote.test>\r\n\r\nfirst\r\n",
		"From: Charles <charles@remote.test>\r\nSubject: Looms\r\nMessage-ID: <looms@remote.test>\r\n\r\nsecond\r\n",
	},
	"Sent": {
		"From: " + testUser + "\r\nTo: ada@remote.test\r\nSubject: Re: Engines\r\nMessage-ID: <reply@example.com>\r\nIn-Reply-To: <engines@remote.test>\r\n\r\nthird\r\n",
	},
	// A draft carrying two files.
	"Drafts": {
		"From: " + testUser + "\r\nSubject: Notes\r\nMIME-Version: 1.0\r\n" +
			"Content-Type: multipart/mixed; boundary=b\r\n\r\n" +
			"--b\r\nContent-Type: text/plain\r\n\r\nNotes\r\n" +
			"--b\r\nContent-Type: text/plain\r\nContent-Disposition: attachment; filename=one.txt\r\n\r\none\r\n" +
			"--b\r\nContent-Type: text/plain\r\nContent-Disposition: attachment; filename=two.txt\r\n\r\ntwo\r\n" +
			"--b--\r\n",
	},
}

// newSlowIMAPTestServer runs the server over m, signed in as testUser.
func newSlowIMAPTestServer(t *testing.T, m *slowMailServer) *testServer {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	for _, name := range []string{"INBOX", "Sent", "Drafts"} {
		if err := user.Create(ctx, name, nil); err != nil {
			t.Fatal(err)
		}
		for _, msg := range slowServerMail[name] {
			if _, err := user.Append(ctx, name, strings.NewReader(msg), &imap.AppendOptions{}); err != nil {
				t.Fatal(err)
			}
		}
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(c *imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			m.mu.Lock()
			m.conns++
			conn := m.conns
			m.mu.Unlock()
			return &slowMailSession{Session: mem.NewSession(), server: m, netConn: c.NetConn(), conn: conn}, nil, nil
		},
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}},
		InsecureAuth: true,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go imapSrv.Serve(ln)

	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	popt, err := (&imapprovider.Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	srv, err := alps.New(alps.NewLogger(), &alps.Options{
		Provider:     popt,
		SMTP:         alps.SMTPOptions{Server: "smtp://127.0.0.1:1"},
		LoginKey:     &key,
		CacheEnabled: true,
		CacheTTL:     time.Minute,
	})
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() {
		ts.Close()
		srv.Close()
		imapSrv.Close()
	})
	jar, _ := cookiejar.New(nil)
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}, server: srv}
}

// send makes a request without waiting for its answer, and answers its status
// on the channel once it has one.
func (s *testServer) send(req *http.Request) <-chan int {
	status := make(chan int, 1)
	go func() {
		res, err := s.client.Do(req)
		if err != nil {
			status <- 0
			return
		}
		res.Body.Close()
		status <- res.StatusCode
	}()
	return status
}

func (s *testServer) request(method, path string, body url.Values, headers ...string) *http.Request {
	s.t.Helper()
	var req *http.Request
	var err error
	if body != nil {
		req, err = http.NewRequest(method, s.url+path, strings.NewReader(body.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	} else {
		req, err = http.NewRequest(method, s.url+path, nil)
	}
	if err != nil {
		s.t.Fatal(err)
	}
	if method != http.MethodGet {
		req.Header.Set("Origin", s.url)
	}
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	return req
}

// Opening a message does not wait for work the user is not waiting for. Each
// of these took the session's one connection to the mail server, and a
// message opened meanwhile waited for it, as long as the server took to
// answer: a check for new mail, a batch of the folder's sender verdicts, the
// search of Sent for a conversation's replies, a draft saved while the user
// types, and the bodies a conversation reads on its own.
func TestHTTP_OpeningAMessageDoesNotWaitForBackgroundWork(t *testing.T) {
	draft := url.Values{"save_as_draft": {"1"}, "to": {"ada@remote.test"}, "subject": {"Notes"}, "text": {"Draft"}}
	for _, background := range []struct {
		name, kind, method, path string
		body                     url.Values
		headers                  []string
	}{
		{name: "a check for new mail", kind: "status", method: "GET", path: "/mailboxes/INBOX/status"},
		{name: "a batch of verdicts", kind: "fetch", method: "GET", path: "/mailboxes/INBOX/verdicts?uids=2"},
		{name: "the search of Sent for a conversation", kind: "search", method: "GET", path: "/mailboxes/INBOX/messages/1/thread"},
		{name: "a draft save", kind: "append", method: "POST", path: "/messages", body: draft},
		{name: "a body read in the background", kind: "fetch", method: "GET", path: "/mailboxes/INBOX/messages/2?view=text",
			headers: []string{"X-Alps-Background", "1"}},
		{name: "a part read in the background", kind: "fetch", method: "GET", path: "/mailboxes/INBOX/messages/2/raw?part=1",
			headers: []string{"X-Alps-Background", "1"}},
	} {
		t.Run(background.name, func(t *testing.T) {
			m := newSlowMailServer()
			s := newSlowIMAPTestServer(t, m)
			s.login()
			s.mailbox("INBOX")

			release := m.hold(t, background.kind)
			defer release()
			backgroundDone := s.send(s.request(background.method, background.path, background.body, background.headers...))
			select {
			case <-m.held:
			case <-time.After(5 * time.Second):
				t.Fatalf("%s never reached the mail server", background.name)
			}

			select {
			case status := <-s.send(s.request("GET", "/mailboxes/INBOX/messages/1?view=text", nil)):
				if status != http.StatusOK {
					t.Fatalf("opening the message answered %d", status)
				}
			case <-time.After(3 * time.Second):
				t.Fatalf("opening a message waited for %s", background.name)
			}

			release()
			if status := <-backgroundDone; status != http.StatusOK {
				t.Errorf("%s answered %d", background.name, status)
			}
		})
	}
}

// Building a conversation leaves the folder on screen selected. The search of
// Sent for the user's replies selected Sent on the session's connection, and
// the next request for the folder on screen selected that folder again.
func TestHTTP_AConversationLeavesTheFolderOnScreenSelected(t *testing.T) {
	m := newSlowMailServer()
	s := newSlowIMAPTestServer(t, m)
	s.login()
	s.mailbox("INBOX")

	r := s.do("GET", "/mailboxes/INBOX/messages/1/thread", nil)
	s.expect(r, http.StatusOK)
	var conversation struct {
		Messages []struct{ Mailbox string }
	}
	r.json(t, &conversation)
	if len(conversation.Messages) != 2 || conversation.Messages[1].Mailbox != "Sent" {
		t.Fatalf("the conversation is %+v, want the message and the reply in Sent", conversation.Messages)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX/messages/2?view=text", nil), http.StatusOK)

	m.mu.Lock()
	defer m.mu.Unlock()
	for _, selected := range m.selected {
		if selected[0] == "INBOX" && len(selected) > 1 {
			t.Errorf("the connection that listed INBOX selected %v", selected)
		}
	}
}

// A mail server that will not let the account hold another connection does
// not cost the user the session. The background work is done on the
// session's own connection instead, and the session does not ask the server
// again with every check.
func TestHTTP_ARefusedBackgroundConnectionKeepsTheSession(t *testing.T) {
	m := newSlowMailServer()
	m.maxLogins = 1
	s := newSlowIMAPTestServer(t, m)
	s.login()
	s.mailbox("INBOX")

	var verdicts verdictsPage
	r := s.do("GET", "/mailboxes/INBOX/verdicts?uids=1,2", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &verdicts)
	if len(verdicts.Verdicts) != 2 {
		t.Errorf("verdicts %+v, want both messages'", verdicts.Verdicts)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	s.expect(s.do("POST", "/messages", url.Values{"save_as_draft": {"1"}, "subject": {"Notes"}, "text": {"Draft"}}), http.StatusOK)
	r = s.do("GET", "/mailboxes/INBOX/messages/1/thread", nil)
	s.expect(r, http.StatusOK)
	var conversation struct{ Messages []struct{ Mailbox string } }
	r.json(t, &conversation)
	if len(conversation.Messages) != 2 {
		t.Errorf("the conversation is %+v, want the reply in Sent too", conversation.Messages)
	}

	s.expect(s.do("GET", "/session", nil), http.StatusOK)
	s.expect(s.do("GET", "/mailboxes/INBOX/messages/2?view=text", nil), http.StatusOK)

	m.mu.Lock()
	defer m.mu.Unlock()
	// Twice, and neither asked again: the first background work asked for its
	// connection, and the first folder list for one to read the subscriptions
	// with LSUB, which a server without LIST-EXTENDED does not say in LIST.
	if m.refused != 2 {
		t.Errorf("the server refused %d sign-ins for its limit, want 2", m.refused)
	}
}

// A draft save that carries files of the draft it replaces reads them on the
// background connection. When that connection is reset half-way, the save is
// done again on the session's own, and the new draft carries each file once.
// A file the first run had read was carried twice: the run added each to the
// message as it went. (The session's own connection does a save again too,
// on a fresh connection, when it is reset under it.)
func TestHTTP_ADraftSaveDoneAgainCarriesEachFileOnce(t *testing.T) {
	m := newSlowMailServer()
	m.dropPart = []int{3}
	s := newSlowIMAPTestServer(t, m)
	s.login()
	s.mailbox("INBOX")

	r := s.do("POST", "/messages", url.Values{
		"save_as_draft": {"1"}, "subject": {"Notes"}, "text": {"Notes"},
		"draft_mailbox": {"Drafts"}, "draft_uid": {"1"}, "prev_attachments": {"2,3"},
	})
	s.expect(r, http.StatusOK)
	var saved struct{ Attachments []struct{ Name string } }
	r.json(t, &saved)

	m.mu.Lock()
	dropped := m.dropped
	m.mu.Unlock()
	if !dropped {
		t.Fatal("the connection was not reset")
	}
	var names []string
	for _, a := range saved.Attachments {
		names = append(names, a.Name)
	}
	if !slices.Equal(names, []string{"one.txt", "two.txt"}) {
		t.Errorf("the new draft carries %v, want one.txt and two.txt once each", names)
	}
}
