package alpsbase

import (
	"bufio"
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// idleMailServer is an in-memory IMAP server, advertising IDLE or not, that
// records by connection the IDLE and STATUS commands it is sent.
type idleMailServer struct {
	user *imapmemserver.User
	addr string

	mu     sync.Mutex
	conns  int
	idles  map[int]int  // IDLE commands, by connection
	inIdle map[int]bool // in IDLE now, by connection
	status map[int]int  // STATUS commands, by connection
}

type idleMailSession struct {
	imapserver.Session
	server *idleMailServer
	conn   int
}

func (s *idleMailSession) Idle(ctx context.Context, w *imapserver.UpdateWriter, stop <-chan struct{}) error {
	m := s.server
	m.mu.Lock()
	m.idles[s.conn]++
	m.inIdle[s.conn] = true
	m.mu.Unlock()
	defer func() {
		m.mu.Lock()
		m.inIdle[s.conn] = false
		m.mu.Unlock()
	}()
	return s.Session.Idle(ctx, w, stop)
}

func (s *idleMailSession) Status(ctx context.Context, mailbox string, options *imap.StatusOptions) (*imap.StatusData, error) {
	s.server.mu.Lock()
	s.server.status[s.conn]++
	s.server.mu.Unlock()
	return s.Session.Status(ctx, mailbox, options)
}

// idling is the connection in IDLE now, or 0.
func (m *idleMailServer) idling() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	for conn, on := range m.inIdle {
		if on {
			return conn
		}
	}
	return 0
}

func (m *idleMailServer) counts(conn int) (idles, status int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.idles[conn], m.status[conn]
}

func (m *idleMailServer) allIdles() int {
	m.mu.Lock()
	defer m.mu.Unlock()
	n := 0
	for _, idles := range m.idles {
		n += idles
	}
	return n
}

// markRead sets \Seen on the Inbox's first message, as another client of the
// account would.
func (m *idleMailServer) markRead(t *testing.T) {
	t.Helper()
	c, err := imapclient.DialInsecure(m.addr, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer c.Close()
	if err := c.Login(testUser, testPassword).Wait(); err != nil {
		t.Fatal(err)
	}
	if _, err := c.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := c.Store(imap.SeqSetNum(1), &imap.StoreFlags{Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{imap.FlagSeen}}, nil).Close(); err != nil {
		t.Fatal(err)
	}
}

// deliver files a message into the Inbox as mail arriving from elsewhere,
// not through any of alps's connections.
func (m *idleMailServer) deliver(t *testing.T, subject string) {
	t.Helper()
	msg := "From: Ada <ada@remote.test>\r\nSubject: " + subject + "\r\n\r\nnew\r\n"
	if _, err := m.user.Append(context.Background(), "INBOX", strings.NewReader(msg), &imap.AppendOptions{}); err != nil {
		t.Fatal(err)
	}
}

type pushOptions struct {
	push   bool // [server] push_new_mail
	noIdle bool // the mail server does not advertise IDLE
	// configure sets up the HTTP server before it starts.
	configure func(*http.Server)
}

// newPushTestServer runs alps over an idleMailServer, signed in as testUser.
func newPushTestServer(t *testing.T, opts pushOptions) (*testServer, *idleMailServer) {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	for _, name := range []string{"INBOX", "Sent"} {
		if err := user.Create(ctx, name, nil); err != nil {
			t.Fatal(err)
		}
	}
	for _, msg := range slowServerMail["INBOX"] {
		if _, err := user.Append(ctx, "INBOX", strings.NewReader(msg), &imap.AppendOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	m := &idleMailServer{user: user, idles: map[int]int{}, inIdle: map[int]bool{}, status: map[int]int{}}
	mem := imapmemserver.New()
	mem.AddUser(user)
	caps := imap.CapSet{imap.CapIMAP4rev1: {}}
	if !opts.noIdle {
		caps[imap.CapIdle] = struct{}{}
	}
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(c *imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			m.mu.Lock()
			m.conns++
			conn := m.conns
			m.mu.Unlock()
			return &idleMailSession{Session: mem.NewSession(), server: m, conn: conn}, nil, nil
		},
		Caps:         caps,
		InsecureAuth: true,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go imapSrv.Serve(ln)
	m.addr = ln.Addr().String()

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
		PushNewMail:  opts.push,
	})
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewUnstartedServer(srv)
	if opts.configure != nil {
		opts.configure(ts.Config)
	}
	ts.Start()
	t.Cleanup(func() {
		ts.CloseClientConnections()
		ts.Close()
		srv.Close()
		// The sessions' IDLEs ended before the server goes: the in-memory
		// server races its own IDLE when a client goes away in the middle
		// of one.
		for deadline := time.Now().Add(3 * time.Second); m.idling() != 0 && time.Now().Before(deadline); {
			time.Sleep(5 * time.Millisecond)
		}
		imapSrv.Close()
	})
	jar, _ := cookiejar.New(nil)
	s := &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}, server: srv}
	s.login()
	return s, m
}

