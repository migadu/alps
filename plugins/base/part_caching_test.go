package alpsbase

import (
	"bytes"
	"context"
	"maps"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
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

// partsCacheTTL is the session cache's lifetime in these tests: long enough
// that nothing in it expires while a test runs, so each test says itself
// what the server has forgotten (see forget).
const partsCacheTTL = time.Hour

// imapCommands counts, by name, the commands an IMAP server is sent over
// all its connections.
type imapCommands struct {
	mu     sync.Mutex
	counts map[string]int
}

// snapshot is what has been counted so far.
func (c *imapCommands) snapshot() map[string]int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return maps.Clone(c.counts)
}

// since is what has been sent after the counts in before.
func (c *imapCommands) since(before map[string]int) map[string]int {
	sent := map[string]int{}
	for name, n := range c.snapshot() {
		if n > before[name] {
			sent[name] = n - before[name]
		}
	}
	return sent
}

// commandLines records one connection: it cuts what the client sends into
// lines, and counts each by its command's name, a UID FETCH as a FETCH.
type commandLines struct {
	all     *imapCommands
	pending []byte
}

func (l *commandLines) ClientBytes(p []byte) {
	l.all.mu.Lock()
	defer l.all.mu.Unlock()
	l.pending = append(l.pending, p...)
	for {
		end := bytes.Index(l.pending, []byte("\r\n"))
		if end < 0 {
			return
		}
		fields := strings.Fields(string(l.pending[:end]))
		l.pending = l.pending[end+2:]
		if len(fields) < 2 {
			continue
		}
		name := strings.ToUpper(fields[1])
		if name == "UID" && len(fields) > 2 {
			name = strings.ToUpper(fields[2])
		}
		l.all.counts[name]++
	}
}

func (l *commandLines) ServerBytes([]byte) {}

type partsServer struct {
	*testServer
	commands *imapCommands
	users    map[string]*imapmemserver.User
}

// newPartsServer runs the server over an in-memory IMAP server holding the
// given accounts, each with INBOX, and counts the commands it is sent.
func newPartsServer(t *testing.T, usernames ...string) *partsServer {
	t.Helper()
	ps := &partsServer{commands: &imapCommands{counts: map[string]int{}}, users: map[string]*imapmemserver.User{}}
	mem := imapmemserver.New()
	for _, name := range usernames {
		user := imapmemserver.NewUser(name, testPassword)
		if err := user.Create(context.Background(), "INBOX", nil); err != nil {
			t.Fatal(err)
		}
		mem.AddUser(user)
		ps.users[name] = user
	}
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		NewDebugConn: func(net.Conn) imapserver.DebugConn { return &commandLines{all: ps.commands} },
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}},
		InsecureAuth: true,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go imapSrv.Serve(ln)
	t.Cleanup(func() { imapSrv.Close() })

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
		CacheTTL:     partsCacheTTL,
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
	ps.testServer = &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}, server: srv}
	return ps
}

// as is a second browser on the same server, signed in as username.
func (ps *partsServer) as(username string) *testServer {
	jar, _ := cookiejar.New(nil)
	other := &testServer{t: ps.t, url: ps.url, client: &http.Client{Jar: jar}, server: ps.server}
	other.expect(other.do("POST", "/session", map[string]string{"username": username, "password": testPassword}), http.StatusOK)
	return other
}

func (ps *partsServer) deliver(username, mailbox, msg string) {
	ps.t.Helper()
	if _, err := ps.users[username].Append(context.Background(), mailbox, strings.NewReader(msg), &imap.AppendOptions{}); err != nil {
		ps.t.Fatal(err)
	}
}

// forget drops what this browser's session has cached under keys starting
// with prefix, all of it for "", as the cache does once entries expire.
func (ps *partsServer) forget(prefix string) {
	ps.t.Helper()
	session, err := ps.server.Sessions.Get(ps.sessionToken())
	if err != nil {
		ps.t.Fatal(err)
	}
	session.Cache().DeletePrefix(prefix)
}

// remakeWork deletes Work and makes it again behind alps's back, holding one
// message with the given note and the photo "\x89PNG\r\n\x1a\nnew". The
// in-memory server goes on serving a deleted mailbox to a connection that
// still has it selected, so it then reads the photo of INBOX's first
// message, which moves the connection on, as using the app would.
func (ps *partsServer) remakeWork(note string) {
	ps.t.Helper()
	user := ps.users[testUser]
	if err := user.Delete(context.Background(), "Work"); err != nil {
		ps.t.Fatal(err)
	}
	if err := user.Create(context.Background(), "Work", nil); err != nil {
		ps.t.Fatal(err)
	}
	ps.deliver(testUser, "Work", withNoteAndPhoto(note, "iVBORw0KGgpuZXc="))
	ps.expect(ps.do("GET", "/mailboxes/INBOX/messages/1/raw?part=2", nil), http.StatusOK)
}

