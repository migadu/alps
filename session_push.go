package alps

import (
	"strings"
	"sync"
	"time"

	"github.com/migadu/alps/provider"
)

// A page learns of new mail by asking: it checks for it every few minutes
// (the poll). With push on ([server] push_new_mail), a session also waits for
// the mail server's news of the Inbox (IMAP IDLE, RFC 2177) while one of its
// pages holds an event stream open (WatchInbox), and tells the page as the
// news comes, which then checks at once. The poll goes on beside it: for the
// folders other than the Inbox, and for when there is no news to be had.
//
// The IDLE runs on the session's background connection (see
// DoBackgroundMail), one for the session however many of its pages watch, and
// only while one does. The connection stays busy meanwhile, so the idle close
// does not apply until the last watch stops. Background work does not wait
// for the IDLE: it ends the IDLE (DONE), runs, and the IDLE begins again once
// the connection has gone unused for pushResumeAfter, so that a run of work
// does not have the IDLE ended and begun around each piece of it. The IDLE is
// begun again every pushRestartAfter too, within RFC 2177's 29 minutes.
//
// A server without IDLE gets no push, and the watches are told so. A lost or
// refused connection is never the session's failure, as for any background
// work: the watches go without news, the pages poll, and the IDLE is tried
// again, after twice pushRetryAfter, and twice as long after each failure
// in a row, up to 64 times pushRetryAfter, about half an hour (see
// idleFailed).
const (
	pushRestartAfter = 25 * time.Minute
	pushResumeAfter  = time.Second
	pushRetryAfter   = 30 * time.Second
)

// pushMailbox is the mailbox a session waits for news of.
const pushMailbox = "INBOX"

// InboxEvent is news of the Inbox for a page: see WatchInbox.
type InboxEvent int

const (
	// InboxWatched says the session waits for the mail server's news of the
	// Inbox from now on. What changed before was not heard: a page checks.
	InboxWatched InboxEvent = iota + 1
	// InboxChanged says a message arrived in the Inbox or went from it. A
	// flag changed is no news (see provider.Idler).
	InboxChanged
	// InboxUnwatchable says the mail server cannot tell of changes (it has no
	// IDLE). It is the last event of a watch.
	InboxUnwatchable
)

func (ev InboxEvent) String() string {
	switch ev {
	case InboxWatched:
		return "watched"
	case InboxChanged:
		return "changed"
	case InboxUnwatchable:
		return "unwatchable"
	}
	return "unknown"
}

// InboxWatch is a page's watch of the Inbox: see WatchInbox.
type InboxWatch struct {
	// C carries the news, and is closed when the watch ends: when it is
	// stopped, after InboxUnwatchable, and when the session ends.
	C    <-chan InboxEvent
	stop func()
}

// Stop ends the watch. The session's IDLE ends with its last watch.
func (w *InboxWatch) Stop() {
	w.stop()
}

// inboxPush is a session's watches of the Inbox and the IDLE that serves them.
type inboxPush struct {
	mu       sync.Mutex
	watchers map[chan InboxEvent]struct{}
	running  bool // runInboxPush is running
	ended    bool // the session has ended, or the server is shutting down
	// The mail server cannot IDLE: watches are told so, and none is kept.
	unwatchable bool
	// The connection the watchers were last told an IDLE began on, or nil
	// when none has since the last was lost, or since the watches began.
	watching provider.MailProvider
	// Closed to end the IDLE running now; nil when none runs. interrupted
	// keeps an interrupt that came while none ran, for the IDLE about to
	// begin: it has taken the connection already (see idleInbox).
	stop        chan struct{}
	interrupted bool
	// failures counts the IDLEs that failed since one last began, for the
	// pause before the next (see idleFailed).
	failures int
	// Background operations waiting for the connection, or running on it, and
	// when the last of them returned.
	wanted   int
	lastDone time.Time
	// kick wakes runInboxPush to look again.
	kick chan struct{}
}

// tell gives every watch ev. A watch with news it has not read yet is due to
// check anyway, so news it has no room for is let go. The caller holds mu.
func (w *inboxPush) tell(ev InboxEvent) {
	for ch := range w.watchers {
		select {
		case ch <- ev:
		default:
		}
	}
}

