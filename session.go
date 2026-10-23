package alps

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
	"github.com/fernet/fernet-go"
	"github.com/google/uuid"
	"github.com/migadu/alps/provider"
)

const defaultSessionDuration = 30 * time.Minute

// How long a session may live no matter how much it is used, when
// AbsoluteSessionDuration is not configured.
//
// The idle window alone bounds nothing: every request resets it, and this app's
// own front end pings /session every five minutes while a tab is open. So a
// token that has been captured and is being kept warm never expires, and the
// user is never asked to authenticate again. A mail tab is the extreme
// long-lived tab, which is why the idle window is generous — and exactly why it
// needs a ceiling that use cannot push back.
const defaultAbsoluteSessionDuration = 7 * 24 * time.Hour

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

// sessionLogID names a session in the log. The token is the bearer credential
// and never goes there; a hash of it ties one session's lines together without
// giving any of it away.
func sessionLogID(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:6])
}

var (
	ErrSessionExpired      = errors.New("session expired")
	ErrAttachmentCacheSize = errors.New("Attachments on session exceed maximum file size")
	// ErrMailProviderUnavailable marks errors where the session's mail provider
	// connection could not be (re-)established. handleError treats it as a signal
	// to log the user out rather than looping on 500s.
	ErrMailProviderUnavailable = errors.New("mail provider unavailable")
)

