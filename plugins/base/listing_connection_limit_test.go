package alpsbase

import (
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	imapprovider "github.com/migadu/alps/provider/imap"
	"github.com/migadu/go-imap"
	"github.com/migadu/go-imap/imapserver"
	"github.com/migadu/go-imap/imapserver/imapmemserver"
)

// fullAccountServer is a mail server whose connections can all be lost at
// once, as when the network between it and alps fails, and that then refuses
// every sign-in with NO [LIMIT], as Sora does once the account holds as many
// connections as it may.
type fullAccountServer struct {
	mu    sync.Mutex
	full  bool
	conns []*imapserver.Conn
}

// fullAccountSession passes METADATA through to the in-memory server, where
// alps keeps the settings. The session keeps a copy of what it read from
// there, and a listing then reads the settings without the mail server.
type fullAccountSession struct {
	imapserver.Session
	server *fullAccountServer
}

func (s fullAccountSession) Login(ctx context.Context, username, password string) error {
	s.server.mu.Lock()
	full := s.server.full
	s.server.mu.Unlock()
	if full {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeLimit, Text: "Maximum connections reached, please wait 42s"}
	}
	return s.Session.Login(ctx, username, password)
}

func (s fullAccountSession) GetMetadata(ctx context.Context, mailbox string, entries []string, options *imap.GetMetadataOptions) (*imap.GetMetadataData, error) {
	return s.Session.(imapserver.SessionMetadata).GetMetadata(ctx, mailbox, entries, options)
}

func (s fullAccountSession) SetMetadata(ctx context.Context, mailbox string, entries map[string]*[]byte) error {
	return s.Session.(imapserver.SessionMetadata).SetMetadata(ctx, mailbox, entries)
}

// loseConnectionsAndFill drops every connection the server holds, and has it
// refuse every sign-in after.
func (m *fullAccountServer) loseConnectionsAndFill() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.full = true
	for _, c := range m.conns {
		c.NetConn().Close()
	}
}

func newFullAccountServer(t *testing.T, m *fullAccountServer) *testServer {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	if err := user.Create(ctx, "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	message := "From: Ada <ada@remote.test>\r\nSubject: Invoice\r\n\r\nThe invoice\r\n"
	if _, err := user.Append(ctx, "INBOX", strings.NewReader(message), &imap.AppendOptions{}); err != nil {
		t.Fatal(err)
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(c *imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			m.mu.Lock()
			m.conns = append(m.conns, c)
			m.mu.Unlock()
			return fullAccountSession{mem.NewSession(), m}, nil, nil
		},
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapMetadata: {}},
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
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}}
}

// A listing that cannot sign in to the mail server again, because the
// account holds as many connections as the server allows, is answered as the
// mail server being unavailable: 503, as every other request is then. With
// the folder list, the statuses and the settings held by the session, the
// listing was the request's first mail work, and it was answered 429,
// "search_rate_limited", with a query or without one, so the page said the
// server was limiting searches.
func TestHTTP_AListingRefusedSignInAtTheConnectionLimitIsUnavailable(t *testing.T) {
	for name, path := range map[string]string{
		"with a query":    "/mailboxes/INBOX?query=invoice",
		"without a query": "/mailboxes/INBOX?page=1",
	} {
		t.Run(name, func(t *testing.T) {
			m := &fullAccountServer{}
			s := newFullAccountServer(t, m)
			s.login()
			// The folder list, the statuses, the settings and the first
			// page, held by the session.
			s.mailbox("INBOX")

			m.loseConnectionsAndFill()

			r := s.do("GET", path, nil)
			s.expect(r, http.StatusServiceUnavailable)
			var body struct{ Error string }
			r.json(t, &body)
			if body.Error != "mail_server_unavailable" {
				t.Errorf("answered %s, want mail_server_unavailable", r.body)
			}
			if got := r.header.Get("Retry-After"); got != "" {
				t.Errorf("Retry-After %q, want none: no search was refused", got)
			}
		})
	}
}
