package alps

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/provider"
)

const linkedAccountsStoreKey = "linked_accounts"

var (
	ErrNoLinkedAccounts     = errors.New("no linked accounts found")
	ErrAccountAlreadyLinked = errors.New("account already linked")
	ErrAccountNotFound      = errors.New("linked account not found")
	ErrLoginKeyRequired     = errors.New("login key required for account encryption")
	ErrCannotLinkSelf       = errors.New("cannot link your own account")
)

// LinkedAccount represents an additional account linked to the primary account.
// Credentials are encrypted using the server's LoginKey and stored in IMAP METADATA.
type LinkedAccount struct {
	Username    string    `json:"username"`
	PasswordEnc string    `json:"password_enc"` // Fernet-encrypted
	DisplayName string    `json:"display_name,omitempty"`
	IMAPServer  string    `json:"imap_server,omitempty"` // Optional: different server
	AddedAt     time.Time `json:"added_at"`
}

// LinkedAccounts is the collection of linked accounts stored in METADATA.
type LinkedAccounts struct {
	Accounts []LinkedAccount `json:"accounts"`
}

// EncryptPassword encrypts a password using the server's LoginKey.
func (s *Session) EncryptPassword(password string) (string, error) {
	fkey := s.manager.loginKey
	if fkey == nil {
		return "", ErrLoginKeyRequired
	}

	encrypted, err := fernet.EncryptAndSign([]byte(password), fkey)
	if err != nil {
		return "", fmt.Errorf("failed to encrypt password: %w", err)
	}

	return string(encrypted), nil
}

// DecryptPassword decrypts a password using the server's LoginKey.
func (s *Session) DecryptPassword(encrypted string) (string, error) {
	fkey := s.manager.loginKey
	if fkey == nil {
		return "", ErrLoginKeyRequired
	}

	decrypted := fernet.VerifyAndDecrypt([]byte(encrypted), 0, []*fernet.Key{fkey})
	if decrypted == nil {
		return "", errors.New("failed to decrypt password")
	}

	return string(decrypted), nil
}

// GetLinkedAccounts retrieves all linked accounts from METADATA.
func (s *Session) GetLinkedAccounts() (*LinkedAccounts, error) {
	var accounts LinkedAccounts
	err := s.Store().Get(linkedAccountsStoreKey, &accounts)
	if err != nil {
		if err == provider.ErrNoStoreEntry {
			return &LinkedAccounts{Accounts: []LinkedAccount{}}, nil
		}
		return nil, fmt.Errorf("failed to get linked accounts: %w", err)
	}

	return &accounts, nil
}

