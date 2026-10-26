package alps

import (
	"context"
	"errors"
	"io"
	"testing"

	"github.com/migadu/alps/provider"
)

// A handler may have obtained its Session before another request ended it,
// or its idle timer ran out, and enter DoMail only after teardown finished.
// That work still runs; a connection it opens has no teardown left to close it.
func TestMailAfterTeardownDoesNotRetainAConnection(t *testing.T) {
	for _, explicit := range []bool{false, true} {
		name := "natural expiry"
		if explicit {
			name = "explicit close"
		}
		t.Run(name, func(t *testing.T) {
			for _, finish := range []bool{false, true} {
				name := "ordinary work"
				if finish {
					name = "finishing mail already sent"
				}
				t.Run(name, func(t *testing.T) {
					c := &mailConnections{}
					s := newBackgroundSession(t, c)
					resume, done := make(chan struct{}), make(chan error, 1)
					calls := 0
					go func(held *Session) {
						<-resume
						work := func(provider.MailProvider) error {
							calls++
							if finish && calls == 1 {
								return io.EOF
							}
							return nil
						}
						if finish {
							ctx, cancel := context.WithCancel(context.Background())
							cancel()
							done <- held.FinishMail(ctx, work)
						} else {
							done <- held.DoMail(work)
						}
					}(s)
					if explicit {
						s.CloseWithReason("mail-server-unavailable")
					}
					s.teardown()
					close(resume)
					err := <-done
					s.teardown() // its once-only cleanup has already finished
					_, opened, open, _ := c.counts()
					// Clean up a leaked connection if this regression fails.
					s.providerLocker.Lock()
					if s.provider != nil {
						s.provider.Close()
						s.provider = nil
					}
					s.providerLocker.Unlock()
					wantCalls, wantOpened := 1, 2
					if finish {
						wantCalls, wantOpened = 2, 3
					}
					if err != nil || calls != wantCalls || opened != wantOpened || open != 0 {
						t.Fatalf("late work err=%v calls=%d opened=%d open=%d; want successful work, %d calls, %d opened, none retained", err, calls, opened, open, wantCalls, wantOpened)
					}
				})
			}
		})
	}
}

// Closing a session must not close its provider while an operation is using
// it. The operation finishes and releases the connection before teardown ends.
func TestMailFinishingAsSessionClosesKeepsItsConnectionUntilDone(t *testing.T) {
	c := &mailConnections{}
	s := newBackgroundSession(t, c)
	running, proceed, result := make(chan struct{}), make(chan struct{}), make(chan error, 1)
	go func() {
		result <- s.DoMail(func(provider.MailProvider) error { close(running); <-proceed; return nil })
	}()
	<-running
	s.CloseWithReason("closed")
	tornDown := make(chan struct{})
	go func() { s.teardown(); close(tornDown) }()
	_, _, open, _ := c.counts()
	if open != 1 {
		t.Errorf("connection closed while operation running: %d", open)
	}
	close(proceed)
	if err := <-result; err != nil {
		t.Fatal(err)
	}
	<-tornDown
	_, _, open, _ = c.counts()
	if open != 0 {
		t.Errorf("closed session retained %d connections", open)
	}
}

// A late FinishMail whose request was given up on may itself be abandoned
// while its command is still in flight. That detached connection belongs to
// giveUpConnection until the command returns, not to doMail's deferred cleanup.
func TestFinishMailAfterTeardownClosesAnAbandonedConnectionOnlyWhenDone(t *testing.T) {
	for _, explicit := range []bool{false, true} {
		name := "natural expiry"
		if explicit {
			name = "explicit close"
		}
		t.Run(name, func(t *testing.T) {
			c := &mailConnections{}
			s := newBackgroundSession(t, c)
			if explicit {
				s.CloseWithReason("closed")
			}
			s.teardown()
			ctx, cancel := context.WithCancel(context.Background())
			cancel()
			proceed := make(chan struct{})
			err := s.FinishMail(ctx, func(provider.MailProvider) error { <-proceed; return nil })
			if !errors.Is(err, context.Canceled) {
				t.Fatalf("late FinishMail err=%v", err)
			}
			_, _, open, _ := c.counts()
			if open != 1 {
				t.Errorf("connection closed under abandoned operation: %d", open)
			}
			close(proceed)
			eventually(t, "late FinishMail connection released", func() bool { _, _, open, _ := c.counts(); return open == 0 })
		})
	}
}

// A password change accepted elsewhere may finish updating its session after
// teardown. Preserve its success and new password, but do not retain the
// verification connection on the ended session.
func TestPasswordUpdateAfterTeardownDoesNotRetainAConnection(t *testing.T) {
	for _, explicit := range []bool{false, true} {
		name := "natural expiry"
		if explicit {
			name = "explicit close"
		}
		t.Run(name, func(t *testing.T) {
			c := &mailConnections{}
			s := newBackgroundSession(t, c)
			if explicit {
				s.CloseWithReason("closed")
			}
			s.teardown()
			err := s.manager.UpdatePasswordContext(context.Background(), s, "new accepted password")
			_, opened, open, _ := c.counts()
			s.providerLocker.Lock()
			if s.provider != nil {
				s.provider.Close()
				s.provider = nil
			}
			s.providerLocker.Unlock()
			if err != nil || s.password != "new accepted password" || opened != 2 || open != 0 {
				t.Fatalf("late password update err=%v passwordUpdated=%v opened=%d open=%d; want accepted change, new connection, none retained", err, s.password == "new accepted password", opened, open)
			}
		})
	}
}
