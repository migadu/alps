package alps

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/migadu/alps/provider"
)

// webAuthnKey is the store entry holding the account's WebAuthn credentials.
const webAuthnKey = "webauthn"

// ReadWebAuthn reads the account's WebAuthn record into out, and returns
// provider.ErrNoStoreEntry when there is none.
//
// The record is read from the server every time, not from what this session's
// connection last saw. Another session, on this node or another, may have
// added or removed a key since, and what a session may change depends on
// whether the account has one.
//
// A record that does not decode at all is removed, and reads as none. No
// version of alps can check a credential in it, and kept, it would stop every
// sign-in to the account. A value of the wrong type inside the record keeps
// what out held, and the rest is read.
func (s *Session) ReadWebAuthn(out interface{}) error {
	store := s.Store()
	err := provider.GetFresh(store, webAuthnKey, out)
	var typeErr *json.UnmarshalTypeError
	var syntaxErr *json.SyntaxError
	switch {
	case err == nil:
		return nil
	case errors.As(err, &typeErr) && typeErr.Field != "":
		return nil
	case errors.As(err, &typeErr) || errors.As(err, &syntaxErr):
		if putErr := store.Put(webAuthnKey, nil); putErr != nil {
			return fmt.Errorf("failed to remove unreadable WebAuthn record: %v", putErr)
		}
		s.manager.logger.Printf("Removed unreadable WebAuthn record of %s: %v", s.username, err)
		return provider.ErrNoStoreEntry
	default:
		return err
	}
}

// webAuthnEnabled reports whether signing in to the account takes a second
// factor: WebAuthn is on, with at least one credential.
func (s *Session) webAuthnEnabled() (bool, error) {
	var data map[string]interface{}
	if err := s.ReadWebAuthn(&data); errors.Is(err, provider.ErrNoStoreEntry) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	enabled, _ := data["enabled"].(bool)
	credentials, _ := data["credentials"].([]interface{})
	return enabled && len(credentials) > 0, nil
}

// TrustLinkedAccountsVersion is stored beside trust in linked accounts, as
// trust_linked_accounts_version, when it is turned on. It names the rules
// trust was turned on under: on an account with a key, by a session that gave
// it, with the account's password.
//
// Trust stored without it was turned on before those rules, when any session
// of the account could turn it on, one that never gave the second factor
// included, and with no key on the account at all. Such trust is read as off
// (see TrustCounts), and the record's next save drops it: the account's owner
// turns it on again, under the rules, if they want it.
const TrustLinkedAccountsVersion = 1

// TrustCounts reports whether trust in linked accounts, as stored in an
// account's WebAuthn record with keys keys, lets a linked account that gave
// its own second factor switch to the account without giving the account's.
// It must be on, beside a key, and turned on under the rules that hold now.
// This is the one place that decides it.
func TrustCounts(trust bool, version, keys int) bool {
	return trust && keys > 0 && version >= TrustLinkedAccountsVersion
}

// TrustsLinkedAccounts reports whether the account lets a linked account that
// signed in with its second factor switch to it without asking for one. See
// TrustCounts.
func (s *Session) TrustsLinkedAccounts() (bool, error) {
	var data struct {
		Credentials []json.RawMessage `json:"credentials"`
		Trust       bool              `json:"trust_linked_accounts"`
		Version     int               `json:"trust_linked_accounts_version"`
	}
	if err := s.ReadWebAuthn(&data); errors.Is(err, provider.ErrNoStoreEntry) {
		return false, nil
	} else if err != nil {
		return false, err
	}
	return TrustCounts(data.Trust, data.Version, len(data.Credentials)), nil
}
