package alps

import (
	"context"
	"errors"
	"mime/multipart"
	"sync"
	"testing"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// TestDoMailWithContext_ConnectFailureIsIdentifiable verifies that a failed
// (re)connect surfaces an error that handleError can act on: errors.As must
// still recover the underlying AuthError (so %w wrapping did not hide it), and
// errors.Is must match ErrMailProviderUnavailable so the user is logged out
// instead of looping on 500s.
func TestDoMailWithContext_ConnectFailureIsIdentifiable(t *testing.T) {
	authCause := errors.New("invalid credentials")
	connectProvider := func(username, password string) (provider.MailProvider, error) {
		return nil, AuthError{cause: authCause}
	}
	sm := newSessionManager(
		connectProvider, nil, &NilLogger{},
		0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0,
	)
	s := &Session{manager: sm, closed: make(chan struct{}), username: "u", password: "p"}

	err := s.DoMailWithContext(context.Background(), func(p provider.MailProvider) error { return nil })
	assert.Error(t, err)

	var authErr AuthError
	assert.True(t, errors.As(err, &authErr), "AuthError must survive %%w wrapping so errors.As matches")
	assert.True(t, errors.Is(err, ErrMailProviderUnavailable), "sentinel must be joined so handleError logs out")
}

// TestSession_CloseIsIdempotent verifies that Close can be called repeatedly and
// concurrently without panicking on a double close of the signalling channel.
func TestSession_CloseIsIdempotent(t *testing.T) {
	sm := &SessionManager{
		sessions:     make(map[string]*Session),
		userSessions: make(map[string][]string),
	}
	s := &Session{manager: sm, closed: make(chan struct{})}

	var wg sync.WaitGroup
	for i := 0; i < 16; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s.Close()
		}()
	}
	wg.Wait()
	s.Close() // once more, still safe

	select {
	case <-s.closed:
	default:
		t.Fatal("closed channel should be closed after Close()")
	}
}

// TestSession_ExpiryReleasesAttachments verifies that a session expiring
// naturally (timer fires) releases its composer attachments and returns their
// bytes to the global budget — previously only the logout/eviction path did
// this, so idle-expired sessions permanently inflated the global budget.
func TestSession_ExpiryReleasesAttachments(t *testing.T) {
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", mock.Anything, mock.Anything).Return(provider.ErrNoStoreEntry)

	connectProvider := func(username, password string) (provider.MailProvider, error) {
		return mockProvider, nil
	}
	var loginKey fernet.Key
	loginKey.Generate()

	sm := newSessionManager(
		connectProvider,
		nil,
		&NilLogger{},
		10*time.Minute,
		false,
		&loginKey,
		200*time.Millisecond, // short session duration → quick natural expiry
		24*time.Hour,
		100,
		10,
		32,
		128,
		1024,
	)

	session, err := sm.Put("user@example.com", "pass")
	assert.NoError(t, err)

	// Attach a composer attachment and account for it in the global budget,
	// well before the 200ms timer can fire.
	form := &multipart.Form{Value: map[string][]string{}, File: map[string][]*multipart.FileHeader{}}
	session.attachmentsLocker.Lock()
	session.attachments["att1"] = &Attachment{
		ComposerID: "c1",
		File:       &multipart.FileHeader{Size: 4096},
		Form:       form,
		CreatedAt:  time.Now(),
	}
	session.attachmentsLocker.Unlock()
	sm.globalAttachmentSize.Add(4096)
	token := session.Token()

	// Wait for the session to expire naturally.
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if _, gerr := sm.Get(token); gerr == ErrSessionExpired {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	_, err = sm.Get(token)
	assert.Equal(t, ErrSessionExpired, err, "expired session must be removed from the manager")
	assert.Equal(t, int64(0), sm.globalAttachmentSize.Load(),
		"natural expiry must release the attachment's global budget")
}

func TestSessionManager_PutAndGet(t *testing.T) {
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}

	// Expectations
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", "base.settings", mock.Anything).Return(provider.ErrNoStoreEntry)

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
	mockStore.On("Get", "base.settings", mock.Anything).Return(provider.ErrNoStoreEntry)

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

// The idle window bounds inactivity; the absolute deadline bounds USE. A ping
// may push the idle window forward, but never past the cap — otherwise a token
// being kept warm (which this app's own front end does every five minutes)
// never expires.
func TestSession_NextTimeoutIsClampedByAbsoluteDeadline(t *testing.T) {
	s := &Session{duration: 30 * time.Minute}

	// No cap configured: the idle window is the whole answer.
	assert.Equal(t, 30*time.Minute, s.nextTimeout())

	// Cap further out than the idle window: the idle window still wins.
	s.absoluteDeadline = time.Now().Add(2 * time.Hour)
	assert.Equal(t, 30*time.Minute, s.nextTimeout())

	// Cap nearer than the idle window: the remainder of the cap wins, so a ping
	// cannot extend the session past it.
	s.absoluteDeadline = time.Now().Add(5 * time.Minute)
	d := s.nextTimeout()
	assert.Greater(t, d, 4*time.Minute)
	assert.LessOrEqual(t, d, 5*time.Minute)

	// Cap already passed: non-positive, which the timeout goroutine reads as
	// "end the session" rather than resetting the timer.
	s.absoluteDeadline = time.Now().Add(-time.Second)
	assert.LessOrEqual(t, s.nextTimeout(), time.Duration(0))
}

// A cap configured BELOW the idle window would silently redefine the idle
// window as the shorter of the two — a misconfiguration that reads as
// "sessions last 30 minutes of inactivity" everywhere while behaving otherwise.
func TestSessionManager_AbsoluteDeadlineIsFlooredAtTheIdleWindow(t *testing.T) {
	start := time.Now()

	sm := &SessionManager{sessionDuration: time.Hour, absoluteSessionDuration: 10 * time.Minute}
	assert.Equal(t, start.Add(time.Hour), sm.absoluteDeadlineFrom(start))

	sm = &SessionManager{sessionDuration: 30 * time.Minute, absoluteSessionDuration: 7 * 24 * time.Hour}
	assert.Equal(t, start.Add(7*24*time.Hour), sm.absoluteDeadlineFrom(start))

	// Explicitly disabled: the zero time, which nextTimeout reads as "no cap".
	sm = &SessionManager{sessionDuration: 30 * time.Minute, absoluteSessionDuration: -1}
	assert.True(t, sm.absoluteDeadlineFrom(start).IsZero())
}
