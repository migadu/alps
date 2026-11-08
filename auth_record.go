package alps

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
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
	session      *Session
	version      *credentialVersion
	repair       error
	writeStarted bool
}

// WithWebAuthnRecord serializes the entire read-modify-write operation across
// this node's sessions of an account. Use record.Read inside f so the version
// protocol tracks the snapshot's ancestry. Other accounts can proceed.
// Bare logins resolved to an address and case variants share the lock.
// Shared METADATA stores use versioned proposals and a final fence validation.
// The local lock only reduces contention within an instance.
func (s *Session) WithWebAuthnRecord(f func(record *WebAuthnRecord) error) error {
	unlock := s.manager.webAuthnRecords.lock(strings.ToLower(s.Address()))
	defer unlock()
	record := &WebAuthnRecord{session: s}
	shared, err := s.SharedWebAuthnAvailable()
	if err == nil && shared {
		record.version, err = beginCredentialVersion(&sessionStore{session: s})
	}
	if err != nil {
		s.manager.logger.Errorf("WebAuthn coordination for %s: %v", s.Username(), err)
		return NewHTTPError(http.StatusServiceUnavailable, "security keys unavailable")
	}
	err = f(record)
	// Repair is staged so a malformed record followed by enrollment remains
	// one mutation. Publishing a cleanup first would give that partial change
	// the same ancestry ID as the later enrollment, falsely proving inclusion.
	if record.repair != nil && !record.writeStarted {
		if repairErr := record.Write(nil); repairErr != nil {
			s.manager.logger.Errorf("WebAuthn malformed-record repair for %s: %v", s.Username(), repairErr)
			return NewHTTPError(http.StatusServiceUnavailable, "security keys unavailable")
		}
		s.manager.logger.Printf("Removed unreadable WebAuthn record of %s: %v", s.Username(), record.repair)
	}
	if errors.Is(err, ErrWebAuthnConflict) {
		return NewHTTPError(http.StatusServiceUnavailable, "security keys unavailable; retry the operation")
	}
	return err
}

// Read reads fresh, including past a connection's cached copy. Removing a
// malformed record is a write too, so it happens under the same account lock.
func (record *WebAuthnRecord) Read(out interface{}) error {
	s := record.session
	err := s.readWebAuthnVersion(out, record.version)
	var typeErr *json.UnmarshalTypeError
	var syntaxErr *json.SyntaxError
	switch {
	case err == nil:
		return nil
	case errors.As(err, &typeErr) && typeErr.Field != "":
		return nil
	case errors.As(err, &typeErr) || errors.As(err, &syntaxErr):
		record.repair = err
		return provider.ErrNoStoreEntry
	default:
		return err
	}
}

// Write saves the record, or removes it when v is nil. A callback may write
// once; internal malformed-record repair is staged until that mutation.
func (record *WebAuthnRecord) Write(v interface{}) error {
	if record.writeStarted {
		return fmt.Errorf("credential callback may write only one mutation")
	}
	record.writeStarted = true
	if record.version == nil {
		return (&sessionStore{session: record.session}).putOnce(webAuthnKey, v)
	}
	var raw json.RawMessage
	if v != nil {
		var err error
		raw, err = json.Marshal(v)
		if err != nil {
			return err
		}
	}
	return record.version.commit(raw)
}

// readWebAuthn needs no proposal. A plain read sees the newest committed
// snapshot; abandoned proposals never hide it. Only repairing malformed data
// needs the update protocol. The old METADATA entry bootstraps the first read;
// a committed tombstone prevents a deleted record falling back to that entry.
func (s *Session) readWebAuthn(out interface{}) error {
	return s.readWebAuthnVersion(out, nil)
}

func (s *Session) readWebAuthnVersion(out interface{}, version *credentialVersion) error {
	shared, err := s.SharedWebAuthnAvailable()
	if err != nil {
		return err
	}
	if shared {
		versions, err := listCredentialVersions(&sessionStore{session: s})
		if err != nil {
			return err
		}
		if version != nil {
			if _, ok := versions.entries[version.key]; !ok {
				return ErrWebAuthnConflict
			}
		}
		if versions.committed != "" {
			envelope := versions.entries[versions.committed]
			if version != nil {
				version.parents = append([]string(nil), envelope.Applied...)
			}
			raw := envelope.Data
			if len(raw) == 0 || string(raw) == "null" {
				return provider.ErrNoStoreEntry
			}
			return json.Unmarshal(raw, out)
		}
	}
	return provider.GetFresh(s.Store(), webAuthnKey, out)
}
