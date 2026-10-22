package alps

import (
	"bytes"
	"context"
	"net"
	"reflect"
	"regexp"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/provider"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// verdictTraffic records what the in-memory mail server sends.
type verdictTraffic struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (b *verdictTraffic) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *verdictTraffic) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.String()
}

// droppingListener keeps the server's side of every connection, so that a
// test can drop one as a mail server does.
type droppingListener struct {
	net.Listener
	mu    sync.Mutex
	conns []net.Conn
}

func (l *droppingListener) Accept() (net.Conn, error) {
	c, err := l.Listener.Accept()
	if err == nil {
		l.mu.Lock()
		l.conns = append(l.conns, c)
		l.mu.Unlock()
	}
	return c, err
}

func (l *droppingListener) drop(i int) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.conns[i].Close()
}

func (l *droppingListener) accepted() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.conns)
}

// verdictHeaderReads matches a server response carrying a message's
// Authentication-Results fields.
var verdictHeaderReads = regexp.MustCompile(`(?i)\* \d+ FETCH \([^\r\n]*BODY\[HEADER\.FIELDS`)

// serveVerdictMail serves an account, ada, whose INBOX holds a message from a
// brand that passed DMARC and one that failed it.
func serveVerdictMail(t *testing.T, traffic *verdictTraffic) *droppingListener {
	t.Helper()
	user := imapmemserver.NewUser("ada", "pass")
	if err := user.Create(context.Background(), "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	for _, results := range []string{
		"Authentication-Results: mx.test; dmarc=pass header.from=brand.test\r\n",
		"Authentication-Results: mx.test; dmarc=fail header.from=brand.test\r\n",
	} {
		m := results + "From: Brand <news@brand.test>\r\nSubject: news\r\n\r\nHello\r\n"
		if _, err := user.Append(context.Background(), "INBOX", bytes.NewReader([]byte(m)), &imap.AppendOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	srv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}},
		InsecureAuth: true,
		DebugWriter:  traffic,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	dl := &droppingListener{Listener: ln}
	go srv.Serve(dl)
	t.Cleanup(func() { srv.Close() })
	return dl
}

// The reader reads a message's Authentication-Results with the rest of its
// header, and the list asks for the message's verdict after. The verdict was
// kept on the connection it was read on, and a session does not keep one
// connection for good: it opens another when the mail server drops it, or
// when it gives up on one a request left busy. The list's next request read
// every verdict again, from each stored message, while the user waited behind
// it.
func TestSessionVerdictsOutliveTheConnection(t *testing.T) {
	traffic := &verdictTraffic{}
	ln := serveVerdictMail(t, traffic)
	connect := func(username, password string) (provider.MailProvider, error) {
		c, err := imapclient.DialInsecure(ln.Addr().String(), nil)
		if err != nil {
			return nil, err
		}
		if err := c.Login(username, password).Wait(); err != nil {
			c.Close()
			return nil, provider.AuthError{Cause: err}
		}
		return imapprovider.NewIMAPProvider(c, false), nil
	}
	var loginKey fernet.Key
	loginKey.Generate()
	sm := newSessionManager(connect, nil, &NilLogger{}, 0, false, &loginKey, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	s, err := sm.Put("ada", "pass")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.Close)

	ids := []provider.MessageID{imapprovider.IMAPUID(1), imapprovider.IMAPUID(2)}
	if err := s.DoMail(func(p provider.MailProvider) error {
		for _, id := range ids {
			if _, err := p.GetMessageMetadata("INBOX", id); err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}

	// The mail server drops the connection, and the next request, the
	// folder's listing, is answered on another.
	ln.drop(0)
	if err := s.DoMail(func(p provider.MailProvider) error {
		_, _, err := p.ListMessages("INBOX", "", 0, 50)
		return err
	}); err != nil {
		t.Fatal(err)
	}
	before := len(traffic.String())
	var got map[string]provider.AuthVerdict
	if err := s.DoMail(func(p provider.MailProvider) error {
		var err error
		got, _, err = p.(provider.AuthVerdictProvider).AuthVerdicts("INBOX", ids)
		return err
	}); err != nil {
		t.Fatal(err)
	}
	if n := ln.accepted(); n != 2 {
		t.Fatalf("%d connections to the mail server; want the session's second, after the first was dropped", n)
	}
	want := map[string]provider.AuthVerdict{"1": {BimiPotential: true}, "2": {BimiFailed: true}}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("verdicts %+v, want %+v", got, want)
	}
	if reads := len(verdictHeaderReads.FindAllString(traffic.String()[before:], -1)); reads != 0 {
		t.Fatalf("%d Authentication-Results reads, on the session's new connection, of messages its first had read; want none", reads)
	}
}
