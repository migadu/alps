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
	imapConn           *imapclient.Client
	username, password string
}

// TODO: expiration timer
type ConnPool struct {
	locker   sync.Mutex
	sessions map[string]*Session
}

func NewConnPool() *ConnPool {
	return &ConnPool{
		sessions: make(map[string]*Session),
	}
}

func (pool *ConnPool) Get(token string) (*Session, error) {
	pool.locker.Lock()
	defer pool.locker.Unlock()

	session, ok := pool.sessions[token]
	if !ok {
		return nil, ErrSessionExpired
	}
	return session, nil
}

func (pool *ConnPool) Put(imapConn *imapclient.Client, username, password string) (token string, err error) {
	pool.locker.Lock()
	defer pool.locker.Unlock()

	for {
		var err error
		token, err = generateToken()
		if err != nil {
			imapConn.Logout()
			return "", err
		}

		if _, ok := pool.sessions[token]; !ok {
			break
		}
	}

	pool.sessions[token] = &Session{
		imapConn: imapConn,
		username: username,
		password: password,
	}

	go func() {
		<-imapConn.LoggedOut()

		pool.locker.Lock()
		delete(pool.sessions, token)
		pool.locker.Unlock()
	}()

	return token, nil
}