// tellLast gives every watch ev as its last event, and ends the watches. The
// last word is never let go for want of room: unread news makes way for it.
// The caller holds mu, and no other sends to a watch meanwhile.
func (w *inboxPush) tellLast(ev InboxEvent) {
	for ch := range w.watchers {
		for sent := false; !sent; {
			select {
			case ch <- ev:
				sent = true
			default:
				select {
				case <-ch:
				default:
				}
			}
		}
		close(ch)
	}
	w.watchers = nil
}

// interruptLocked ends the IDLE running now, if one is. The caller holds mu.
func (w *inboxPush) interruptLocked() {
	if w.stop != nil {
		close(w.stop)
		w.stop = nil
	}
}

func (w *inboxPush) kickLocked() {
	if w.kick == nil {
		return
	}
	select {
	case w.kick <- struct{}{}:
	default:
	}
}

// interrupt ends the IDLE running now, so that its connection is free: for
// a connection the session gives up on, and for the session's own work that
// is to take the background connection over (see reclaimBackground). One
// that comes while no IDLE runs is kept for the next, which may have taken
// the connection already and not begun.
func (w *inboxPush) interrupt() {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.stop == nil {
		w.interrupted = true
	}
	w.interruptLocked()
}

// want says that a background operation waits for the connection, and ends
// the IDLE that holds it. done says it has returned.
func (w *inboxPush) want() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.wanted++
	w.interruptLocked()
}

func (w *inboxPush) done() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.wanted--
	w.lastDone = time.Now()
	w.kickLocked()
}

// end closes every watch, and keeps any from opening: the session has ended,
// or the server is shutting down.
func (w *inboxPush) end() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.ended = true
	for ch := range w.watchers {
		close(ch)
	}
	w.watchers = nil
	w.interruptLocked()
	w.kickLocked()
}

// WatchInbox has the session tell the caller of the mail server's news of
// the Inbox, for as long as the watch lasts: see inboxPush. A watch begun
// while the IDLE is up is told InboxWatched at once. With push off, the
// watch ends at once.
func (s *Session) WatchInbox() *InboxWatch {
	w := &s.push
	ch := make(chan InboxEvent, 2)
	watch := &InboxWatch{C: ch, stop: func() { s.unwatchInbox(ch) }}
	w.mu.Lock()
	defer w.mu.Unlock()
	switch {
	case w.ended || s.manager == nil || !s.manager.pushNewMail:
		close(ch)
	case w.unwatchable:
		ch <- InboxUnwatchable
		close(ch)
	default:
		if w.watchers == nil {
			w.watchers = make(map[chan InboxEvent]struct{})
		}
		w.watchers[ch] = struct{}{}
		if w.watching != nil {
			ch <- InboxWatched
		}
		if !w.running {
			if w.kick == nil {
				w.kick = make(chan struct{}, 1)
			}
			w.running = true
			go s.runInboxPush()
		}
	}
	return watch
}

func (s *Session) unwatchInbox(ch chan InboxEvent) {
	w := &s.push
	w.mu.Lock()
	defer w.mu.Unlock()
	if _, ok := w.watchers[ch]; !ok {
		return
	}
	delete(w.watchers, ch)
	close(ch)
	if len(w.watchers) == 0 {
		w.interruptLocked()
		w.kickLocked()
	}
}

// inboxNews is told what the mail server says unasked on the background
// connection (see provider.Idler.OnMailboxNews).
func (s *Session) inboxNews(mailbox string) {
	if !strings.EqualFold(mailbox, pushMailbox) {
		return
	}
	w := &s.push
	w.mu.Lock()
	defer w.mu.Unlock()
	w.tell(InboxChanged)
}

// runInboxPush is the session's IDLE, begun again after each pause, for as
// long as the session has a watch.
func (s *Session) runInboxPush() {
	var pause time.Duration
	for s.awaitIdleTurn(pause) {
		pause = s.idleInbox()
	}
}