// streamEvent is one event of an event stream, or a comment line.
type streamEvent struct {
	name, data string
	comment    bool
}

// openEvents opens the session's event stream and answers what it sends as
// it comes, until it ends.
func (s *testServer) openEvents() (*http.Response, <-chan streamEvent) {
	s.t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	s.t.Cleanup(cancel)
	res, err := s.client.Do(s.request("GET", "/events", nil).WithContext(ctx))
	if err != nil {
		s.t.Fatal(err)
	}
	events := make(chan streamEvent, 64)
	if res.StatusCode != http.StatusOK {
		res.Body.Close()
		close(events)
		return res, events
	}
	go func() {
		defer close(events)
		defer res.Body.Close()
		lines := bufio.NewScanner(res.Body)
		var ev streamEvent
		for lines.Scan() {
			line := lines.Text()
			switch {
			case line == "":
				if ev.name != "" || ev.data != "" {
					events <- ev
				}
				ev = streamEvent{}
			case strings.HasPrefix(line, ":"):
				events <- streamEvent{comment: true}
			case strings.HasPrefix(line, "event:"):
				ev.name = strings.TrimSpace(strings.TrimPrefix(line, "event:"))
			case strings.HasPrefix(line, "data:"):
				ev.data = strings.TrimSpace(strings.TrimPrefix(line, "data:"))
			}
		}
	}()
	return res, events
}

// openStream opens the event stream and fails the test unless it is one.
func (s *testServer) openStream() <-chan streamEvent {
	s.t.Helper()
	res, events := s.openEvents()
	if res.StatusCode != http.StatusOK {
		s.t.Fatalf("GET /events answered %d, want an event stream", res.StatusCode)
	}
	return events
}

// awaitEvent waits for the next event called name, passing over comments and
// failing on any other event.
func awaitEvent(t *testing.T, events <-chan streamEvent, name string) streamEvent {
	t.Helper()
	timeout := time.After(5 * time.Second)
	for {
		select {
		case ev, ok := <-events:
			if !ok {
				t.Fatalf("the stream ended before %q", name)
			}
			if ev.comment {
				continue
			}
			if ev.name != name {
				t.Fatalf("the stream sent %q, want %q", ev.name, name)
			}
			return ev
		case <-timeout:
			t.Fatalf("no %q came", name)
		}
	}
}

// awaitEnd waits for the stream to end, failing on any event but a comment.
func awaitEnd(t *testing.T, events <-chan streamEvent, what string) {
	t.Helper()
	timeout := time.After(3 * time.Second)
	for {
		select {
		case ev, ok := <-events:
			if !ok {
				return
			}
			if !ev.comment {
				t.Fatalf("%s: the stream sent %q", what, ev.name)
			}
		case <-timeout:
			t.Fatalf("%s: the stream did not end", what)
		}
	}
}

func eventuallyTrue(t *testing.T, what string, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for !cond() {
		if time.Now().After(deadline) {
			t.Fatalf("waited in vain for %s", what)
		}
		time.Sleep(5 * time.Millisecond)
	}
}

