package alps

import (
	"bufio"
	"context"
	"net"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/migadu/alps/provider"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// stuckDoneServer is a raw IMAP server that answers what a session asks of
// it, but never answers DONE: a server that hangs, or a connection that has
// gone half-open, while in IDLE.
type stuckDoneServer struct {
	ln    net.Listener
	mu    sync.Mutex
	conns []net.Conn
	dones int
	idles int
	// silentIdle has it send no continuation to IDLE either.
	silentIdle bool
}

func newStuckDoneServer(t *testing.T) *stuckDoneServer {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	srv := &stuckDoneServer{ln: ln}
	go func() {
		for {
			c, err := ln.Accept()
			if err != nil {
				return
			}
			srv.mu.Lock()
			srv.conns = append(srv.conns, c)
			srv.mu.Unlock()
			go srv.serve(c)
		}
	}()
	t.Cleanup(func() {
		ln.Close()
		srv.mu.Lock()
		defer srv.mu.Unlock()
		for _, c := range srv.conns {
			c.Close()
		}
	})
	return srv
}

func (srv *stuckDoneServer) serve(c net.Conn) {
	w := bufio.NewWriter(c)
	say := func(s string) { w.WriteString(s + "\r\n"); w.Flush() }
	say("* OK [CAPABILITY IMAP4rev1 IDLE] ready")
	r := bufio.NewReader(c)
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			return
		}
		line = strings.TrimRight(line, "\r\n")
		if strings.EqualFold(line, "DONE") {
			srv.mu.Lock()
			srv.dones++
			srv.mu.Unlock()
			continue // never answered
		}
		parts := strings.SplitN(line, " ", 3)
		if len(parts) < 2 {
			continue
		}
		tag, cmd := parts[0], strings.ToUpper(parts[1])
		switch cmd {
		case "LOGIN":
			say(tag + " OK [CAPABILITY IMAP4rev1 IDLE] logged in")
		case "SELECT":
			say("* 0 EXISTS")
			say("* OK [UIDVALIDITY 1] ok")
			say(tag + " OK [READ-WRITE] selected")
		case "STATUS":
			say(`* STATUS "INBOX" (MESSAGES 0 UNSEEN 0 UIDVALIDITY 1 UIDNEXT 1)`)
			say(tag + " OK done")
		case "IDLE":
			srv.mu.Lock()
			srv.idles++
			silent := srv.silentIdle
			srv.mu.Unlock()
			if !silent {
				say("+ idling")
			}
		case "LOGOUT":
			say("* BYE bye")
			say(tag + " OK bye")
			c.Close()
			return
		default:
			say(tag + " OK done")
		}
	}
}

