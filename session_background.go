package alps

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// A session does its mail work on one connection, one operation after another
// (DoMailWithContext). Work the user is not waiting for sat in that queue
// beside what they are waiting for: a check for new mail, the sender verdicts
// of the rows on screen, the search of Sent for a conversation's replies, a
// draft saved while they type, the bodies a conversation reads on its own.
// Each of them held up the message opened next, and the search of Sent left
// the connection in Sent, so the next request for the folder on screen
// selected that folder again. Such work runs on a second connection instead,
// the session's background connection, through DoBackgroundMail.
//
// Mail servers limit how many connections an account may hold (Dovecot allows
// 10 per user and address by default), and every session alps holds comes from
// alps's own address. So a session opens one background connection beside its
// own, and no more. It is opened only when background work is first asked
// for, and closed once it has gone unused for backgroundIdleTimeout. When the
// server will not open it, the work waits its turn on the session's own
// connection, as all of it did before, and the session does not ask again for
// backgroundRetryAfter. That is never the session's failure: the user is not
// signed out for it.
//
// A connection the session has given up on mid-command (the browser went
// away) stays open until that command returns, as it always has. Until then
// the session opens no background connection, closes the one it has once its
// work returns, and its own work takes an idle one rather than open another
// (see takeIdleBackground). Its own work does not wait for background work,
// though, nor for a command nobody waits for any more: while the background
// connection is busy, or still being opened, the session opens a connection
// of its own beside the two, one more than it otherwise holds, until one of
// those commands returns.
//
// The other way round, a session whose own connection is gone and that the
// server will not let open another, for the account's connection limit,
// carries on with its background connection rather than sign the user out:
// at once when it is idle, and once the work running on it has returned when
// it is busy (see reclaimBackground).
const (
	backgroundIdleTimeout = time.Minute
	backgroundRetryAfter  = 5 * time.Minute
)

// backgroundConnection is a session's background connection: see
// DoBackgroundMail.
type backgroundConnection struct {
	// jobs is held while an operation runs on the connection, so that they run
	// one at a time, as on the session's own. Where both are held, it is taken
	// before providerLocker (see UpdatePassword), and an operation that falls
	// back to the session's own connection lets go of it first. Work done
	// for a request waits for it no longer than the request does (see
	// jobLock).
	jobs jobLock

	// mu guards the fields below. It is held only to read or change them,
	// never while waiting for the mail server or for another lock.
	mu      sync.Mutex
	p       provider.MailProvider // nil when the session has none
	busy    bool                  // an operation is running on p
	idle    *time.Timer           // closes p once it has gone unused
	retire  bool                  // p is to be closed once its operation returns
	ended   bool                  // the session has ended, and opens no other
	refused time.Time             // when the mail server last did not open one

	// claim is where the session's own work waits for p to be handed over
	// once its operation returns, when the session has no connection of its
	// own and the mail server will not open one (see reclaimBackground).
	claim chan provider.MailProvider
}

// jobLock is a mutex that can be waited for until a context is done. The IDLE
// that serves a session's pages holds the background connection's for as
// long as it waits, and ends that wait for whoever asks; the server may still
// be slow to answer (see provider.Idler.Idle), and work for a request that
// has gone gives up then rather than wait on for nobody.
type jobLock struct {
	once sync.Once
	ch   chan struct{}
}

func (l *jobLock) init() {
	l.once.Do(func() { l.ch = make(chan struct{}, 1) })
}

func (l *jobLock) Lock() {
	l.init()
	l.ch <- struct{}{}
}