// revalidateAtOnce asks for each path in parallel, naming the ETag given for
// it, as a reader asks for a message's inline images, and returns the
// statuses in order.
func (ps *partsServer) revalidateAtOnce(paths, etags []string) []int {
	ps.t.Helper()
	statuses := make([]int, len(paths))
	errs := make([]error, len(paths))
	var wg sync.WaitGroup
	for i := range paths {
		wg.Add(1)
		go func() {
			defer wg.Done()
			req, err := http.NewRequest("GET", ps.url+paths[i], nil)
			if err != nil {
				errs[i] = err
				return
			}
			req.Header.Set("If-None-Match", etags[i])
			res, err := ps.client.Do(req)
			if err != nil {
				errs[i] = err
				return
			}
			res.Body.Close()
			statuses[i] = res.StatusCode
		}()
	}
	wg.Wait()
	for _, err := range errs {
		if err != nil {
			ps.t.Fatal(err)
		}
	}
	return statuses
}

// withPhoto is a message whose second part is an image of the given bytes,
// base64-encoded.
func withPhoto(base64Body string) string {
	return withNoteAndPhoto("The photo.", base64Body)
}

// withNoteAndPhoto is withPhoto with the given text as its first part.
func withNoteAndPhoto(note, base64Body string) string {
	return "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Photo\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n" +
		"--b\r\nContent-Type: text/plain\r\n\r\n" + note + "\r\n" +
		"--b\r\nContent-Type: image/png\r\nContent-Disposition: attachment; filename=photo.png\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
		base64Body + "\r\n--b--\r\n"
}

// TestHTTP_RawPartRevalidates: a part of a message never changes while its
// mailbox keeps its UIDVALIDITY, so a browser that holds one is told so with
// a 304, and the part is not fetched from IMAP again. The answer stays the
// browser's own (private), and the browser checks before every reuse
// (no-cache): that is what keeps another account signed in to the same
// browser from being shown a copy that is not its own.
func TestHTTP_RawPartRevalidates(t *testing.T) {
	const other = "grace@example.com"
	ps := newPartsServer(t, testUser, other)
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))  // "\x89PNG\r\n\x1a\nada"
	ps.deliver(other, "INBOX", withPhoto("iVBORw0KGgpncmFjZQ==")) // "\x89PNG\r\n\x1a\ngrace"
	ps.login()

	const part = "/mailboxes/INBOX/messages/1/raw?part=2"
	first := ps.do("GET", part, nil)
	ps.expect(first, http.StatusOK)
	if string(first.body) != "\x89PNG\r\n\x1a\nada" {
		t.Fatalf("part body %q", first.body)
	}
	cc := first.header.Get("Cache-Control")
	if !strings.Contains(cc, "private") || !strings.Contains(cc, "no-cache") {
		t.Fatalf("Cache-Control %q; want the part kept by the browser alone, and checked before reuse", cc)
	}
	etag := first.header.Get("ETag")
	if etag == "" {
		t.Fatal("no ETag on the part: the browser has nothing to revalidate its copy with")
	}
	const text = "/mailboxes/INBOX/messages/1/raw?part=1"
	textFirst := ps.do("GET", text, nil)
	ps.expect(textFirst, http.StatusOK)
	textETag := textFirst.header.Get("ETag")
	if textETag == "" || textETag == etag {
		t.Fatalf("the text part's ETag %q, the image's %q", textETag, etag)
	}

	// Reopened once the server has forgotten the message, with its parts asked
	// for at once: each copy is confirmed, and confirming them all costs one
	// STATUS. Nothing is fetched, and neither the folder list nor the
	// settings are read.
	ps.forget("")
	before := ps.commands.snapshot()
	var paths, etags []string
	for range 4 {
		paths = append(paths, part, text)
		etags = append(etags, etag, textETag)
	}
	for i, status := range ps.revalidateAtOnce(paths, etags) {
		if status != http.StatusNotModified {
			t.Fatalf("revalidating %s: status %d, want 304", paths[i], status)
		}
	}
	if sent := ps.commands.since(before); !maps.Equal(sent, map[string]int{"STATUS": 1}) {
		t.Fatalf("confirming the copies sent %v; want one STATUS and nothing else", sent)
	}
	again := ps.do("GET", part, nil, "If-None-Match", etag)
	ps.expect(again, http.StatusNotModified)
	if len(again.body) != 0 {
		t.Fatalf("a 304 with a body: %q", again.body)
	}
	if again.header.Get("ETag") != etag {
		t.Fatalf("304 names %q, want %q", again.header.Get("ETag"), etag)
	}

	// Another account's INBOX has the same UIDVALIDITY and the same UID, and
	// the same URL: the copy is not its own.
	grace := ps.as(other)
	theirs := grace.do("GET", part, nil, "If-None-Match", etag)
	grace.expect(theirs, http.StatusOK)
	if string(theirs.body) != "\x89PNG\r\n\x1a\ngrace" {
		t.Fatalf("the other account's part %q", theirs.body)
	}

	// What failed is not cached.
	missing := ps.do("GET", "/mailboxes/INBOX/messages/99/raw?part=2", nil)
	if missing.status == http.StatusOK || missing.header.Get("ETag") != "" || missing.header.Get("Cache-Control") != "" {
		t.Fatalf("a missing message answered %d with ETag %q, Cache-Control %q", missing.status, missing.header.Get("ETag"), missing.header.Get("Cache-Control"))
	}
}

