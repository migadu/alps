package alps

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/mock"
)

// mailConnections opens the connections of a session under test, as a mail
// server would, and counts them: how many it opened, how many are open now,
// and the most that were open at once.
type mailConnections struct {
	mu        sync.Mutex
	dials     int
	opened    int
	open      int
	mostOpen  int
	passwords []string
	// refuse answers the error a dial fails with, or nil for one that opens.
	refuse func(dial int) error
}

func (c *mailConnections) dial(username, password string) (provider.MailProvider, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.dials++
	if c.refuse != nil {
		if err := c.refuse(c.dials); err != nil {
			return nil, err
		}
	}
	c.opened++
	c.open++
	if c.open > c.mostOpen {
		c.mostOpen = c.open
	}
	c.passwords = append(c.passwords, password)
	p := &provider.MockProvider{}
	closed := false
	p.On("Close").Return(nil).Run(func(mock.Arguments) {
		c.mu.Lock()
		defer c.mu.Unlock()
		if !closed {
			closed = true
			c.open--
		}
	})
	return p, nil
}

func (c *mailConnections) counts() (dials, opened, open, mostOpen int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.dials, c.opened, c.open, c.mostOpen
}

// newBackgroundSession is a session whose connections c opens, with
// background connections on, signed in on its own connection.
func newBackgroundSession(t *testing.T, c *mailConnections) *Session {
	t.Helper()
	sm := newSessionManager(c.dial, nil, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	// Exercise the path after the foreground grace interval has elapsed.
	sm.abandonedWait = time.Millisecond
	sm.backgroundConnections = true
	s := &Session{manager: sm, closed: make(chan struct{}), username: "u", password: "p"}
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.teardown)
	return s
}

// ownConnection is the connection s does its own mail work on.
func ownConnection(t *testing.T, s *Session) provider.MailProvider {
	t.Helper()
	var own provider.MailProvider
	s.DoMail(func(p provider.MailProvider) error {
		own = p
		return nil
	})
	return own
}

// backgroundConnectionOf is the connection s does its background work on.
func backgroundConnectionOf(t *testing.T, s *Session) provider.MailProvider {
	t.Helper()
	var used provider.MailProvider
	if err := s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
		used = p
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	return used
}

func eventually(t *testing.T, what string, cond func() bool) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for !cond() {
		if time.Now().After(deadline) {
			t.Fatalf("waited in vain for %s", what)
		}
		time.Sleep(5 * time.Millisecond)
	}
}

// The background connection is opened by the first background work, not
// with the session, and the work after it uses the same one.
func TestDoBackgroundMail_OpensItsConnectionWhenFirstNeeded(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	own := ownConnection(t, s)
	if _, opened, _, _ := c.counts(); opened != 1 {
		t.Fatalf("a session opened %d connections before any background work, want its own only", opened)
	}

	first := backgroundConnectionOf(t, s)
	if first == own {
		t.Fatal("the background work ran on the session's own connection")
	}
	if second := backgroundConnectionOf(t, s); second != first {
		t.Error("the next background work opened another connection")
	}
	if _, opened, open, _ := c.counts(); opened != 2 || open != 2 {
		t.Errorf("opened %d, open %d; want the session's own and one background connection", opened, open)
	}
}

// A background connection nobody uses is closed, and the next background
// work opens another. Use keeps it open.
func TestDoBackgroundMail_ClosesItsConnectionOnceIdle(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	s.manager.backgroundIdle = 500 * time.Millisecond
	own := ownConnection(t, s)

	first := backgroundConnectionOf(t, s)
	for i := 0; i < 4; i++ {
		time.Sleep(200 * time.Millisecond)
		if p := backgroundConnectionOf(t, s); p != first {
			t.Fatal("a background connection in use was closed")
		}
	}

	eventually(t, "the idle background connection to close", func() bool {
		_, _, open, _ := c.counts()
		return open == 1
	})
	if ownConnection(t, s) != own {
		t.Error("closing the idle background connection closed the session's own")
	}
	if p := backgroundConnectionOf(t, s); p == first || p == own {
		t.Error("background work after the idle close did not open another connection")
	}
}