// pushSessionOver is a session with push on over the IMAP server at addr,
// signed in, whose connections answer within timeout.
func pushSessionOver(t *testing.T, addr string, timeout time.Duration, username, password string) *Session {
	t.Helper()
	opts, err := (&imapprovider.Config{Server: "imap+insecure://" + addr}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	sm := newSessionManager(opts.CreateFactory(timeout, false), nil, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	sm.backgroundConnections = true
	sm.pushNewMail = true
	sm.pushResume = 10 * time.Millisecond
	sm.pushRetry = 25 * time.Millisecond
	s := &Session{manager: sm, closed: make(chan struct{}), username: username, password: password}
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.teardown)
	return s
}

func (srv *stuckDoneServer) doneCount() int {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	return srv.dones
}

// A DONE the server never answers costs the background work waiting for the
// connection no more than the connection's response timeout: the IDLE takes
// the connection for lost, and the work runs on another. The session goes
// on, and so does the watch.
func TestWatchInbox_AnUnansweredDoneLosesTheConnection(t *testing.T) {
	srv := newStuckDoneServer(t)
	opts, err := (&imapprovider.Config{Server: "imap+insecure://" + srv.ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	sm := newSessionManager(opts.CreateFactory(300*time.Millisecond, false), nil, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	sm.backgroundConnections = true
	sm.pushNewMail = true
	sm.pushResume = 10 * time.Millisecond
	sm.pushRetry = 25 * time.Millisecond
	s := &Session{manager: sm, closed: make(chan struct{}), username: "u", password: "p"}
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.teardown)
	w := s.WatchInbox()
	defer w.Stop()
	next(t, w)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	done := make(chan error, 1)
	start := time.Now()
	go func() {
		done <- s.DoBackgroundMail(ctx, func(p provider.MailProvider) error {
			_, err := p.GetMailboxStatus("INBOX")
			return err
		})
	}()
	select {
	case err := <-done:
		if err != nil {
			t.Errorf("the work answered %v", err)
		}
		if took := time.Since(start); took > 2*time.Second {
			t.Errorf("the work waited %v for an unanswered DONE", took)
		}
	case <-time.After(3 * time.Second):
		t.Fatalf("the work still waits after %v for an unanswered DONE (sent %d times)", time.Since(start).Round(time.Millisecond), srv.doneCount())
	}
	select {
	case <-s.closed:
		t.Fatalf("the session ended (%s)", s.endReason)
	default:
	}
}

// An IDLE the server never answers with its continuation costs the work that
// waits for the connection no more than the connection's response timeout,
// a password change without a context of its own included.
func TestWatchInbox_AnUnansweredIdleLosesTheConnection(t *testing.T) {
	srv := newStuckDoneServer(t)
	srv.silentIdle = true
	s := pushSessionOver(t, srv.ln.Addr().String(), 300*time.Millisecond, "u", "p")
	w := s.WatchInbox()
	defer w.Stop()
	eventually(t, "the IDLE to be asked for", func() bool {
		srv.mu.Lock()
		defer srv.mu.Unlock()
		return srv.idles > 0
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	err := s.DoBackgroundMail(ctx, func(p provider.MailProvider) error {
		_, err := p.GetMailboxStatus("INBOX")
		return err
	})
	if err != nil {
		t.Errorf("background work behind an IDLE that never began answered %v", err)
	}
	done := make(chan error, 1)
	go func() { done <- s.manager.UpdatePassword(s, "p2") }()
	select {
	case <-done:
	case <-time.After(3 * time.Second):
		t.Fatal("a password change waits behind an IDLE that never began")
	}
}

// What the server says of the Inbox while background work runs there, an
// arrival, or one message in and one out, is told as it comes, not only
// when the next IDLE begins.
func TestWatchInbox_NewsDuringBackgroundWorkInTheInbox(t *testing.T) {
	user := imapmemserver.NewUser("ada", "pass")
	for _, name := range []string{"INBOX", "Sent"} {
		if err := user.Create(context.Background(), name, nil); err != nil {
			t.Fatal(err)
		}
	}
	deliver := func() {
		t.Helper()
		msg := "From: Charles <charles@remote.test>\r\nSubject: Looms\r\n\r\nnew\r\n"
		if _, err := user.Append(context.Background(), "INBOX", strings.NewReader(msg), &imap.AppendOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	deliver()
	mem := imapmemserver.New()
	mem.AddUser(user)
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapIdle: {}},
		InsecureAuth: true,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go imapSrv.Serve(ln)
	t.Cleanup(func() { imapSrv.Close() })

	s := pushSessionOver(t, ln.Addr().String(), 5*time.Second, "ada", "pass")
	w := s.WatchInbox()
	defer w.Stop()
	if ev := next(t, w); ev != InboxWatched {
		t.Fatalf("the first event is %v", ev)
	}

	// An arrival, told on the STATUS the work sends.
	heard := make(chan InboxEvent, 1)
	err = s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
		deliver()
		if _, err := p.GetMailboxStatus("INBOX"); err != nil {
			return err
		}
		select {
		case ev := <-w.C:
			heard <- ev
		case <-time.After(time.Second):
			heard <- 0
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if ev := <-heard; ev != InboxChanged {
		t.Errorf("an arrival during background work in the Inbox came as %v, want InboxChanged", ev)
	}
	for len(w.C) > 0 {
		<-w.C
	}

	// One message in and one out.
	other, err := imapclient.DialInsecure(ln.Addr().String(), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer other.Close()
	if err := other.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	if _, err := other.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	err = s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
		if err := other.Store(imap.SeqSetNum(1), &imap.StoreFlags{Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{imap.FlagDeleted}}, nil).Close(); err != nil {
			return err
		}
		if err := other.Expunge().Close(); err != nil {
			return err
		}
		deliver()
		_, err := p.GetMailboxStatus("INBOX")
		return err
	})
	if err != nil {
		t.Fatal(err)
	}
	select {
	case <-w.C:
	case <-time.After(2 * time.Second):
		t.Error("one message in and one out during background work in the Inbox was never told")
	}

	// The IDLE ended before the server goes: the in-memory server races its
	// own IDLE when a client goes away in the middle of one.
	w.Stop()
	eventually(t, "the IDLE to end", func() bool {
		s.background.mu.Lock()
		defer s.background.mu.Unlock()
		return !s.background.busy
	})
}
