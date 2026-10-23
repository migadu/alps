package alps

import (
	"context"
	"errors"
	"io"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/mock"
)

// connectionCounter counts the connections a session opens and closes.
type connectionCounter struct {
	opened, closed atomic.Int32
	// dial, unless nil, is called as each connection is opened.
	dial func()
}

// newCountedSession is a session whose mail connections c counts.
func newCountedSession(t *testing.T, c *connectionCounter) *Session {
	t.Helper()
	sm := newSessionManager(func(string, string) (provider.MailProvider, error) {
		if c.dial != nil {
			c.dial()
		}
		c.opened.Add(1)
		p := &provider.MockProvider{}
		p.On("Close").Return(nil).Run(func(mock.Arguments) { c.closed.Add(1) })
		return p, nil
	}, nil, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	return &Session{manager: sm, closed: make(chan struct{}), username: "u", password: "p"}
}

// holdConnection keeps s's connection busy until the returned func is called.
func holdConnection(t *testing.T, s *Session) (release func()) {
	t.Helper()
	busy, done, finished := make(chan struct{}), make(chan struct{}), make(chan struct{})
	go func() {
		defer close(finished)
		s.DoMail(func(provider.MailProvider) error {
			close(busy)
			<-done
			return nil
		})
	}()
	<-busy
	return func() {
		close(done)
		<-finished
	}
}

// A request the browser gave up on while it waited for the connection has no
// one to answer. It used to do its whole mail operation anyway, while the
// requests behind it waited, and then close the connection.
func TestDoMailWithContext_ARequestGivenUpWhileWaitingDoesNoMailWork(t *testing.T) {
	var conns connectionCounter
	s := newCountedSession(t, &conns)
	s.DoMail(func(provider.MailProvider) error { return nil }) // connected
	release := holdConnection(t, s)

	ctx, cancel := context.WithCancel(context.Background())
	ran := make(chan struct{})
	result := make(chan error, 1)
	go func() {
		result <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
			close(ran)
			return nil
		})
	}()
	time.Sleep(50 * time.Millisecond) // it waits for the connection
	cancel()
	release()

	if err := <-result; !errors.Is(err, context.Canceled) {
		t.Errorf("the request given up on returned %v, want it cancelled", err)
	}
	select {
	case <-ran:
		t.Error("the mail operation of a request given up on ran anyway")
	case <-time.After(200 * time.Millisecond):
	}
	s.DoMail(func(provider.MailProvider) error { return nil })
	if opened, closed := conns.opened.Load(), conns.closed.Load(); opened != 1 || closed != 0 {
		t.Errorf("the session opened %d connections and closed %d, want the one it had kept open", opened, closed)
	}
}

// A request given up on while its mail operation runs lets the operation
// finish, and the connection stays open for the next request. It used to be
// closed, and the next request had to open and sign in to a new one, with
// nothing the old one had learned: this could feed on itself, each slow
// request making the next one slower.
func TestDoMailWithContext_ARequestGivenUpDuringItsOperationKeepsTheConnection(t *testing.T) {
	var conns connectionCounter
	s := newCountedSession(t, &conns)

	ctx, cancel := context.WithCancel(context.Background())
	running, proceed := make(chan struct{}), make(chan struct{})
	result := make(chan error, 1)
	go func() {
		result <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
			close(running)
			<-proceed
			return nil
		})
	}()
	<-running
	cancel()
	select {
	case err := <-result:
		t.Errorf("the request returned %v while its operation still held the connection", err)
		close(proceed)
	case <-time.After(100 * time.Millisecond):
		close(proceed)
		if err := <-result; err != nil {
			t.Errorf("the operation finished, and its request returned %v", err)
		}
	}

	s.DoMail(func(provider.MailProvider) error { return nil })
	if opened, closed := conns.opened.Load(), conns.closed.Load(); opened != 1 || closed != 0 {
		t.Errorf("the session opened %d connections and closed %d, want the first one still open", opened, closed)
	}
}