// AddLinkedAccount adds a new linked account after validating credentials.
// Returns an error if the account is already linked or authentication fails.
// This creates a bidirectional link: both accounts will have each other in their linked list.
func (s *Session) AddLinkedAccount(username, password, displayName string) error {
	if s.manager.loginKey == nil {
		return ErrLoginKeyRequired
	}

	// Prevent linking your own account
	if username == s.username {
		return ErrCannotLinkSelf
	}

	// Validate credentials by creating a temporary session
	targetSession, err := s.manager.Put(username, password)
	if err != nil {
		return fmt.Errorf("failed to validate account credentials: %w", err)
	}
	defer targetSession.Close()

	// Use target session's store for reading/writing METADATA
	targetStore := targetSession.Store()

	// Get existing linked accounts for current session
	accounts, err := s.GetLinkedAccounts()
	if err != nil {
		return err
	}

	// Check if account is already linked
	for _, acc := range accounts.Accounts {
		if acc.Username == username {
			return ErrAccountAlreadyLinked
		}
	}

	// Encrypt passwords for both directions
	targetEncryptedPassword, err := s.EncryptPassword(password)
	if err != nil {
		return err
	}

	currentEncryptedPassword, err := s.EncryptPassword(s.password)
	if err != nil {
		return err
	}

	// Add new account to current session's linked accounts
	newAccount := LinkedAccount{
		Username:    username,
		PasswordEnc: targetEncryptedPassword,
		DisplayName: displayName,
		AddedAt:     time.Now(),
	}
	accounts.Accounts = append(accounts.Accounts, newAccount)

	// Save to current account's METADATA (bypassing custom marshaler)
	if err := s.putLinkedAccounts(accounts); err != nil {
		return err
	}

	// Now create the reverse link: add current account to target account's linked accounts
	targetAccounts, err := getLinkedAccountsViaStore(targetStore)
	if err != nil {
		// If we fail to read target's accounts, roll back the forward link
		s.RemoveLinkedAccount(username)
		return fmt.Errorf("failed to read target account's linked accounts: %w", err)
	}

	// Check if current account is already in target's list and update/add it
	found := false
	for i, acc := range targetAccounts.Accounts {
		if acc.Username == s.username {
			// Update existing entry with new encrypted password
			targetAccounts.Accounts[i].PasswordEnc = currentEncryptedPassword
			found = true
			break
		}
	}

	if !found {
		// Add current account to target's linked accounts
		reverseAccount := LinkedAccount{
			Username:    s.username,
			PasswordEnc: currentEncryptedPassword,
			DisplayName: "", // Target account doesn't have a display name for us yet
			AddedAt:     time.Now(),
		}
		targetAccounts.Accounts = append(targetAccounts.Accounts, reverseAccount)
	}

	// Save to target account's METADATA
	if err := setLinkedAccountsViaStore(targetStore, targetAccounts); err != nil {
		// If we fail to create reverse link, roll back the forward link
		s.RemoveLinkedAccount(username)
		return fmt.Errorf("failed to create reverse link: %w", err)
	}

	return nil
}

// RemoveLinkedAccount removes a linked account by username.
// This also removes the reverse link from the target account (best effort).
func (s *Session) RemoveLinkedAccount(username string) error {
	accounts, err := s.GetLinkedAccounts()
	if err != nil {
		return err
	}

	// Find and remove the account
	var removedAccount *LinkedAccount
	newAccounts := make([]LinkedAccount, 0, len(accounts.Accounts))
	for _, acc := range accounts.Accounts {
		if acc.Username == username {
			removedAccount = &acc
			continue
		}
		newAccounts = append(newAccounts, acc)
	}

	if removedAccount == nil {
		return ErrAccountNotFound
	}

	accounts.Accounts = newAccounts

	// Save updated list to METADATA (bypassing custom marshaler)
	if err := s.putLinkedAccounts(accounts); err != nil {
		return err
	}

	// Best effort: try to remove the reverse link from the target account
	// If this fails, we don't return an error since the primary removal succeeded
	password, err := s.DecryptPassword(removedAccount.PasswordEnc)
	if err == nil {
		targetSession, err := s.manager.Put(username, password)
		if err == nil {
			defer targetSession.Close()
			targetStore := targetSession.Store()

			targetAccounts, err := getLinkedAccountsViaStore(targetStore)
			if err == nil {
				// Remove current account from target's list
				newTargetAccounts := make([]LinkedAccount, 0, len(targetAccounts.Accounts))
				for _, acc := range targetAccounts.Accounts {
					if acc.Username != s.username {
						newTargetAccounts = append(newTargetAccounts, acc)
					}
				}
				targetAccounts.Accounts = newTargetAccounts

				// Save to target account's METADATA (ignore errors)
				_ = setLinkedAccountsViaStore(targetStore, targetAccounts)
			}
		}
	}

	return nil
}

// GetLinkedAccountCredentials retrieves and decrypts credentials for a linked account.
func (s *Session) GetLinkedAccountCredentials(username string) (password string, err error) {
	accounts, err := s.GetLinkedAccounts()
	if err != nil {
		return "", err
	}

	for _, acc := range accounts.Accounts {
		if acc.Username == username {
			password, err := s.DecryptPassword(acc.PasswordEnc)
			if err != nil {
				return "", fmt.Errorf("failed to decrypt password for %s: %w", username, err)
			}
			return password, nil
		}
	}

	return "", ErrAccountNotFound
}

