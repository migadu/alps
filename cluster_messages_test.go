package alps

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// gossip is the cluster as the nodes see it: what one node broadcasts reaches
// the others, here at once and in order, and a copy is kept.
type gossip struct {
	mu   sync.Mutex
	sent [][]byte
	to   []*Server
}

func (g *gossip) Broadcast(msg []byte) {
	g.mu.Lock()
	g.sent = append(g.sent, msg)
	to := g.to
	g.mu.Unlock()
	for _, s := range to {
		s.HandleClusterMessage(msg)
	}
}

// Enrolling a key on one node has the account's sessions on the others read
// the record on their next request, without waiting out the interval. A
// session that gave the second factor still reads nothing.
func TestCluster_EnrollingAKeyHasTheOtherNodesSessionsLookAtOnce(t *testing.T) {
	clock := newFakeClock()
	mail := &rawStore{entries: map[string]string{}}
	a, b := newTestNode(t, mail, clock), newTestNode(t, mail, clock)
	a.sessions.broadcaster = &gossip{to: []*Server{b.server}}
	enrolling := a.open(nodeUser)
	before := b.open(nodeUser)
	otherCase := b.open("Ada@Example.com")
	verified := b.open(nodeUser)
	verified.SetAuthenticated2FA(true)
	bob := b.open("bob@example.com")
	assert.Equal(t, 4, b.reads(), "the sign-ins")

	clock.Advance(time.Second)
	enrolKey(t, a, enrolling, mail)

	assert.Equal(t, http.StatusUnauthorized, b.inbox(before), "the next request on the other node")
	assert.Equal(t, http.StatusUnauthorized, b.inbox(otherCase), "signed in as Ada@Example.com")
	assert.Equal(t, http.StatusOK, b.inbox(verified))
	assert.Equal(t, http.StatusOK, b.inbox(bob), "another account's session")
	assert.Equal(t, 6, b.reads(), "the two sessions of the account that had not given the key read once each")
}

// The message only has the sessions read the record: what the record says
// decides. A message for an account that has no key, as one sent again after
// the key was removed, signs no one out.
func TestCluster_TheRecordDecidesNotTheMessage(t *testing.T) {
	clock := newFakeClock()
	mail := &rawStore{entries: map[string]string{}}
	n := newTestNode(t, mail, clock)
	s := n.open(nodeUser)

	msg, err := encodeSecondFactorMessage(nodeUser)
	if err != nil {
		t.Fatal(err)
	}
	n.server.HandleClusterMessage(msg)
	assert.Equal(t, http.StatusOK, n.inbox(s))
	assert.Equal(t, 2, n.reads(), "the record was read at once")
	assert.Equal(t, http.StatusOK, n.inbox(s))
	assert.Equal(t, 2, n.reads(), "and not again before the interval")
	assert.False(t, s.Requires2FA())
}

// A node that knows only rate-limit events, as every node did before, cannot
// take the message for one, whatever the username: it does not decode as
// JSON, and the rate limiter records nothing from it.
func TestCluster_ANodeThatKnowsOnlyRateLimitEventsDropsTheMessage(t *testing.T) {
	for _, username := range []string{
		nodeUser,
		`{"ip":"192.0.2.1","success":false}`,
		" \t\n{}",
		"",
	} {
		g := &gossip{}
		sm := newSessionManager(nil, nil, &NilLogger{}, time.Minute, false, nil, time.Hour, 24*time.Hour, 0, 0, 0, 0, 0)
		sm.broadcaster = g
		sm.RequireSecondFactor(username)
		if !assert.Len(t, g.sent, 1, username) {
			continue
		}
		msg := g.sent[0]
		assert.Equal(t, clusterMessageSecondFactor, msg[0], username)
		assert.False(t, json.Valid(msg), "%q: the message is JSON", username)
		var event RateLimitEvent
		assert.Error(t, json.Unmarshal(msg, &event), username)

		rl := NewRateLimiter(DefaultRateLimitConfig(), &NilLogger{}, nil)
		rl.HandleClusterMessage(msg)
		rl.mu.RLock()
		assert.Empty(t, rl.globalTS, username)
		assert.Empty(t, rl.ipMap, username)
		assert.Empty(t, rl.userMap, username)
		rl.mu.RUnlock()
		rl.Close()
	}
}

// Rate-limit events still reach the rate limiter. A message of a kind this
// node does not know, or one that does not decode, is dropped.
func TestCluster_MessagesReachWhatTheyAreFor(t *testing.T) {
	clock := newFakeClock()
	mail := &rawStore{entries: map[string]string{}}
	n := newTestNode(t, mail, clock)
	n.server.RateLimiter = NewRateLimiter(DefaultRateLimitConfig(), &NilLogger{}, nil)
	t.Cleanup(n.server.RateLimiter.Close)
	s := n.open(nodeUser)

	sender := &gossip{}
	other := NewRateLimiter(DefaultRateLimitConfig(), &NilLogger{}, sender)
	defer other.Close()
	req := httptest.NewRequest(http.MethodPost, "/session", nil)
	req.RemoteAddr = "192.0.2.7:4321"
	other.RecordLoginAttempt(req, "bob@example.com", false)

	for _, msg := range [][]byte{
		nil,
		{0x7f, '{', '}'},
		{clusterMessageSecondFactor},
		append([]byte{clusterMessageSecondFactor}, `{"username": ""}`...),
		append([]byte{clusterMessageSecondFactor}, "ada@example.com"...),
		sender.sent[0],
	} {
		n.server.HandleClusterMessage(msg)
	}

	rl := n.server.RateLimiter
	rl.mu.RLock()
	assert.Len(t, rl.globalTS, 1)
	assert.Contains(t, rl.ipMap, "192.0.2.7")
	assert.Contains(t, rl.userMap, "bob@example.com")
	rl.mu.RUnlock()
	assert.Equal(t, http.StatusOK, n.inbox(s))
	assert.Equal(t, 1, n.reads(), "a message that did not decode had the session read")

	// A node without rate limiting drops the events, and goes on.
	n.server.RateLimiter = nil
	n.server.HandleClusterMessage(sender.sent[0])
}