func (s *testServer) pushOffered() bool {
	s.t.Helper()
	r := s.do("GET", "/settings", nil)
	s.expect(r, http.StatusOK)
	var settings struct{ PushNewMail bool }
	r.json(s.t, &settings)
	return settings.PushNewMail
}

// Mail that arrives while the session waits in IDLE reaches its event stream
// at once, and the session no longer answers from the pages it held of the
// Inbox. The counts it held are kept, for the check the page makes next to
// tell the change from them.
func TestHTTP_NewMailDuringIdleReachesTheEventStream(t *testing.T) {
	s, m := newPushTestServer(t, pushOptions{push: true})
	if !s.pushOffered() {
		t.Error("the settings do not say that new mail is pushed")
	}
	s.mailbox("INBOX")
	cache := s.signedInSession().Cache()
	if _, ok := cache.Get("status:INBOX"); !ok || len(cache.GetKeysWithPrefix("messages:INBOX:")) == 0 {
		t.Fatal("the listing left nothing of the Inbox in the cache")
	}

	events := s.openStream()
	awaitEvent(t, events, "watching")
	m.deliver(t, "Babbage")
	if ev := awaitEvent(t, events, "inbox"); ev.data != "INBOX" {
		t.Errorf("the news names %q", ev.data)
	}

	if _, ok := cache.Get("status:INBOX"); !ok {
		t.Error("the Inbox's counts were dropped: the check after the news finds none to compare with")
	}
	if keys := cache.GetKeysWithPrefix("messages:INBOX:"); len(keys) > 0 {
		t.Errorf("the Inbox's pages from before the news are still held: %v", keys)
	}
	// The check the page makes on the news: the counts, then the listing.
	r := s.do("GET", "/mailboxes/INBOX/status", nil)
	s.expect(r, http.StatusOK)
	var counts MailboxStatusResponse
	r.json(t, &counts)
	if counts.Total != 3 {
		t.Errorf("the check counts %d messages, want the new one too", counts.Total)
	}
	if page := s.mailbox("INBOX"); len(page.Messages) != 3 {
		t.Errorf("the Inbox lists %d messages after the check, want the new one too", len(page.Messages))
	}
}