// MarshalJSON implements custom JSON marshaling to prevent password leakage.
func (la LinkedAccount) MarshalJSON() ([]byte, error) {
	type Alias LinkedAccount
	return json.Marshal(&struct {
		*Alias
		PasswordEnc string `json:"password_enc,omitempty"`
	}{
		Alias:       (*Alias)(&la),
		PasswordEnc: "", // Never expose encrypted password in JSON
	})
}

// check2FAEnabled checks if a user has WebAuthn 2FA enabled.
// This is the same check used in the login flow.
func check2FAEnabled(store provider.Store) (bool, error) {
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

	return enabled, nil
}

// linkedAccountsToJSON converts LinkedAccounts to JSON with passwords intact.
// This bypasses the custom MarshalJSON that strips passwords for security.
func linkedAccountsToJSON(accounts *LinkedAccounts) ([]byte, error) {
	type linkedAccountInternal struct {
		Username    string    `json:"username"`
		PasswordEnc string    `json:"password_enc"`
		DisplayName string    `json:"display_name,omitempty"`
		IMAPServer  string    `json:"imap_server,omitempty"`
		AddedAt     time.Time `json:"added_at"`
	}
	type linkedAccountsInternal struct {
		Accounts []linkedAccountInternal `json:"accounts"`
	}

	internal := linkedAccountsInternal{
		Accounts: make([]linkedAccountInternal, len(accounts.Accounts)),
	}
	for i, acc := range accounts.Accounts {
		internal.Accounts[i] = linkedAccountInternal{
			Username:    acc.Username,
			PasswordEnc: acc.PasswordEnc,
			DisplayName: acc.DisplayName,
			IMAPServer:  acc.IMAPServer,
			AddedAt:     acc.AddedAt,
		}
	}

	return json.Marshal(internal)
}

// getLinkedAccountsViaStore reads linked accounts directly from a Store.
// This is used to read another account's linked accounts during bidirectional linking.
func getLinkedAccountsViaStore(store provider.Store) (*LinkedAccounts, error) {
	var accounts LinkedAccounts
	err := store.Get(linkedAccountsStoreKey, &accounts)
	if err != nil {
		if err == provider.ErrNoStoreEntry {
			return &LinkedAccounts{Accounts: []LinkedAccount{}}, nil
		}
		return nil, fmt.Errorf("failed to get linked accounts: %w", err)
	}

	return &accounts, nil
}

// setLinkedAccountsViaStore writes linked accounts directly to a Store.
// This is used to write to another account's METADATA during bidirectional linking.
func setLinkedAccountsViaStore(store provider.Store, accounts *LinkedAccounts) error {
	type linkedAccountInternal struct {
		Username    string    `json:"username"`
		PasswordEnc string    `json:"password_enc"`
		DisplayName string    `json:"display_name,omitempty"`
		IMAPServer  string    `json:"imap_server,omitempty"`
		AddedAt     time.Time `json:"added_at"`
	}
	type linkedAccountsInternal struct {
		Accounts []linkedAccountInternal `json:"accounts"`
	}

	internal := linkedAccountsInternal{
		Accounts: make([]linkedAccountInternal, len(accounts.Accounts)),
	}
	for i, acc := range accounts.Accounts {
		internal.Accounts[i] = linkedAccountInternal{
			Username:    acc.Username,
			PasswordEnc: acc.PasswordEnc,
			DisplayName: acc.DisplayName,
			IMAPServer:  acc.IMAPServer,
			AddedAt:     acc.AddedAt,
		}
	}

	// We store the internal representation to bypass the custom MarshalJSON
	if err := store.Put(linkedAccountsStoreKey, internal); err != nil {
		return fmt.Errorf("failed to set linked accounts in store: %w", err)
	}

	return nil
}

// putLinkedAccounts saves linked accounts to the session's store, bypassing
// the custom MarshalJSON that strips passwords.
func (s *Session) putLinkedAccounts(accounts *LinkedAccounts) error {
	return setLinkedAccountsViaStore(s.Store(), accounts)
}
