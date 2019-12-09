package koushin

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"sync"

	imapclient "github.com/emersion/go-imap/client"
)

func generateToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

var ErrSessionExpired = errors.New("session expired")

type Session struct {
	locker             sync.Mutex
	imapConn           *imapclient.Client
	username, password string
}

func (s *Session) Do(f func(*imapclient.Client) error) error {
	s.locker.Lock()
	defer s.locker.Unlock()

	return f(s.imapConn)
}

// TODO: expiration timer
type SessionManager struct {
	locker   sync.Mutex
	sessions map[string]*Session
}

func NewSessionManager() *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
	}
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

func (sm *SessionManager) Put(imapConn *imapclient.Client, username, password string) (token string, err error) {
	sm.locker.Lock()
	defer sm.locker.Unlock()

	for {
		var err error
		token, err = generateToken()
		if err != nil {
			imapConn.Logout()
			return "", err
		}

		if _, ok := sm.sessions[token]; !ok {
			break
		}
	}

	sm.sessions[token] = &Session{
		imapConn: imapConn,
		username: username,
		password: password,
	}

	go func() {
		<-imapConn.LoggedOut()

		sm.locker.Lock()
		delete(sm.sessions, token)
		sm.locker.Unlock()
	}()

	return token, nil
}
