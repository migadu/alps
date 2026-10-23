package imap

import (
	"bufio"
	"context"
	"errors"
	"net"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
)

// idleAccount is an in-memory account with an Inbox and a Sent folder, and a
// provider signed in to it the way sessions are, through the factory.
func idleAccount(t *testing.T, caps imap.CapSet) (*IMAPProvider, *imapmemserver.User) {
	t.Helper()
	user := imapmemserver.NewUser("ada", "pass")
	for _, name := range []string{"INBOX", "Sent"} {
		if err := user.Create(context.Background(), name, nil); err != nil {
			t.Fatal(err)
		}
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	srv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		Caps:         caps,
		InsecureAuth: true,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })

	opts, err := (&Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	mp, err := opts.CreateFactory(5*time.Second, false)("ada", "pass")
	if err != nil {
		t.Fatal(err)
	}
	p := mp.(*IMAPProvider)
	// The connection itself, not a LOGOUT, which waits behind an IDLE that
	// a failed test left running.
	t.Cleanup(func() { p.client.Close() })
	dialers[p] = func(t *testing.T) *IMAPProvider {
		mp, err := opts.CreateFactory(5*time.Second, false)("ada", "pass")
		if err != nil {
			t.Fatal(err)
		}
		other := mp.(*IMAPProvider)
		t.Cleanup(func() { other.client.Close() })
		return other
	}
	return p, user
}

// dialers opens another connection to the account of a provider idleAccount
// made, as another client of the account.
var dialers = map[*IMAPProvider]func(t *testing.T) *IMAPProvider{}

func (p *IMAPProvider) dialAgain(t *testing.T) *IMAPProvider {
	t.Helper()
	return dialers[p](t)
}

func deliverTo(t *testing.T, user *imapmemserver.User, mailbox string) {
	t.Helper()
	msg := "From: Charles <charles@remote.test>\r\nSubject: Looms\r\n\r\nnew\r\n"
	if _, err := user.Append(context.Background(), mailbox, strings.NewReader(msg), &imap.AppendOptions{}); err != nil {
		t.Fatal(err)
	}
}

// awaitBegun waits for an IDLE to begin, and fails the test when it does not.
func awaitBegun(t *testing.T, began <-chan struct{}) {
	t.Helper()
	select {
	case <-began:
	case <-time.After(3 * time.Second):
		t.Fatal("the IDLE did not begin")
	}
}

// heard records the news a provider passes on.
type heard struct {
	mu   sync.Mutex
	news []string
	came chan struct{}
}

func listen(p *IMAPProvider) *heard {
	h := &heard{came: make(chan struct{}, 16)}
	p.OnMailboxNews(func(mailbox string) {
		h.mu.Lock()
		h.news = append(h.news, mailbox)
		h.mu.Unlock()
		h.came <- struct{}{}
	})
	return h
}

func (h *heard) await(t *testing.T) []string {
	t.Helper()
	select {
	case <-h.came:
	case <-time.After(3 * time.Second):
		t.Fatal("no news came")
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	return append([]string(nil), h.news...)
}

var idleCaps = imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapIdle: {}}

// Mail arriving while the connection waits in IDLE is passed on, naming the
// mailbox, and once the wait is stopped the connection takes commands again.
func TestIdle_PassesOnNewMail(t *testing.T) {
	p, user := idleAccount(t, idleCaps)
	if ok, err := p.CanIdle(); !ok || err != nil {
		t.Fatalf("a server with IDLE reads as one without (%v)", err)
	}
	h := listen(p)
	stop := make(chan struct{})
	began := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(began) }) }()
	select {
	case <-began:
	case <-time.After(3 * time.Second):
		t.Fatal("the IDLE did not begin")
	}

	deliverTo(t, user, "INBOX")
	if news := h.await(t); len(news) == 0 || news[0] != "INBOX" {
		t.Fatalf("the news named %v, want INBOX", news)
	}
	close(stop)
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("the IDLE did not end when stopped")
	}
	status, err := p.GetMailboxStatus("INBOX")
	if err != nil || status.NumMessages != 1 {
		t.Fatalf("after the IDLE, STATUS answered %+v, %v", status, err)
	}
}

