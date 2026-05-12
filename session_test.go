package alps

import (
	"testing"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSessionManager_PutAndGet(t *testing.T) {
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}

	// Expectations
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", "settings", mock.Anything).Return(provider.ErrNoStoreEntry)

	connectProvider := func(username, password string) (provider.MailProvider, error) {
		assert.Equal(t, "user@example.com", username)
		assert.Equal(t, "pass123", password)
		return mockProvider, nil
	}

	logger := &NilLogger{}
	var loginKey fernet.Key
	loginKey.Generate()

	sm := newSessionManager(
		connectProvider,
		nil, // dialSMTP
		logger,
		10*time.Minute,
		false,
		&loginKey,
		30*time.Minute,
		24*time.Hour,
		100, // maxSessions
		10,  // maxSessionsPerUser
		32,
		128,
		1024,
	)

	// Create session
	session, err := sm.Put("user@example.com", "pass123")
	assert.NoError(t, err)
	assert.NotNil(t, session)
	assert.NotEmpty(t, session.Token())
	assert.Equal(t, "user@example.com", session.Username())

	// Retrieve session
	retrieved, err := sm.Get(session.Token())
	assert.NoError(t, err)
	assert.Equal(t, session, retrieved)

	// Get invalid session
	_, err = sm.Get("invalid-token")
	assert.Equal(t, ErrSessionExpired, err)

	// Clean up
	session.Close()
	sm.Close()
}

func TestSessionManager_Eviction(t *testing.T) {
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}

	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", "settings", mock.Anything).Return(provider.ErrNoStoreEntry)

	connectProvider := func(username, password string) (provider.MailProvider, error) {
		return mockProvider, nil
	}

	sm := newSessionManager(
		connectProvider,
		nil,
		&NilLogger{},
		10*time.Minute,
		false,
		nil,
		30*time.Minute,
		24*time.Hour,
		2, // maxSessions global limit = 2
		0,
		32,
		128,
		1024,
	)

	// Add 3 sessions, the oldest should be evicted
	s1, _ := sm.Put("user1@example.com", "pass")

	// Artificially make s1 older
	s1.lastAccess.Store(time.Now().Add(-1 * time.Hour).UnixNano())

	s2, _ := sm.Put("user2@example.com", "pass")
	s3, _ := sm.Put("user3@example.com", "pass")

	// s1 should be evicted
	_, err := sm.Get(s1.Token())
	assert.Equal(t, ErrSessionExpired, err)

	_, err = sm.Get(s2.Token())
	assert.NoError(t, err)

	_, err = sm.Get(s3.Token())
	assert.NoError(t, err)

	sm.Close()
}

func TestSession_CalculateDuration(t *testing.T) {
	sm := newSessionManager(
		nil, nil, &NilLogger{},
		0, false, nil,
		30*time.Minute, // Default duration
		2*time.Hour,    // Max duration
		0, 0, 0, 0, 0,
	)

	// Test 1: No settings, should return default (30m)
	assert.Equal(t, 30*time.Minute, sm.CalculateSessionDurationForVal(nil))

	// Test 2: Valid custom setting within limits (60m)
	sixty := 60
	assert.Equal(t, 60*time.Minute, sm.CalculateSessionDurationForVal(&sixty))

	// Test 3: Custom setting exceeding max limits (180m -> capped to 120m)
	oneEighty := 180
	assert.Equal(t, 2*time.Hour, sm.CalculateSessionDurationForVal(&oneEighty))

	// Test 4: Infinite duration (0) -> capped to max limits
	zero := 0
	assert.Equal(t, 2*time.Hour, sm.CalculateSessionDurationForVal(&zero))
}