// A check for new mail runs on the background connection while the session
// waits there in IDLE: the IDLE ends for it, and begins again after it.
func TestHTTP_IdleMakesWayForACheckForNewMail(t *testing.T) {
	s, m := newPushTestServer(t, pushOptions{push: true})
	events := s.openStream()
	awaitEvent(t, events, "watching")
	conn := m.idling()
	if conn == 0 {
		t.Fatal("no connection is in IDLE")
	}

	select {
	case status := <-s.send(s.request("GET", "/mailboxes/INBOX/status", nil)):
		if status != http.StatusOK {
			t.Fatalf("the check answered %d", status)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("the check for new mail waited for the IDLE")
	}
	if _, status := m.counts(conn); status != 1 {
		t.Errorf("the connection in IDLE ran %d STATUS commands, want the check's", status)
	}
	eventuallyTrue(t, "the IDLE to begin again", func() bool {
		idles, _ := m.counts(conn)
		return idles == 2 && m.idling() == conn
	})

	m.deliver(t, "Babbage")
	awaitEvent(t, events, "inbox")
}

// A mail server without IDLE gets no push: the stream says so and ends, and
// the session goes on as before.
func TestHTTP_AServerWithoutIdleGetsNoPush(t *testing.T) {
	s, m := newPushTestServer(t, pushOptions{push: true, noIdle: true})
	events := s.openStream()
	if ev := awaitEvent(t, events, "unavailable"); ev.data != "INBOX" {
		t.Errorf("the refusal names %q", ev.data)
	}
	awaitEnd(t, events, "a server without IDLE")
	again := s.openStream()
	awaitEvent(t, again, "unavailable")
	awaitEnd(t, again, "asked again")

	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	s.expect(s.do("GET", "/session", nil), http.StatusOK)
	if page := s.mailbox("INBOX"); len(page.Messages) != 2 {
		t.Errorf("the Inbox lists %d messages", len(page.Messages))
	}
	if n := m.allIdles(); n != 0 {
		t.Errorf("%d IDLE commands reached a server without IDLE", n)
	}
}

// With push off, as by default, there is no event stream and no IDLE.
func TestHTTP_PushOffMeansNoStreamAndNoIdle(t *testing.T) {
	s, m := newPushTestServer(t, pushOptions{})
	if s.pushOffered() {
		t.Error("the settings say that new mail is pushed")
	}
	res, _ := s.openEvents()
	if res.StatusCode != http.StatusNotFound {
		t.Errorf("GET /events answered %d, want 404", res.StatusCode)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	time.Sleep(100 * time.Millisecond)
	if n := m.allIdles(); n != 0 {
		t.Errorf("%d IDLE commands with push off", n)
	}
}

// Signing out ends the stream, and the IDLE with it.
func TestHTTP_SigningOutEndsTheEventStream(t *testing.T) {
	s, m := newPushTestServer(t, pushOptions{push: true})
	events := s.openStream()
	awaitEvent(t, events, "watching")
	s.expect(s.do("DELETE", "/session", nil), http.StatusOK)
	awaitEnd(t, events, "signing out")
	eventuallyTrue(t, "the IDLE to end", func() bool { return m.idling() == 0 })
}

// The stream says it is still there, as a comment, so that a proxy between
// it and the browser does not take its silence for a dead connection. The
// HTTP server's own read and write timeouts, meant for requests that end, do
// not cut it either, and its answer is not to be buffered on the way.
func TestHTTP_TheEventStreamSendsHeartbeatsPastTheServerTimeouts(t *testing.T) {
	heartbeat := eventStreamHeartbeat
	eventStreamHeartbeat = 100 * time.Millisecond
	t.Cleanup(func() { eventStreamHeartbeat = heartbeat })
	if heartbeat < 20*time.Second || heartbeat > 30*time.Second {
		t.Errorf("a heartbeat every %v, want one every 20 to 30 s: under the minute proxies commonly allow, and seldom", heartbeat)
	}

	s, m := newPushTestServer(t, pushOptions{push: true, configure: func(hs *http.Server) {
		hs.ReadTimeout = 300 * time.Millisecond
		hs.WriteTimeout = 300 * time.Millisecond
	}})
	res, events := s.openEvents()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("GET /events answered %d", res.StatusCode)
	}
	for header, want := range map[string]string{
		"Content-Type":      "text/event-stream",
		"Cache-Control":     "no-cache",
		"X-Accel-Buffering": "no",
	} {
		if got := res.Header.Get(header); !strings.HasPrefix(got, want) {
			t.Errorf("%s: %q, want %q", header, got, want)
		}
	}

	heartbeats := 0
	timeout := time.After(1200 * time.Millisecond)
	for done := false; !done; {
		select {
		case ev, ok := <-events:
			if !ok {
				t.Fatalf("the stream ended after %d heartbeats", heartbeats)
			}
			if ev.comment {
				heartbeats++
			}
		case <-timeout:
			done = true
		}
	}
	if heartbeats < 5 {
		t.Errorf("%d heartbeats in 1.2 s, want one every 100 ms", heartbeats)
	}
	m.deliver(t, "Babbage")
	awaitEvent(t, events, "inbox")
}

// A flag changed elsewhere is no news: push is for mail that arrives or
// goes. The pages the session holds of the Inbox are kept, and the poll
// brings the flag, as without push.
func TestHTTP_AFlagChangedElsewhereIsNoNews(t *testing.T) {
	s, m := newPushTestServer(t, pushOptions{push: true})
	s.mailbox("INBOX")
	cache := s.signedInSession().Cache()
	events := s.openStream()
	awaitEvent(t, events, "watching")

	m.markRead(t)
	timeout := time.After(500 * time.Millisecond)
	for done := false; !done; {
		select {
		case ev := <-events:
			if !ev.comment {
				t.Fatalf("a flag changed elsewhere sent %q", ev.name)
			}
		case <-timeout:
			done = true
		}
	}
	if len(cache.GetKeysWithPrefix("messages:INBOX:")) == 0 {
		t.Error("a flag changed elsewhere dropped the Inbox's pages")
	}
}