// Session is an active user session. It may also hold a mail provider connection.
//
// The session's password is not available to plugins. Plugins should use the
// session helpers to authenticate outgoing connections, for instance DoSMTP.
type Session struct {
	manager            *SessionManager
	username, password string
	address            string // see Address
	token              string
	id                 string    // names the session in the log, see sessionLogID
	created            time.Time // when the password was accepted
	closed             chan struct{}
	pings              chan struct{}
	durationUpdate     chan time.Duration
	notice             string
	duration           time.Duration // Effective idle window for this user

	// Whether this session has given the account's second factor, and whether
	// it must before it goes on. Atomic, because requires2FA can be set by a
	// request of another session: see RequireSecondFactor.
	authenticated2FA atomic.Bool
	requires2FA      atomic.Bool

	// When this session last read, from the server, whether the account has a
	// key, on the manager's clock; whether one of its requests is reading it
	// now; and whether another node has said since that the account enrolled
	// one. See needsSecondFactor.
	secondFactorReadAt  atomic.Pointer[time.Time]
	secondFactorReading atomic.Bool
	secondFactorNews    atomic.Bool

	// The wall-clock instant past which this session ends no matter how much it
	// is used. Fixed at login and never moved — see SessionManager's
	// absoluteSessionDuration for why an idle window alone is not enough.
	absoluteDeadline time.Time

	providerLocker sync.Mutex
	provider       provider.MailProvider // protected by locker, can be nil

	// The session's second connection, for mail work the user is not waiting
	// for: see DoBackgroundMail.
	background backgroundConnection

	// The watches of the Inbox its pages hold, and the IDLE that serves them:
	// see WatchInbox.
	push inboxPush

	// How many connections the session has given up on that are not closed
	// yet: see giveUpConnection.
	givenUp atomic.Int32

	// The store entries the session's connection has read or written, as the
	// JSON the store holds them in, and nil for one it found missing, when the
	// connection's store keeps such copies itself: see sessionStore. Changed
	// only with providerLocker held as well, so that they change in the order
	// the connection read and wrote them.
	storeEntriesLocker sync.RWMutex
	storeEntries       map[string]json.RawMessage // protected by storeEntriesLocker

	attachmentsLocker sync.Mutex
	attachments       map[string]*Attachment // protected by attachmentsLocker
	attachmentsGone   bool                   // set by teardown; protected by attachmentsLocker

	// Cache for mail data (mailbox lists, statuses, etc.)
	cache *Cache

	// The authentication verdicts read on any of the session's connections:
	// see shareVerdicts.
	verdicts provider.VerdictCache

	memoryDataLock sync.RWMutex
	memoryData     map[string]interface{}

	lastAccess atomic.Int64 // stores unix nano for LRU eviction

	closeOnce    sync.Once // guards close(s.closed)
	teardownOnce sync.Once // guards releasing attachments/provider/cache

	// Why the session was closed, for the line that records its end. Written
	// once, inside closeOnce, and read only after s.closed is.
	endReason string

	// Set once a browser holds the session. Only such a session's end is
	// logged: the ones alps opens for itself, to read a linked account, are not
	// anyone's sign-in.
	issued atomic.Bool
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

// UpdateDuration dynamically updates the session's timeout duration. The send is
// non-blocking: if the session is already closed, or an update is still pending
// in the single-slot channel, the update is dropped rather than blocking (and
// permanently leaking) the calling request goroutine.
func (s *Session) UpdateDuration(d time.Duration) {
	select {
	case s.durationUpdate <- d:
	case <-s.closed:
	default:
	}
}

// Username returns the session's username.
func (s *Session) Username() string {
	return s.username
}

// Address returns the user's email address, worked out once, at sign-in. A
// login with an "@" is its own address. One without is a user name, which
// some IMAP servers sign users in with and which the multi provider completes
// with its default_domain to choose a backend: the provider names the address
// it stands for when it can. Otherwise the login is all there is.
func (s *Session) Address() string {
	if s.address == "" {
		return s.username
	}
	return s.address
}

// Password returns the session's password.
func (s *Session) Password() string {
	return s.password
}

// CheckPassword reports whether password is the one this session signed in
// with, for a change that must be confirmed by someone who knows it rather
// than by whoever holds the session.
//
// Both sides are hashed before the constant-time comparison, because
// subtle.ConstantTimeCompare returns at once when the lengths differ, and so
// would tell a guesser the password's length. The password is never sent
// anywhere to be checked, so a check cannot fail for want of a server.
func (s *Session) CheckPassword(password string) bool {
	given := sha256.Sum256([]byte(password))
	held := sha256.Sum256([]byte(s.password))
	return s.password != "" && subtle.ConstantTimeCompare(given[:], held[:]) == 1
}

// Token returns the session's token.
func (s *Session) Token() string {
	return s.token
}

// ID names the session in the log without giving away its token.
func (s *Session) ID() string {
	return s.id
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
	s.authenticated2FA.Store(authenticated)
}

// IsAuthenticated2FA returns whether this session has completed 2FA verification.
func (s *Session) IsAuthenticated2FA() bool {
	return s.authenticated2FA.Load()
}

// Requires2FA returns whether this session requires 2FA verification.
func (s *Session) Requires2FA() bool {
	return s.requires2FA.Load()
}

// secondFactorRecheckInterval is how often a session that has not given the
// second factor, of an account not known to have a key, reads the account's
// WebAuthn record again while it is being used.
//
// It bounds how long a session opened before the account's first key keeps
// its access on the nodes RequireSecondFactor does not reach. A minute is
// short beside the days such a session could otherwise last, and long enough
// that the read, one small METADATA fetch on the session's own connection,
// costs little beside the mail requests a session in use makes meanwhile. A
// tab left open and unused asks only every five minutes, and reads no oftener.
const secondFactorRecheckInterval = time.Minute

// needsSecondFactor reports whether this session must give the account's
// second factor before it goes on. The auth middleware asks it on every
// request.
//
// Whether the account has a key is read when the session is opened. A session
// that has not given the second factor, of an account that had no key then,
// reads it again from the server, not from its connection's copy, at most once
// every secondFactorRecheckInterval while it is used; once the account has a
// key, the session needs it from then on. A session that has given the second
// factor, or that already needs it, reads nothing. When another node says the
// account has enrolled a key (see readSecondFactorAgain), the next request
// reads at once rather than at the end of the interval.
//
// Only one request of a session reads; its other requests meanwhile go on as
// the session stood, rather than wait on the read. A read that fails says
// nothing either way: the session goes on as it stood, and the next interval
// reads again. A failure here must not sign anyone out.
func (s *Session) needsSecondFactor() bool {
	if s.IsAuthenticated2FA() {
		return false
	}
	if !s.Requires2FA() && s.manager != nil {
		s.recheckSecondFactor()
	}
	return s.Requires2FA() && !s.IsAuthenticated2FA()
}

// secondFactorReadDue reports whether the account's record is to be read
// again: it has not been for an interval, or it never was, or another node
// has said since that the account enrolled a key.
func (s *Session) secondFactorReadDue() bool {
	if s.secondFactorNews.Load() {
		return true
	}
	last := s.secondFactorReadAt.Load()
	return last == nil || s.manager.now().Sub(*last) >= secondFactorRecheckInterval
}

// noteSecondFactorRead records that the account's record was read, or that a
// read was tried, just now.
func (s *Session) noteSecondFactorRead() {
	now := s.manager.now()
	s.secondFactorReadAt.Store(&now)
}

// recheckSecondFactor reads the account's record again when it is due, and
// marks the session as needing the second factor when the account has a key.
func (s *Session) recheckSecondFactor() {
	if !s.secondFactorReadDue() {
		return
	}
	if !s.secondFactorReading.CompareAndSwap(false, true) {
		return // another request of this session is reading it
	}
	defer s.secondFactorReading.Store(false)
	// Read by a request that finished while this one got here.
	if !s.secondFactorReadDue() {
		return
	}
	// Cleared before the read, so that news arriving during it is read again.
	s.secondFactorNews.Store(false)

	enabled, err := s.webAuthnEnabled()
	s.noteSecondFactorRead()
	if err != nil {
		s.manager.logger.Debugf("Second factor: could not read whether %s has a security key, reading again in %v: %v",
			s.username, secondFactorRecheckInterval, err)
		return
	}
	if enabled {
		s.requires2FA.Store(true)
	}
}

// connect opens a connection to the mail server for the session, which keeps
// its verdicts in the session's cache: see shareVerdicts.
func (s *Session) connect() (provider.MailProvider, error) {
	p, err := s.manager.connectProvider(s.username, s.password)
	if err == nil {
		s.shareVerdicts(p)
	}
	return p, err
}

// shareVerdicts has p, a connection the session has just opened, keep the
// verdicts it reads in the session's cache. They were each connection's own,
// and a session does not keep one connection for good: it opens another when
// the mail server drops it, and when it gives up on one a request left busy.
// Each new one read every verdict again, from each stored message, while the
// user's requests waited behind it.
func (s *Session) shareVerdicts(p provider.MailProvider) {
	if vs, ok := p.(provider.VerdictSharer); ok {
		vs.ShareVerdicts(&s.verdicts)
	}
}

// DoMail executes a mail operation using the provider. The provider can only
// be used from inside f.
func (s *Session) DoMail(f func(provider.MailProvider) error) error {
	return s.DoMailWithContext(context.Background(), f)
}

// DoMailWithContext executes a mail operation for a request whose context is
// ctx.
//
// A request given up on (the browser timed out, or the page went away) while
// it waited for the connection, or while the connection was opened for it,
// does no mail work: no one will read the answer, and the requests queued
// behind it would wait for it. One given up on while its operation runs lets
// the operation finish, and the connection stays open: see runMail. Mail work
// that ends something already done elsewhere, such as filing a message the
// SMTP server has taken, is not the request's to give up: it runs with
// FinishMail.
func (s *Session) DoMailWithContext(ctx context.Context, f func(provider.MailProvider) error) error {
	return s.doMail(ctx, f, true)
}

// FinishMail is DoMailWithContext for mail work that finishes something
// already done elsewhere, such as filing a message the SMTP server has taken.
// It runs even when its request was given up on before its turn, and after a
// network error it is tried again on a new connection as if the request still
// waited. Once its request is given up on, it holds the connection no longer
// than any other operation whose request was given up on (see runMail). Run
// with DoMail, which never gives up, an operation on a connection that no
// longer answers would hold every request of the session for good, where the
// browser giving up used to let that connection go.
func (s *Session) FinishMail(ctx context.Context, f func(provider.MailProvider) error) error {
	return s.doMail(ctx, f, false)
}

// doMail runs f on the session's connection for DoMailWithContext, and for
// FinishMail when mayGiveUp is false.
func (s *Session) doMail(ctx context.Context, f func(provider.MailProvider) error, mayGiveUp bool) error {
	s.providerLocker.Lock()
	defer s.providerLocker.Unlock()

	if err := ctx.Err(); err != nil && mayGiveUp {
		return fmt.Errorf("context cancelled: %w", err)
	}

	if s.provider == nil {
		var err error
		// The session's background connection, when it holds one that is
		// idle, rather than another: see takeIdleBackground.
		if s.provider = s.takeIdleBackground(); s.provider == nil {
			s.provider, err = s.connect()
		}
		if err != nil && atConnectionLimit(err) {
			// At the account's connection limit, the background connection
			// instead, once the operation running on it has returned: see
			// reclaimBackground.
			var waitErr error
			if s.provider, waitErr = s.reclaimBackground(ctx); waitErr != nil {
				s.forgetStoreEntries()
				return fmt.Errorf("context cancelled: %w", waitErr)
			}
			if s.provider != nil {
				err = nil
			}
		}
		s.forgetStoreEntries()
		if err != nil {
			s.CloseWithReason("mail-server-unavailable")
			// Wrap with %w so errors.As can still recover an AuthError (bad
			// credentials), and join the sentinel so handleError logs the user
			// out on a dead connection instead of looping on 500s.
			return fmt.Errorf("failed to connect to mail provider: %w", errors.Join(ErrMailProviderUnavailable, err))
		}
		s.noteThreadCapability(s.provider)
	}

	// Given up on while the connection was opened for it, a request does no
	// mail work either. The connection stays open for the next one.
	if err := ctx.Err(); err != nil && mayGiveUp {
		return fmt.Errorf("context cancelled: %w", err)
	}

	err := s.runMail(ctx, f, "IMAP operation")

	// If we get a connection error, try once more with a fresh connection
	if err != nil && isNetworkError(err) {
		s.provider.Close()
		s.provider = nil
		// No one is waiting for the retry; the next request connects.
		if ctx.Err() != nil && mayGiveUp {
			return err
		}

		var reErr error
		s.provider, reErr = s.connect()
		if reErr != nil && atConnectionLimit(reErr) {
			// A server that will not let the account open another connection
			// still answers on the background one the session holds, once the
			// operation running on it has returned. Not a server that refused
			// the password, nor one that could not be reached: the session
			// ends then, as it did before it had one.
			var waitErr error
			if s.provider, waitErr = s.reclaimBackground(ctx); waitErr != nil {
				s.forgetStoreEntries()
				return fmt.Errorf("context cancelled: %w", waitErr)
			}
			if s.provider != nil {
				reErr = nil
			}
		}
		s.forgetStoreEntries()
		if reErr != nil {
			s.CloseWithReason("mail-server-unavailable")
			return fmt.Errorf("failed to re-connect to mail provider: %w", errors.Join(ErrMailProviderUnavailable, reErr))
		}
		s.noteThreadCapability(s.provider)

		err = s.runMail(ctx, f, "IMAP operation (retry)")
	}

	return err
}

// noteThreadCapability records whether p's server can thread. Without a saved
// threading preference that decides whether a listing is threaded, and the
// listing's cached pages are named by it.
func (s *Session) noteThreadCapability(p provider.MailProvider) {
	type threadCapable interface {
		HasThreadCapability() bool
	}
	if tc, ok := p.(threadCapable); ok {
		s.SetData("hasThreadCapability", tc.HasThreadCapability())
	}
}

// abandonedOperationWait is how long a mail operation whose request was given
// up on may go on holding the session's connection.
//
// A request is given up on when the browser stops waiting for it (after 25
// seconds), or when the page goes away. Neither says anything about the
// connection, and closing it cost the next request a new connection and
// sign-in, and everything the old one had learned: its cache of the store,
// the verdicts and dates it had read. So the operation is let finish, and the
// connection kept. But one that does not finish, on a connection that no
// longer answers, would hold the session's every request; past this wait the
// connection is let go as it used to be.
const abandonedOperationWait = 10 * time.Second

// runMail runs f on the session's connection, waits for it and returns what
// it returned. The caller holds providerLocker.
//
// When ctx is done first, it waits on for up to abandonedOperationWait. If f
// has not returned by then, the connection is let go: it is closed once f
// returns, never while a command of f's is still in flight on it, and the next
// request opens another.
func (s *Session) runMail(ctx context.Context, f func(provider.MailProvider) error, what string) error {
	// done is buffered, so f's send never blocks once runMail has returned.
	done := make(chan error, 1)
	go func(p provider.MailProvider) {
		defer func() {
			if r := recover(); r != nil {
				done <- fmt.Errorf("panic in %s: %v", what, r)
			}
		}()
		done <- f(p)
	}(s.provider)

	select {
	case err := <-done:
		return err
	case <-ctx.Done():
	}

	wait := time.NewTimer(s.manager.abandonedWait)
	defer wait.Stop()
	select {
	case err := <-done:
		return err
	case <-wait.C:
		s.giveUpConnection(s.provider, done)
		s.provider = nil
		return fmt.Errorf("context cancelled: %w", ctx.Err())
	}
}

// smtpMaxAttempts is the number of times DoSMTP tries an operation before
// giving up. The SMTP relay is trusted, so transient failures (connection
// drops, temporary 4xx responses) are worth retrying.
const smtpMaxAttempts = 3

// DoSMTP executes an SMTP operation on this session. The SMTP client can only
// be used from inside f.
//
// A failed attempt is made again, on a fresh connection, only when its
// failure may pass: a failed connection, or a temporary (4xx) reply. Any
// other failure is returned at once, as another attempt would meet it again:
// bad credentials, a permanent (5xx) reply, or an error of f's own, such as an
// address it cannot parse. DoSMTP sees only what f wraps (with %w) of a
// failure, so f must not wrap a failed connection once the server may have
// what f sent: sent again, it would arrive twice. f must be safe to call more
// than once.
func (s *Session) DoSMTP(f func(*smtp.Client) error) error {
	var err error
	for attempt := 1; attempt <= smtpMaxAttempts; attempt++ {
		err = s.doSMTP(f)
		if err == nil || !smtpMayPass(err) {
			return err
		}

		if attempt < smtpMaxAttempts {
			time.Sleep(time.Duration(attempt) * time.Second)
		}
	}
	return fmt.Errorf("SMTP operation failed after %d attempts: %v", smtpMaxAttempts, err)
}

// smtpMayPass reports whether a failed SMTP attempt may pass when it is made
// again. Re-dialing will not fix bad credentials, whatever the reply to them.
func smtpMayPass(err error) bool {
	var authErr provider.AuthError
	if errors.As(err, &authErr) {
		return false
	}
	var smtpErr *smtp.SMTPError
	if errors.As(err, &smtpErr) {
		return smtpErr.Temporary()
	}
	var netErr net.Error
	return errors.As(err, &netErr) || errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF)
}