// A mail server that will not open the background connection, at the dial or
// at the sign-in, does not end the session: the work is done on the session's
// own connection, and the server is not asked again until a while has passed.
func TestDoBackgroundMail_ARefusedConnectionFallsBackToTheSessionsOwn(t *testing.T) {
	for _, refusal := range []struct {
		name string
		err  error
	}{
		{"the dial", errors.New("dial tcp 127.0.0.1:993: connect: connection refused")},
		{"the sign-in", loginRefused(imap.ResponseCodeLimit, "Maximum connections reached")},
	} {
		t.Run(refusal.name, func(t *testing.T) {
			c := mailConnections{refuse: func(dial int) error {
				if dial > 1 {
					return refusal.err
				}
				return nil
			}}
			s := newBackgroundSession(t, &c)
			now := time.Now()
			s.manager.now = func() time.Time { return now }
			own := ownConnection(t, s)

			ran := false
			err := s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
				ran = p == own
				return nil
			})
			if err != nil || !ran {
				t.Fatalf("the work answered %v, and ran on the session's own connection: %v", err, ran)
			}
			select {
			case <-s.closed:
				t.Fatalf("a refused background connection ended the session (%s)", s.endReason)
			default:
			}

			backgroundConnectionOf(t, s)
			if dials, _, _, _ := c.counts(); dials != 2 {
				t.Errorf("%d dials, want the session's own and one refused: the server was asked again at once", dials)
			}

			now = now.Add(backgroundRetryAfter)
			c.refuse = nil
			if p := backgroundConnectionOf(t, s); p == own {
				t.Error("a while after the refusal the background work still ran on the session's own connection")
			}
		})
	}
}

// Background work that loses its connection runs on the session's own, and
// the next opens another background connection.
func TestDoBackgroundMail_ALostConnectionFallsBackToTheSessionsOwn(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	own := ownConnection(t, s)
	lost := backgroundConnectionOf(t, s)

	var ranOn []provider.MailProvider
	err := s.DoBackgroundMail(context.Background(), func(p provider.MailProvider) error {
		ranOn = append(ranOn, p)
		if p == lost {
			return errors.New("read tcp: connection reset by peer")
		}
		return nil
	})
	if err != nil || len(ranOn) != 2 || ranOn[1] != own {
		t.Fatalf("answered %v after running on %d connections; want it run again on the session's own", err, len(ranOn))
	}
	if p := backgroundConnectionOf(t, s); p == lost || p == own {
		t.Error("the next background work did not open another connection")
	}
	if _, _, open, _ := c.counts(); open != 2 {
		t.Errorf("%d connections open, want 2", open)
	}
}

// A session that gives up on no connection holds two at most, its own and the
// background one, however much of each kind of work it does at once, and
// however often the background one is closed and opened again.
func TestDoBackgroundMail_NeverMoreThanTwoConnections(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	s.manager.backgroundIdle = 5 * time.Millisecond

	work := func(provider.MailProvider) error {
		time.Sleep(time.Millisecond)
		return nil
	}
	const rounds = 4
	for round := 0; round < rounds; round++ {
		var wg sync.WaitGroup
		for i := 0; i < 8; i++ {
			wg.Add(2)
			go func() {
				defer wg.Done()
				for j := 0; j < 5; j++ {
					s.DoBackgroundMail(context.Background(), work)
				}
			}()
			go func() {
				defer wg.Done()
				for j := 0; j < 5; j++ {
					s.DoMail(work)
				}
			}()
		}
		wg.Wait()
		eventually(t, "the background connection to idle out", func() bool {
			_, _, open, _ := c.counts()
			return open == 1
		})
	}

	if _, opened, _, mostOpen := c.counts(); mostOpen > 2 || opened != 1+rounds {
		t.Errorf("at most %d connections were open at once, of %d opened; want 2 at most, of the session's own and one background connection a round", mostOpen, opened)
	}
}

