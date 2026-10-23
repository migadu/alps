package alps

import (
	"context"
	"errors"
	"io"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// idlingServer opens the connections of a session under test, as a mail
// server that can wait for news of a mailbox (IDLE) would, or one that cannot.
type idlingServer struct {
	mu       sync.Mutex
	noIdle   bool
	dials    int
	conns    []*idlingConnection
	refuse   func(dial int) error
	password []string
	// unread fails the reading of a connection's capabilities, by its dial,
	// as CanIdle does when the server could not be asked.
	unread func(dial int) error
	// refusal is what IDLE is answered with instead, a tagged NO, while set.
	refusal error
	// hang, while set, keeps an IDLE from ending at DONE until it is closed:
	// a server that never answers DONE.
	hang chan struct{}
	// attempts are when each IDLE was asked for, refused or not.
	attempts []time.Time
}

func (srv *idlingServer) dial(username, password string) (provider.MailProvider, error) {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	srv.dials++
	if srv.refuse != nil {
		if err := srv.refuse(srv.dials); err != nil {
			return nil, err
		}
	}
	srv.password = append(srv.password, password)
	c := &idlingConnection{server: srv, dial: srv.dials, drop: make(chan struct{})}
	srv.conns = append(srv.conns, c)
	return c, nil
}

func (srv *idlingServer) dialled() int {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	return srv.dials
}

func (srv *idlingServer) open() int {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	n := 0
	for _, c := range srv.conns {
		c.mu.Lock()
		if !c.closed {
			n++
		}
		c.mu.Unlock()
	}
	return n
}

// idling is the connection waiting in IDLE now, or nil.
func (srv *idlingServer) idling() *idlingConnection {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	for _, c := range srv.conns {
		c.mu.Lock()
		on := c.inIdle
		c.mu.Unlock()
		if on {
			return c
		}
	}
	return nil
}

// idlingConnection is one connection of an idlingServer.
type idlingConnection struct {
	provider.MockProvider
	server *idlingServer
	dial   int // which dial opened it, from 1

	mu     sync.Mutex
	news   func(mailbox string)
	idles  int  // IDLE commands begun on it
	inIdle bool // waiting in IDLE now
	worked bool // other work ran on it while it was in IDLE
	closed bool
	drop   chan struct{} // closed to drop the connection under an IDLE
}

func (c *idlingConnection) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.closed = true
	return nil
}

func (c *idlingConnection) CanIdle() (bool, error) {
	srv := c.server
	srv.mu.Lock()
	defer srv.mu.Unlock()
	if srv.unread != nil {
		if err := srv.unread(c.dial); err != nil {
			return false, err
		}
	}
	return !srv.noIdle, nil
}

func (c *idlingConnection) OnMailboxNews(news func(mailbox string)) {
	c.mu.Lock()
	c.news = news
	c.mu.Unlock()
}

func (c *idlingConnection) Idle(mailbox string, stop <-chan struct{}, started func()) error {
	if mailbox != "INBOX" {
		return errors.New("IDLE on " + mailbox)
	}
	srv := c.server
	srv.mu.Lock()
	srv.attempts = append(srv.attempts, time.Now())
	refusal, hang := srv.refusal, srv.hang
	srv.mu.Unlock()
	if refusal != nil {
		return refusal
	}
	c.mu.Lock()
	c.idles++
	c.inIdle = true
	c.mu.Unlock()
	started()
	var err error
	select {
	case <-stop:
		if hang != nil {
			select {
			case <-hang:
			case <-c.drop:
				err = io.EOF
			}
		}
	case <-c.drop:
		err = io.EOF
	}
	c.mu.Lock()
	c.inIdle = false
	c.mu.Unlock()
	return err
}

func (c *idlingConnection) isClosed() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.closed
}

// say has the mail server send news of mailbox on the connection, as it does
// in IDLE.
func (c *idlingConnection) say(mailbox string) {
	c.mu.Lock()
	news := c.news
	c.mu.Unlock()
	if news != nil {
		news(mailbox)
	}
}

