package alpsbase

import (
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
)

// newIMAPTestServer is newTestServer with the IMAP provider, against an
// in-memory IMAP account holding messages in INBOX.
func newIMAPTestServer(t *testing.T, messages ...string) *testServer {
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
	srv, err := alps.New(alps.NewLogger(), &alps.Options{
		Provider:     alps.ProviderOptions{Type: "imap", IMAP: alps.IMAPProviderOptions{Server: "imap+insecure://" + ln.Addr().String()}},
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

type verdictsPage struct {
	Scope    string
	Verdicts map[string]struct {
		HasBimiPotential bool
		HasBimiFailed    bool
	}
}

func TestHTTP_AuthVerdicts(t *testing.T) {
	s := newIMAPTestServer(t,
		"Authentication-Results: mx.test; dmarc=pass header.from=brand.test\r\nFrom: Brand <news@brand.test>\r\nSubject: passed\r\n\r\nHello\r\n",
		"Authentication-Results: mx.test; dmarc=fail header.from=brand.test\r\nAuthentication-Results: brand.test; dmarc=pass header.from=brand.test\r\nFrom: Brand <news@brand.test>\r\nSubject: forged\r\n\r\nHello\r\n",
	)
	s.login()

	r := s.do("GET", "/mailboxes/INBOX/verdicts?uids=1,2,99", nil)
	s.expect(r, http.StatusOK)
	var page verdictsPage
	r.json(t, &page)
	if len(page.Verdicts) != 2 || !page.Verdicts["1"].HasBimiPotential || page.Verdicts["2"].HasBimiPotential || !page.Verdicts["2"].HasBimiFailed {
		t.Fatalf("verdicts %+v; want 1 passed, 2 failed, 99 absent", page.Verdicts)
	}
	if page.Scope == "" {
		t.Fatal("no scope with the verdicts")
	}

	r = s.do("GET", "/mailboxes/INBOX/verdicts", nil)
	s.expect(r, http.StatusOK)
	page = verdictsPage{}
	r.json(t, &page)
	if len(page.Verdicts) != 0 {
		t.Fatalf("verdicts %+v for no uids", page.Verdicts)
	}

	many := make([]string, maxVerdictUIDs+1)
	for i := range many {
		many[i] = strconv.Itoa(i + 1)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX/verdicts?uids="+strings.Join(many, ","), nil), http.StatusBadRequest)
	s.expect(s.do("GET", "/mailboxes/INBOX/verdicts?uids=1,not-a-uid", nil), http.StatusBadRequest)
}

func TestHTTP_AuthVerdictsFromAProviderWithoutThem(t *testing.T) {
	s := newTestServer(t)
	s.login()
	r := s.do("GET", "/mailboxes/INBOX/verdicts?uids=1", nil)
	s.expect(r, http.StatusOK)
	var page verdictsPage
	r.json(t, &page)
	if len(page.Verdicts) != 0 {
		t.Fatalf("maildir answered verdicts %+v", page.Verdicts)
	}
}