// A session that gives up on its own connection while a command is in flight
// on it (the browser went away) closes it once the command returns. Until
// then it counts: the session's own work takes the idle background
// connection rather than open a third, and background work opens none.
func TestDoBackgroundMail_AConnectionGivenUpOnStillCounts(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	own := ownConnection(t, s)
	background := backgroundConnectionOf(t, s)

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
	if err := <-given; !errors.Is(err, context.Canceled) {
		t.Fatalf("the request given up on answered %v", err)
	}

	if p := ownConnection(t, s); p != background {
		t.Error("the session opened a connection of its own beside the one it gave up on and the idle background one")
	}
	if p := backgroundConnectionOf(t, s); p != background {
		t.Error("background work opened a connection beside the one given up on")
	}
	if _, opened, _, mostOpen := c.counts(); opened != 2 || mostOpen != 2 {
		t.Errorf("opened %d, at most %d at once; want 2", opened, mostOpen)
	}

	close(finish)
	eventually(t, "the connection given up on to close", func() bool {
		_, _, open, _ := c.counts()
		return open == 1
	})
	if p := backgroundConnectionOf(t, s); p == own || p == background {
		t.Error("background work did not open a connection once the one given up on was closed")
	}
}

// The session's own work does not wait for background work, nor for the
// command it gave up on: when it gives up on its own connection while the
// background one is busy, it opens its own beside the two, and holds three
// until one of those commands returns. The busy background connection is
// closed once its work returns, while the one given up on is still open, and
// none is opened until that one has closed too.
func TestDoBackgroundMail_AConnectionGivenUpOnBesideBusyBackgroundWork(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	own := ownConnection(t, s)
	background := backgroundConnectionOf(t, s)

	backgroundBusy, backgroundFinish := make(chan struct{}), make(chan struct{})
	backgroundDone := make(chan error, 1)
	go func() {
		backgroundDone <- s.DoBackgroundMail(context.Background(), func(provider.MailProvider) error {
			close(backgroundBusy)
			<-backgroundFinish
			return nil
		})
	}()
	<-backgroundBusy

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
	if err := <-given; !errors.Is(err, context.Canceled) {
		t.Fatalf("the request given up on answered %v", err)
	}

	next := ownConnection(t, s)
	if next == own || next == background {
		t.Fatal("the session's own work waited for a connection that was busy")
	}
	if _, opened, open, _ := c.counts(); opened != 3 || open != 3 {
		t.Fatalf("opened %d, open %d; want the session's new connection beside the busy two", opened, open)
	}

	close(backgroundFinish)
	if err := <-backgroundDone; err != nil {
		t.Fatal(err)
	}
	if _, _, open, _ := c.counts(); open != 2 {
		t.Errorf("%d open once the background work returned; want its connection closed while the one given up on is still open", open)
	}
	if p := backgroundConnectionOf(t, s); p != next {
		t.Error("background work opened a connection beside the one given up on")
	}

	close(finish)
	eventually(t, "the connection given up on to close", func() bool {
		_, _, open, _ := c.counts()
		return open == 1
	})
	if p := backgroundConnectionOf(t, s); p == next || p == background {
		t.Error("background work did not open a connection once the one given up on was closed")
	}
	if _, opened, open, mostOpen := c.counts(); opened != 4 || open != 2 || mostOpen != 3 {
		t.Errorf("opened %d, open %d, at most %d at once; want 4, 2 and 3", opened, open, mostOpen)
	}
}

// A session whose connection the server dropped, and that the server will
// not let open another, carries on with its background connection rather
// than sign the user out.
func TestDoMailWithContext_ARefusedReconnectTakesTheBackgroundConnection(t *testing.T) {
	c := mailConnections{}
	s := newBackgroundSession(t, &c)
	own := ownConnection(t, s)
	background := backgroundConnectionOf(t, s)
	c.refuse = func(int) error {
		return loginRefused(imap.ResponseCodeLimit, "Maximum connections reached")
	}

	var ranOn []provider.MailProvider
	err := s.DoMail(func(p provider.MailProvider) error {
		ranOn = append(ranOn, p)
		if p == own {
			return errors.New("read tcp: connection reset by peer")
		}
		return nil
	})
	if err != nil || len(ranOn) != 2 || ranOn[1] != background {
		t.Fatalf("answered %v after running on %d connections; want it run again on the background one", err, len(ranOn))
	}
	select {
	case <-s.closed:
		t.Fatalf("the session ended (%s)", s.endReason)
	default:
	}
}

