package alps

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"sync"
	"time"

	imapclient "github.com/emersion/go-imap/client"
	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// TODO: make this configurable
const sessionDuration = 30 * time.Minute
const maxAttachmentSize = 32 << 20 // 32 MiB

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
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

// Session is an active user session. It may also hold an IMAP connection.
//
// The session's password is not available to plugins. Plugins should use the
// session helpers to authenticate outgoing connections, for instance DoSMTP.
type Session struct {
	manager            *SessionManager
	username, password string
	token              string
	closed             chan struct{}
	pings              chan struct{}
	store              Store
	notice             string

	imapLocker sync.Mutex
	imapConn   *imapclient.Client // protected by locker, can be nil

	attachmentsLocker sync.Mutex
	attachments       map[string]*Attachment // protected by attachmentsLocker
}

type Attachment struct {
	File *multipart.FileHeader
	Form *multipart.Form
}

func (s *Session) ping() {
	s.pings <- struct{}{}
}

// Username returns the session's username.
func (s *Session) Username() string {
	return s.username
}

// DoIMAP executes an IMAP operation on this session. The IMAP client can only
// be used from inside f.
func (s *Session) DoIMAP(f func(*imapclient.Client) error) error {
	s.imapLocker.Lock()
	defer s.imapLocker.Unlock()

	if s.imapConn == nil {
		var err error
		s.imapConn, err = s.manager.connectIMAP(s.username, s.password)
		if err != nil {
			s.Close()
			return fmt.Errorf("failed to re-connect to IMAP server: %v", err)
		}
	}

	return f(s.imapConn)
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
	}

	select {
	case <-s.closed:
		// This space is intentionally left blank
	default:
		close(s.closed)
	}
}

// Puts an attachment and returns a generated UUID
func (s *Session) PutAttachment(in *multipart.FileHeader,
	form *multipart.Form) (string, error) {
	id := uuid.New()
	s.attachmentsLocker.Lock()

	var size int64
	for _, a := range s.attachments {
		size += a.File.Size
	}
	if size+in.Size > maxAttachmentSize {
		return "", ErrAttachmentCacheSize
	}

	s.attachments[id.String()] = &Attachment{
		File: in,
		Form: form,
	}
	s.attachmentsLocker.Unlock()
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

// Store returns a store suitable for storing persistent user data.
func (s *Session) Store() Store {
	return s.store
}

type (
	// DialIMAPFunc connects to the upstream IMAP server.
	DialIMAPFunc func() (*imapclient.Client, error)
	// DialSMTPFunc connects to the upstream SMTP server.
	DialSMTPFunc func() (*smtp.Client, error)
)

// SessionManager keeps track of active sessions. It connects and re-connects
// to the upstream IMAP server as necessary. It prunes expired sessions.
type SessionManager struct {
	dialIMAP DialIMAPFunc
	dialSMTP DialSMTPFunc
	logger   echo.Logger
	debug    bool

	locker   sync.Mutex
	sessions map[string]*Session // protected by locker
}

func newSessionManager(dialIMAP DialIMAPFunc, dialSMTP DialSMTPFunc, logger echo.Logger, debug bool) *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
		dialIMAP: dialIMAP,
		dialSMTP: dialSMTP,
		logger:   logger,
		debug:    debug,
	}
}

func (sm *SessionManager) Close() {
	for _, s := range sm.sessions {
		s.Close()
	}
}

func (sm *SessionManager) connectIMAP(username, password string) (*imapclient.Client, error) {
	c, err := sm.dialIMAP()
	if err != nil {
		return nil, err
	}

	if err := c.Login(username, password); err != nil {
		c.Logout()
		return nil, AuthError{err}
	}

	if sm.debug {
		c.SetDebug(os.Stderr)
	}

	return c, nil
}

func (sm *SessionManager) get(token string) (*Session, error) {
	sm.locker.Lock()
	defer sm.locker.Unlock()

	session, ok := sm.sessions[token]
	if !ok {
		return nil, ErrSessionExpired
	}
	return session, nil
}

// Put connects to the IMAP server and creates a new session. If authentication
// fails, the error will be of type AuthError.
func (sm *SessionManager) Put(username, password string) (*Session, error) {
	c, err := sm.connectIMAP(username, password)
	if err != nil {
		return nil, err
	}

	sm.locker.Lock()
	defer sm.locker.Unlock()

	var token string
	for {
		token, err = generateToken()
		if err != nil {
			c.Logout()
			return nil, err
		}

		if _, ok := sm.sessions[token]; !ok {
			break
		}
	}

	s := &Session{
		manager:     sm,
		closed:      make(chan struct{}),
		pings:       make(chan struct{}, 5),
		imapConn:    c,
		username:    username,
		password:    password,
		token:       token,
		attachments: make(map[string]*Attachment),
	}

	s.store, err = newStore(s, sm.logger)
	if err != nil {
		return nil, err
	}

	sm.sessions[token] = s

	go func() {
		timer := time.NewTimer(sessionDuration)

		alive := true
		for alive {
			var loggedOut <-chan struct{}
			s.imapLocker.Lock()
			if s.imapConn != nil {
				loggedOut = s.imapConn.LoggedOut()
			}
			s.imapLocker.Unlock()

			select {
			case <-loggedOut:
				s.imapLocker.Lock()
				s.imapConn = nil
				s.imapLocker.Unlock()
			case <-s.pings:
				if !timer.Stop() {
					<-timer.C
				}
				timer.Reset(sessionDuration)
			case <-timer.C:
				alive = false
			case <-s.closed:
				alive = false
			}
		}

		timer.Stop()

		s.imapLocker.Lock()
		if s.imapConn != nil {
			s.imapConn.Logout()
		}
		s.imapLocker.Unlock()

		sm.locker.Lock()
		delete(sm.sessions, token)
		sm.locker.Unlock()
	}()

	return s, nil
}
