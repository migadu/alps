package alps

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
)

func TestLinkedAccounts_EncryptDecrypt(t *testing.T) {
	var loginKey fernet.Key
	loginKey.Generate()

	sm := newSessionManager(
		nil, nil, &NilLogger{},
		0, false, &loginKey,
		30*time.Minute, 0, 0, 0, 0, 0, 0,
	)

	session := &Session{
		manager: sm,
	}

	password := "supersecret"

	// Test Encrypt
	enc, err := session.EncryptPassword(password)
	assert.NoError(t, err)
	assert.NotEmpty(t, enc)
	assert.NotEqual(t, password, enc)

	// Test Decrypt
	dec, err := session.DecryptPassword(enc)
	assert.NoError(t, err)
	assert.Equal(t, password, dec)

	// Test Decrypt with invalid token
	_, err = session.DecryptPassword("invalid")
	assert.Error(t, err)

	// Test with no key
	smNoKey := newSessionManager(
		nil, nil, &NilLogger{},
		0, false, nil,
		30*time.Minute, 0, 0, 0, 0, 0, 0,
	)
	sessionNoKey := &Session{manager: smNoKey}

	_, err = sessionNoKey.EncryptPassword(password)
	assert.Equal(t, ErrLoginKeyRequired, err)

	_, err = sessionNoKey.DecryptPassword(enc)
	assert.Equal(t, ErrLoginKeyRequired, err)
}

func TestLinkedAccount_JSONMarshal(t *testing.T) {
	acc := LinkedAccount{
		Username:    "user@example.com",
		PasswordEnc: "encrypted_secret",
		DisplayName: "My Other Account",
		IMAPServer:  "imap.example.com",
		AddedAt:     time.Now(),
	}

	b, err := json.Marshal(acc)
	assert.NoError(t, err)

	jsonStr := string(b)
	assert.Contains(t, jsonStr, "user@example.com")
	assert.Contains(t, jsonStr, "My Other Account")
	assert.Contains(t, jsonStr, "imap.example.com")
	// IMPORTANT: PasswordEnc must be omitted or empty
	assert.NotContains(t, jsonStr, "encrypted_secret")
}

// connectionStore is one connection's view of an account's store. Like the
// IMAP store, it keeps a copy of each entry it has read or written, and of
// each it found missing, for as long as the connection lasts, and reads past
// it only when asked to.
type connectionStore struct {
	account *rawStore
	copies  map[string]*string // nil for an entry found missing
}

func (s *connectionStore) Get(key string, out interface{}) error {
	raw, ok := s.copies[key]
	if !ok {
		s.account.mu.Lock()
		if v, found := s.account.entries[key]; found {
			raw = &v
		}
		s.account.mu.Unlock()
		s.copies[key] = raw
	}
	if raw == nil {
		return provider.ErrNoStoreEntry
	}
	return json.Unmarshal([]byte(*raw), out)
}

func (s *connectionStore) GetFresh(key string, out interface{}) error {
	delete(s.copies, key)
	return s.Get(key, out)
}

func (s *connectionStore) Put(key string, v interface{}) error {
	delete(s.copies, key)
	return s.account.Put(key, v)
}

// Linking A to B writes A into B's linked accounts through a session of B's
// own, opened for the purpose. B's session, signed in all along, had read its
// linked accounts before, when the account menu listed them, and its
// connection kept what it read. So it went on listing them without A, and the
// next account B linked was written over A's link.
func TestLinkedAccounts_ALinkMadeFromAnotherSessionIsKept(t *testing.T) {
	cases := []struct {
		name  string
		links string // B's linked accounts before A links B, none when empty
	}{
		{name: "the first link"},
		{name: "a link besides another", links: `{"accounts": [{"username": "carol@example.com", "password_enc": "x"}]}`},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var loginKey fernet.Key
			if err := loginKey.Generate(); err != nil {
				t.Fatal(err)
			}
			accounts := map[string]*rawStore{}
			for _, u := range []string{"ada@example.com", "bob@example.com", "dave@example.com"} {
				accounts[u] = &rawStore{entries: map[string]string{}}
			}
			if c.links != "" {
				accounts["bob@example.com"].entries[linkedAccountsStoreKey] = c.links
			}
			sm := newSessionManager(func(username, _ string) (provider.MailProvider, error) {
				p := &provider.MockProvider{}
				p.On("Close").Return(nil)
				p.On("GetStore").Return(&connectionStore{account: accounts[username], copies: map[string]*string{}}, nil)
				return p, nil
			}, nil, &NilLogger{}, time.Minute, false, &loginKey, time.Hour, 24*time.Hour, 0, 0, 0, 0, 0)

			bob, err := sm.Put("bob@example.com", "bob's password")
			if err != nil {
				t.Fatal(err)
			}
			defer bob.Close()
			before, err := bob.GetLinkedAccounts() // the account menu lists them
			if err != nil {
				t.Fatal(err)
			}

			ada, err := sm.Put("ada@example.com", "ada's password")
			if err != nil {
				t.Fatal(err)
			}
			defer ada.Close()
			if err := ada.AddLinkedAccount("bob@example.com", "bob's password", "Bob"); err != nil {
				t.Fatal(err)
			}

			linked := func(list *LinkedAccounts) []string {
				var names []string
				for _, a := range list.Accounts {
					names = append(names, a.Username)
				}
				return names
			}
			now, err := bob.GetLinkedAccounts()
			if err != nil {
				t.Fatal(err)
			}
			assert.Equal(t, append(linked(before), "ada@example.com"), linked(now),
				"the accounts B's session lists once A has linked B")

			if err := bob.AddLinkedAccount("dave@example.com", "dave's password", "Dave"); err != nil {
				t.Fatal(err)
			}
			var stored LinkedAccounts
			if err := accounts["bob@example.com"].Get(linkedAccountsStoreKey, &stored); err != nil {
				t.Fatal(err)
			}
			assert.Equal(t, append(linked(before), "ada@example.com", "dave@example.com"), linked(&stored),
				"the accounts B is linked to once B has linked another")
		})
	}
}
