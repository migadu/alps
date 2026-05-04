package alps

import (
	"testing"
	"time"
)

func TestSessionManager_GlobalLimitEviction(t *testing.T) {
	logger := &mockLogger{}
	maxSessions := 3

	sm := &SessionManager{
		logger:             logger,
		maxSessions:        maxSessions,
		maxSessionsPerUser: 0,
		sessions:           make(map[string]*Session),
		userSessions:       make(map[string][]string),
	}

	// Manually add sessions up to the limit
	now := time.Now()
	tokens := []string{"token1", "token2", "token3"}
	usernames := []string{"user1@example.com", "user2@example.com", "user3@example.com"}

	for i := 0; i < maxSessions; i++ {
		s := &Session{
			manager:  sm,
			username: usernames[i],
			token:    tokens[i],
			closed:   make(chan struct{}),
		}
		s.lastAccess.Store(now.Add(time.Duration(i) * time.Second).UnixNano())
		sm.sessions[tokens[i]] = s
		sm.userSessions[usernames[i]] = append(sm.userSessions[usernames[i]], tokens[i])
	}

	// Verify we're at the limit
	if len(sm.sessions) != maxSessions {
		t.Fatalf("Expected %d sessions, got %d", maxSessions, len(sm.sessions))
	}

	// Simulate adding one more session (should evict oldest)
	sm.locker.Lock()
	if sm.maxSessions > 0 && len(sm.sessions) >= sm.maxSessions {
		sm.evictOldestSession()
	}
	sm.locker.Unlock()

	// Verify oldest session (token1) was evicted
	if _, exists := sm.sessions["token1"]; exists {
		t.Error("Expected oldest session (token1) to be evicted")
	}

	// Verify we now have space for a new session
	if len(sm.sessions) != maxSessions-1 {
		t.Errorf("Expected %d sessions after eviction, got %d", maxSessions-1, len(sm.sessions))
	}

	// Verify the evicted session was removed from userSessions
	if len(sm.userSessions["user1@example.com"]) != 0 {
		t.Error("Expected user1 to have no sessions after eviction")
	}
}

func TestSessionManager_PerUserLimitEviction(t *testing.T) {
	logger := &mockLogger{}
	maxSessionsPerUser := 2

	sm := &SessionManager{
		logger:             logger,
		maxSessions:        0, // unlimited global
		maxSessionsPerUser: maxSessionsPerUser,
		sessions:           make(map[string]*Session),
		userSessions:       make(map[string][]string),
	}

	username := "test@example.com"
	now := time.Now()
	tokens := []string{"token1", "token2"}

	// Add sessions up to per-user limit
	for i := 0; i < maxSessionsPerUser; i++ {
		s := &Session{
			manager:  sm,
			username: username,
			token:    tokens[i],
			closed:   make(chan struct{}),
		}
		s.lastAccess.Store(now.Add(time.Duration(i) * time.Second).UnixNano())
		sm.sessions[tokens[i]] = s
		sm.userSessions[username] = append(sm.userSessions[username], tokens[i])
	}

	// Verify user is at limit
	if len(sm.userSessions[username]) != maxSessionsPerUser {
		t.Fatalf("Expected %d sessions for user, got %d", maxSessionsPerUser, len(sm.userSessions[username]))
	}

	// Simulate adding another session for the same user
	sm.locker.Lock()
	if sm.maxSessionsPerUser > 0 && len(sm.userSessions[username]) >= sm.maxSessionsPerUser {
		sm.evictOldestUserSession(username)
	}
	sm.locker.Unlock()

	// Verify oldest session (token1) was evicted
	if _, exists := sm.sessions["token1"]; exists {
		t.Error("Expected oldest user session (token1) to be evicted")
	}

	// Verify user now has space for a new session
	if len(sm.userSessions[username]) != maxSessionsPerUser-1 {
		t.Errorf("Expected %d sessions for user after eviction, got %d", maxSessionsPerUser-1, len(sm.userSessions[username]))
	}

	// Verify token2 still exists
	if _, exists := sm.sessions["token2"]; !exists {
		t.Error("Expected newer session (token2) to still exist")
	}
}

func TestSessionManager_RemoveSession(t *testing.T) {
	logger := &mockLogger{}

	sm := &SessionManager{
		logger:             logger,
		maxSessions:        0,
		maxSessionsPerUser: 0,
		sessions:           make(map[string]*Session),
		userSessions:       make(map[string][]string),
	}

	username := "test@example.com"
	token := "test-token"

	// Add a session
	s := &Session{
		manager:  sm,
		username: username,
		token:    token,
		closed:   make(chan struct{}),
	}
	s.lastAccess.Store(time.Now().UnixNano())
	sm.sessions[token] = s
	sm.userSessions[username] = append(sm.userSessions[username], token)

	// Verify session exists
	if _, exists := sm.sessions[token]; !exists {
		t.Fatal("Session should exist before removal")
	}

	// Remove the session
	sm.locker.Lock()
	sm.removeSession(token)
	sm.locker.Unlock()

	// Verify session was removed from all maps
	if _, exists := sm.sessions[token]; exists {
		t.Error("Session should not exist in sessions map after removal")
	}
	if len(sm.userSessions[username]) != 0 {
		t.Errorf("Expected 0 sessions for user after removal, got %d", len(sm.userSessions[username]))
	}
}

func TestSessionManager_MultipleUsersIndependentLimits(t *testing.T) {
	logger := &mockLogger{}
	maxSessionsPerUser := 2

	sm := &SessionManager{
		logger:             logger,
		maxSessions:        0, // unlimited global
		maxSessionsPerUser: maxSessionsPerUser,
		sessions:           make(map[string]*Session),
		userSessions:       make(map[string][]string),
	}

	user1 := "user1@example.com"
	user2 := "user2@example.com"
	now := time.Now()

	// Add sessions for both users
	for i := 0; i < maxSessionsPerUser; i++ {
		// User 1 sessions
		token1 := "user1-token" + string(rune('1'+i))
		s1 := &Session{
			manager:  sm,
			username: user1,
			token:    token1,
			closed:   make(chan struct{}),
		}
		s1.lastAccess.Store(now.Add(time.Duration(i) * time.Second).UnixNano())
		sm.sessions[token1] = s1
		sm.userSessions[user1] = append(sm.userSessions[user1], token1)

		// User 2 sessions
		token2 := "user2-token" + string(rune('1'+i))
		s2 := &Session{
			manager:  sm,
			username: user2,
			token:    token2,
			closed:   make(chan struct{}),
		}
		s2.lastAccess.Store(now.Add(time.Duration(i) * time.Second).UnixNano())
		sm.sessions[token2] = s2
		sm.userSessions[user2] = append(sm.userSessions[user2], token2)
	}

	// Verify both users have their sessions
	if len(sm.userSessions[user1]) != maxSessionsPerUser {
		t.Errorf("Expected %d sessions for user1, got %d", maxSessionsPerUser, len(sm.userSessions[user1]))
	}
	if len(sm.userSessions[user2]) != maxSessionsPerUser {
		t.Errorf("Expected %d sessions for user2, got %d", maxSessionsPerUser, len(sm.userSessions[user2]))
	}

	// Total sessions should be 2 * maxSessionsPerUser
	totalSessions := len(sm.sessions)
	expectedTotal := 2 * maxSessionsPerUser
	if totalSessions != expectedTotal {
		t.Errorf("Expected %d total sessions, got %d", expectedTotal, totalSessions)
	}
}