func (c *idlingConnection) idleCount() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.idles
}

// work is background work that notes whether it ran while its connection was
// in IDLE.
func work(p provider.MailProvider) error {
	if c, ok := p.(*idlingConnection); ok {
		c.mu.Lock()
		if c.inIdle {
			c.worked = true
		}
		c.mu.Unlock()
	}
	return nil
}

// newPushSession is a session over srv with background connections and push
// on, signed in on its own connection, whose IDLE waits between rounds only
// for a moment.
func newPushSession(t *testing.T, srv *idlingServer) *Session {
	t.Helper()
	sm := newSessionManager(srv.dial, nil, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	sm.backgroundConnections = true
	sm.pushNewMail = true
	sm.pushResume = 10 * time.Millisecond
	sm.pushRetry = 25 * time.Millisecond
	// A request given up on is given up on at once, rather than after the
	// grace a foreground request has.
	sm.abandonedWait = time.Millisecond
	s := &Session{manager: sm, closed: make(chan struct{}), username: "u", password: "p"}
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.teardown)
	return s
}

// next is the next event of w, failing the test when none comes in time.
func next(t *testing.T, w *InboxWatch) InboxEvent {
	t.Helper()
	select {
	case ev, ok := <-w.C:
		if !ok {
			t.Fatal("the watch ended")
		}
		return ev
	case <-time.After(2 * time.Second):
		t.Fatal("no news came")
	}
	return 0
}

// quiet fails the test when w has news within a moment.
func quiet(t *testing.T, w *InboxWatch, what string) {
	t.Helper()
	select {
	case ev, ok := <-w.C:
		t.Fatalf("%s: got %v (open %v), want nothing", what, ev, ok)
	case <-time.After(100 * time.Millisecond):
	}
}

func ended(t *testing.T, w *InboxWatch) {
	t.Helper()
	select {
	case ev, ok := <-w.C:
		if ok {
			t.Fatalf("got %v, want the watch ended", ev)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the watch did not end")
	}
}

// A watched Inbox is waited on with IDLE on the session's background
// connection, never its own, and what the mail server says of the Inbox
// there reaches the watch. News of another mailbox does not. Once the watch
// stops, so does the IDLE, and the background connection is closed once it
// has gone unused, as when nothing watches.
func TestWatchInbox_IdlesOnTheBackgroundConnection(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	s.manager.backgroundIdle = 100 * time.Millisecond
	own := ownConnection(t, s)

	w := s.WatchInbox()
	if ev := next(t, w); ev != InboxWatched {
		t.Fatalf("the first event is %v, want InboxWatched", ev)
	}
	idling := srv.idling()
	if idling == nil {
		t.Fatal("no connection is in IDLE")
	}
	if provider.MailProvider(idling) == own {
		t.Fatal("the IDLE runs on the session's own connection")
	}

	idling.say("Sent")
	quiet(t, w, "news of Sent")
	idling.say("INBOX")
	if ev := next(t, w); ev != InboxChanged {
		t.Fatalf("news of the Inbox came as %v, want InboxChanged", ev)
	}

	w.Stop()
	ended(t, w)
	eventually(t, "the IDLE to end", func() bool { return srv.idling() == nil })
	eventually(t, "the unused background connection to close", func() bool { return srv.open() == 1 })
	if ownConnection(t, s) != own {
		t.Error("the session's own connection was replaced")
	}
}

// One IDLE serves every watch of a session, and runs until the last stops.
func TestWatchInbox_OneIdleForTheSession(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)

	first := s.WatchInbox()
	next(t, first)
	second := s.WatchInbox()
	if ev := next(t, second); ev != InboxWatched {
		t.Fatalf("a watch that joined a running IDLE was first told %v, want InboxWatched", ev)
	}
	idling := srv.idling()
	idling.say("INBOX")
	if next(t, first) != InboxChanged || next(t, second) != InboxChanged {
		t.Fatal("not every watch heard the news")
	}
	if n := srv.dialled(); n != 2 {
		t.Errorf("%d connections dialled, want the session's own and one background connection", n)
	}

	first.Stop()
	time.Sleep(50 * time.Millisecond)
	if srv.idling() != idling {
		t.Fatal("the IDLE ended while a watch still ran")
	}
	if n := idling.idleCount(); n != 1 {
		t.Errorf("%d IDLE commands for two watches, want 1", n)
	}
	second.Stop()
	eventually(t, "the IDLE to end with the last watch", func() bool { return srv.idling() == nil })
}

