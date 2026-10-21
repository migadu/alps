package alps

import (
	"encoding/json"
	"fmt"
	"io"
	"sync"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
)

// rawStore keeps each entry as the bytes a server holds and decodes them as
// the IMAP store does. While down is set, every read fails with it.
type rawStore struct {
	mu      sync.Mutex
	entries map[string]string
	down    error
}

func (s *rawStore) Get(key string, out interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.down != nil {
		return s.down
	}
	raw, ok := s.entries[key]
	if !ok {
		return provider.ErrNoStoreEntry
	}
	if err := json.Unmarshal([]byte(raw), out); err != nil {
		return fmt.Errorf("store entry %q: %w", key, err)
	}
	return nil
}

func (s *rawStore) Put(key string, v interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if v == nil {
		delete(s.entries, key)
		return nil
	}
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	s.entries[key] = string(b)
	return nil
}

// Signing in looks up whether the account takes a second factor. A record
// that does not decode is removed and the account signs in without one, since
// kept it would stop every sign-in; a record that cannot be fetched stops the
// sign-in, which used to go ahead without the second factor.
func TestSessionManagerPut_SecondFactor(t *testing.T) {
	const on = `{"enabled": true, "credentials": [{"name": "key"}], "trust_linked_accounts": true}`
	cases := []struct {
		name       string
		record     string // none when empty
		down       error
		want2FA    bool
		wantTrust  bool
		wantRecord bool
		wantErr    bool
	}{
		{name: "on", record: on, want2FA: true, wantTrust: true, wantRecord: true},
		{name: "off", record: `{"enabled": false, "credentials": [{"name": "key"}]}`, wantRecord: true},
		{name: "without credentials", record: `{"enabled": true, "credentials": []}`, wantRecord: true},
		{name: "a value of another type", record: `{"enabled": "yes", "credentials": [{"name": "key"}], "trust_linked_accounts": true}`, wantTrust: true, wantRecord: true},
		{name: "none"},
		{name: "not JSON", record: `{"enabled": true, "credentials": [`},
		{name: "not an object", record: `"on"`},
		{name: "unreachable", record: on, down: io.EOF, wantRecord: true, wantErr: true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			store := &rawStore{entries: map[string]string{}, down: c.down}
			if c.record != "" {
				store.entries[webAuthnKey] = c.record
			}
			mockProvider := &provider.MockProvider{}
			mockProvider.On("Close").Return(nil)
			mockProvider.On("GetStore").Return(store, nil)
			mockProvider.On("HasThreadCapability").Return(false).Maybe()
			sm := newSessionManager(
				func(string, string) (provider.MailProvider, error) { return mockProvider, nil },
				nil, &NilLogger{}, time.Minute, false, nil, time.Hour, 24*time.Hour, 0, 0, 0, 0, 0,
			)

			s, err := sm.Put("ada@example.com", "pass")
			if c.wantErr {
				assert.Error(t, err)
				assert.Nil(t, s)
				mockProvider.AssertCalled(t, "Close")
				assert.Empty(t, sm.sessions, "a sign-in that failed left a session")
			} else {
				if !assert.NoError(t, err) {
					return
				}
				defer s.Close()
				assert.Equal(t, c.want2FA, s.Requires2FA())
				trust, err := s.TrustsLinkedAccounts()
				assert.NoError(t, err)
				assert.Equal(t, c.wantTrust, trust)
			}
			_, kept := store.entries[webAuthnKey]
			assert.Equal(t, c.wantRecord, kept, "whether the record is still there")
		})
	}
}

// copyingStore keeps a copy of each entry it has read, as the IMAP store does
// for as long as its connection lasts, and reads past it only when asked to.
type copyingStore struct {
	*rawStore
	copies map[string]string
}

func (s *copyingStore) Get(key string, out interface{}) error {
	if raw, ok := s.copies[key]; ok {
		return json.Unmarshal([]byte(raw), out)
	}
	if err := s.rawStore.Get(key, out); err != nil {
		return err
	}
	s.copies[key] = s.entries[key]
	return nil
}

func (s *copyingStore) GetFresh(key string, out interface{}) error {
	delete(s.copies, key)
	return s.Get(key, out)
}

// A key enrolled from another session is seen by this one: whether the
// account has a key decides what a session may change, and the copy this
// session's connection keeps predates it.
func TestReadWebAuthn_SeesAKeyEnrolledElsewhere(t *testing.T) {
	store := &copyingStore{rawStore: &rawStore{entries: map[string]string{}}, copies: map[string]string{}}
	store.entries[webAuthnKey] = `{"enabled": false, "credentials": []}`
	mockProvider := &provider.MockProvider{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(store, nil)
	mockProvider.On("HasThreadCapability").Return(false).Maybe()
	sm := newSessionManager(
		func(string, string) (provider.MailProvider, error) { return mockProvider, nil },
		nil, &NilLogger{}, time.Minute, false, nil, time.Hour, 24*time.Hour, 0, 0, 0, 0, 0,
	)
	s, err := sm.Put("ada@example.com", "pass")
	if !assert.NoError(t, err) {
		return
	}
	defer s.Close()
	assert.False(t, s.Requires2FA())

	store.entries[webAuthnKey] = `{"enabled": true, "credentials": [{"name": "key"}]}`
	enabled, err := s.webAuthnEnabled()
	assert.NoError(t, err)
	assert.True(t, enabled, "the session read its own copy of the record")
}
