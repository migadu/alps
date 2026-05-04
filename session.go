package alps

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
	"github.com/fernet/fernet-go"
	"github.com/google/uuid"
)

const defaultSessionDuration = 30 * time.Minute

// isNetworkError checks if an error is a network connection error
func isNetworkError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
		return true
	}
	errStr := err.Error()
	return strings.Contains(errStr, "use of closed network connection") ||
		strings.Contains(errStr, "connection reset") ||
		strings.Contains(errStr, "broken pipe")
}

// generateToken creates a cryptographically secure random session token.
// Token space: 32 bytes = 256 bits = 2^256 possible values (~1.16 × 10^77)
// Collision probability: With 1 billion active sessions, probability < 10^-60
func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

var (
	ErrSessionExpired      = errors.New("session expired")
	ErrAttachmentCacheSize = errors.New("Attachments on session exceed maximum file size")
)

// AuthError wraps an authentication error.
type AuthError struct {
	cause error
}

func (err AuthError) Error() string {
	return fmt.Sprintf("authentication failed: %v", err.cause)
}

// Session is an active user session. It may also hold a mail provider connection.
//
// The session's password is not available to plugins. Plugins should use the
// session helpers to authenticate outgoing connections, for instance DoSMTP.
type Session struct {
	manager            *SessionManager
	username, password string
	token              string
	closed             chan struct{}
	pings              chan struct{}
	durationUpdate     chan time.Duration
	notice             string
	authenticated2FA   bool          // Set to true after successful 2FA verification
	duration           time.Duration // Effective session duration for this user

	providerLocker sync.Mutex
	provider       provider.MailProvider // protected by locker, can be nil

	attachmentsLocker sync.Mutex
	attachments       map[string]*Attachment // protected by attachmentsLocker

	// Cache for mail data (mailbox lists, statuses, etc.)
	cache *Cache

	lastAccess atomic.Int64 // stores unix nano for LRU eviction
}

type Attachment struct {
	ComposerID string
	File       *multipart.FileHeader
	Form       *multipart.Form
	CreatedAt  time.Time
}

func (s *Session) ping() {
	s.lastAccess.Store(time.Now().UnixNano())
	select {
	case s.pings <- struct{}{}:
	default:
	}
}

// UpdateDuration dynamically updates the session's timeout duration.
func (s *Session) UpdateDuration(d time.Duration) {
	s.durationUpdate <- d
}

// Username returns the session's username.
func (s *Session) Username() string {
	return s.username
}

// Token returns the session's token.
func (s *Session) Token() string {
	return s.token
}

// GetSessionDuration returns the effective session duration for this user.
func (s *Session) GetSessionDuration() time.Duration {
	return s.duration
}

// Cache returns the session's cache.
func (s *Session) Cache() *Cache {
	return s.cache
}

// SetAuthenticated2FA marks this session as having completed 2FA verification.
func (s *Session) SetAuthenticated2FA(authenticated bool) {
	s.authenticated2FA = authenticated
}

// IsAuthenticated2FA returns whether this session has completed 2FA verification.
func (s *Session) IsAuthenticated2FA() bool {
	return s.authenticated2FA
}

// DoMail executes a mail operation using the provider. The provider can only
// be used from inside f.
func (s *Session) DoMail(f func(provider.MailProvider) error) error {
	return s.DoMailWithContext(context.Background(), f)
}

