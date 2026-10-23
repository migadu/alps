package alpsbase

import (
	"errors"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type CredentialInfo struct {
	Credential webauthn.Credential `json:"credential"`
	Name       string              `json:"name"`
	AddedAt    string              `json:"added_at"`
}

type UserCredentials struct {
	UserID              []byte           `json:"user_id"`
	Enabled             bool             `json:"enabled"`
	Credentials         []CredentialInfo `json:"credentials"`
	TrustLinkedAccounts bool             `json:"trust_linked_accounts"`
	// The rules trust was turned on under: alps.TrustLinkedAccountsVersion
	// when it is on, nothing when it is off.
	TrustLinkedAccountsVersion int `json:"trust_linked_accounts_version,omitempty"`
}

// setTrust turns trust in linked accounts on or off, and marks trust turned
// on as turned on under the rules that hold now. The caller has checked them.
func (c *UserCredentials) setTrust(trust bool) {
	c.TrustLinkedAccounts = trust
	c.TrustLinkedAccountsVersion = 0
	if trust {
		c.TrustLinkedAccountsVersion = alps.TrustLinkedAccountsVersion
	}
}

type sessionData struct {
	Challenge string `json:"challenge"`
	UserID    []byte `json:"user_id"`
}

type webauthnUser struct {
	username    string
	credentials *UserCredentials
}

func (u *webauthnUser) WebAuthnID() []byte {
	return u.credentials.UserID
}

func (u *webauthnUser) WebAuthnName() string {
	return u.username
}

func (u *webauthnUser) WebAuthnDisplayName() string {
	return u.username
}

func (u *webauthnUser) WebAuthnIcon() string {
	return ""
}

// WebAuthnCredentials hands the ceremonies copies of the account's keys,
// without their clone warning. FinishLogin only ever raises the warning, so a
// key handed to it marked came back marked whatever its count did at that
// sign-in, and a count that went back again could not be told from the first.
// recordKeyUse keeps the stored mark.
func (u *webauthnUser) WebAuthnCredentials() []webauthn.Credential {
	var creds []webauthn.Credential
	for _, c := range u.credentials.Credentials {
		cred := c.Credential
		cred.Authenticator.CloneWarning = false
		creds = append(creds, cred)
	}
	return creds
}

// loadCredentials reads the account's WebAuthn credentials. An account
// without a record, or whose record was unreadable and so removed, has none.
//
// Trust in linked accounts is read as off unless it counts (see
// alps.TrustCounts), whatever the record says, so the settings show it off and
// the next save drops it. A record without a key trusts no linked account:
// such a record could be written before, and enrolling a first key into it
// carried the trust over. Nor does trust turned on before it took a key, the
// second factor and the password, which such a record does not mark.
func loadCredentials(session *alps.Session) (*UserCredentials, error) {
	var creds UserCredentials
	if err := session.ReadWebAuthn(&creds); errors.Is(err, provider.ErrNoStoreEntry) {
		return &UserCredentials{Credentials: []CredentialInfo{}}, nil
	} else if err != nil {
		return nil, err
	}
	if !alps.TrustCounts(creds.TrustLinkedAccounts, creds.TrustLinkedAccountsVersion, len(creds.Credentials)) {
		creds.setTrust(false)
	}
	return &creds, nil
}

// saveCredentials stores the account's WebAuthn record, or removes it when
// there is no key left in it. Trust in linked accounts waives a second factor,
// so it means nothing without one and is not kept on its own.
func saveCredentials(store provider.Store, creds *UserCredentials) error {
	if creds == nil || len(creds.Credentials) == 0 {
		return store.Put("webauthn", nil)
	}
	return store.Put("webauthn", creds)
}

func loadSessionData(session *alps.Session) (*sessionData, error) {
	val, ok := session.GetData("webauthn_session")
	if !ok {
		return nil, errors.New("no webauthn session found")
	}
	s, ok := val.(*sessionData)
	if !ok {
		return nil, errors.New("invalid webauthn session data")
	}
	return s, nil
}

func saveSessionData(session *alps.Session, data *sessionData) error {
	session.SetData("webauthn_session", data)
	return nil
}

func clearSessionData(session *alps.Session) error {
	session.ClearData("webauthn_session")
	return nil
}