// busyBackgroundWork starts background work on s that runs until finish is
// closed, and returns once it runs. Its result lands on the channel returned.
func busyBackgroundWork(t *testing.T, s *Session, finish <-chan struct{}) <-chan error {
	t.Helper()
	busy, done := make(chan struct{}), make(chan error, 1)
	go func() {
		done <- s.DoBackgroundMail(context.Background(), func(provider.MailProvider) error {
			close(busy)
			<-finish
			return nil
		})
	}()
	<-busy
	return done
}

// refuseForTheLimit has the mail server refuse every connection from now on,
// for the account's connection limit.
func refuseForTheLimit(c *mailConnections) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.refuse = func(int) error {
		return loginRefused(imap.ResponseCodeLimit, "Maximum connections reached")
	}
}

// A session whose own connection is gone, and that the server will not let
// open another, carries on with its background connection when that is busy
// too: it waits for the work running there to return, rather than sign the
// user out while it holds a connection, and holds two at most meanwhile.
// Whether the server dropped its own connection, or the session gave up on it
// mid-command.
func TestDoMailWithContext_ARefusedConnectionWaitsForBusyBackgroundWork(t *testing.T) {
	for _, lost := range []string{"dropped", "given up on"} {
		t.Run(lost, func(t *testing.T) {
			var c mailConnections
			s := newBackgroundSession(t, &c)
			own := ownConnection(t, s)
			background := backgroundConnectionOf(t, s)
			backgroundFinish := make(chan struct{})
			backgroundDone := busyBackgroundWork(t, s, backgroundFinish)

			givenUpFinish := make(chan struct{})
			defer close(givenUpFinish)
			if lost == "given up on" {
				ctx, cancel := context.WithCancel(context.Background())
				busy := make(chan struct{})
				given := make(chan error, 1)
				go func() {
					given <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
						close(busy)
						<-givenUpFinish
						return nil
					})
				}()
				<-busy
				cancel()
				if err := <-given; !errors.Is(err, context.Canceled) {
					t.Fatalf("the request given up on answered %v", err)
				}
			}
			refuseForTheLimit(&c)

			var ranOn []provider.MailProvider
			done := make(chan error, 1)
			go func() {
				done <- s.DoMail(func(p provider.MailProvider) error {
					ranOn = append(ranOn, p)
					if p == own {
						return errors.New("read tcp: connection reset by peer")
					}
					return nil
				})
			}()
			eventually(t, "the server to refuse a connection", func() bool {
				dials, _, _, _ := c.counts()
				return dials == 3
			})
			select {
			case err := <-done:
				select {
				case <-s.closed:
					t.Fatalf("the session ended (%s) while work ran on its background connection: %v", s.endReason, err)
				default:
					t.Fatalf("the session's own work answered %v while its background connection was busy", err)
				}
			case <-time.After(100 * time.Millisecond):
			}

			close(backgroundFinish)
			if err := <-backgroundDone; err != nil {
				t.Fatal(err)
			}
			if err := <-done; err != nil || len(ranOn) == 0 || ranOn[len(ranOn)-1] != background {
				t.Fatalf("answered %v after running on %d connections; want it run on the background one once its work returned", err, len(ranOn))
			}
			select {
			case <-s.closed:
				t.Fatalf("the session ended (%s)", s.endReason)
			default:
			}
			if p := ownConnection(t, s); p != background {
				t.Error("the session's next work did not run on the connection it took")
			}
			if p := backgroundConnectionOf(t, s); p != background {
				t.Error("background work did not run on the session's connection, the only one the server lets it hold")
			}
			if _, opened, _, mostOpen := c.counts(); opened != 2 || mostOpen != 2 {
				t.Errorf("opened %d, at most %d at once; want 2", opened, mostOpen)
			}
		})
	}
}