// DoMailWithContext executes a mail operation and safely closes the provider
// if the context is cancelled (e.g. client disconnects).
func (s *Session) DoMailWithContext(ctx context.Context, f func(provider.MailProvider) error) error {
	s.providerLocker.Lock()
	defer s.providerLocker.Unlock()

	if s.provider == nil {
		var err error
		s.provider, err = s.manager.connectProvider(s.username, s.password)
		if err != nil {
			s.Close()
			return fmt.Errorf("failed to connect to mail provider: %v", err)
		}
	}

	done := make(chan error, 1)
	go func(p provider.MailProvider) {
		done <- f(p)
	}(s.provider)

	var err error
	select {
	case <-ctx.Done():
		s.provider.Close()
		s.provider = nil
		return fmt.Errorf("context cancelled, closed provider: %v", ctx.Err())
	case err = <-done:
	}

	// If we get a connection error, try once more with a fresh connection
	if err != nil && isNetworkError(err) {
		s.provider.Close()
		s.provider = nil

		var reErr error
		s.provider, reErr = s.manager.connectProvider(s.username, s.password)
		if reErr != nil {
			s.Close()
			return fmt.Errorf("failed to re-connect to mail provider: %v", reErr)
		}

		done2 := make(chan error, 1)
		go func(p provider.MailProvider) {
			done2 <- f(p)
		}(s.provider)

		select {
		case <-ctx.Done():
			s.provider.Close()
			s.provider = nil
			return fmt.Errorf("context cancelled during retry, closed provider: %v", ctx.Err())
		case err = <-done2:
		}
	}

	return err
}


// DoSMTP executes an SMTP operation on this session. The SMTP client can only
// be used from inside f.
func (s *Session) DoSMTP(f func(*smtp.Client) error) error {
	c, err := s.manager.dialSMTP()
	if err != nil {
		return err
	}
	defer c.Close()

	auth := sasl.NewPlainClient("", s.username, s.password)
	if err := c.Auth(auth); err != nil {
		return AuthError{err}
	}

	if err := f(c); err != nil {
		return err
	}

	if err := c.Quit(); err != nil {
		return fmt.Errorf("QUIT failed: %v", err)
	}

	return nil
}

// SetHTTPBasicAuth adds an Authorization header field to the request with
// this session's credentials.
func (s *Session) SetHTTPBasicAuth(req *http.Request) {
	// TODO: find a way to make it harder for plugins to steal credentials
	req.SetBasicAuth(s.username, s.password)
}

// Close destroys the session. This can be used to log the user out.
func (s *Session) Close() {
	s.attachmentsLocker.Lock()
	defer s.attachmentsLocker.Unlock()

	for _, f := range s.attachments {
		f.Form.RemoveAll()
		s.manager.globalAttachmentSize.Add(-f.File.Size)
	}
	s.attachments = make(map[string]*Attachment)

	select {
	case <-s.closed:
		// This space is intentionally left blank
	default:
		close(s.closed)
	}
}

// Puts an attachment and returns a generated UUID
func (s *Session) PutAttachment(composerID string, in *multipart.FileHeader,
	form *multipart.Form) (string, error) {

	// Try to reserve global budget
	for {
		currentGlobal := s.manager.globalAttachmentSize.Load()
		if currentGlobal+in.Size > s.manager.maxGlobalAttachmentSize {
			if !s.manager.evictOldestAttachment() {
				return "", ErrAttachmentCacheSize
			}
			continue
		}
		if s.manager.globalAttachmentSize.CompareAndSwap(currentGlobal, currentGlobal+in.Size) {
			break
		}
	}

	id := uuid.New()
	s.attachmentsLocker.Lock()
	defer s.attachmentsLocker.Unlock()

	var composerSize int64
	var sessionSize int64
	for {
		composerSize = 0
		sessionSize = 0
		var oldestID string
		var oldestTime time.Time

		for id, a := range s.attachments {
			sessionSize += a.File.Size
			if a.ComposerID == composerID {
				composerSize += a.File.Size
			}
			if oldestTime.IsZero() || a.CreatedAt.Before(oldestTime) {
				oldestTime = a.CreatedAt
				oldestID = id
			}
		}

		if composerSize+in.Size > s.manager.maxAttachmentSize {
			s.manager.globalAttachmentSize.Add(-in.Size) // rollback global reservation
			return "", ErrAttachmentCacheSize
		}

		if sessionSize+in.Size > s.manager.maxSessionAttachmentSize {
			if oldestID != "" {
				a := s.attachments[oldestID]
				delete(s.attachments, oldestID)
				a.Form.RemoveAll()
				s.manager.globalAttachmentSize.Add(-a.File.Size)
				continue
			} else {
				s.manager.globalAttachmentSize.Add(-in.Size) // rollback global reservation
				return "", ErrAttachmentCacheSize
			}
		}

		break
	}

	s.attachments[id.String()] = &Attachment{
		ComposerID: composerID,
		File:       in,
		Form:       form,
		CreatedAt:  time.Now(),
	}
	return id.String(), nil
}