// doSMTP performs a single SMTP attempt: dial, authenticate, run f, quit.
func (s *Session) doSMTP(f func(*smtp.Client) error) error {
	c, err := s.manager.dialSMTP(s.username)
	if err != nil {
		return err
	}
	defer c.Close()

	// Auth would read the server's greeting and say EHLO first, and its
	// error would not tell their failures from a refusal of the
	// credentials: a busy server's 421, or a connection lost before AUTH,
	// was taken for a bad password, and not tried again. Hello says EHLO
	// as the client would, under the name it gives by default.
	if err := c.Hello("localhost"); err != nil {
		return err
	}

	// Only the server's reply to AUTH refuses the credentials. A connection
	// lost during the exchange is a failed connection like any other.
	auth := sasl.NewPlainClient("", s.username, s.password)
	if err := c.Auth(auth); err != nil {
		var smtpErr *smtp.SMTPError
		if errors.As(err, &smtpErr) {
			return provider.AuthError{Cause: err}
		}
		return err
	}

	if err := f(c); err != nil {
		return err
	}

	// f has done what it came for: a message it sent, the server has taken.
	// A QUIT that fails changes nothing of that; reported as a failure, it
	// would have the message sent again.
	if err := c.Quit(); err != nil {
		s.manager.logger.Debugf("SMTP QUIT failed after the operation succeeded: %v", err)
	}

	return nil
}