// Background work does not wait for the IDLE: the IDLE ends, the work runs on
// the connection, and the IDLE resumes on it after the work.
func TestWatchInbox_IdleMakesWayForBackgroundWork(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	next(t, w)
	idling := srv.idling()

	for i := 0; i < 3; i++ {
		done := make(chan error, 1)
		var ranOn provider.MailProvider
		go func() {
			done <- s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
				ranOn = p
				return work(p)
			})
		}()
		select {
		case err := <-done:
			if err != nil {
				t.Fatal(err)
			}
		case <-time.After(2 * time.Second):
			t.Fatal("background work waited for the IDLE")
		}
		if ranOn != provider.MailProvider(idling) {
			t.Fatal("the work did not run on the background connection")
		}
		eventually(t, "the IDLE to resume", func() bool { return idling.idleCount() == i+2 && srv.idling() == idling })
	}
	idling.mu.Lock()
	worked := idling.worked
	idling.mu.Unlock()
	if worked {
		t.Error("background work ran while the connection was in IDLE")
	}
	quiet(t, w, "making way for background work")

	idling.say("INBOX")
	if ev := next(t, w); ev != InboxChanged {
		t.Errorf("news after the work came as %v", ev)
	}
}

// The IDLE is begun again before RFC 2177's 29 minutes are up, on the same
// connection, and the watch is not told anything of it.
func TestWatchInbox_IdleIsBegunAgainBeforeTheServerGivesUpOnIt(t *testing.T) {
	if pushRestartAfter >= 29*time.Minute {
		t.Errorf("IDLE is begun again after %v; RFC 2177 advises clients to begin it again at least every 29 minutes, since a server may log off an idle client (after 30, RFC 3501 §5.4)", pushRestartAfter)
	}
	var srv idlingServer
	s := newPushSession(t, &srv)
	s.manager.pushRestart = 50 * time.Millisecond
	w := s.WatchInbox()
	next(t, w)
	idling := srv.idling()
	eventually(t, "the IDLE to be begun again", func() bool { return idling.idleCount() >= 3 })
	if n := srv.dialled(); n != 2 {
		t.Errorf("%d connections dialled, want the IDLE begun again on the same one", n)
	}
	quiet(t, w, "beginning the IDLE again")
}

// A dropped IDLE connection does not end the session, nor does a mail server
// that will not open another: the watch waits, and once a connection is
// open again it is told so, since what happened meanwhile went unheard.
func TestWatchInbox_ALostIdleIsNoReasonToSignOut(t *testing.T) {
	srv := idlingServer{}
	s := newPushSession(t, &srv)
	var later atomic.Int64
	s.manager.now = func() time.Time { return time.Now().Add(time.Duration(later.Load())) }
	w := s.WatchInbox()
	next(t, w)
	lost := srv.idling()

	srv.mu.Lock()
	srv.refuse = func(dial int) error {
		if dial == 3 {
			return loginRefused(imap.ResponseCodeLimit, "Maximum connections reached")
		}
		return nil
	}
	srv.mu.Unlock()
	close(lost.drop)

	eventually(t, "another connection to be asked for", func() bool { return srv.dialled() == 3 })
	lost.mu.Lock()
	closed := lost.closed
	lost.mu.Unlock()
	if !closed {
		t.Error("the dropped connection was not closed")
	}
	time.Sleep(100 * time.Millisecond)
	select {
	case <-s.closed:
		t.Fatalf("a lost IDLE ended the session (%s)", s.endReason)
	default:
	}
	if n := srv.dialled(); n != 3 {
		t.Errorf("%d connections dialled; the server that refused one was asked again at once", n)
	}

	// Past the wait after a refusal, as for any background work.
	later.Store(int64(backgroundRetryAfter))
	eventually(t, "the IDLE to resume on another connection", func() bool {
		c := srv.idling()
		return c != nil && c != lost
	})
	if ev := next(t, w); ev != InboxWatched {
		t.Errorf("the watch was told %v once the IDLE resumed, want InboxWatched", ev)
	}
	select {
	case <-s.closed:
		t.Fatalf("the session ended (%s)", s.endReason)
	default:
	}
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Errorf("the session's own work answered %v", err)
	}
}