// Removes an attachment from the session. Returns nil if there was no such
// attachment.
func (s *Session) PopAttachment(uuid string) *Attachment {
	s.attachmentsLocker.Lock()
	defer s.attachmentsLocker.Unlock()

	a, ok := s.attachments[uuid]
	if !ok {
		return nil
	}
	delete(s.attachments, uuid)
	s.manager.globalAttachmentSize.Add(-a.File.Size)

	return a
}

// GetAttachment returns an attachment from the session without removing it.
// Returns nil if there was no such attachment.
func (s *Session) GetAttachment(uuid string) *Attachment {
	s.attachmentsLocker.Lock()
	defer s.attachmentsLocker.Unlock()

	a, ok := s.attachments[uuid]
	if !ok {
		return nil
	}
	return a
}

func (s *Session) PutNotice(n string) {
	s.notice = n
}

func (s *Session) PopNotice() string {
	n := s.notice
	s.notice = ""
	return n
}

type sessionStore struct {
	session *Session
}

func (ss *sessionStore) Get(key string, out interface{}) error {
	return ss.session.DoMailWithContext(context.Background(), func(p provider.MailProvider) error {
		store, err := p.GetStore()
		if err != nil {
			return err
		}
		return store.Get(key, out)
	})
}

func (ss *sessionStore) Put(key string, v interface{}) error {
	return ss.session.DoMailWithContext(context.Background(), func(p provider.MailProvider) error {
		store, err := p.GetStore()
		if err != nil {
			return err
		}
		return store.Put(key, v)
	})
}

// Store returns a store suitable for storing persistent user data.
func (s *Session) Store() provider.Store {
	return &sessionStore{session: s}
}

type (
	// DialSMTPFunc connects to the upstream SMTP server.
	DialSMTPFunc func() (*smtp.Client, error)
)

// SessionManager keeps track of active sessions. It connects and re-connects
// to the mail provider as necessary. It prunes expired sessions.
type SessionManager struct {
	connectProviderFunc      provider.AuthenticatedProviderFactory
	dialSMTP                 DialSMTPFunc
	logger                   Logger
	cacheTTL                 time.Duration
	cacheEnabled             bool
	loginKey                 *fernet.Key // for encrypting linked account passwords
	sessionDuration          time.Duration
	maxSessionDuration       time.Duration
	maxSessions              int   // Maximum total sessions (0 = unlimited)
	maxSessionsPerUser       int   // Maximum sessions per username (0 = unlimited)
	maxAttachmentSize        int64 // Max attachment size per composer in bytes
	maxSessionAttachmentSize int64 // Max attachment size per session in bytes
	maxGlobalAttachmentSize  int64 // Max global attachment size in bytes

	globalAttachmentSize atomic.Int64 // Tracks current total attachment size across all sessions

	locker       sync.RWMutex
	sessions     map[string]*Session // token -> Session, protected by locker
	userSessions map[string][]string // username -> []token, protected by locker
}