// A request given up on while it waits for the busy background connection
// does not end the session either, and the session's next work takes that
// connection once the work running there has returned.
func TestDoMailWithContext_ARequestGivenUpOnWhileItWaitsForTheBackgroundConnection(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	own := ownConnection(t, s)
	background := backgroundConnectionOf(t, s)
	backgroundFinish := make(chan struct{})
	backgroundDone := busyBackgroundWork(t, s, backgroundFinish)
	refuseForTheLimit(&c)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan error, 1)
	go func() {
		done <- s.DoMailWithContext(ctx, func(p provider.MailProvider) error {
			if p == own {
				return errors.New("read tcp: connection reset by peer")
			}
			return nil
		})
	}()
	eventually(t, "the server to refuse a connection", func() bool {
		dials, _, _, _ := c.counts()
		return dials == 3
	})
	cancel()
	if err := <-done; !errors.Is(err, context.Canceled) {
		t.Fatalf("the request given up on answered %v", err)
	}
	select {
	case <-s.closed:
		t.Fatalf("a request given up on ended the session (%s)", s.endReason)
	default:
	}

	close(backgroundFinish)
	if err := <-backgroundDone; err != nil {
		t.Fatal(err)
	}
	if p := ownConnection(t, s); p != background {
		t.Error("the session's next work did not take the background connection")
	}
	if _, opened, open, mostOpen := c.counts(); opened != 2 || open != 1 || mostOpen != 2 {
		t.Errorf("opened %d, open %d, at most %d at once; want 2, 1 and 2", opened, open, mostOpen)
	}
}