// awaitIdleTurn waits until the IDLE may begin: pause has passed, no
// background operation wants the connection, and it has gone unused for
// pushResume since the last one. It reports false, and runInboxPush ends,
// when no watch is left or the session has ended.
func (s *Session) awaitIdleTurn(pause time.Duration) bool {
	w := &s.push
	until := time.Now().Add(pause)
	for {
		w.mu.Lock()
		if w.ended || len(w.watchers) == 0 {
			w.running = false
			w.watching = nil
			w.mu.Unlock()
			return false
		}
		wanted := w.wanted > 0
		at := until
		if resume := w.lastDone.Add(s.manager.pushResume); resume.After(at) {
			at = resume
		}
		kick := w.kick
		w.mu.Unlock()

		if wanted {
			<-kick
			continue
		}
		wait := time.Until(at)
		if wait <= 0 {
			return true
		}
		timer := time.NewTimer(wait)
		select {
		case <-kick:
		case <-timer.C:
		}
		timer.Stop()
	}
}

// idleInbox waits on the background connection in IDLE until something ends
// the wait, and answers how long to pause before the next.
func (s *Session) idleInbox() time.Duration {
	bg := &s.background
	w := &s.push
	bg.jobs.Lock()
	defer bg.jobs.Unlock()

	p := s.useBackground()
	if p == nil {
		// None to be had now: the session holds a connection it has given
		// up on, or the mail server would not open one and is not asked
		// again yet (see useBackground).
		w.mu.Lock()
		w.watching = nil
		w.mu.Unlock()
		return s.manager.pushRetry
	}
	idler, ok := p.(provider.Idler)
	if ok {
		var err error
		if ok, err = idler.CanIdle(); err != nil {
			return s.idleFailed(p, err)
		}
	}
	if !ok {
		s.doneWithBackground()
		s.manager.logger.Debugf("Push: the mail server of %s cannot IDLE; its pages poll for new mail", s.username)
		w.mu.Lock()
		w.unwatchable = true
		w.tellLast(InboxUnwatchable)
		w.mu.Unlock()
		return 0
	}
	idler.OnMailboxNews(s.inboxNews)

	w.mu.Lock()
	if w.wanted > 0 || w.interrupted || w.ended || len(w.watchers) == 0 {
		// Asked for since the turn came.
		w.interrupted = false
		w.mu.Unlock()
		s.doneWithBackground()
		return 0
	}
	stop := make(chan struct{})
	w.stop = stop
	w.mu.Unlock()

	restart := time.AfterFunc(s.manager.pushRestart, w.interrupt)
	err := idler.Idle(pushMailbox, stop, func() {
		w.mu.Lock()
		defer w.mu.Unlock()
		w.failures = 0
		if w.watching != p {
			w.watching = p
			w.tell(InboxWatched)
		}
	})
	restart.Stop()

	w.mu.Lock()
	if w.stop == stop {
		w.stop = nil
	}
	w.mu.Unlock()
	if err != nil {
		return s.idleFailed(p, err)
	}
	s.doneWithBackground()
	return 0
}

// idleFailed lets go of the connection an IDLE failed on, and answers how
// long to pause before the next, longer after each failure in a row.
//
// Only a connection that is gone is closed, as for any background work, and
// the next IDLE opens another. A refusal, a NO to SELECT or to IDLE, or
// capabilities that could not be read, says nothing against the connection:
// it is kept for the next IDLE and for the work that waits for it, and the
// session's own work that is to take it over gets it. Nobody is signed out
// for either, and what changed meanwhile is checked once the IDLE is back
// (InboxWatched).
func (s *Session) idleFailed(p provider.MailProvider, err error) time.Duration {
	w := &s.push
	w.mu.Lock()
	w.failures++
	pause := s.manager.pushRetry << min(w.failures, 6)
	w.watching = nil
	w.mu.Unlock()
	if isNetworkError(err) {
		s.dropBackground()
		p.Close()
	} else {
		s.doneWithBackground()
	}
	s.manager.logger.Debugf("Push: the IDLE of %s failed, tried again in %v: %v", s.username, pause, err)
	return pause
}

// PushNewMail reports whether sessions tell their pages of new mail as the
// mail server announces it: see Session.WatchInbox.
func (sm *SessionManager) PushNewMail() bool {
	return sm.pushNewMail
}

// endInboxWatches ends the watches of every session, for a server shutting
// down: the event streams they serve end, and the HTTP server does not wait
// for them. The pages open theirs again on the next server.
func (sm *SessionManager) endInboxWatches() {
	sm.locker.RLock()
	sessions := make([]*Session, 0, len(sm.sessions))
	for _, s := range sm.sessions {
		sessions = append(sessions, s)
	}
	sm.locker.RUnlock()
	for _, s := range sessions {
		s.push.end()
	}
}
