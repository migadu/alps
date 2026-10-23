package alpsbase

import (
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// newMetadataIMAPTestServer is newIMAPTestServer for an IMAP server that keeps
// METADATA, where alps keeps the account's settings, and whose sessions the
// test can reach.
func newMetadataIMAPTestServer(t *testing.T, messages ...string) *testServer {
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
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
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
	pcfg := &imapprovider.Config{Server: "imap+insecure://" + ln.Addr().String()}
	popt, err := pcfg.ToOptions()
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
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}, server: srv}
}

// A listing the session has cached is answered from memory, and so are the
// settings it is paged by. Reading them went through the session's mail
// connection, and so waited behind whatever the connection was doing: a
// conversation being built, a search across folders, a draft being saved.
func TestHTTP_ACachedListingDoesNotWaitForTheMailConnection(t *testing.T) {
	s := newMetadataIMAPTestServer(t, "From: Charles <charles@remote.test>\r\nSubject: Engines\r\n\r\nHello\r\n")
	s.login()
	s.expect(s.do("PUT", "/settings", map[string]any{"messages_per_page": 20}), http.StatusOK)
	s.mailbox("INBOX") // now cached, with the folder list and its counts

	session, err := s.server.Sessions.Get(s.sessionToken())
	if err != nil {
		t.Fatal(err)
	}
	busy, release, finished := make(chan struct{}), make(chan struct{}), make(chan struct{})
	go func() {
		defer close(finished)
		session.DoMail(func(provider.MailProvider) error {
			close(busy)
			<-release
			return nil
		})
	}()
	<-busy
	defer func() {
		close(release)
		<-finished
	}()

	answered := make(chan int, 1)
	go func() {
		res, err := s.client.Get(s.url + "/mailboxes/INBOX")
		if err != nil {
			answered <- 0
			return
		}
		res.Body.Close()
		answered <- res.StatusCode
	}()
	select {
	case status := <-answered:
		if status != http.StatusOK {
			t.Fatalf("the cached listing answered %d", status)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the cached listing waited for the mail connection, which was busy with another request")
	}
}