// LockContext takes the lock, or answers ctx's error once ctx is done first.
func (l *jobLock) LockContext(ctx context.Context) error {
	l.init()
	select {
	case l.ch <- struct{}{}:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (l *jobLock) Unlock() {
	<-l.ch
}

// stopIdle stops the timer that would close the connection. The caller holds
// mu.
func (bg *backgroundConnection) stopIdle() {
	if bg.idle != nil {
		bg.idle.Stop()
		bg.idle = nil
	}
}

// answerClaim hands p, or nil when there is none to hand over, to the
// session's own work when that waits for the connection (see
// reclaimBackground), and reports whether it did. The caller holds mu.
func (bg *backgroundConnection) answerClaim(p provider.MailProvider) bool {
	if bg.claim == nil {
		return false
	}
	bg.claim <- p
	bg.claim = nil
	return true
}

// DoBackgroundMail runs a mail operation the user is not waiting for on the
// session's background connection, so that what they are waiting for does not
// wait behind it, and the session's own connection keeps the mailbox it has
// selected. The connection is opened when it is first needed.
//
// It runs f on the session's own connection, as DoMailWithContext does, when
// background connections are turned off, when the session may not open one or
// the mail server will not, and when the connection fails under f. A
// background connection that cannot be opened does not end the session.
func (s *Session) DoBackgroundMail(ctx context.Context, f func(provider.MailProvider) error) error {
	if s.manager.backgroundConnections {
		if ran, err := s.doBackgroundMail(ctx, f); ran {
			return err
		}
	}
	return s.DoMailWithContext(ctx, f)
}

// doBackgroundMail runs f on the background connection, and reports whether it
// did. It did not when the session had no connection for it, nor when the
// connection failed under f: the caller runs f on the session's own connection
// then, whose retry covers a server that has dropped it.
func (s *Session) doBackgroundMail(ctx context.Context, f func(provider.MailProvider) error) (ran bool, err error) {
	bg := &s.background
	// An IDLE waiting on the connection ends for f, and begins again once the
	// connection has gone unused for a moment (see inboxPush).
	s.push.want()
	defer s.push.done()
	if err := bg.jobs.LockContext(ctx); err != nil {
		return true, fmt.Errorf("context cancelled: %w", err)
	}
	defer bg.jobs.Unlock()

	if err := ctx.Err(); err != nil {
		return true, fmt.Errorf("context cancelled: %w", err)
	}
	p := s.useBackground()
	if p == nil {
		return false, nil
	}

	done := make(chan error, 1)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				done <- fmt.Errorf("panic in background IMAP operation: %v", r)
			}
		}()
		done <- f(p)
	}()

	select {
	case <-ctx.Done():
		// As on the session's own connection: let go of, and closed once f
		// has returned, never while a command of f's is in flight on it.
		s.dropBackground()
		s.giveUpConnection(p, done)
		return true, fmt.Errorf("context cancelled: %w", ctx.Err())
	case err = <-done:
	}

	if err != nil && isNetworkError(err) {
		// Gone, as a connection the server has timed out is. The next
		// background operation opens another.
		s.dropBackground()
		p.Close()
		return false, nil
	}
	s.doneWithBackground()
	return true, err
}

// useBackground returns the background connection for an operation to run on,
// opening one when the session has none, or nil when it may not use one. It
// may not while it has given up on a connection that has not closed yet: that
// one still counts, and the session's own connection, which replaces it, takes
// the background one (see takeIdleBackground). The caller holds jobs.
func (s *Session) useBackground() provider.MailProvider {
	bg := &s.background
	bg.mu.Lock()
	if s.givenUp.Load() > 0 || bg.ended {
		bg.mu.Unlock()
		return nil
	}
	if bg.p != nil {
		bg.stopIdle()
		bg.busy = true
		p := bg.p
		bg.mu.Unlock()
		return p
	}
	waiting := !bg.refused.IsZero() && s.manager.now().Sub(bg.refused) < backgroundRetryAfter
	bg.mu.Unlock()
	if waiting {
		return nil
	}

	p, err := s.connect()
	if err != nil {
		bg.mu.Lock()
		bg.refused = s.manager.now()
		bg.mu.Unlock()
		s.manager.logger.Debugf("Background connection: the mail server did not open one for %s, whose background work waits on the session's own connection for %v: %v",
			s.username, backgroundRetryAfter, err)
		return nil
	}

	bg.mu.Lock()
	if s.givenUp.Load() > 0 || bg.ended {
		// The session ended, or gave up on its own connection, while this one
		// was being opened.
		bg.mu.Unlock()
		p.Close()
		return nil
	}
	bg.refused = time.Time{}
	bg.p, bg.busy = p, true
	bg.mu.Unlock()
	return p
}

// doneWithBackground has the background connection wait for the next
// operation, and closes it once it has gone unused for the manager's
// backgroundIdle. It closes it now when the session has ended or has asked
// for it to be closed, and while the session holds a connection it has given
// up on beside its own (see giveUpConnection). When the session's own work
// waits for it, having no connection of its own, it hands it over instead
// (see reclaimBackground). The caller holds jobs.
func (s *Session) doneWithBackground() {
	bg := &s.background
	bg.mu.Lock()
	bg.busy = false
	p := bg.p
	if p == nil {
		bg.answerClaim(nil)
		bg.mu.Unlock()
		return
	}
	// Readied for the session's own use only when it is handed over: the
	// news is switched off then, not after every operation.
	if !bg.ended && !bg.retire && bg.claim != nil && bg.answerClaim(ownUse(p)) {
		// The session's own connection from now on.
		bg.p = nil
		bg.mu.Unlock()
		return
	}
	if bg.ended || bg.retire || s.givenUp.Load() > 0 {
		bg.answerClaim(nil)
		bg.p, bg.retire = nil, false
		bg.mu.Unlock()
		p.Close()
		return
	}
	var idle *time.Timer
	idle = time.AfterFunc(s.manager.backgroundIdle, func() {
		// Holding jobs, so that no other is opened while this one closes.
		bg.jobs.Lock()
		defer bg.jobs.Unlock()
		bg.mu.Lock()
		// Not if it was used since, which stopped this timer or replaced it.
		if bg.idle != idle || bg.busy || bg.p != p {
			bg.mu.Unlock()
			return
		}
		bg.p, bg.idle = nil, nil
		bg.mu.Unlock()
		s.manager.logger.Debugf("Background connection: closing the one of %s, unused for %v", s.username, s.manager.backgroundIdle)
		p.Close()
	})
	bg.idle = idle
	bg.mu.Unlock()
}

