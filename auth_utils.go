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
// A record that does not decode at all is removed, and reads as none. No
// version of alps can check a credential in it, and kept, it would stop every
// sign-in to the account. A value of the wrong type inside the record keeps
// what out held, and the rest is read.
func (s *Session) ReadWebAuthn(out interface{}) error {
	store := s.Store()
	err := store.Get(webAuthnKey, out)
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
	if err := s.ReadWebAuthn(&data); err == provider.ErrNoStoreEntry {
		return false, nil
	} else if err != nil {
		return false, err
	}
	enabled, _ := data["enabled"].(bool)
	credentials, _ := data["credentials"].([]interface{})
	return enabled && len(credentials) > 0, nil
}

// TrustsLinkedAccounts reports whether the account lets a linked account that
// signed in with its second factor switch to it without asking for one.
func (s *Session) TrustsLinkedAccounts() (bool, error) {
	var data map[string]interface{}
	if err := s.ReadWebAuthn(&data); err == provider.ErrNoStoreEntry {
		return false, nil
	} else if err != nil {
		return false, err
	}
	trust, _ := data["trust_linked_accounts"].(bool)
	return trust, nil
}
