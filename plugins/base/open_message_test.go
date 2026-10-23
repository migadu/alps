package alpsbase

import (
	"bytes"
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"regexp"
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

// readerWire is what crossed the wire to the in-memory IMAP server, both
// ways, for a test to read back the commands alps sent.
type readerWire struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (w *readerWire) Write(p []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.buf.Write(p)
}

// imapCommands names the commands a client can send. A line of the traffic
// is one of them when it is a tag followed by one of these, which leaves out
// the server's answers and the lines of the messages it sends.
var imapCommands = regexp.MustCompile(`^[A-Za-z0-9]+ (UID )?(APPEND|AUTHENTICATE|CAPABILITY|CHECK|CLOSE|COPY|CREATE|DELETE|ENABLE|EXAMINE|EXPUNGE|FETCH|GETMETADATA|ID|IDLE|LIST|LOGIN|LOGOUT|LSUB|MOVE|NAMESPACE|NOOP|RENAME|SEARCH|SELECT|SETMETADATA|SORT|STATUS|STORE|SUBSCRIBE|THREAD|UNSELECT|UNSUBSCRIBE)( |$)`)

// commandsSince returns the commands alps sent after the first mark bytes,
// as their tag and name ("T7 UID FETCH").
func (w *readerWire) commandsSince(mark int) []string {
	w.mu.Lock()
	defer w.mu.Unlock()
	var commands []string
	for _, line := range strings.Split(w.buf.String()[mark:], "\r\n") {
		if m := imapCommands.FindString(strings.ToUpper(line)); m != "" {
			commands = append(commands, strings.TrimSpace(m))
		}
	}
	return commands
}

func (w *readerWire) mark() int {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.buf.Len()
}

// fetchCount counts the FETCH commands among commands.
func fetchCount(commands []string) int {
	n := 0
	for _, c := range commands {
		if strings.HasSuffix(c, " FETCH") {
			n++
		}
	}
	return n
}

// newReaderIMAPTestServer is newIMAPTestServer with the IMAP traffic kept
// for the test to read.
func newReaderIMAPTestServer(t *testing.T, messages ...string) (*testServer, *readerWire) {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	if err := user.Create(ctx, "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	for _, m := range messages {
		if _, err := user.Append(ctx, "INBOX", strings.NewReader(m), &imap.AppendOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	wire := &readerWire{}
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}},
		InsecureAuth: true,
		DebugWriter:  wire,
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
		CacheTTL:     time.Minute,
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
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}}, wire
}

// gearsMessage has a text and an HTML alternative, the HTML one encoded, and
// the two fields a listing row does not carry and the reader shows: a
// passing DMARC verdict (the brand logo) and References (the reply chain).
const gearsMessage = "Authentication-Results: mx.example.com; dmarc=pass header.from=brand.test\r\n" +
	"From: Brand <news@brand.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\n" +
	"Message-ID: <gears@brand.test>\r\nIn-Reply-To: <engines@brand.test>\r\nReferences: <engines@brand.test>\r\n" +
	"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMIME-Version: 1.0\r\n" +
	"Content-Type: multipart/alternative; boundary=b\r\n\r\n" +
	"--b\r\nContent-Type: text/plain\r\n\r\nGears turn.\r\n" +
	"--b\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n" +
	"<p>Gears =E2=80=94 turn.</p>\r\n" +
	"--b--\r\n"

// openedMessage is the reader's answer, as far as these tests read it.
type openedMessage struct {
	Message struct {
		HasBimiPotential bool
		References       []string
	}
	Part *struct {
		MIMEType string
		Path     []int
	}
	Body *string
}

// openAsReader asks for a message as the reader does, and checks that the
// answer is the HTML part with its text, verdict and References.
func openAsReader(t *testing.T, s *testServer, uid string) map[string]json.RawMessage {
	t.Helper()
	r := s.do("GET", "/mailboxes/INBOX/messages/"+uid+"?view=html", nil)
	s.expect(r, http.StatusOK)
	var opened openedMessage
	r.json(t, &opened)
	if opened.Part == nil || opened.Part.MIMEType != "text/html" {
		t.Errorf("the reader was given part %+v, want the HTML one", opened.Part)
	}
	if opened.Body == nil {
		t.Errorf("the answer carries no body: the reader has to ask for it again")
	} else if got := strings.TrimSpace(*opened.Body); got != "<p>Gears — turn.</p>" {
		t.Errorf("the answer carries the body %q, want the HTML part decoded", got)
	}
	if !opened.Message.HasBimiPotential {
		t.Errorf("the message lost its passing verdict")
	}
	if !contains(opened.Message.References, "engines@brand.test") {
		t.Errorf("the message has References %v, want engines@brand.test", opened.Message.References)
	}
	var fields map[string]json.RawMessage
	r.json(t, &fields)
	return fields
}

// A listing caches every row it lists, structure included, so the part to
// show can be chosen without asking the server. The reader's request used to
// FETCH the message's structure and those fields first, then the part, and
// answer without the part's text, which the reader asked for again with
// /raw.
func TestHTTP_OpeningAListedMessageIsOneFetch(t *testing.T) {
	s, wire := newReaderIMAPTestServer(t, gearsMessage)
	s.login()
	uid := s.mailbox("INBOX").Messages[0].UID

	mark := wire.mark()
	fields := openAsReader(t, s, uid)
	if sent := wire.commandsSince(mark); fetchCount(sent) != 1 {
		t.Errorf("opening a listed message sent %d FETCH, want 1: %v", fetchCount(sent), sent)
	}
	// The folder list is the listing's to send; the reader never reads it.
	for _, name := range []string{"Mailboxes", "Mailbox", "Inbox"} {
		if _, ok := fields[name]; ok {
			t.Errorf("the answer carries %s", name)
		}
	}
}

// A message whose body the session holds is answered from the session alone.
// The structure was fetched from the server before the cache was looked in,
// so every reopen cost a FETCH.
func TestHTTP_ReopeningAMessageAsksTheServerNothing(t *testing.T) {
	s, wire := newReaderIMAPTestServer(t, gearsMessage)
	s.login()
	uid := s.mailbox("INBOX").Messages[0].UID
	openAsReader(t, s, uid)

	mark := wire.mark()
	openAsReader(t, s, uid)
	if sent := wire.commandsSince(mark); len(sent) != 0 {
		t.Errorf("reopening the message sent %v, want nothing", sent)
	}
}

// Opened from a link, a message no listing holds is read in full once, and
// is then held like a listed one.
func TestHTTP_AMessageNoListingHoldsIsReadOnce(t *testing.T) {
	s, wire := newReaderIMAPTestServer(t, gearsMessage)
	s.login()

	mark := wire.mark()
	openAsReader(t, s, "1")
	if sent := wire.commandsSince(mark); fetchCount(sent) > 2 {
		t.Errorf("opening an unlisted message sent %d FETCH, want at most 2: %v", fetchCount(sent), sent)
	}

	mark = wire.mark()
	openAsReader(t, s, "1")
	if sent := wire.commandsSince(mark); len(sent) != 0 {
		t.Errorf("reopening it sent %v, want nothing", sent)
	}
}

// The part may already be in the session's cache from another read of it,
// such as /raw, which does not read the fields the reader shows. The reader
// is still given them.
func TestHTTP_APartReadElsewhereStillOpensWithTheVerdict(t *testing.T) {
	s, _ := newReaderIMAPTestServer(t, gearsMessage)
	s.login()
	uid := s.mailbox("INBOX").Messages[0].UID

	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+uid+"/raw?part=2", nil), http.StatusOK)
	openAsReader(t, s, uid)
}