// dropBackground lets go of the background connection an operation ran on,
// which the caller closes. The session's own work waiting for it gets none.
// The caller holds jobs.
func (s *Session) dropBackground() {
	bg := &s.background
	bg.mu.Lock()
	defer bg.mu.Unlock()
	bg.answerClaim(nil)
	bg.p, bg.busy, bg.retire = nil, false, false
}

// takeIdleBackground hands the session's background connection over to the
// session's own use, when it has one that no operation is running on, and
// returns it; it returns nil otherwise. A session that has to replace its own
// connection takes it rather than open another: it is signed in already, and
// the mail server may not let the account open another while it is.
func (s *Session) takeIdleBackground() provider.MailProvider {
	bg := &s.background
	bg.mu.Lock()
	defer bg.mu.Unlock()
	if bg.p == nil || bg.busy {
		return nil
	}
	bg.stopIdle()
	p := bg.p
	bg.p = nil
	return ownUse(p)
}

// ownUse readies a background connection for the session's own use: what the
// mail server says unasked on it is no news for the pages from now on (see
// WatchInbox), of the session's own moves out of the Inbox least of all.
func ownUse(p provider.MailProvider) provider.MailProvider {
	if idler, ok := p.(provider.Idler); ok {
		idler.OnMailboxNews(nil)
	}
	return p
}

// reclaimBackground hands the session's background connection over to the
// session's own use, for a session that has no connection of its own and
// that the mail server will not let open one, for the account's connection
// limit (see atConnectionLimit). When an operation is running on it, it waits
// for that operation to return: the session goes on with the connection it
// holds rather than sign the user out, and holds no more than its two
// meanwhile. It returns nil when the session has no background connection or
// the operation loses it, and ctx's error when ctx is done first, with the
// connection when it was handed over just then. The caller holds
// providerLocker.
//
// It does not wait for jobs, which is taken before providerLocker (see
// UpdatePassword), and so does not wait behind the background operations
// still to start either: the operation running hands the connection over as
// it returns (see doneWithBackground).
func (s *Session) reclaimBackground(ctx context.Context) (provider.MailProvider, error) {
	bg := &s.background
	bg.mu.Lock()
	if bg.p == nil || bg.ended {
		bg.mu.Unlock()
		return nil, nil
	}
	if !bg.busy {
		bg.stopIdle()
		p := bg.p
		bg.p = nil
		bg.mu.Unlock()
		return ownUse(p), nil
	}
	claim := make(chan provider.MailProvider, 1)
	bg.claim = claim
	bg.mu.Unlock()
	// An IDLE is never done of itself: it ends for this.
	s.push.interrupt()

	select {
	case p := <-claim:
		return p, nil
	case <-ctx.Done():
	}
	bg.mu.Lock()
	if bg.claim == claim {
		bg.claim = nil
	}
	bg.mu.Unlock()
	select {
	case p := <-claim:
		return p, ctx.Err()
	default:
		return nil, ctx.Err()
	}
}

// atConnectionLimit reports whether err is a mail server refusing a sign-in
// because the account holds as many connections as it may: RFC 5530's
// [LIMIT], which Sora answers then ("NO [LIMIT] Maximum connections
// reached"). The password is not in question then, and the background
// connection the session holds is as good as another. A refused password
// ([AUTHENTICATIONFAILED]) is not such a refusal, nor an expired account, nor
// a server that could not be reached.
func atConnectionLimit(err error) bool {
	var imapErr *imap.Error
	return errors.As(err, &imapErr) && imapErr.Code == imap.ResponseCodeLimit
}

// letGoOfBackground closes the background connection: now, or once the
// operation running on it has returned. With end, the session has ended, and
// opens none again.
func (s *Session) letGoOfBackground(end bool) {
	bg := &s.background
	bg.mu.Lock()
	if end {
		bg.ended = true
	}
	p := bg.p
	switch {
	case p == nil:
	case bg.busy:
		bg.retire = true
		p = nil
	default:
		bg.stopIdle()
		bg.p = nil
	}
	bg.mu.Unlock()
	if p != nil {
		p.Close()
	}
}

// giveUpConnection closes p, a connection the session has let go of, once the
// operation whose result lands on done has returned, so that it is never
// closed while a command is still in flight on it. Until it is closed, the
// session counts it among its connections, and uses no background connection
// beside the connection that replaces it.
func (s *Session) giveUpConnection(p provider.MailProvider, done <-chan error) {
	if p == nil {
		return
	}
	s.givenUp.Add(1)
	// An IDLE on the background connection ends, so that the connection is
	// closed, as the one of any background operation running now is.
	s.push.interrupt()
	go func() {
		<-done
		p.Close()
		s.givenUp.Add(-1)
	}()
}