// Mail that arrived while the connection was in another mailbox was not told
// of there, and is when the IDLE selects the Inbox again.
func TestIdle_TellsOfMailThatCameWhileElsewhere(t *testing.T) {
	p, user := idleAccount(t, idleCaps)
	h := listen(p)
	// Waited on once, so that the provider knows what the Inbox held.
	stop := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(stop) }) }()
	if err := <-done; err != nil {
		t.Fatal(err)
	}

	if err := p.ensureMailboxSelected("Sent"); err != nil {
		t.Fatal(err)
	}
	deliverTo(t, user, "INBOX")
	again := make(chan struct{})
	go func() { done <- p.Idle("INBOX", again, nil) }()
	if news := h.await(t); len(news) != 1 || news[0] != "INBOX" {
		t.Fatalf("the news named %v, want INBOX", news)
	}
	// Ended before the connection is closed: the in-memory server races its
	// own IDLE when a client goes away in the middle of one.
	close(again)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

// A server without IDLE is not asked for it, nor is a connection made without
// the handler that would hear its news.
func TestCanIdle_NotWithoutIdleOrItsNews(t *testing.T) {
	p, _ := idleAccount(t, imap.CapSet{imap.CapIMAP4rev1: {}})
	if ok, err := p.CanIdle(); ok || err != nil {
		t.Errorf("a server without IDLE reads as %v, %v", ok, err)
	}
	p, _ = idleAccount(t, idleCaps)
	if ok, _ := NewIMAPProvider(p.client, false).CanIdle(); ok {
		t.Error("a connection made without the news handler reads as one that can IDLE")
	}
}

// scriptedServer is a raw IMAP server for what the in-memory one does not
// do: it never answers DONE (a server that hangs, or a connection gone
// half-open while in IDLE), and it can refuse CAPABILITY.
type scriptedServer struct {
	ln              net.Listener
	refuseCapabilty bool
	// silentIdle has the server send no continuation to IDLE, ever.
	silentIdle bool

	mu    sync.Mutex
	conns []net.Conn
	dones int
}

