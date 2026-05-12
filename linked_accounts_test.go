package alps

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/fernet/fernet-go"
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