func newSessionManager(connectProviderFunc provider.AuthenticatedProviderFactory, dialSMTP DialSMTPFunc, logger Logger, cacheTTL time.Duration, cacheEnabled bool, loginKey *fernet.Key, sessionDuration time.Duration, maxSessionDuration time.Duration, maxSessions int, maxSessionsPerUser int, maxAttachmentMiB int, maxSessionAttachmentMiB int, maxGlobalAttachmentMiB int) *SessionManager {
	// Default to 10 minutes if not specified
	if cacheTTL == 0 {
		cacheTTL = 10 * time.Minute
	}
	// Default to 30 minutes if not specified
	if sessionDuration == 0 {
		sessionDuration = defaultSessionDuration
	}

	if maxAttachmentMiB == 0 {
		maxAttachmentMiB = 32
	}
	if maxSessionAttachmentMiB == 0 {
		maxSessionAttachmentMiB = 128
	}
	if maxGlobalAttachmentMiB == 0 {
		maxGlobalAttachmentMiB = 1024
	}

	return &SessionManager{
		sessions:                 make(map[string]*Session),
		userSessions:             make(map[string][]string),
		connectProviderFunc:      connectProviderFunc,
		dialSMTP:                 dialSMTP,
		logger:                   logger,
		cacheTTL:                 cacheTTL,
		cacheEnabled:             cacheEnabled,
		loginKey:                 loginKey,
		sessionDuration:          sessionDuration,
		maxSessionDuration:       maxSessionDuration,
		maxSessions:              maxSessions,
		maxSessionsPerUser:       maxSessionsPerUser,
		maxAttachmentSize:        int64(maxAttachmentMiB) << 20,
		maxSessionAttachmentSize: int64(maxSessionAttachmentMiB) << 20,
		maxGlobalAttachmentSize:  int64(maxGlobalAttachmentMiB) << 20,
	}
}

func (sm *SessionManager) Close() {
	for _, s := range sm.sessions {
		s.Close()
	}
}

// calculateSessionDuration determines the effective session duration for a user.
func (sm *SessionManager) calculateSessionDuration(store provider.Store) time.Duration {
	type UserSettings struct {
		AutoLogout *int `json:"auto_logout,omitempty"`
	}

	var settings UserSettings
	err := store.Get("settings", &settings)
	if err != nil {
		sm.logger.Debugf("Using server default session duration (no user settings): %v", sm.sessionDuration)
		return sm.sessionDuration
	}

	return sm.CalculateSessionDurationForVal(settings.AutoLogout)
}

// CalculateSessionDurationForVal calculates the session duration given the AutoLogout setting pointer.
func (sm *SessionManager) CalculateSessionDurationForVal(autoLogout *int) time.Duration {
	if autoLogout == nil {
		sm.logger.Debugf("User AutoLogout not set, using server default: %v", sm.sessionDuration)
		return sm.sessionDuration
	}

	if *autoLogout <= 0 {
		if sm.maxSessionDuration > 0 {
			sm.logger.Printf("User requested 'Never' session timeout, capping at max %v", sm.maxSessionDuration)
			return sm.maxSessionDuration
		}
		sm.logger.Debugf("User requested 'Never' session timeout, using infinite duration")
		return 8760 * time.Hour // 1 year
	}

	userDuration := time.Duration(*autoLogout) * time.Minute

	if sm.maxSessionDuration > 0 && userDuration > sm.maxSessionDuration {
		sm.logger.Printf("User requested %v session, capping at max %v", userDuration, sm.maxSessionDuration)
		return sm.maxSessionDuration
	}

	sm.logger.Debugf("Using user's AutoLogout setting: %v", userDuration)
	return userDuration
}

func (sm *SessionManager) connectProvider(username, password string) (provider.MailProvider, error) {
	return sm.connectProviderFunc(username, password)
}

func (sm *SessionManager) get(token string) (*Session, error) {
	sm.locker.RLock()
	defer sm.locker.RUnlock()

	session, ok := sm.sessions[token]
	if !ok {
		return nil, ErrSessionExpired
	}
	return session, nil
}

// Get retrieves a session by token (public wrapper for get)
func (sm *SessionManager) Get(token string) (*Session, error) {
	return sm.get(token)
}