// A mail server that cannot IDLE gets no push: the watch is told so and ends,
// and a later one is told at once. Nothing else changes.
func TestWatchInbox_AServerWithoutIdle(t *testing.T) {
	srv := idlingServer{noIdle: true}
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	if ev := next(t, w); ev != InboxUnwatchable {
		t.Fatalf("the watch was told %v, want InboxUnwatchable", ev)
	}
	ended(t, w)

	later := s.WatchInbox()
	if ev := next(t, later); ev != InboxUnwatchable {
		t.Fatalf("a later watch was told %v, want InboxUnwatchable", ev)
	}
	ended(t, later)
	for _, c := range srv.conns {
		if c.idleCount() > 0 {
			t.Fatal("IDLE was sent to a server without it")
		}
	}
	if err := s.DoBackgroundMail(context.Background(), work); err != nil {
		t.Errorf("background work answered %v", err)
	}
	if n := srv.dialled(); n != 2 {
		t.Errorf("%d connections dialled, want the session's own and one background connection", n)
	}
}

// With push off, a watch hears nothing and no IDLE is sent.
func TestWatchInbox_OffMeansNoIdle(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	s.manager.pushNewMail = false
	w := s.WatchInbox()
	ended(t, w)
	if err := s.DoBackgroundMail(context.Background(), work); err != nil {
		t.Fatal(err)
	}
	time.Sleep(50 * time.Millisecond)
	for _, c := range srv.conns {
		if c.idleCount() > 0 {
			t.Fatal("IDLE was sent with push off")
		}
	}
}

// The session's end ends its watches and the IDLE.
func TestWatchInbox_EndsWithTheSession(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	next(t, w)
	s.CloseWithReason("sign-out")
	s.teardown()
	ended(t, w)
	eventually(t, "every connection to close", func() bool { return srv.open() == 0 })
	ended(t, s.WatchInbox())
}

// A session whose own connection is dropped, and whose reconnect the mail
// server refuses for the account's connection limit, carries on with its
// background connection when that one is in IDLE, as when it is busy with
// other work: the IDLE ends and hands it over.
func TestWatchInbox_ARefusedReconnectTakesTheIdlingConnection(t *testing.T) {
	srv := idlingServer{}
	s := newPushSession(t, &srv)
	own := ownConnection(t, s)
	w := s.WatchInbox()
	next(t, w)
	idling := srv.idling()
	srv.mu.Lock()
	srv.refuse = func(int) error {
		return loginRefused(imap.ResponseCodeLimit, "Maximum connections reached")
	}
	srv.mu.Unlock()

	done := make(chan error, 1)
	var ranOn []provider.MailProvider
	go func() {
		done <- s.DoMail(func(p provider.MailProvider) error {
			ranOn = append(ranOn, p)
			if p == own {
				return errors.New("read tcp: connection reset by peer")
			}
			return nil
		})
	}()
	select {
	case err := <-done:
		if err != nil || len(ranOn) != 2 || ranOn[1] != provider.MailProvider(idling) {
			t.Fatalf("answered %v after running on %d connections; want it run again on the connection that was in IDLE", err, len(ranOn))
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the session's own work waited for the IDLE")
	}
	select {
	case <-s.closed:
		t.Fatalf("the session ended (%s)", s.endReason)
	default:
	}
	// The session's own from now on: what the server says there, of its
	// own moves out of the Inbox too, is no news for the pages.
	for len(w.C) > 0 {
		<-w.C
	}
	idling.say("INBOX")
	quiet(t, w, "news on the connection handed over")
}

// A password change does not wait for the IDLE, and the IDLE resumes on a
// connection signed in with the new password.
func TestWatchInbox_APasswordChangeEndsTheIdle(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	next(t, w)
	old := srv.idling()

	done := make(chan error, 1)
	go func() { done <- s.manager.UpdatePassword(s, "new") }()
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the password change waited for the IDLE")
	}
	eventually(t, "the IDLE to resume on another connection", func() bool {
		c := srv.idling()
		return c != nil && c != old
	})
	srv.mu.Lock()
	defer srv.mu.Unlock()
	if last := srv.password[len(srv.password)-1]; last != "new" {
		t.Errorf("the IDLE resumed on a connection signed in with %q", last)
	}
}

