package alps

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/migadu/alps/provider"
)

// accountRecordLocks keeps one lock per account with work in progress. Waiters
// count as users too, so an entry cannot disappear while someone waits for it.
// The registry lock is never held across a mail operation.
type accountRecordLocks struct {
	mu       sync.Mutex
	accounts map[string]*accountRecordLock
}

type accountRecordLock struct {
	mu    sync.Mutex
	users int
}

func (locks *accountRecordLocks) lock(username string) func() {
	locks.mu.Lock()
	if locks.accounts == nil {
		locks.accounts = make(map[string]*accountRecordLock)
	}
	entry := locks.accounts[username]
	if entry == nil {
		entry = &accountRecordLock{}
		locks.accounts[username] = entry
	}
	entry.users++
	locks.mu.Unlock()
	entry.mu.Lock()
	return func() {
		entry.mu.Unlock()
		locks.mu.Lock()
		entry.users--
		if entry.users == 0 {
			delete(locks.accounts, username)
		}
		locks.mu.Unlock()
	}
}

// WebAuthnRecord is the account's record during WithWebAuthnRecord. It must
// only be used inside that callback. Read and Write share the account lock
// with every other session's credential updates, including recovery codes.
type WebAuthnRecord struct {
	session *Session
}

// WithWebAuthnRecord serializes the entire read-modify-write operation across
// this node's sessions of an account. Use record.Read inside f, rather than
// Session.ReadWebAuthn, which acquires the same lock. Other accounts can proceed.
// Bare logins resolved to an address and case variants share the lock.
// This is a local transaction; IMAP METADATA offers no cross-node transaction.
func (s *Session) WithWebAuthnRecord(f func(record *WebAuthnRecord) error) error {
	unlock := s.manager.webAuthnRecords.lock(strings.ToLower(s.Address()))
	defer unlock()
	return f(&WebAuthnRecord{session: s})
}

// Read reads fresh, including past a connection's cached copy. Removing a
// malformed record is a write too, so it happens under the same account lock.
func (record *WebAuthnRecord) Read(out interface{}) error {
	s := record.session
	err := provider.GetFresh(s.Store(), webAuthnKey, out)
	var typeErr *json.UnmarshalTypeError
	var syntaxErr *json.SyntaxError
	switch {
	case err == nil:
		return nil
	case errors.As(err, &typeErr) && typeErr.Field != "":
		return nil
	case errors.As(err, &typeErr) || errors.As(err, &syntaxErr):
		if putErr := record.Write(nil); putErr != nil {
			return fmt.Errorf("failed to remove unreadable WebAuthn record: %v", putErr)
		}
		s.manager.logger.Printf("Removed unreadable WebAuthn record of %s: %v", s.username, err)
		return provider.ErrNoStoreEntry
	default:
		return err
	}
}

// Write saves the record, or removes it when v is nil.
func (record *WebAuthnRecord) Write(v interface{}) error {
	return record.session.Store().Put(webAuthnKey, v)
}