// SetHTTPBasicAuth adds an Authorization header field to the request with
// this session's credentials.
func (s *Session) SetHTTPBasicAuth(req *http.Request) {
	// TODO: find a way to make it harder for plugins to steal credentials
	req.SetBasicAuth(s.username, s.password)
}

// teardown releases every resource the session owns: composer attachments (and
// their global-budget accounting), the mail provider connection, and the cache.
// It is idempotent and safe to call from multiple goroutines — only the first
// call does the work — so every exit path (logout, eviction, natural expiry)
// can call it without risking a double free or a leaked resource. Previously
// each exit path cleaned up a different subset, which is how expiring sessions
// leaked their attachments and permanently inflated the global budget.
func (s *Session) teardown() {
	s.teardownOnce.Do(func() {
		// First, so that the pages' event streams end with the session, not
		// once the work in flight on its connection has returned.
		s.push.end()

		s.attachmentsLocker.Lock()
		for _, f := range s.attachments {
			f.Form.RemoveAll()
			s.manager.globalAttachmentSize.Add(-f.File.Size)
		}
		s.attachments = make(map[string]*Attachment)
		s.attachmentsGone = true
		s.attachmentsLocker.Unlock()

		s.providerLocker.Lock()
		if s.provider != nil {
			s.provider.Close()
			s.provider = nil
		}
		s.providerLocker.Unlock()
		s.letGoOfBackground(true)

		if s.cache != nil {
			s.cache.Close()
		}
	})
}

