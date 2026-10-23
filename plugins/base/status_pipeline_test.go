package alpsbase

import (
	"bytes"
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
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

// statusWatch forwards IMAP sessions and counts the STATUS commands a client
// has sent and not yet had answered. Each answer is held back a moment, so a
// client that sends its commands together is seen to, and one that waits for
// each answer before the next is seen to wait.
type statusWatch struct {
	mu       sync.Mutex
	sent     int
	answered int
	most     int
}

func (w *statusWatch) reset() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.sent, w.answered, w.most = 0, 0, 0
}

func (w *statusWatch) mostAtOnce() int {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.most
}

// countLines counts the lines of chunk whose first two words are first (any
// tag when it is empty) and second.
func countLines(chunk []byte, first, second string) int {
	n := 0
	for _, line := range bytes.Split(bytes.ToUpper(chunk), []byte("\r\n")) {
		words := bytes.Fields(line)
		if len(words) < 2 || string(words[1]) != second {
			continue
		}
		if first == "" && string(words[0]) == "*" || first != "" && string(words[0]) != first {
			continue
		}
		n++
	}
	return n
}

func (w *statusWatch) listen(t *testing.T, backend string) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	go func() {
		for {
			down, err := ln.Accept()
			if err != nil {
				return
			}
			up, err := net.Dial("tcp", backend)
			if err != nil {
				down.Close()
				continue
			}
			go w.forward(down, up, func(chunk []byte) {
				w.mu.Lock()
				w.sent += countLines(chunk, "", "STATUS")
				w.most = max(w.most, w.sent-w.answered)
				w.mu.Unlock()
			})
			go w.forward(up, down, func(chunk []byte) {
				if n := countLines(chunk, "*", "STATUS"); n > 0 {
					time.Sleep(250 * time.Millisecond)
					w.mu.Lock()
					w.answered += n
					w.mu.Unlock()
				}
			})
		}
	}()
	return ln.Addr().String()
}

func (w *statusWatch) forward(from, to net.Conn, see func([]byte)) {
	defer from.Close()
	defer to.Close()
	buf := make([]byte, 32*1024)
	for {
		n, err := from.Read(buf)
		if n > 0 {
			see(buf[:n])
			if _, werr := to.Write(buf[:n]); werr != nil {
				return
			}
		}
		if err != nil {
			return
		}
	}
}

// newWatchedIMAPTestServer is newIMAPTestServer for an account with the given
// subscribed folders, on an IMAP server without LIST-STATUS, reached through
// watch.
func newWatchedIMAPTestServer(t *testing.T, watch *statusWatch, folders ...string) *testServer {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	for _, name := range folders {
		if err := user.Create(ctx, name, nil); err != nil {
			t.Fatal(err)
		}
		if err := user.Subscribe(ctx, name); err != nil {
			t.Fatal(err)
		}
	}
	return newIMAPUserTestServer(t, user, watch)
}

// newIMAPUserTestServer is newIMAPTestServer for user's account, on an IMAP
// server without LIST-STATUS, reached through watch when it is not nil.
func newIMAPUserTestServer(t *testing.T, user *imapmemserver.User, watch *statusWatch) *testServer {
	t.Helper()
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
	addr := ln.Addr().String()
	if watch != nil {
		addr = watch.listen(t, addr)
	}
	pcfg := &imapprovider.Config{
		Server: "imap+insecure://" + addr,
	}
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
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}}
}

// A server without LIST-STATUS is asked each folder's counts with a STATUS of
// its own. Asked one after another, the listing waited for one round trip per
// subscribed folder; sent together, the answers come back in one.
func TestHTTP_FolderCountsAreAskedTogether(t *testing.T) {
	folders := []string{"INBOX", "Archive", "Lists", "Trash"}
	var watch statusWatch
	s := newWatchedIMAPTestServer(t, &watch, folders...)
	s.login()

	watch.reset()
	page := s.statusPage("/mailboxes/INBOX?page=0")
	if len(page.Mailboxes) != len(folders) {
		t.Fatalf("listed %+v", page.Mailboxes)
	}
	if got := watch.mostAtOnce(); got != len(folders) {
		t.Errorf("at most %d STATUS commands were out at once; want all %d sent before the first answer", got, len(folders))
	}
}
