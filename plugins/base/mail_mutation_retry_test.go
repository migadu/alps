package alpsbase

import (
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// The server performs COPY, or the second batch of EXPUNGE, then loses its
// reply. Shared counters survive reconnection so replay remains visible.
type lostMutationReply struct {
	imapserver.Session
	conn     *imapserver.Conn
	copies   *atomic.Int32
	expunges *atomic.Int32
}

func (s lostMutationReply) Copy(ctx context.Context, set imap.NumSet, dest string) (*imap.CopyData, error) {
	data, err := s.Session.Copy(ctx, set, dest)
	if err == nil && s.expunges == nil && s.copies.Add(1) == 1 {
		s.conn.NetConn().Close()
	}
	return data, err
}

func (s lostMutationReply) Expunge(ctx context.Context, w *imapserver.ExpungeWriter, uids *imap.UIDSet) error {
	err := s.Session.Expunge(ctx, w, uids)
	if err == nil && s.expunges != nil && s.expunges.Add(1) == 2 {
		s.conn.NetConn().Close()
	}
	return err
}

func newLostReplyServer(t *testing.T, deleting bool) (*testServer, *atomic.Int32) {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	if err := user.Create(ctx, "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	message := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: One\r\n\r\nBody\r\n"
	count := 1
	if deleting {
		count = maxScopeBatch + 1
	}
	for i := 0; i < count; i++ {
		if _, err := user.Append(ctx, "INBOX", strings.NewReader(message), &imap.AppendOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	copies := &atomic.Int32{}
	var expunges *atomic.Int32
	if deleting {
		expunges = &atomic.Int32{}
	}
	imapSrv := imapserver.New(&imapserver.Options{NewSession: func(c *imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
		return lostMutationReply{mem.NewSession(), c, copies, expunges}, nil, nil
	}, Caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}}, InsecureAuth: true})
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
	options, err := (&imapprovider.Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	srv, err := alps.New(alps.NewLogger(), &alps.Options{Provider: options, SMTP: alps.SMTPOptions{Server: "smtp://127.0.0.1:1"}, LoginKey: &key, CacheEnabled: true, CacheTTL: time.Minute})
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() { ts.Close(); srv.Close() })
	jar, _ := cookiejar.New(nil)
	counter := copies
	if deleting {
		counter = expunges
	}
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}}, counter
}

func TestHTTP_ALostCopyReplyDoesNotRepeatAMutation(t *testing.T) {
	for _, verb := range []string{"copy", "move"} {
		t.Run(verb, func(t *testing.T) {
			s, copies := newLostReplyServer(t, false)
			s.login()
			s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Archive"}}), http.StatusOK)
			// Seed both cached pages, to check the uncertain result invalidates them.
			s.mailbox("INBOX")
			s.mailbox("Archive")
			r := s.do("PUT", "/mailboxes/INBOX/messages/"+verb, map[string]any{"uids": []string{"1"}, "to": "Archive"})
			if r.status != http.StatusInternalServerError {
				t.Errorf("uncertain %s answered %d: %s", verb, r.status, r.body)
			}
			if got := copies.Load(); got != 1 {
				t.Errorf("COPY executed %d times, want once", got)
			}
			if got := s.mailbox("Archive").Total; got != 1 {
				t.Errorf("destination holds %d copies, want one", got)
			}
			if got := s.mailbox("INBOX").Total; got != 1 {
				t.Errorf("source holds %d messages, want retained original", got)
			}
		})
	}
}

// A lost reply in the second delete batch must not replay the first batch,
// which would count the already removed messages a second time.
func TestHTTP_ALostDeleteReplyDoesNotReplayEarlierBatches(t *testing.T) {
	s, expunges := newLostReplyServer(t, true)
	s.login()
	var ids []string
	for i := 1; i <= maxScopeBatch+1; i++ {
		ids = append(ids, strconv.Itoa(i))
	}
	r := s.do("DELETE", "/mailboxes/INBOX/messages", map[string]any{"uids": ids})
	if r.status != http.StatusInternalServerError {
		t.Errorf("uncertain delete answered %d: %s", r.status, r.body)
	}
	if got := expunges.Load(); got != 2 {
		t.Errorf("EXPUNGE executed %d times, want two batches once each", got)
	}
	if got := s.mailbox("INBOX").Total; got != 0 {
		t.Errorf("source still lists %d already removed messages", got)
	}
}