// An operation that goes on long after its request was given up on, as on a
// connection that no longer answers, is not waited for without end: the
// connection is let go, closed once the operation returns, and the next
// request opens another.
func TestDoMailWithContext_AnOperationLongAfterItsRequestLetsTheConnectionGo(t *testing.T) {
	var conns connectionCounter
	s := newCountedSession(t, &conns)
	s.manager.abandonedWait = 50 * time.Millisecond

	ctx, cancel := context.WithCancel(context.Background())
	running, proceed := make(chan struct{}), make(chan struct{})
	result := make(chan error, 1)
	go func() {
		result <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
			close(running)
			<-proceed
			return nil
		})
	}()
	<-running
	cancel()
	select {
	case err := <-result:
		if !errors.Is(err, context.Canceled) {
			t.Errorf("the request returned %v, want it cancelled", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("the request waited on for an operation that does not finish")
	}

	s.DoMail(func(provider.MailProvider) error { return nil })
	if opened := conns.opened.Load(); opened != 2 {
		t.Errorf("the session opened %d connections, want a second one", opened)
	}
	if closed := conns.closed.Load(); closed != 0 {
		t.Errorf("the connection was closed under its running operation")
	}
	close(proceed)
	deadline := time.Now().Add(2 * time.Second)
	for conns.closed.Load() != 1 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if closed := conns.closed.Load(); closed != 1 {
		t.Errorf("once its operation returned, %d connections were closed, want the one let go", closed)
	}
}

// A request given up on while the connection was opened for it does no mail
// work either, and leaves the connection open for the next request.
func TestDoMailWithContext_ARequestGivenUpWhileConnectingDoesNoMailWork(t *testing.T) {
	var conns connectionCounter
	connecting, proceed := make(chan struct{}), make(chan struct{})
	var first sync.Once
	conns.dial = func() {
		first.Do(func() {
			close(connecting)
			<-proceed
		})
	}
	s := newCountedSession(t, &conns)

	ctx, cancel := context.WithCancel(context.Background())
	ran := make(chan struct{})
	result := make(chan error, 1)
	go func() {
		result <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
			close(ran)
			return nil
		})
	}()
	<-connecting
	cancel()
	close(proceed)

	if err := <-result; !errors.Is(err, context.Canceled) {
		t.Errorf("the request given up on returned %v, want it cancelled", err)
	}
	select {
	case <-ran:
		t.Error("the mail operation of a request given up on while it connected ran anyway")
	default:
	}
	s.DoMail(func(provider.MailProvider) error { return nil })
	if opened, closed := conns.opened.Load(), conns.closed.Load(); opened != 1 || closed != 0 {
		t.Errorf("the session opened %d connections and closed %d, want the one opened for the request given up on kept", opened, closed)
	}
}

// An operation that fails on the network after its request was given up on
// is not tried again on a new connection: no one waits for the answer. The
// failed connection is closed, and the next request opens another.
func TestDoMailWithContext_ARequestGivenUpIsNotRetried(t *testing.T) {
	var conns connectionCounter
	s := newCountedSession(t, &conns)

	ctx, cancel := context.WithCancel(context.Background())
	running, proceed := make(chan struct{}), make(chan struct{})
	calls := 0
	result := make(chan error, 1)
	go func() {
		result <- s.DoMailWithContext(ctx, func(provider.MailProvider) error {
			calls++
			if calls == 1 {
				close(running)
				<-proceed
			}
			return io.EOF
		})
	}()
	<-running
	cancel()
	close(proceed)

	if err := <-result; !errors.Is(err, io.EOF) {
		t.Errorf("the request returned %v, want its operation's network error", err)
	}
	if calls != 1 {
		t.Errorf("the operation of a request given up on ran %d times, want once", calls)
	}
	if opened, closed := conns.opened.Load(), conns.closed.Load(); opened != 1 || closed != 1 {
		t.Errorf("the session opened %d connections and closed %d, want the failed one closed and no other opened", opened, closed)
	}
	s.DoMail(func(provider.MailProvider) error { return nil })
	if opened := conns.opened.Load(); opened != 2 {
		t.Errorf("the next request found %d connections opened, want a new one", opened)
	}
}

// Work that finishes something already done, such as filing a message the
// SMTP server has taken, is done although its request was given up on before
// its turn, and tried again after a network error. It still lets the
// connection go once it runs on long after its request was given up on.
func TestFinishMail_RunsForARequestGivenUpOn(t *testing.T) {
	var conns connectionCounter
	s := newCountedSession(t, &conns)
	s.manager.abandonedWait = 50 * time.Millisecond
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	calls := 0
	err := s.FinishMail(ctx, func(provider.MailProvider) error {
		calls++
		if calls == 1 {
			return io.EOF
		}
		return nil
	})
	if err != nil || calls != 2 {
		t.Errorf("the work ran %d times and returned %v, want it done on a second connection", calls, err)
	}

	proceed := make(chan struct{})
	defer close(proceed)
	result := make(chan error, 1)
	go func() {
		result <- s.FinishMail(ctx, func(provider.MailProvider) error {
			<-proceed
			return nil
		})
	}()
	select {
	case err := <-result:
		if !errors.Is(err, context.Canceled) {
			t.Errorf("the work that did not finish returned %v, want it cancelled", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("work for a request given up on held the connection without end")
	}
}