func (sm *SessionManager) evictOldestSession() {
	var oldestToken string
	var oldestTime int64 = -1

	for token, session := range sm.sessions {
		accessTime := session.lastAccess.Load()
		if oldestTime == -1 || accessTime < oldestTime {
			oldestToken = token
			oldestTime = accessTime
		}
	}

	if oldestToken != "" {
		if session, ok := sm.sessions[oldestToken]; ok {
			tokenPrefix := oldestToken
			if len(oldestToken) > 8 {
				tokenPrefix = oldestToken[:8]
			}
			t := time.Unix(0, oldestTime)
			sm.logger.Printf("Evicting oldest session due to global limit: token=%s, username=%s, last_access=%v",
				tokenPrefix, session.username, t)
			session.Close()
			sm.removeSession(oldestToken)
		}
	}
}

func (sm *SessionManager) evictOldestUserSession(username string) {
	tokens, ok := sm.userSessions[username]
	if !ok || len(tokens) == 0 {
		return
	}

	var oldestToken string
	var oldestTime int64 = -1

	for _, token := range tokens {
		if session, exists := sm.sessions[token]; exists {
			accessTime := session.lastAccess.Load()
			if oldestTime == -1 || accessTime < oldestTime {
				oldestToken = token
				oldestTime = accessTime
			}
		}
	}

	if oldestToken != "" {
		if session, ok := sm.sessions[oldestToken]; ok {
			tokenPrefix := oldestToken
			if len(oldestToken) > 8 {
				tokenPrefix = oldestToken[:8]
			}
			t := time.Unix(0, oldestTime)
			sm.logger.Printf("Evicting oldest session for user due to per-user limit: token=%s, username=%s, last_access=%v",
				tokenPrefix, username, t)
			session.Close()
			sm.removeSession(oldestToken)
		}
	}
}

// removeSession removes a session from all tracking maps
// Must be called with sm.locker held (write lock)
func (sm *SessionManager) removeSession(token string) {
	session, ok := sm.sessions[token]
	if !ok {
		return
	}

	username := session.username
	delete(sm.sessions, token)

	// Remove from user sessions list
	if tokens, exists := sm.userSessions[username]; exists {
		newTokens := make([]string, 0, len(tokens)-1)
		for _, t := range tokens {
			if t != token {
				newTokens = append(newTokens, t)
			}
		}
		if len(newTokens) > 0 {
			sm.userSessions[username] = newTokens
		} else {
			delete(sm.userSessions, username)
		}
	}
}

// evictOldestAttachment evicts the oldest attachment across all sessions to free up global budget.
// Returns true if an attachment was evicted, false if no attachments exist.
func (sm *SessionManager) evictOldestAttachment() bool {
	sm.locker.RLock()
	var oldestSession *Session
	var oldestID string
	var oldestTime time.Time

	for _, s := range sm.sessions {
		s.attachmentsLocker.Lock()
		for id, a := range s.attachments {
			if oldestTime.IsZero() || a.CreatedAt.Before(oldestTime) {
				oldestTime = a.CreatedAt
				oldestID = id
				oldestSession = s
			}
		}
		s.attachmentsLocker.Unlock()
	}
	sm.locker.RUnlock()

	if oldestSession != nil {
		if a := oldestSession.PopAttachment(oldestID); a != nil {
			a.Form.RemoveAll()
			return true
		}
	}
	return false
}