// A password change that waits for the busy background connection, and the
// session's own work that waits for it after the server refused it another,
// do not wait for each other: the work runs on that connection once the
// operation there has returned, and the password change after it.
func TestUpdatePassword_AndTheSessionsOwnWorkBothWaitingForTheBackgroundConnection(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	own := ownConnection(t, s)
	background := backgroundConnectionOf(t, s)
	backgroundFinish := make(chan struct{})
	backgroundDone := busyBackgroundWork(t, s, backgroundFinish)

	changed := make(chan error, 1)
	go func() { changed <- s.manager.UpdatePassword(s, "new") }()
	time.Sleep(50 * time.Millisecond)

	refuseForTheLimit(&c)
	var ranOn provider.MailProvider
	done := make(chan error, 1)
	go func() {
		done <- s.DoMail(func(p provider.MailProvider) error {
			if p == own {
				return errors.New("read tcp: connection reset by peer")
			}
			ranOn = p
			return nil
		})
	}()
	eventually(t, "the session's own work to wait for the background connection", func() bool {
		s.background.mu.Lock()
		defer s.background.mu.Unlock()
		return s.background.claim != nil
	})
	c.mu.Lock()
	c.refuse = nil
	c.mu.Unlock()
	close(backgroundFinish)

	timeout := time.After(2 * time.Second)
	for _, ch := range []<-chan error{backgroundDone, done, changed} {
		select {
		case err := <-ch:
			if err != nil {
				t.Fatal(err)
			}
		case <-timeout:
			t.Fatal("the session's own work and the password change waited for each other")
		}
	}
	if ranOn != background {
		t.Error("the session's own work did not run on the background connection")
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.mostOpen != 2 || c.passwords[len(c.passwords)-1] != "new" {
		t.Errorf("at most %d connections at once, the last signed in with %q; want 2, and the new password", c.mostOpen, c.passwords[len(c.passwords)-1])
	}
}

// A reconnect refused for anything but the connection limit still ends the
// session, as it did before it had a background connection: a password
// changed or revoked meanwhile is not carried on with by the connection that
// signed in with the old one.
func TestDoMailWithContext_AReconnectRefusedTheSignInEndsTheSession(t *testing.T) {
	for _, refusal := range []struct {
		name string
		err  error
	}{
		{"the password", loginRefused(imap.ResponseCodeAuthenticationFailed, "Invalid credentials")},
		{"an expired account", loginRefused(imap.ResponseCodeExpired, "Password expired")},
		{"the dial", errors.New("dial tcp 127.0.0.1:993: connect: connection refused")},
	} {
		t.Run(refusal.name, func(t *testing.T) {
			c := mailConnections{}
			s := newBackgroundSession(t, &c)
			own := ownConnection(t, s)
			background := backgroundConnectionOf(t, s)
			c.refuse = func(int) error { return refusal.err }

			var ranOn []provider.MailProvider
			err := s.DoMail(func(p provider.MailProvider) error {
				ranOn = append(ranOn, p)
				if p == own {
					return errors.New("read tcp: connection reset by peer")
				}
				return nil
			})
			if !errors.Is(err, ErrMailProviderUnavailable) || len(ranOn) != 1 {
				t.Errorf("answered %v after running on %d connections; want the reconnect refused, and no second run", err, len(ranOn))
			}
			for _, p := range ranOn {
				if p == background {
					t.Error("the session took its background connection for a reconnect the server refused the sign-in of")
				}
			}
			select {
			case <-s.closed:
				if s.endReason != "mail-server-unavailable" {
					t.Errorf("the session ended for %q", s.endReason)
				}
			default:
				t.Error("the session went on after its reconnect was refused")
			}
		})
	}
}

// loginRefused is a sign-in the mail server answered NO, with code, as the
// IMAP provider reports it.
func loginRefused(code imap.ResponseCode, text string) error {
	return provider.AuthError{Cause: &imap.Error{Type: imap.StatusResponseTypeNo, Code: code, Text: text}}
}

// A new password closes the background connection, which signed in with the
// old one, and the next background work signs in with the new one.
func TestUpdatePassword_ClosesTheBackgroundConnection(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	old := backgroundConnectionOf(t, s)

	if err := s.manager.UpdatePassword(s, "new"); err != nil {
		t.Fatal(err)
	}
	if _, _, open, mostOpen := c.counts(); open != 1 || mostOpen != 2 {
		t.Errorf("open %d, at most %d at once; want the new connection only, and 2 at most", open, mostOpen)
	}
	if p := backgroundConnectionOf(t, s); p == old {
		t.Error("the background connection signed in with the old password is still used")
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if last := c.passwords[len(c.passwords)-1]; last != "new" {
		t.Errorf("the background connection signed in with %q", last)
	}
}

// A session that ends closes its background connection, at once when it is
// idle and once its work has returned when it is not, and opens no other.
func TestDoBackgroundMail_TheSessionsEndClosesIt(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	backgroundConnectionOf(t, s)

	busy, finish := make(chan struct{}), make(chan struct{})
	done := make(chan error, 1)
	go func() {
		done <- s.DoBackgroundMail(context.Background(), func(provider.MailProvider) error {
			close(busy)
			<-finish
			return nil
		})
	}()
	<-busy
	s.teardown()
	if _, _, open, _ := c.counts(); open != 1 {
		t.Fatalf("%d open while the background work runs, want it alone", open)
	}
	close(finish)
	<-done
	if _, _, open, _ := c.counts(); open != 0 {
		t.Errorf("%d connections open after the session ended", open)
	}
}

// With background connections turned off, background work runs on the
// session's own connection, and no other is opened.
func TestDoBackgroundMail_TurnedOffUsesTheSessionsOwn(t *testing.T) {
	var c mailConnections
	s := newBackgroundSession(t, &c)
	s.manager.backgroundConnections = false
	own := ownConnection(t, s)
	if p := backgroundConnectionOf(t, s); p != own {
		t.Error("background work ran on another connection")
	}
	if _, opened, _, _ := c.counts(); opened != 1 {
		t.Errorf("%d connections opened, want 1", opened)
	}
}
