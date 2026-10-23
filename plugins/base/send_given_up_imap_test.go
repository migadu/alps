package alpsbase

import (
	"context"
	"errors"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
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

// fetchStall holds the first FETCH an IMAP session is sent once it is armed,
// until the test releases it.
type fetchStall struct {
	armed   atomic.Bool
	entered chan struct{} // closed when the held FETCH arrives
	release chan struct{}
}

func (f *fetchStall) wait() {
	if f.armed.CompareAndSwap(true, false) {
		close(f.entered)
		<-f.release
	}
}

// stallingIMAPSession is an in-memory IMAP session of user whose FETCH stall
// can hold.
type stallingIMAPSession struct {
	*imapmemserver.UserSession // nil until Login
	user                       *imapmemserver.User
	stall                      *fetchStall
}

func (s *stallingIMAPSession) Login(ctx context.Context, username, password string) error {
	if err := s.user.Login(ctx, username, password); err != nil {
		return err
	}
	s.UserSession = imapmemserver.NewUserSession(s.user)
	return nil
}

func (s *stallingIMAPSession) Fetch(ctx context.Context, w *imapserver.FetchWriter, numSet imap.NumSet, options *imap.FetchOptions) error {
	s.stall.wait()
	return s.UserSession.Fetch(ctx, w, numSet, options)
}

// sendTestServer is a server with the IMAP provider, against an in-memory
// account whose FETCH stall can hold, that sends through smtpServer.
type sendTestServer struct {
	*testServer
	user *imapmemserver.User
	// sends receives the context of each POST /messages as it starts, and
	// sent a value as each one has been answered.
	sends chan context.Context
	sent  chan struct{}
}

func newSendTestServer(t *testing.T, smtpServer string, stall *fetchStall) *sendTestServer {
	t.Helper()
	user := imapmemserver.NewUser(testUser, testPassword)
	for _, name := range []string{"INBOX", "Drafts", "Sent"} {
		if err := user.Create(context.Background(), name, nil); err != nil {
			t.Fatal(err)
		}
	}
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return &stallingIMAPSession{user: user, stall: stall}, nil, nil
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
	pcfg := &imapprovider.Config{Server: "imap+insecure://" + ln.Addr().String()}
	popt, err := pcfg.ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	srv, err := alps.New(alps.NewLogger(), &alps.Options{
		Provider:     popt,
		SMTP:         alps.SMTPOptions{Server: smtpServer},
		LoginKey:     &key,
		CacheEnabled: true,
		CacheTTL:     time.Minute,
	})
	if err != nil {
		t.Fatal(err)
	}
	s := &sendTestServer{user: user, sends: make(chan context.Context, 1), sent: make(chan struct{}, 1)}
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		send := r.Method == http.MethodPost && r.URL.Path == "/messages"
		if send {
			s.sends <- r.Context()
		}
		srv.ServeHTTP(w, r)
		if send {
			s.sent <- struct{}{}
		}
	}))
	t.Cleanup(func() {
		ts.Close()
		srv.Close()
	})
	jar, _ := cookiejar.New(nil)
	s.testServer = &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}, server: srv}
	return s
}

// messages counts the messages in the account's mailbox name, as the IMAP
// server holds them.
func (s *sendTestServer) messages(name string) uint32 {
	s.t.Helper()
	data, err := s.user.Status(context.Background(), name, &imap.StatusOptions{NumMessages: true})
	if err != nil {
		s.t.Fatal(err)
	}
	return *data.NumMessages
}

