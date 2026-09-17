package main

import (
	"crypto/sha256"
	"errors"
	"sync"
	"time"

	"github.com/emersion/go-imap/v2/imapclient"
)

var errBadCredentials = errors.New("invalid credentials")

// credentials decides whether a username and password are good by asking the
// IMAP server, the only place in the stack that holds accounts.
//
// Asking rather than accepting anything is the point: the submission and DAV
// servers here would otherwise let a session with a stale or wrong password
// keep working, and a deleted account keep sending mail, which is exactly the
// kind of behaviour a browser test should be able to see fail.
//
// Answers are kept briefly. Every DAV request carries the password, and a
// login against the IMAP server costs a password hash on its side; a calendar
// page makes dozens of requests.
type credentials struct {
	imapAddr string
	ttl      time.Duration

	mu    sync.Mutex
	cache map[[32]byte]time.Time
}

func newCredentials(imapAddr string) *credentials {
	return &credentials{
		imapAddr: imapAddr,
		ttl:      5 * time.Second,
		cache:    make(map[[32]byte]time.Time),
	}
}

func (c *credentials) check(username, password string) error {
	if username == "" || password == "" {
		return errBadCredentials
	}
	key := sha256.Sum256([]byte(username + "\x00" + password))

	c.mu.Lock()
	until, ok := c.cache[key]
	c.mu.Unlock()
	if ok && time.Now().Before(until) {
		return nil
	}

	client, err := c.login(username, password)
	if err != nil {
		return err
	}
	_ = client.Logout().Wait()
	_ = client.Close()

	c.mu.Lock()
	c.cache[key] = time.Now().Add(c.ttl)
	c.mu.Unlock()
	return nil
}

// login opens an authenticated IMAP connection. The caller closes it.
func (c *credentials) login(username, password string) (*imapclient.Client, error) {
	client, err := imapclient.DialInsecure(c.imapAddr, nil)
	if err != nil {
		return nil, err
	}
	if err := client.Login(username, password).Wait(); err != nil {
		_ = client.Close()
		return nil, errBadCredentials
	}
	return client, nil
}