func newScriptedServer(t *testing.T, refuseCapability bool) *scriptedServer {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	srv := &scriptedServer{ln: ln, refuseCapabilty: refuseCapability}
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

func (srv *scriptedServer) serve(c net.Conn) {
	w := bufio.NewWriter(c)
	say := func(s string) { w.WriteString(s + "\r\n"); w.Flush() }
	caps := " [CAPABILITY IMAP4rev1 IDLE]"
	if srv.refuseCapabilty {
		caps = ""
	}
	say("* OK" + caps + " ready")
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
			continue
		}
		parts := strings.SplitN(line, " ", 3)
		if len(parts) < 2 {
			continue
		}
		tag, cmd := parts[0], strings.ToUpper(parts[1])
		switch cmd {
		case "LOGIN":
			say(tag + " OK" + caps + " logged in")
		case "CAPABILITY":
			if srv.refuseCapabilty {
				say(tag + " NO not now")
			} else {
				say("* CAPABILITY IMAP4rev1 IDLE")
				say(tag + " OK done")
			}
		case "SELECT":
			say("* 0 EXISTS")
			say("* OK [UIDVALIDITY 1] ok")
			say("* OK [UIDNEXT 1] ok")
			say(tag + " OK [READ-WRITE] selected")
		case "IDLE":
			if !srv.silentIdle {
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

func (srv *scriptedServer) dial(t *testing.T, timeout time.Duration) *IMAPProvider {
	t.Helper()
	opts, err := (&Config{Server: "imap+insecure://" + srv.ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	mp, err := opts.CreateFactory(timeout, false)("ada", "pass")
	if err != nil {
		t.Fatal(err)
	}
	p := mp.(*IMAPProvider)
	t.Cleanup(func() { p.client.Close() })
	return p
}

// A DONE the server never answers ends the wait all the same, within the
// connection's response timeout, as a lost connection: the connection is
// closed, and whoever waits for it can go on. The client's own read deadline
// in IDLE is half an hour, and DONE does not shorten it.
func TestIdle_ADoneLeftUnansweredLosesTheConnection(t *testing.T) {
	srv := newScriptedServer(t, false)
	p := srv.dial(t, 300*time.Millisecond)
	stop := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(stop) }) }()
	select {
	case err := <-done:
		if err == nil {
			t.Fatal("an unanswered DONE ended the IDLE as if answered")
		}
		if !strings.Contains(err.Error(), "use of closed network connection") {
			t.Errorf("the IDLE ended with %v, which does not read as a lost connection", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("the IDLE still waits for the answer to DONE")
	}
	select {
	case <-p.client.Closed():
	case <-time.After(time.Second):
		t.Error("the connection was left open")
	}
}

// A server whose capabilities cannot be read says nothing of IDLE either
// way: that is not a server without IDLE.
func TestCanIdle_UnreadCapabilitiesAreNoAnswer(t *testing.T) {
	srv := newScriptedServer(t, true)
	p := srv.dial(t, time.Second)
	if ok, err := p.CanIdle(); err == nil {
		t.Errorf("CanIdle answered %v and no error, with the capabilities unread", ok)
	}
}

// Mail that came while the connection was in another mailbox is news when
// the IDLE begins, whoever selected the Inbox again: here a background job,
// before the IDLE.
func TestIdle_TellsOfMailThatCameWhileAJobWasElsewhere(t *testing.T) {
	p, user := idleAccount(t, idleCaps)
	h := listen(p)
	stop := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(stop) }) }()
	if err := <-done; err != nil {
		t.Fatal(err)
	}

	if err := p.ensureMailboxSelected("Sent"); err != nil { // the Sent lookup
		t.Fatal(err)
	}
	deliverTo(t, user, "INBOX")
	if err := p.ensureMailboxSelected("INBOX"); err != nil { // verdicts of the Inbox's rows
		t.Fatal(err)
	}
	again := make(chan struct{})
	go func() { done <- p.Idle("INBOX", again, nil) }()
	if news := h.await(t); len(news) != 1 || news[0] != "INBOX" {
		t.Fatalf("the news named %v, want INBOX", news)
	}
	// Ended before the connection is closed: the in-memory server races its
	// own IDLE when a client goes away in the middle of one.
	close(again)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

// A message in and one out while the connection was elsewhere moves no
// count; the Inbox's UIDNEXT says that one came.
func TestIdle_TellsOfOneInAndOneOut(t *testing.T) {
	p, user := idleAccount(t, idleCaps)
	deliverTo(t, user, "INBOX")
	h := listen(p)
	stop := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(stop) }) }()
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	if err := p.ensureMailboxSelected("Sent"); err != nil {
		t.Fatal(err)
	}

	other := p.dialAgain(t)
	if _, err := other.client.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := other.client.Store(imap.SeqSetNum(1), &imap.StoreFlags{Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{imap.FlagDeleted}}, nil).Close(); err != nil {
		t.Fatal(err)
	}
	if err := other.client.Expunge().Close(); err != nil {
		t.Fatal(err)
	}
	deliverTo(t, user, "INBOX")

	again := make(chan struct{})
	go func() { done <- p.Idle("INBOX", again, nil) }()
	select {
	case <-h.came:
	case <-time.After(3 * time.Second):
		// What the comparison went by, for a failure that does not show twice.
		t.Fatalf("no news came: the last IDLE ended at %+v; the Inbox is selected at UIDNEXT %v, UIDVALIDITY %v, %d messages",
			p.idled, p.selectedUIDNext, p.selectedUIDValidity, p.client.Mailbox().NumMessages)
	}
	// Ended before the connection is closed: the in-memory server races its
	// own IDLE when a client goes away in the middle of one.
	close(again)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