// A session that gives up on its own connection mid-command holds no more
// connections than without push: the IDLE ends and its connection is closed
// until the one given up on has closed, as busy background work's is.
func TestWatchInbox_AConnectionGivenUpOnEndsTheIdle(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	next(t, w)
	idling := srv.idling()

	ctx, cancel := context.WithCancel(context.Background())
	busy, finish := make(chan struct{}), make(chan struct{})
	given := make(chan error, 1)
	go func() {
		given <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
			close(busy)
			<-finish
			return nil
		})
	}()
	<-busy
	cancel()
	<-given

	eventually(t, "the IDLE's connection to close", func() bool {
		idling.mu.Lock()
		defer idling.mu.Unlock()
		return idling.closed
	})
	close(finish)
	eventually(t, "the IDLE to resume once the connection given up on has closed", func() bool {
		c := srv.idling()
		return c != nil && c != idling
	})
}

// A server shutting down ends the watches, and the event streams they serve,
// rather than wait for the pages to go; the sessions go on.
func TestEndInboxWatches_EndsTheWatchesForAShutdown(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	s.manager.sessions["token"] = s
	w := s.WatchInbox()
	next(t, w)
	s.manager.endInboxWatches()
	ended(t, w)
	eventually(t, "the IDLE to end", func() bool { return srv.idling() == nil })
	select {
	case <-s.closed:
		t.Fatal("the shutdown's first step ended the session")
	default:
	}
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Errorf("the session's own work answered %v", err)
	}
}