// TestHTTP_RawPartOfRemadeMailbox: a mailbox deleted and made again by
// another client starts its UIDs over under a new UIDVALIDITY, so UID 1 is
// another message now. The session cache can still hold the old message's
// part after the UIDVALIDITY it was read under has expired, as every entry
// lasts from when it was written. Once the new UIDVALIDITY is read, the part
// is the new message's: the old bytes never go out under an ETag that later
// requests are told is current.
func TestHTTP_RawPartOfRemadeMailbox(t *testing.T) {
	ps := newPartsServer(t, testUser)
	user := ps.users[testUser]
	if err := user.Create(context.Background(), "Work", nil); err != nil {
		t.Fatal(err)
	}
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
	ps.deliver(testUser, "Work", withPhoto("iVBORw0KGgpvbGQ=")) // "\x89PNG\r\n\x1a\nold"
	ps.login()

	const work = "/mailboxes/Work/messages/1/raw?part=2"
	old := ps.do("GET", work, nil)
	ps.expect(old, http.StatusOK)
	oldETag := old.header.Get("ETag")
	if string(old.body) != "\x89PNG\r\n\x1a\nold" || oldETag == "" {
		t.Fatalf("part body %q, ETag %q", old.body, oldETag)
	}

	ps.remakeWork("The photo.")

	// Work's UIDVALIDITY runs out in the session cache, and the old part
	// does not yet.
	ps.forget("uidvalidity:Work")
	renewed := ps.do("GET", work, nil, "If-None-Match", oldETag)
	ps.expect(renewed, http.StatusOK)
	newETag := renewed.header.Get("ETag")
	if newETag == "" || newETag == oldETag {
		t.Fatalf("the remade mailbox's part has ETag %q, the old part had %q", newETag, oldETag)
	}
	if string(renewed.body) != "\x89PNG\r\n\x1a\nnew" {
		t.Fatalf("under the remade mailbox's ETag came %q; want the new message's part", renewed.body)
	}

	// The new ETag is confirmed for the new bytes, and the old one is not.
	ps.expect(ps.do("GET", work, nil, "If-None-Match", newETag), http.StatusNotModified)
	stale := ps.do("GET", work, nil, "If-None-Match", oldETag)
	ps.expect(stale, http.StatusOK)
	if string(stale.body) != "\x89PNG\r\n\x1a\nnew" {
		t.Fatalf("the old ETag got %q", stale.body)
	}
}

// TestHTTP_RawPartOfAnOpenedMessage: the reader opens a message with the JSON
// request, which reads the part it is to show, and then asks /raw for that
// part. The part is read from IMAP once, and read again only once the
// mailbox it was read from has been made again.
func TestHTTP_RawPartOfAnOpenedMessage(t *testing.T) {
	ps := newPartsServer(t, testUser)
	if err := ps.users[testUser].Create(context.Background(), "Work", nil); err != nil {
		t.Fatal(err)
	}
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
	ps.deliver(testUser, "Work", withNoteAndPhoto("Before.", "iVBORw0KGgpvbGQ="))
	ps.login()

	opened := ps.do("GET", "/mailboxes/Work/messages/1?view=text", nil)
	ps.expect(opened, http.StatusOK)
	var page struct{ Part struct{ Path []int } }
	opened.json(t, &page)
	if len(page.Part.Path) != 1 || page.Part.Path[0] != 1 {
		t.Fatalf("the message opens on part %v, want [1]", page.Part.Path)
	}
	const body = "/mailboxes/Work/messages/1/raw?part=1"
	before := ps.commands.snapshot()
	shown := ps.do("GET", body, nil)
	ps.expect(shown, http.StatusOK)
	if string(shown.body) != "Before." || shown.header.Get("ETag") == "" {
		t.Fatalf("part body %q, ETag %q", shown.body, shown.header.Get("ETag"))
	}
	if sent := ps.commands.since(before); sent["FETCH"] != 0 {
		t.Fatalf("/raw read again the part the JSON request had just read: sent %v", sent)
	}

	// What the JSON request read is another message's once Work is made
	// again, and the new UIDVALIDITY is read.
	ps.remakeWork("After.")
	ps.forget("uidvalidity:Work")
	before = ps.commands.snapshot()
	renewed := ps.do("GET", body, nil, "If-None-Match", shown.header.Get("ETag"))
	ps.expect(renewed, http.StatusOK)
	if string(renewed.body) != "After." {
		t.Fatalf("the remade mailbox's message showed %q", renewed.body)
	}
	if sent := ps.commands.since(before); sent["FETCH"] != 1 {
		t.Fatalf("reading the remade mailbox's part sent %v; want one FETCH", sent)
	}
}