// A send the browser gives up on before the message goes is not sent. The
// composer has already said the send failed and is open again, for the user
// to send it once more. The request went on once the parts it carries from
// its draft had been read, and so sent the message, filed it and removed the
// draft: sent again, it went twice, or failed for want of the draft.
func TestHTTP_ASendGivenUpOnBeforeItGoesIsNotSent(t *testing.T) {
	addr, rec := listenRecorder(t)
	stall := &fetchStall{entered: make(chan struct{}), release: make(chan struct{})}
	s := newSendTestServer(t, addr, stall)
	draft := "From: " + testUser + "\r\nTo: charles@remote.test\r\nSubject: Plans\r\nMIME-Version: 1.0\r\n" +
		"Content-Type: multipart/mixed; boundary=b\r\n\r\n" +
		"--b\r\nContent-Type: text/plain\r\n\r\nThe plans.\r\n" +
		"--b\r\nContent-Type: text/plain; name=notes.txt\r\nContent-Disposition: attachment; filename=notes.txt\r\n\r\nNotes.\r\n" +
		"--b--\r\n"
	if _, err := s.user.Append(context.Background(), "Drafts", strings.NewReader(draft), &imap.AppendOptions{Flags: []imap.Flag{imap.FlagDraft}}); err != nil {
		t.Fatal(err)
	}
	s.login()

	form := url.Values{
		"to":               {"charles@remote.test"},
		"subject":          {"Plans"},
		"text":             {"The plans."},
		"draft_mailbox":    {"Drafts"},
		"draft_uid":        {"1"},
		"prev_attachments": {"2"},
	}
	ctx, giveUp := context.WithCancel(context.Background())
	defer giveUp()
	req, err := http.NewRequestWithContext(ctx, "POST", s.url+"/messages", strings.NewReader(form.Encode()))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", s.url)
	stall.armed.Store(true) // the attachment's part, read from the draft
	gaveUp := make(chan struct{})
	go func() {
		defer close(gaveUp)
		if res, err := s.client.Do(req); err == nil {
			res.Body.Close()
		}
	}()
	send := <-s.sends

	select {
	case <-stall.entered:
	case <-time.After(5 * time.Second):
		t.Fatal("the send did not read the draft's part")
	}
	giveUp()
	<-gaveUp
	select {
	case <-send.Done():
	case <-time.After(5 * time.Second):
		t.Fatal("the server did not notice that the browser gave up")
	}
	close(stall.release)
	select {
	case <-s.sent:
	case <-time.After(10 * time.Second):
		t.Fatal("the send given up on was not answered")
	}

	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()
	if data != "" {
		t.Error("the message the browser gave up on before it went was sent")
	}
	if n := s.messages("Drafts"); n != 1 {
		t.Errorf("the draft of the message the browser gave up on is gone: Drafts holds %d messages", n)
	}
	if n := s.messages("Sent"); n != 0 {
		t.Errorf("the message the browser gave up on before it went was filed in Sent")
	}
}

// A temporary refusal ends the first transaction without sending DATA. If
// the browser gives up while that refusal is in flight, the retry must not
// start another transaction: the composer can already be sending again.
func TestHTTP_ASendGivenUpOnBeforeItsRetryIsNotSent(t *testing.T) {
	reached, release := make(chan struct{}), make(chan struct{})
	var released sync.Once
	defer released.Do(func() { close(release) })
	var dataCommands atomic.Int32
	addr, relay := listenScripted(t, func(n int, command string) string {
		if command == "DATA" {
			dataCommands.Add(1)
		}
		if n == 1 && command == "RCPT" {
			close(reached)
			<-release
			return "451 4.3.0 Try again later"
		}
		return ""
	})
	s := newSendTestServer(t, addr, &fetchStall{})
	draft := "From: " + testUser + "\r\nTo: charles@remote.test\r\nSubject: Notes\r\n\r\nSee you.\r\n"
	if _, err := s.user.Append(context.Background(), "Drafts", strings.NewReader(draft), &imap.AppendOptions{Flags: []imap.Flag{imap.FlagDraft}}); err != nil {
		t.Fatal(err)
	}
	s.login()
	form := sendForm()
	form.Set("draft_mailbox", "Drafts")
	form.Set("draft_uid", "1")
	ctx, giveUp := context.WithCancel(context.Background())
	defer giveUp()
	req, err := http.NewRequestWithContext(ctx, "POST", s.url+"/messages", strings.NewReader(form.Encode()))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", s.url)
	finished := make(chan error, 1)
	go func() {
		res, err := s.client.Do(req)
		if err == nil {
			res.Body.Close()
		}
		finished <- err
	}()
	select {
	case <-reached:
	case <-time.After(5 * time.Second):
		t.Fatal("the first transaction did not reach RCPT")
	}
	send := <-s.sends
	giveUp()
	select {
	case err := <-finished:
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("the browser returned %v, want cancellation", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("the browser did not give up")
	}
	select {
	case <-send.Done():
	case <-time.After(5 * time.Second):
		t.Fatal("the server did not notice that the browser gave up")
	}
	released.Do(func() { close(release) })
	select {
	case <-s.sent:
	case <-time.After(10 * time.Second):
		t.Fatal("the cancelled send was not finished")
	}
	if _, mails, complete := relay.counts(); mails != 1 || complete != 0 {
		t.Errorf("the cancelled send made %d transactions and completed %d messages, want 1 and 0", mails, complete)
	}
	if n := dataCommands.Load(); n != 0 {
		t.Errorf("the cancelled send issued DATA %d times", n)
	}
	if n := s.messages("Sent"); n != 0 {
		t.Errorf("the cancelled send was filed: Sent holds %d messages", n)
	}
	if n := s.messages("Drafts"); n != 1 {
		t.Errorf("the unsent draft was lost: Drafts holds %d messages", n)
	}
}