// Background work does not wait past its context for an IDLE whose DONE the
// server leaves unanswered, nor does a password change: each gives up when
// its request does. Before push, whoever held the background connection was
// bound by its own context.
func TestWatchInbox_WorkDoesNotWaitPastItsContextForAnUnansweredDone(t *testing.T) {
	srv := idlingServer{hang: make(chan struct{})}
	s := newPushSession(t, &srv)
	t.Cleanup(func() { close(srv.hang) })
	w := s.WatchInbox()
	next(t, w)

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- s.DoBackgroundMail(ctx, work) }()
	select {
	case err := <-done:
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Errorf("the work answered %v, want its context's end", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("background work waits on behind an unanswered DONE, past its context")
	}

	ctx, cancel = context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()
	go func() { done <- s.manager.UpdatePasswordContext(ctx, s, "new") }()
	select {
	case err := <-done:
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Errorf("the password change answered %v, want its context's end", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("a password change waits on behind an unanswered DONE, past its context")
	}
	if s.password != "p" {
		t.Errorf("a password change given up on left the session's password %q", s.password)
	}
}

// gatedConnection is an idlingConnection whose CanIdle waits at a gate, as
// a CAPABILITY round trip would: the moment between the IDLE taking the
// background connection and beginning.
type gatedConnection struct {
	*idlingConnection
	entered chan struct{}
	gate    chan struct{}
	once    sync.Once
}

func (c *gatedConnection) CanIdle() (bool, error) {
	c.once.Do(func() {
		close(c.entered)
		<-c.gate
	})
	return c.idlingConnection.CanIdle()
}

// newGatedPushSession is newPushSession whose background connection holds
// its IDLE at the gate.
func newGatedPushSession(t *testing.T, srv *idlingServer) (*Session, provider.MailProvider, func() *gatedConnection) {
	t.Helper()
	var mu sync.Mutex
	var gated []*gatedConnection
	dial := func(u, p string) (provider.MailProvider, error) {
		mp, err := srv.dial(u, p)
		if err != nil {
			return nil, err
		}
		g := &gatedConnection{idlingConnection: mp.(*idlingConnection), entered: make(chan struct{}), gate: make(chan struct{})}
		mu.Lock()
		gated = append(gated, g)
		mu.Unlock()
		return g, nil
	}
	s := newPushSession(t, srv)
	s.manager.connectProviderFunc = dial
	s.provider.Close()
	s.provider = nil
	own := ownConnection(t, s)
	background := func() *gatedConnection {
		eventually(t, "a background connection", func() bool {
			mu.Lock()
			defer mu.Unlock()
			return len(gated) == 2
		})
		mu.Lock()
		defer mu.Unlock()
		return gated[1]
	}
	return s, own, background
}

// The session's own work that takes the background connection over, at the
// account's connection limit, ends an IDLE that has taken the connection and
// not yet begun: the IDLE does not begin, and hands the connection over.
func TestWatchInbox_AnInterruptBeforeTheIdleBeginsIsKept(t *testing.T) {
	var srv idlingServer
	s, own, background := newGatedPushSession(t, &srv)
	w := s.WatchInbox()
	defer w.Stop()
	bg := background()
	<-bg.entered

	srv.mu.Lock()
	srv.refuse = func(int) error { return loginRefused(imap.ResponseCodeLimit, "Maximum connections reached") }
	srv.mu.Unlock()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	done := make(chan error, 1)
	var ranOn []provider.MailProvider
	go func() {
		done <- s.DoMailWithContext(ctx, func(p provider.MailProvider) error {
			ranOn = append(ranOn, p)
			if p == own {
				return errors.New("read tcp: connection reset by peer")
			}
			return nil
		})
	}()
	time.Sleep(100 * time.Millisecond) // the claim is made, and the interrupt sent
	close(bg.gate)

	select {
	case err := <-done:
		if err != nil || len(ranOn) != 2 || ranOn[1] != provider.MailProvider(bg) {
			t.Fatalf("answered %v after running on %d connections; want the IDLE's connection handed over", err, len(ranOn))
		}
	case <-time.After(3 * time.Second):
		t.Fatal("the session's own work waits for a connection the IDLE kept")
	}
	if bg.idleCount() != 0 {
		t.Error("the IDLE began after it was asked to end")
	}
}

// A connection given up on mid-command, while the IDLE is about to begin,
// has the background connection closed all the same: the session holds no
// more connections than without push.
func TestWatchInbox_AGiveUpBeforeTheIdleBeginsIsKept(t *testing.T) {
	var srv idlingServer
	s, _, background := newGatedPushSession(t, &srv)
	w := s.WatchInbox()
	defer w.Stop()
	bg := background()
	<-bg.entered

	ctx, cancel := context.WithCancel(context.Background())
	busy, finish := make(chan struct{}), make(chan struct{})
	given := make(chan error, 1)
	go func() {
		given <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
			close(busy)
			<-finish
			return nil
		})
	}()
	<-busy
	cancel()
	<-given
	close(bg.gate)
	eventually(t, "the background connection to close", bg.isClosed)
	if bg.idleCount() != 0 {
		t.Error("the IDLE began beside a connection given up on")
	}
	close(finish)
}

