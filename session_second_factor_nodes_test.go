package alps

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
)

// These tests run two nodes over one mail server, each with its own session
// manager and the real auth middleware, the way a cluster behind a load
// balancer does: sessions live in the memory of the node that opened them, and
// the account's WebAuthn record lives on the mail server they share.

// fakeClock is a clock that moves only when the test moves it.
type fakeClock struct{ ns atomic.Int64 }

func newFakeClock() *fakeClock {
	c := &fakeClock{}
	c.ns.Store(time.Date(2026, 10, 21, 9, 0, 0, 0, time.UTC).UnixNano())
	return c
}

func (c *fakeClock) Now() time.Time          { return time.Unix(0, c.ns.Load()) }
func (c *fakeClock) Advance(d time.Duration) { c.ns.Add(int64(d)) }

// countingStore is one node's view of the mail server's store: it counts the
// reads of the account's WebAuthn record, and holds one back when asked to.
type countingStore struct {
	*rawStore
	reads   atomic.Int32
	holding atomic.Bool   // a read of the record waits for release while set
	entered chan struct{} // a held read has begun
	release chan struct{}
}

func (s *countingStore) Get(key string, out interface{}) error {
	if key == webAuthnKey {
		s.reads.Add(1)
		if s.holding.Load() {
			s.entered <- struct{}{}
			<-s.release
		}
	}
	return s.rawStore.Get(key, out)
}

// testNode is one alps node.
type testNode struct {
	t        *testing.T
	server   *Server
	sessions *SessionManager
	router   *Router
	store    *countingStore
}