// TestHTTP_RawPartUnderAStaleUIDValidity: Work is made again by another
// client while the session still has its old UIDVALIDITY cached. A part read
// from it now is the new message's, so it goes out under the UIDVALIDITY the
// server gave when Work was selected for the read, never under the cached
// one: a browser holding the old message's part under that ETag would be
// told its copy is current.
func TestHTTP_RawPartUnderAStaleUIDValidity(t *testing.T) {
	ps := newPartsServer(t, testUser)
	if err := ps.users[testUser].Create(context.Background(), "Work", nil); err != nil {
		t.Fatal(err)
	}
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
	ps.deliver(testUser, "Work", withNoteAndPhoto("Before.", "iVBORw0KGgpvbGQ="))
	ps.login()

	const body = "/mailboxes/Work/messages/1/raw?part=1"
	old := ps.do("GET", body, nil)
	ps.expect(old, http.StatusOK)
	oldETag := old.header.Get("ETag")
	if string(old.body) != "Before." || oldETag == "" {
		t.Fatalf("part body %q, ETag %q", old.body, oldETag)
	}

	// The session forgets the part, and not Work's UIDVALIDITY.
	ps.remakeWork("After.")
	ps.forget("message:Work:")
	renewed := ps.do("GET", body, nil)
	ps.expect(renewed, http.StatusOK)
	newETag := renewed.header.Get("ETag")
	if string(renewed.body) != "After." {
		t.Fatalf("the remade mailbox's message showed %q", renewed.body)
	}
	if newETag == "" || newETag == oldETag {
		t.Fatalf("the remade mailbox's part went out under ETag %q, the old message's had %q", newETag, oldETag)
	}

	// From then on the new ETag is confirmed, and the old one is not.
	before := ps.commands.snapshot()
	ps.expect(ps.do("GET", body, nil, "If-None-Match", newETag), http.StatusNotModified)
	if sent := ps.commands.since(before); len(sent) != 0 {
		t.Fatalf("confirming the new part sent %v; want nothing", sent)
	}
	stale := ps.do("GET", body, nil, "If-None-Match", oldETag)
	ps.expect(stale, http.StatusOK)
	if string(stale.body) != "After." {
		t.Fatalf("the old ETag got %q", stale.body)
	}
}

// TestHTTP_RawPartWithoutUIDValidity: a provider with no UIDVALIDITY, like
// maildir, gives nothing to vouch for a copy with. Its parts are still the
// browser's own, but they carry no ETag, and are always sent whole.
func TestHTTP_RawPartWithoutUIDValidity(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := s.mailbox("INBOX").Messages[0].UID

	r := s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw", nil)
	s.expect(r, http.StatusOK)
	if cc := r.header.Get("Cache-Control"); cc != rawPartCacheControl {
		t.Fatalf("Cache-Control %q, want %q", cc, rawPartCacheControl)
	}
	if etag := r.header.Get("ETag"); etag != "" {
		t.Fatalf("ETag %q from a provider without UIDVALIDITY", etag)
	}
	again := s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw", nil, "If-None-Match", `"anything"`)
	s.expect(again, http.StatusOK)
	if len(again.body) == 0 {
		t.Fatal("the message was not sent again")
	}
}

func TestETagListed(t *testing.T) {
	for _, tc := range []struct {
		header string
		want   bool
	}{
		{`"a1"`, true},
		{`W/"a1"`, true},
		{`"b2", "a1"`, true},
		{` "b2" ,W/"a1" `, true},
		{``, false},
		{`*`, false},
		{`"a1-gzip"`, false},
		{`a1`, false},
	} {
		if got := etagListed(tc.header, `"a1"`); got != tc.want {
			t.Errorf("etagListed(%q) = %v, want %v", tc.header, got, tc.want)
		}
	}
}