// A mail server that refuses IDLE with a NO has said nothing against the
// connection: it is kept, nobody is signed out, and IDLE is asked for again
// less and less often, not with a sign-in every few seconds.
func TestWatchInbox_ARefusedIdleKeepsTheConnectionAndTheSession(t *testing.T) {
	srv := idlingServer{refusal: &imap.Error{Type: imap.StatusResponseTypeNo, Text: "not now"}}
	s := newPushSession(t, &srv)
	own := ownConnection(t, s)
	w := s.WatchInbox()
	defer w.Stop()

	eventually(t, "three refusals", func() bool {
		srv.mu.Lock()
		defer srv.mu.Unlock()
		return len(srv.attempts) >= 3
	})
	srv.mu.Lock()
	a := append([]time.Time(nil), srv.attempts...)
	srv.mu.Unlock()
	if gap := a[1].Sub(a[0]); gap < 2*s.manager.pushRetry {
		t.Errorf("IDLE asked for again %v after a refusal, want at least %v", gap, 2*s.manager.pushRetry)
	}
	if a[2].Sub(a[1]) <= a[1].Sub(a[0]) {
		t.Errorf("the waits between refusals do not grow: %v, then %v", a[1].Sub(a[0]), a[2].Sub(a[1]))
	}
	if n := srv.dialled(); n != 2 {
		t.Errorf("%d connections dialled; a refused IDLE closed a connection the server had not dropped", n)
	}

	// The session's own connection dropped, and its reconnect refused at the
	// limit: the background connection is taken over, whether an IDLE was
	// being refused on it or not.
	srv.mu.Lock()
	srv.refuse = func(int) error { return loginRefused(imap.ResponseCodeLimit, "Maximum connections reached") }
	srv.mu.Unlock()
	err := s.DoMail(func(p provider.MailProvider) error {
		if p == own {
			return errors.New("read tcp: connection reset by peer")
		}
		return nil
	})
	if err != nil {
		t.Errorf("the session's own work answered %v", err)
	}
	select {
	case <-s.closed:
		t.Fatalf("the session ended (%s)", s.endReason)
	default:
	}
	quiet(t, w, "a refused IDLE")
}

// Capabilities that could not be read say nothing of IDLE: the IDLE is
// tried again, and nobody is told that the server cannot.
func TestWatchInbox_UnreadCapabilitiesAreTriedAgain(t *testing.T) {
	srv := idlingServer{unread: func(dial int) error {
		return errors.New("imap: the server's capabilities could not be read")
	}}
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	defer w.Stop()
	time.Sleep(100 * time.Millisecond)
	select {
	case ev, ok := <-w.C:
		t.Fatalf("the watch was told %v (open %v) while the capabilities could not be read", ev, ok)
	default:
	}
	srv.mu.Lock()
	srv.unread = nil
	srv.mu.Unlock()
	if ev := next(t, w); ev != InboxWatched {
		t.Errorf("once they could be read, the watch was told %v, want InboxWatched", ev)
	}
}

// A watch is told that the server cannot push even when it has news it has
// not read: the last word of a watch is not let go for want of room.
func TestWatchInbox_TheLastEventIsNeverDropped(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	eventually(t, "the IDLE", func() bool { return srv.idling() != nil })
	first := srv.idling()
	first.say("INBOX")
	first.say("INBOX")

	// The server loses IDLE (another node of it, after a failover).
	srv.mu.Lock()
	srv.noIdle = true
	srv.mu.Unlock()
	close(first.drop)
	// Read nothing until the server has been asked again, and said no.
	eventually(t, "another connection", func() bool { return srv.dialled() == 3 })
	time.Sleep(50 * time.Millisecond)

	var got []InboxEvent
	timeout := time.After(3 * time.Second)
	for done := false; !done; {
		select {
		case ev, ok := <-w.C:
			if !ok {
				done = true
				break
			}
			got = append(got, ev)
		case <-timeout:
			t.Fatalf("the watch did not end; it heard %v", got)
		}
	}
	if len(got) == 0 || got[len(got)-1] != InboxUnwatchable {
		t.Errorf("the watch heard %v, want InboxUnwatchable last", got)
	}
}