// A flag changed elsewhere is no news: push is for mail that arrives or
// goes, and the poll keeps flags current, as it did. A message read here
// is announced back on the server's next look at the mailbox, and every
// page would re-read the Inbox for it.
func TestIdle_AFlagChangedElsewhereIsNoNews(t *testing.T) {
	p, user := idleAccount(t, idleCaps)
	deliverTo(t, user, "INBOX")
	h := listen(p)
	stop := make(chan struct{})
	began := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(began) }) }()
	awaitBegun(t, began)

	other := p.dialAgain(t)
	if _, err := other.client.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := other.client.Store(imap.SeqSetNum(1), &imap.StoreFlags{Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{imap.FlagSeen}}, nil).Close(); err != nil {
		t.Fatal(err)
	}
	select {
	case <-h.came:
		t.Error("a flag changed elsewhere was passed on as news")
	case <-time.After(300 * time.Millisecond):
	}
	close(stop)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}

// A connection handed to other use stops passing news on.
func TestOnMailboxNews_NilStopsTheNews(t *testing.T) {
	p, user := idleAccount(t, idleCaps)
	h := listen(p)
	p.OnMailboxNews(nil)
	stop := make(chan struct{})
	began := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(began) }) }()
	awaitBegun(t, began)
	deliverTo(t, user, "INBOX")
	select {
	case <-h.came:
		t.Error("news came after OnMailboxNews(nil)")
	case <-time.After(300 * time.Millisecond):
	}
	close(stop)
	<-done
}

// An IDLE the server never answers with its continuation ends all the same,
// within the connection's response timeout, as a lost connection: the client
// waits for it under its half-hour read deadline for IDLE.
func TestIdle_AnUnansweredIdleLosesTheConnection(t *testing.T) {
	srv := newScriptedServer(t, false)
	srv.silentIdle = true
	p := srv.dial(t, 300*time.Millisecond)
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", make(chan struct{}), func() {}) }()
	select {
	case err := <-done:
		if !errors.Is(err, net.ErrClosed) {
			t.Errorf("the IDLE ended with %v, which does not read as a lost connection", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("the IDLE still waits for the server's continuation")
	}
	select {
	case <-p.client.Closed():
	case <-time.After(time.Second):
		t.Error("the connection was left open")
	}
}

// Capabilities unread because the connection is gone are a lost connection,
// which is let go of, not one kept for the next IDLE.
func TestCanIdle_UnreadOnAClosedConnectionIsALostConnection(t *testing.T) {
	srv := newScriptedServer(t, true)
	p := srv.dial(t, time.Second)
	p.client.Close()
	if _, err := p.CanIdle(); !errors.Is(err, net.ErrClosed) {
		t.Errorf("CanIdle on a closed connection answered %v, which does not read as a lost connection", err)
	}
}

// A message in and one out while the connection was elsewhere is news also
// after an IDLE that heard an arrival: the UIDNEXT the Inbox is selected
// with again is compared whatever the last IDLE heard.
func TestIdle_TellsOfOneInAndOneOutAfterAnIdleThatHeardNews(t *testing.T) {
	p, user := idleAccount(t, idleCaps)
	h := listen(p)
	stop := make(chan struct{})
	began := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(began) }) }()
	awaitBegun(t, began)
	deliverTo(t, user, "INBOX")
	h.await(t)
	close(stop)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	if err := p.ensureMailboxSelected("Sent"); err != nil {
		t.Fatal(err)
	}

	other := p.dialAgain(t)
	if _, err := other.client.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := other.client.Store(imap.SeqSetNum(1), &imap.StoreFlags{Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{imap.FlagDeleted}}, nil).Close(); err != nil {
		t.Fatal(err)
	}
	if err := other.client.Expunge().Close(); err != nil {
		t.Fatal(err)
	}
	deliverTo(t, user, "INBOX")

	again := make(chan struct{})
	go func() { done <- p.Idle("INBOX", again, nil) }()
	select {
	case <-h.came:
	case <-time.After(3 * time.Second):
		t.Fatalf("no news of one in and one out after an IDLE that heard news (the last IDLE ended at %+v; selected at UIDNEXT %v)", p.idled, p.selectedUIDNext)
	}
	// Ended before the connection is closed: the in-memory server races its
	// own IDLE when a client goes away in the middle of one.
	close(again)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
}