// Put connects to the mail provider and creates a new session. If authentication
// fails, the error will be of type AuthError.
func (sm *SessionManager) Put(username, password string) (*Session, error) {
	// Connect to provider for authentication check
	p, err := sm.connectProvider(username, password)
	if err != nil {
		return nil, err
	}
	defer p.Close()

	sm.locker.Lock()
	defer sm.locker.Unlock()

	// Enforce global session limit
	for sm.maxSessions > 0 && len(sm.sessions) >= sm.maxSessions {
		sm.logger.Printf("Global session limit reached (%d/%d), evicting oldest session",
			len(sm.sessions), sm.maxSessions)
		sm.evictOldestSession()
	}

	// Enforce per-user session limit
	if sm.maxSessionsPerUser > 0 {
		for len(sm.userSessions[username]) >= sm.maxSessionsPerUser {
			sm.logger.Printf("Per-user session limit reached for %s (%d/%d), evicting oldest session",
				username, len(sm.userSessions[username]), sm.maxSessionsPerUser)
			sm.evictOldestUserSession(username)
		}
	}

	// Generate unique session token with collision protection
	const maxTokenRetries = 100
	var token string
	for attempt := 0; attempt < maxTokenRetries; attempt++ {
		token, err = generateToken()
		if err != nil {
			return nil, fmt.Errorf("failed to generate session token: %w", err)
		}

		if _, ok := sm.sessions[token]; !ok {
			break
		}

		// Log collision for monitoring (should be extremely rare)
		if attempt > 0 {
			sm.logger.Printf("Session token collision on attempt %d (token: %s...)", attempt+1, token[:8])
		}
	}

	// If we exhausted all retries, something is seriously wrong
	if _, exists := sm.sessions[token]; exists {
		return nil, fmt.Errorf("failed to generate unique session token after %d attempts (possible RNG failure or token space exhaustion)", maxTokenRetries)
	}

	var cache *Cache
	if sm.cacheEnabled {
		cache = NewCache(sm.cacheTTL)
	} else {
		// Create a dummy cache with 1 second TTL to effectively disable caching
		cache = NewCache(1 * time.Second)
	}

	s := &Session{
		manager:        sm,
		closed:         make(chan struct{}),
		pings:          make(chan struct{}, 5),
		durationUpdate: make(chan time.Duration, 1),
		provider:       p,
		username:       username,
		password:       password,
		token:          token,
		attachments:    make(map[string]*Attachment),
		cache:          cache,
		duration:       sm.sessionDuration, // Will be updated after reading user settings
	}
	s.lastAccess.Store(time.Now().UnixNano())

	// Calculate effective session duration based on user's AutoLogout preference
	s.duration = sm.calculateSessionDuration(s.Store())

	// Track the session
	sm.sessions[token] = s
	sm.userSessions[username] = append(sm.userSessions[username], token)

	go func() {
		timer := time.NewTimer(s.duration)

		alive := true
		for alive {
			select {
			case <-s.pings:
				if !timer.Stop() {
					<-timer.C
				}
				timer.Reset(s.duration)
			case newDuration := <-s.durationUpdate:
				s.duration = newDuration
				if !timer.Stop() {
					<-timer.C
				}
				timer.Reset(s.duration)
			case <-timer.C:
				alive = false
			case <-s.closed:
				alive = false
			}
		}

		timer.Stop()

		s.providerLocker.Lock()
		if s.provider != nil {
			s.provider.Close()
		}
		s.providerLocker.Unlock()


		// Unregister cache from global cleanup manager
		if s.cache != nil {
			s.cache.Close()
		}

		sm.locker.Lock()
		sm.removeSession(token)
		sm.locker.Unlock()
	}()

	return s, nil
}

// SwitchAccount creates a new session for a linked account.
// It retrieves the linked account credentials from the current session's METADATA,
// decrypts them, and creates a new authenticated session.
func (sm *SessionManager) SwitchAccount(currentSession *Session, targetUsername string) (*Session, error) {
	// Get linked account credentials
	password, err := currentSession.GetLinkedAccountCredentials(targetUsername)
	if err != nil {
		return nil, fmt.Errorf("failed to get credentials for %s: %w", targetUsername, err)
	}

	// Create new session with the linked account
	newSession, err := sm.Put(targetUsername, password)
	if err != nil {
		return nil, fmt.Errorf("failed to create session for %s: %w", targetUsername, err)
	}

	return newSession, nil
}

// UpdatePassword reconnects the session with a new password and updates the session state if successful.
func (sm *SessionManager) UpdatePassword(s *Session, newPassword string) error {
	s.providerLocker.Lock()
	defer s.providerLocker.Unlock()

	// Try to connect with new password to verify it works
	provider, err := sm.connectProvider(s.username, newPassword)
	if err != nil {
		return fmt.Errorf("failed to verify new password with provider: %w", err)
	}

	// Close old connections
	if s.provider != nil {
		s.provider.Close()
	}

	// Update session state
	s.provider = provider
	s.password = newPassword

	return nil
}
