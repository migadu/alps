package koushin

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"sync"
	"time"

	imapclient "github.com/emersion/go-imap/client"
)

// TODO: make this configurable
const sessionDuration = 30 * time.Minute

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

var ErrSessionExpired = errors.New("session expired")

type AuthError struct {
	cause error
}

func (err AuthError) Error() string {
	return fmt.Sprintf("authentication failed: %v", err.cause)
}

type Session struct {
	manager            *SessionManager
	username, password string
	token              string
	closed             chan struct{}
	pings              chan struct{}
	timer              *time.Timer

	locker   sync.Mutex
	imapConn *imapclient.Client // protected by locker, can be nil
}

func (s *Session) Ping() {
	s.pings <- struct{}{}
}

func (s *Session) Do(f func(*imapclient.Client) error) error {
	s.locker.Lock()
	defer s.locker.Unlock()

	if s.imapConn == nil {
		var err error
		s.imapConn, err = s.manager.connect(s.username, s.password)
		if err != nil {
			s.Close()
			return fmt.Errorf("failed to re-connect to IMAP server: %v", err)
		}
	}

	return f(s.imapConn)
}

func (s *Session) Close() {
	select {
	case <-s.closed:
		// This space is intentionally left blank
	default:
		close(s.closed)
	}
}

type SessionManager struct {
	newIMAPClient func() (*imapclient.Client, error)

	locker   sync.Mutex
	sessions map[string]*Session // protected by locker
}

func newSessionManager(newIMAPClient func() (*imapclient.Client, error)) *SessionManager {
	return &SessionManager{
		sessions:      make(map[string]*Session),
		newIMAPClient: newIMAPClient,
	}
}

func (sm *SessionManager) connect(username, password string) (*imapclient.Client, error) {
	c, err := sm.newIMAPClient()
	if err != nil {
		return nil, err
	}

	if err := c.Login(username, password); err != nil {
		c.Logout()
		return nil, AuthError{err}
	}

	return c, nil
}

func (sm *SessionManager) Get(token string) (*Session, error) {
	sm.locker.Lock()
	defer sm.locker.Unlock()

	session, ok := sm.sessions[token]
	if !ok {
		return nil, ErrSessionExpired
	}
	return session, nil
}

func (sm *SessionManager) Put(username, password string) (*Session, error) {
	c, err := sm.connect(username, password)
	if err != nil {
		return nil, err
	}

	sm.locker.Lock()
	defer sm.locker.Unlock()

	var token string
	for {
		var err error
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
		manager:  sm,
		closed:   make(chan struct{}),
		pings:    make(chan struct{}, 5),
		imapConn: c,
		username: username,
		password: password,
		token:    token,
	}
	sm.sessions[token] = s

	go func() {
		timer := time.NewTimer(sessionDuration)

		alive := true
		for alive {
			var loggedOut <-chan struct{}
			s.locker.Lock()
			if s.imapConn != nil {
				loggedOut = s.imapConn.LoggedOut()
			}
			s.locker.Unlock()

			select {
			case <-loggedOut:
				s.locker.Lock()
				s.imapConn = nil
				s.locker.Unlock()
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

		if !timer.Stop() {
			<-timer.C
		}

		s.locker.Lock()
		if s.imapConn != nil {
			s.imapConn.Logout()
		}
		s.locker.Unlock()

		sm.locker.Lock()
		delete(sm.sessions, token)
		sm.locker.Unlock()
	}()

	return s, nil
}