// Close destroys the session. This can be used to log the user out. It signals
// the timeout goroutine to exit, which then runs teardown() to release the
// session's resources. Teardown is deliberately left to the goroutine (which
// runs it before taking sm.locker) so that closing the provider — potentially
// blocking on an in-flight mail operation — never happens while a caller holds
// sm.locker (e.g. eviction), which would stall every other session. Close is
// safe to call more than once and from multiple goroutines concurrently.
func (s *Session) Close() {
	s.CloseWithReason("closed")
}

// CloseWithReason is Close, saying why for the line that records the session's
// end. Only the first close's reason counts.
func (s *Session) CloseWithReason(reason string) {
	s.closeOnce.Do(func() {
		s.endReason = reason
		close(s.closed)
	})
}

// MaxAttachmentSize is the per-composer attachment budget in bytes, after
// defaults have been applied. Exposed so the HTTP layer can bound the REQUEST
// as well as what it keeps: PutAttachment can only refuse an upload that has
// already been read to disk.
func (sm *SessionManager) MaxAttachmentSize() int64 {
	return sm.maxAttachmentSize
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

// ReturnAttachment gives back, under its id, an attachment a request took
// with PopAttachment and did not use up, as when the message it was for could
// not be stored or sent: it is there for the next try. If the session has
// ended meanwhile, its file is removed instead, as the session's own were.
func (s *Session) ReturnAttachment(uuid string, a *Attachment) {
	s.attachmentsLocker.Lock()
	defer s.attachmentsLocker.Unlock()
	if s.attachmentsGone {
		a.Form.RemoveAll()
		return
	}
	s.attachments[uuid] = a
	s.manager.globalAttachmentSize.Add(a.File.Size)
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

// sessionStore is the store of the session's account, read and written on the
// session's connection. When the connection's store keeps a copy of each entry
// it has read or written, as the IMAP store does, the session keeps the same
// copy, and Get answers from it without the connection.
//
// Every listing and every message opened reads the settings. Each read waited
// for the connection, behind whatever it was doing, such as building a
// conversation, searching across folders or saving a draft, and opened a new
// one if it had been closed, only for the connection to answer from its own
// copy.
//
// What the session keeps changes with the connection's own copy of the entry,
// and lasts until the session connects again, when the new connection starts
// without one: GetFresh reads past both, a read that fails leaves neither, and
// both change with every write the connection makes. An entry found missing is
// kept as missing for as long, so a read that must see what another session
// wrote since reads fresh. A store that keeps no copy, such as the maildir
// store, which reads its file every time, is read on the connection every
// time, as before.
type sessionStore struct {
	session *Session
}

func (ss *sessionStore) Get(key string, out interface{}) error {
	if raw, ok := ss.session.storeEntry(key); ok {
		return decodeStoreEntry(key, raw, out)
	}
	return ss.read(key, out, provider.Store.Get)
}

func (ss *sessionStore) GetFresh(key string, out interface{}) error {
	return ss.read(key, out, provider.GetFresh)
}

// read reads key from the connection's store with get into out. From a store
// that keeps copies, the entry is read whole, as the JSON the store holds,
// whatever part of it out has room for, and kept: the next reader may want
// another part of it.
func (ss *sessionStore) read(key string, out interface{}, get func(provider.Store, string, interface{}) error) error {
	var raw json.RawMessage
	kept := false
	err := ss.session.DoMailWithContext(context.Background(), func(p provider.MailProvider) error {
		store, err := p.GetStore()
		if err != nil {
			return err
		}
		if !keepsCopies(store) {
			return get(store, key, out)
		}
		kept = true
		err = get(store, key, &raw)
		switch {
		case err == nil:
			ss.session.keepStoreEntry(key, raw)
		case errors.Is(err, provider.ErrNoStoreEntry):
			ss.session.keepStoreEntry(key, nil)
		default:
			// The connection's store may have dropped its own copy, as a fresh
			// read does before it asks, and will ask again; so does the session.
			ss.session.forgetStoreEntry(key)
		}
		return err
	})
	if err != nil || !kept {
		return err
	}
	return decodeStoreEntry(key, raw, out)
}

func (ss *sessionStore) Put(key string, v interface{}) error {
	return ss.session.DoMailWithContext(context.Background(), func(p provider.MailProvider) error {
		store, err := p.GetStore()
		if err != nil {
			return err
		}
		if err := store.Put(key, v); err != nil {
			// Whether the server took it is not known; the next read asks.
			ss.session.forgetStoreEntry(key)
			return err
		}
		if !keepsCopies(store) {
			return nil
		}
		if v == nil {
			ss.session.keepStoreEntry(key, nil)
		} else if raw, err := json.Marshal(v); err == nil {
			ss.session.keepStoreEntry(key, raw)
		} else {
			ss.session.forgetStoreEntry(key)
		}
		return nil
	})
}

// keepsCopies reports whether store keeps a copy of each entry it has read or
// written, for as long as its connection lasts: a store that can read past its
// copy has one. Only such a store's entries are kept by the session. Any other
// is read where the entries are kept, every time, and a copy of what it read
// would be older than what it reads next.
func keepsCopies(store provider.Store) bool {
	_, ok := store.(provider.FreshStore)
	return ok
}

// decodeStoreEntry decodes an entry the store holds as raw into out. A nil raw
// is an entry that is not there.
func decodeStoreEntry(key string, raw json.RawMessage, out interface{}) error {
	if raw == nil {
		return provider.ErrNoStoreEntry
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return fmt.Errorf("failed to decode store entry %q: %w", key, err)
	}
	return nil
}

// storeEntry returns the session's copy of the store entry key, and whether it
// has one; a nil copy is an entry that is not there.
func (s *Session) storeEntry(key string) (json.RawMessage, bool) {
	s.storeEntriesLocker.RLock()
	defer s.storeEntriesLocker.RUnlock()
	raw, ok := s.storeEntries[key]
	return raw, ok
}

// keepStoreEntry keeps raw as the session's copy of the store entry key, nil
// for one that is not there. The caller holds providerLocker.
func (s *Session) keepStoreEntry(key string, raw json.RawMessage) {
	s.storeEntriesLocker.Lock()
	defer s.storeEntriesLocker.Unlock()
	if s.storeEntries == nil {
		s.storeEntries = make(map[string]json.RawMessage)
	}
	s.storeEntries[key] = raw
}

// forgetStoreEntry drops the session's copy of the store entry key. The
// caller holds providerLocker.
func (s *Session) forgetStoreEntry(key string) {
	s.storeEntriesLocker.Lock()
	defer s.storeEntriesLocker.Unlock()
	delete(s.storeEntries, key)
}

// forgetStoreEntries drops every copy the session keeps, when it connects
// again: the new connection's store has read nothing yet. The caller holds
// providerLocker.
func (s *Session) forgetStoreEntries() {
	s.storeEntriesLocker.Lock()
	defer s.storeEntriesLocker.Unlock()
	s.storeEntries = nil
}

// Store returns a store suitable for storing persistent user data.
func (s *Session) Store() provider.Store {
	return &sessionStore{session: s}
}

type (
	// DialSMTPFunc connects to the upstream SMTP server for a given login.
	// The username decides the submission server when the provider routes it
	// per domain; providers that do not route ignore it.
	DialSMTPFunc func(username string) (*smtp.Client, error)
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
	absoluteSessionDuration  time.Duration
	maxSessions              int   // Maximum total sessions (0 = unlimited)
	maxSessionsPerUser       int   // Maximum sessions per username (0 = unlimited)
	maxAttachmentSize        int64 // Max attachment size per composer in bytes
	maxSessionAttachmentSize int64 // Max attachment size per session in bytes
	maxGlobalAttachmentSize  int64 // Max global attachment size in bytes

	globalAttachmentSize atomic.Int64 // Tracks current total attachment size across all sessions

	// now is the clock that decides when a session reads its account's
	// WebAuthn record again (see needsSecondFactor), so that a test can move
	// it on rather than wait.
	now func() time.Time

	// abandonedWait is abandonedOperationWait, held here so that a test can
	// shorten it rather than wait.
	abandonedWait time.Duration

	// broadcaster reaches the other nodes of a cluster, or is nil when this
	// node is alone. See RequireSecondFactor.
	broadcaster ClusterBroadcaster

	// addresses completes a login that is not an address, or is nil when the
	// provider cannot. See Session.Address.
	addresses provider.AddressResolver

	// Whether sessions do the mail work the user is not waiting for on a
	// background connection, and how long one may go unused before it is
	// closed. See DoBackgroundMail.
	backgroundConnections bool
	backgroundIdle        time.Duration

	// Whether sessions wait on that connection for the mail server's news of
	// the Inbox while a page watches it, and the pauses of that wait. See
	// Session.WatchInbox.
	pushNewMail bool
	pushRestart time.Duration
	pushResume  time.Duration
	pushRetry   time.Duration

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
		absoluteSessionDuration:  defaultAbsoluteSessionDuration,
		maxSessions:              maxSessions,
		maxSessionsPerUser:       maxSessionsPerUser,
		maxAttachmentSize:        int64(maxAttachmentMiB) << 20,
		maxSessionAttachmentSize: int64(maxSessionAttachmentMiB) << 20,
		maxGlobalAttachmentSize:  int64(maxGlobalAttachmentMiB) << 20,
		now:                      time.Now,
		backgroundIdle:           backgroundIdleTimeout,
		abandonedWait:            abandonedOperationWait,
		pushRestart:              pushRestartAfter,
		pushResume:               pushResumeAfter,
		pushRetry:                pushRetryAfter,
	}
}

func (sm *SessionManager) Close() {
	// Snapshot the sessions under the lock, then close them without holding it.
	// Each Close() wakes the session's timeout goroutine, which removes itself
	// from sm.sessions under the same lock; iterating the live map here would be
	// a concurrent map iteration/write and crash the process during shutdown.
	sm.locker.Lock()
	sessions := make([]*Session, 0, len(sm.sessions))
	for _, s := range sm.sessions {
		sessions = append(sessions, s)
	}
	sm.locker.Unlock()

	for _, s := range sessions {
		s.CloseWithReason("shutdown")
	}
}

// calculateSessionDuration determines the effective session duration for a user.
func (sm *SessionManager) calculateSessionDuration(store provider.Store) time.Duration {
	type UserSettings struct {
		AutoLogout *int `json:"auto_logout,omitempty"`
	}

	var settings UserSettings
	err := store.Get("base.settings", &settings)
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

// absoluteDeadlineFrom returns the instant a session created at `start` must
// end, or the zero time when no cap is configured.
//
// Floored at the idle window, because a cap BELOW it would silently redefine
// the idle window as the shorter of the two — a misconfiguration that reads as
// "sessions last 30 minutes of inactivity" everywhere while behaving as
// something else entirely.
func (sm *SessionManager) absoluteDeadlineFrom(start time.Time) time.Time {
	if sm.absoluteSessionDuration <= 0 {
		return time.Time{}
	}
	d := sm.absoluteSessionDuration
	if sm.sessionDuration > d {
		d = sm.sessionDuration
	}
	return start.Add(d)
}

// nextTimeout is how long the timeout goroutine should wait before ending the
// session: the idle window, or whatever is left of the absolute cap, whichever
// comes first. A non-positive result means the cap has already passed.
// When idle timeout is disabled (s.duration <= 0), it waits until the absolute
// deadline, or for 1 year if no absolute deadline is configured.
func (s *Session) nextTimeout() time.Duration {
	if !s.absoluteDeadline.IsZero() {
		remaining := time.Until(s.absoluteDeadline)
		if remaining <= 0 {
			return 0
		}
		if s.duration <= 0 || remaining < s.duration {
			return remaining
		}
		return s.duration
	}
	if s.duration <= 0 {
		return 8760 * time.Hour
	}
	return s.duration
}

// ending says why the session's timeout goroutine stopped: the reason it was
// closed with, or, when its timer ran out, which of its two limits was reached.
func (s *Session) ending() string {
	select {
	case <-s.closed:
		return s.endReason
	default:
	}
	if !s.absoluteDeadline.IsZero() && !time.Now().Before(s.absoluteDeadline) {
		return "max-age"
	}
	return "idle"
}

func (sm *SessionManager) connectProvider(username, password string) (provider.MailProvider, error) {
	return sm.connectProviderFunc(username, password)
}

// addressOf is the email address of the user who signs in as username: see
// Session.Address.
func (sm *SessionManager) addressOf(username string) string {
	if strings.Contains(username, "@") || sm.addresses == nil {
		return username
	}
	if addr := sm.addresses.AddressOf(username); addr != "" {
		return addr
	}
	return username
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
			t := time.Unix(0, oldestTime)
			sm.logger.Printf("Evicting oldest session due to global limit: session=%s, username=%s, last_access=%v",
				session.id, session.username, t)
			session.CloseWithReason("evicted")
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
			t := time.Unix(0, oldestTime)
			sm.logger.Printf("Evicting oldest session for user due to per-user limit: session=%s, username=%s, last_access=%v",
				session.id, username, t)
			session.CloseWithReason("evicted")
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
	// Note: Do NOT defer p.Close() here - the provider is stored in the session
	// and will be closed when the session is closed. Closing it here would leave
	// the session with a dead connection.

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
		address:        sm.addressOf(username),
		attachments:    make(map[string]*Attachment),
		cache:          cache,
		duration:       sm.sessionDuration, // updated from user settings below
	}
	// Recorded here as well as on a reconnect, since the session keeps the
	// connection it signed in with. Until it was, a new session without a
	// saved preference filed its threaded pages as unthreaded, and served one
	// of them when threading was turned off in another browser.
	s.noteThreadCapability(p)
	s.created = time.Now()
	s.absoluteDeadline = sm.absoluteDeadlineFrom(s.created)
	s.lastAccess.Store(s.created.UnixNano())
	s.shareVerdicts(p)

	// Read the user's settings (auto-logout duration, 2FA) BEFORE taking the
	// manager lock: these go through the session's provider as IMAP round trips,
	// and holding sm.locker across them would serialize every login and block
	// all other sessions' requests on one user's network latency.
	s.duration = sm.calculateSessionDuration(s.Store())
	// A sign-in whose second factor cannot be looked up does not go ahead
	// without one. It used to, whenever the record could not be read.
	requires2FA, err := s.webAuthnEnabled()
	if err != nil {
		s.teardown() // the read may have replaced or dropped p
		return nil, fmt.Errorf("failed to check whether %s signs in with 2FA: %w", username, err)
	}
	s.requires2FA.Store(requires2FA)
	s.noteSecondFactorRead()

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
			p.Close() // Clean up provider on error
			cache.Close()
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
		p.Close() // Clean up provider on error
		cache.Close()
		return nil, fmt.Errorf("failed to generate unique session token after %d attempts (possible RNG failure or token space exhaustion)", maxTokenRetries)
	}

	s.token = token
	s.id = sessionLogID(token)

	// Track the session
	sm.sessions[token] = s
	sm.userSessions[username] = append(sm.userSessions[username], token)

	go func() {
		defer func() {
			if r := recover(); r != nil {
				sm.logger.Errorf("panic in session timeout goroutine: %v", r)
			}
		}()
		timer := time.NewTimer(s.nextTimeout())
		defer timer.Stop()

		// Every reset goes through nextTimeout, so a ping can push the idle
		// window forward but never past the absolute deadline. Without this the
		// timer was reset to the full idle window on each ping and the session
		// slid indefinitely.
		rearm := func() bool {
			d := s.nextTimeout()
			timer.Stop()
			if d <= 0 {
				return false
			}
			timer.Reset(d)
			return true
		}

		alive := true
		for alive {
			select {
			case <-s.pings:
				// Go 1.23+ timer channels are unbuffered and Stop guarantees no
				// stale value is delivered afterwards, so the old drain pattern
				// (`if !timer.Stop() { <-timer.C }`) is unnecessary and can now
				// deadlock if the timer fires as a ping arrives.
				alive = rearm()
			case newDuration := <-s.durationUpdate:
				s.duration = newDuration
				alive = rearm()
			case <-timer.C:
				alive = false
			case <-s.closed:
				alive = false
			}
		}

		// Release all resources (attachments — including natural expiry, which
		// previously leaked them — the provider connection, and the cache).
		s.teardown()

		// A session is not ended by a restart: the browser's login token signs
		// it back in, and that is logged as a restore.
		if reason := s.ending(); s.issued.Load() && reason != "shutdown" {
			sm.logger.Slog().Info("session ended",
				"user", s.username,
				"session", s.id,
				"reason", reason,
				"duration", time.Since(s.created).Round(time.Second).String())
		}

		sm.locker.Lock()
		sm.removeSession(token)
		sm.locker.Unlock()
	}()

	return s, nil
}