// What the mail server says of the Inbox on the background connection is
// passed on during background work on it too, and after: the news is
// switched off only for a connection handed over to the session's own use.
func TestWatchInbox_NewsDuringBackgroundWorkIsPassedOn(t *testing.T) {
	var srv idlingServer
	s := newPushSession(t, &srv)
	w := s.WatchInbox()
	defer w.Stop()
	next(t, w)
	idling := srv.idling()

	heard := make(chan InboxEvent, 1)
	err := s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
		p.(*idlingConnection).say("INBOX")
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
		t.Errorf("news during background work came as %v, want InboxChanged", ev)
	}
	eventually(t, "the IDLE to resume", func() bool { return idling.idleCount() == 2 && srv.idling() == idling })
	idling.say("INBOX")
	if ev := next(t, w); ev != InboxChanged {
		t.Errorf("news after background work came as %v, want InboxChanged", ev)
	}
}

func TestUpdatePasswordContext_AlreadyCancelledDoesNotChangeTheSession(t *testing.T) {
	for i := 0; i < 50; i++ {
		server := &idlingServer{}
		session := newPushSession(t, server)
		before := server.dialled()
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		err := session.manager.UpdatePasswordContext(ctx, session, "new-password")
		if !errors.Is(err, context.Canceled) || server.dialled() != before || session.password != "p" {
			t.Fatalf("cancelled update iter%d: err=%v dials=%d->%d password=%q", i, err, before, server.dialled(), session.password)
		}
	}
}

// A watch begun while the IDLE's connection is gone is not told that the
// IDLE is up: it is told once one has begun again. Each case has the IDLE
// wait to resume (pushResume), the window in which a page opening its
// stream was told of an IDLE that no connection held.
func TestWatchInbox_NotToldOfAnIdleWhoseConnectionIsGone(t *testing.T) {
	for _, tc := range []struct {
		name string
		gone func(t *testing.T, s *Session, srv *idlingServer, idling *idlingConnection)
	}{
		{"dropped under background work", func(t *testing.T, s *Session, srv *idlingServer, idling *idlingConnection) {
			err := s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
				if p == provider.MailProvider(idling) {
					return errors.New("read tcp: connection reset by peer")
				}
				return nil
			})
			if err != nil {
				t.Fatal(err)
			}
		}},
		{"closed for a password change", func(t *testing.T, s *Session, srv *idlingServer, idling *idlingConnection) {
			if err := s.manager.UpdatePassword(s, "new"); err != nil {
				t.Fatal(err)
			}
		}},
		{"taken over by the session's own work", func(t *testing.T, s *Session, srv *idlingServer, idling *idlingConnection) {
			// Background work first, so that the IDLE waits to resume.
			if err := s.DoBackgroundMail(context.Background(), work); err != nil {
				t.Fatal(err)
			}
			// The session's own connection gone, as one given up on is.
			s.providerLocker.Lock()
			s.provider.Close()
			s.provider = nil
			s.providerLocker.Unlock()
			var ranOn provider.MailProvider
			if err := s.DoMail(func(p provider.MailProvider) error { ranOn = p; return nil }); err != nil {
				t.Fatal(err)
			}
			if ranOn != provider.MailProvider(idling) {
				t.Fatal("the session's own work did not take the background connection over")
			}
		}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var srv idlingServer
			s := newPushSession(t, &srv)
			s.manager.pushResume = 2 * time.Second
			first := s.WatchInbox()
			defer first.Stop()
			next(t, first)
			idling := srv.idling()

			tc.gone(t, s, &srv, idling)
			eventually(t, "the IDLE to end", func() bool { return srv.idling() == nil })
			later := s.WatchInbox()
			defer later.Stop()
			quiet(t, later, "a watch begun while the IDLE's connection is gone")
		})
	}
}
