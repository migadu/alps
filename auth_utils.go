package alps

import (
	"github.com/migadu/alps/provider"
)

// CheckWebAuthnEnabled checks if a user has WebAuthn 2FA enabled
func CheckWebAuthnEnabled(store provider.Store) (bool, error) {
	// Use a minimal struct that matches only the fields we need
	var data map[string]interface{}

	if err := store.Get("webauthn", &data); err != nil {
		if err == provider.ErrNoStoreEntry {
			return false, nil
		}
		return false, err
	}

	enabled, ok := data["enabled"].(bool)
	if !ok {
		return false, nil
	}

	if !enabled {
		return false, nil
	}

	credentials, ok := data["credentials"].([]interface{})
	if !ok {
		return false, nil
	}

	return len(credentials) > 0, nil
}

// CheckTrustLinkedAccounts checks if a user has enabled "trust linked accounts" setting
func CheckTrustLinkedAccounts(store provider.Store) (bool, error) {
	var data map[string]interface{}

	if err := store.Get("webauthn", &data); err != nil {
		if err == provider.ErrNoStoreEntry {
			return false, nil // Default: don't trust
		}
		return false, err
	}

	trust, ok := data["trust_linked_accounts"].(bool)
	if !ok {
		return false, nil // Default: don't trust
	}

	return trust, nil
}