// RequireSecondFactor asks every session of username for the account's second
// factor before it goes on, unless it has given it already. It is called once
// the account has enrolled a key: whether a session needs the second factor
// was decided when it was opened, so a session opened before the key kept full
// access until it ended, and was never asked for the key at all. The session
// that enrolled the key proved it in doing so, and is to be marked as having
// given it first.
//
// Usernames are matched without regard to case, as mail servers sign them in.
//
// Sessions are kept in this node's memory, so this reaches the sessions on
// this node only. A session another node holds finds the key when it next
// reads the account's record, within secondFactorRecheckInterval of being
// used: see needsSecondFactor. In a cluster, the other nodes are told as
// well, and their sessions of the account read the record on their next
// request (see readSecondFactorAgain); the message may be lost, or reach a
// node that does not know it, and the interval still holds.
func (sm *SessionManager) RequireSecondFactor(username string) {
	sm.locker.RLock()
	for _, s := range sm.sessions {
		if strings.EqualFold(s.username, username) {
			s.requires2FA.Store(true)
		}
	}
	sm.locker.RUnlock()

	if sm.broadcaster == nil {
		return
	}
	msg, err := encodeSecondFactorMessage(username)
	if err != nil {
		sm.logger.Printf("Second factor: could not tell the cluster that %s enrolled a key: %v", username, err)
		return
	}
	sm.broadcaster.Broadcast(msg)
}

