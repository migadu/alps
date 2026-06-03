package alpsbase

import (
	"errors"
	"strings"

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

func (u *webauthnUser) WebAuthnCredentials() []webauthn.Credential {
	var creds []webauthn.Credential
	for _, c := range u.credentials.Credentials {
		creds = append(creds, c.Credential)
	}
	return creds
}

func loadCredentials(store provider.Store) (*UserCredentials, error) {
	return loadCredentialsInternal(store, false)
}

func loadCredentialsForVerification(store provider.Store) (*UserCredentials, error) {
	return loadCredentialsInternal(store, true)
}

func loadCredentialsInternal(store provider.Store, strict bool) (*UserCredentials, error) {
	var creds UserCredentials
	err := store.Get("webauthn", &creds)
	if err != nil {
		if err == provider.ErrNoStoreEntry {
			return &UserCredentials{Credentials: []CredentialInfo{}}, nil
		}
		// Be resilient to corrupted data when loading for display (e.g., settings page)
		// so users can still access the settings page and re-register.
		// But be strict during verification to avoid authentication issues.
		if !strict {
			errStr := err.Error()
			if strings.Contains(errStr, "unmarshal") || strings.Contains(errStr, "invalid character") {
				return &UserCredentials{Credentials: []CredentialInfo{}}, nil
			}
		}
		return nil, err
	}
	return &creds, nil
}

func saveCredentials(store provider.Store, creds *UserCredentials) error {
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