func newTestNode(t *testing.T, mail *rawStore, clock *fakeClock) *testNode {
	t.Helper()
	store := &countingStore{rawStore: mail, entered: make(chan struct{}), release: make(chan struct{})}
	mockProvider := &provider.MockProvider{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(store, nil)
	mockProvider.On("HasThreadCapability").Return(false).Maybe()
	sm := newSessionManager(
		func(string, string) (provider.MailProvider, error) { return mockProvider, nil },
		nil, &NilLogger{}, time.Minute, false, nil, time.Hour, 24*time.Hour, 0, 0, 0, 0, 0,
	)
	sm.now = clock.Now
	t.Cleanup(sm.Close)

	server := &Server{logger: &NilLogger{}, Options: &Options{}, Sessions: sm}
	router := NewRouter(server)
	server.setupMiddleware(router)
	router.Add(http.MethodGet, "/mailboxes/INBOX", func(ctx *Context) error {
		return ctx.String(http.StatusOK, "the inbox")
	})
	return &testNode{t: t, server: server, sessions: sm, router: router, store: store}
}

// open signs in to username on this node.
func (n *testNode) open(username string) *Session {
	n.t.Helper()
	s, err := n.sessions.Put(username, "pass")
	if err != nil {
		n.t.Fatal(err)
	}
	return s
}

// inbox asks this node for the inbox with s's cookie, and returns the status.
func (n *testNode) inbox(s *Session) int {
	req := httptest.NewRequest(http.MethodGet, "http://example.com/mailboxes/INBOX", nil)
	req.AddCookie(&http.Cookie{Name: cookieName, Value: s.Token()})
	w := httptest.NewRecorder()
	n.router.ServeHTTP(w, req)
	return w.Code
}

// reads is how often this node has read the account's WebAuthn record.
func (n *testNode) reads() int { return int(n.store.reads.Load()) }

// putKey gives the account a key on the mail server, as enrolling one does.
func putKey(t *testing.T, mail *rawStore) {
	t.Helper()
	if err := mail.Put(webAuthnKey, map[string]any{"enabled": true, "credentials": []any{map[string]any{"name": "laptop"}}}); err != nil {
		t.Fatal(err)
	}
}

// enrolKey enrols the account's first key from s on node n, as
// handleSetupFinish does.
func enrolKey(t *testing.T, n *testNode, s *Session, mail *rawStore) {
	t.Helper()
	putKey(t, mail)
	s.SetAuthenticated2FA(true)
	n.sessions.RequireSecondFactor(s.Username())
}

func (s *rawStore) setDown(err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.down = err
}

const nodeUser = "ada@example.com"

// A session opened on one node before the account enrolled its first key on
// another is asked for the key within a minute of being used, rather than
// keeping its access until it ends. It reads the record no oftener than that.
func TestSecondFactor_ASessionOnAnotherNodeIsAskedForANewKeyWithinAMinute(t *testing.T) {
	clock := newFakeClock()
	mail := &rawStore{entries: map[string]string{}}
	a, b := newTestNode(t, mail, clock), newTestNode(t, mail, clock)
	enrolling := a.open(nodeUser)
	before := b.open(nodeUser)
	assert.Equal(t, http.StatusOK, b.inbox(before))

	clock.Advance(10 * time.Second)
	enrolKey(t, a, enrolling, mail)
	assert.Equal(t, http.StatusOK, a.inbox(enrolling), "the session that enrolled the key")

	// Until a minute has passed since it last read the record, the session on
	// the other node does not read it again, however often it is used.
	clock.Advance(secondFactorRecheckInterval - 11*time.Second)
	for i := 0; i < 3; i++ {
		assert.Equal(t, http.StatusOK, b.inbox(before))
	}
	assert.Equal(t, 1, b.reads(), "reads of the record on the other node, its sign-in's included")

	clock.Advance(time.Second)
	assert.Equal(t, http.StatusUnauthorized, b.inbox(before), "a minute after enrolment")
	assert.True(t, before.Requires2FA())
	assert.Equal(t, http.StatusUnauthorized, b.inbox(before))
	assert.Equal(t, 2, b.reads(), "a session that needs the key reads the record no more")
}

// A read of the record that fails says nothing either way: the session goes
// on, and reads again an interval later.
func TestSecondFactor_AFailedReadLeavesTheSessionWorking(t *testing.T) {
	clock := newFakeClock()
	mail := &rawStore{entries: map[string]string{}}
	n := newTestNode(t, mail, clock)
	s := n.open(nodeUser)

	mail.setDown(errors.New("NO [UNAVAILABLE] metadata is busy"))
	clock.Advance(secondFactorRecheckInterval)
	assert.Equal(t, http.StatusOK, n.inbox(s), "the read failed")
	assert.Equal(t, 2, n.reads())
	assert.Equal(t, http.StatusOK, n.inbox(s))
	assert.Equal(t, 2, n.reads(), "a failed read was tried again before the interval was out")
	assert.False(t, s.Requires2FA())

	mail.setDown(nil)
	putKey(t, mail)
	clock.Advance(secondFactorRecheckInterval - time.Second)
	assert.Equal(t, http.StatusOK, n.inbox(s))
	clock.Advance(time.Second)
	assert.Equal(t, http.StatusUnauthorized, n.inbox(s), "the next read, which finds the key")
	assert.Equal(t, 3, n.reads())
}

// A session that has given the second factor has nothing more to give, and a
// session of an account known to have a key already needs it: neither reads
// the record again, however long it is used.
func TestSecondFactor_SessionsThatGaveItOrNeedItReadNothing(t *testing.T) {
	clock := newFakeClock()
	mail := &rawStore{entries: map[string]string{}}
	n := newTestNode(t, mail, clock)
	verified := n.open(nodeUser)
	verified.SetAuthenticated2FA(true)
	putKey(t, mail)
	asked := n.open(nodeUser)
	assert.True(t, asked.Requires2FA())
	assert.Equal(t, 2, n.reads(), "the two sign-ins")

	for i := 0; i < 3; i++ {
		clock.Advance(secondFactorRecheckInterval)
		assert.Equal(t, http.StatusOK, n.inbox(verified))
		assert.Equal(t, http.StatusUnauthorized, n.inbox(asked))
	}
	assert.Equal(t, 2, n.reads())
}

// One request of a session reads the record; the session's other requests
// meanwhile go on as it stood, rather than wait for the read or make their own.
func TestSecondFactor_OneRequestReadsWhileTheOthersGoOn(t *testing.T) {
	clock := newFakeClock()
	mail := &rawStore{entries: map[string]string{}}
	n := newTestNode(t, mail, clock)
	s := n.open(nodeUser)
	putKey(t, mail)

	clock.Advance(secondFactorRecheckInterval)
	n.store.holding.Store(true)
	reading := make(chan int, 1)
	go func() { reading <- n.inbox(s) }()
	select {
	case <-n.store.entered:
	case code := <-reading:
		t.Fatalf("the request was answered %d without reading the record", code)
	}

	assert.Equal(t, http.StatusOK, n.inbox(s), "a request made while another reads")
	assert.Equal(t, 2, n.reads())

	n.store.holding.Store(false)
	close(n.store.release)
	assert.Equal(t, http.StatusUnauthorized, <-reading, "the request that read the key")
	assert.Equal(t, http.StatusUnauthorized, n.inbox(s))
	assert.Equal(t, 2, n.reads())
}