// readSecondFactorAgain has every session of username on this node that may
// read the account's WebAuthn record read it on its next request, rather than
// at the end of its interval. Another node calls it, through the cluster,
// once the account has enrolled a key there.
//
// It does not mark the sessions as needing the key itself: the record on the
// server says whether the account has one, and a message, delayed or sent
// again, is not let decide that. A session that has given the second factor,
// or already needs it, still reads nothing.
func (sm *SessionManager) readSecondFactorAgain(username string) {
	sm.locker.RLock()
	defer sm.locker.RUnlock()
	for _, s := range sm.sessions {
		if strings.EqualFold(s.username, username) {
			s.secondFactorNews.Store(true)
		}
	}
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
	return sm.UpdatePasswordContext(context.Background(), s, newPassword)
}

// UpdatePasswordContext is UpdatePassword for a request: it gives up, and
// changes nothing, when ctx is done before the background connection is
// free.
func (sm *SessionManager) UpdatePasswordContext(ctx context.Context, s *Session, newPassword string) error {
	// The background connection is closed first, once the operation running
	// on it has returned: while the new password is checked the session holds
	// its own connection and the new one, and no background connection beside
	// them. The next background operation opens one with the password the
	// session has then. An IDLE on it ends for this, as for any background
	// operation.
	s.push.want()
	defer s.push.done()
	if err := s.background.jobs.LockContext(ctx); err != nil {
		return fmt.Errorf("context cancelled: %w", err)
	}
	defer s.background.jobs.Unlock()
	s.letGoOfBackground(false)

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
	s.shareVerdicts(provider)
	s.provider = provider
	s.forgetStoreEntries()
	s.password = newPassword

	return nil
}

// SetData stores transient session data
func (s *Session) SetData(key string, value interface{}) {
	s.memoryDataLock.Lock()
	defer s.memoryDataLock.Unlock()
	if s.memoryData == nil {
		s.memoryData = make(map[string]interface{})
	}
	s.memoryData[key] = value
}

// GetData retrieves transient session data
func (s *Session) GetData(key string) (interface{}, bool) {
	s.memoryDataLock.RLock()
	defer s.memoryDataLock.RUnlock()
	if s.memoryData == nil {
		return nil, false
	}
	val, ok := s.memoryData[key]
	return val, ok
}

// ClearData removes transient session data
func (s *Session) ClearData(key string) {
	s.memoryDataLock.Lock()
	defer s.memoryDataLock.Unlock()
	if s.memoryData != nil {
		delete(s.memoryData, key)
	}
}
