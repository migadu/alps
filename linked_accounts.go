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

// ErrReverseLinkNotCleared reports that an account was unlinked locally but this
// account's stored credential could not be removed from the other side. The
// unlink itself succeeded; the credential is still sitting in the other
// mailbox's METADATA.
var ErrReverseLinkNotCleared = errors.New("linked account removed, but the credential stored in the other account could not be cleared")

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

	// The reverse link is best effort, but its failure is REPORTED.
	//
	// Linking A to B stores A's encrypted password in B's IMAP METADATA (see
	// AddLinkedAccount). Unlinking therefore has to take it back out of B, and
	// every step that can stop it — decrypting the stored credential,
	// authenticating to B with it, reading B's METADATA, writing it back — used
	// to be swallowed by an `if err == nil` or a `_ =`.
	//
	// So if B's password had since changed, or B was unreachable, or the write
	// was refused, A's credential stayed in B's mailbox indefinitely and A was
	// told the account had been removed. A credential outliving the relationship
	// that justified it is exactly what the user believes this button prevents.
	//
	// Still not an error return: the forward removal DID succeed, and failing
	// the call would invite a retry that cannot help. The caller gets a
	// distinguishable sentinel so it can say what is actually true.
	if err := s.removeReverseLink(username, removedAccount.PasswordEnc); err != nil {
		s.manager.logger.Printf("linked accounts: removed %s locally but could not clear the reverse link: %v", username, err)
		return ErrReverseLinkNotCleared
	}

	return nil
}

// removeReverseLink deletes this account's entry from the target's METADATA.
func (s *Session) removeReverseLink(username, encryptedPassword string) error {
	password, err := s.DecryptPassword(encryptedPassword)
	if err != nil {
		return fmt.Errorf("decrypt stored credential: %w", err)
	}

	targetSession, err := s.manager.Put(username, password)
	if err != nil {
		return fmt.Errorf("sign in to %s: %w", username, err)
	}
	defer targetSession.Close()

	targetStore := targetSession.Store()
	targetAccounts, err := getLinkedAccountsViaStore(targetStore)
	if err != nil {
		return fmt.Errorf("read linked accounts of %s: %w", username, err)
	}

	newTargetAccounts := make([]LinkedAccount, 0, len(targetAccounts.Accounts))
	for _, acc := range targetAccounts.Accounts {
		if acc.Username != s.username {
			newTargetAccounts = append(newTargetAccounts, acc)
		}
	}
	targetAccounts.Accounts = newTargetAccounts

	if err := setLinkedAccountsViaStore(targetStore, targetAccounts); err != nil {
		return fmt.Errorf("write linked accounts of %s: %w", username, err)
	}
	return nil
}

// RefreshLinkedCredentials re-encrypts this account's password into every
// account it is linked to, after the password has changed.
//
// Linking stores each side's credential in the OTHER side's METADATA, and
// nothing refreshed those on a password change. The consequences compound:
//
//   - Switching from a linked account BACK to this one decrypts the old
//     password and is rejected. The feature silently stops working in that
//     direction, with nothing saying why.
//   - The superseded password stays stored indefinitely, which is the concern
//     RemoveLinkedAccount's warning exists for — and this is what makes it
//     routine rather than hypothetical.
//   - Unlinking needs to authenticate to the other account with the credential
//     stored HERE, which is unaffected — but the other side's attempt to clean
//     up ITS copy needs the stale one. So a password change is precisely what
//     makes the cleanup in d2780b8 fail.
//
// Best effort per account: one unreachable peer must not stop the rest, and the
// password has already been changed by the time this runs. Returns how many
// could not be updated so the caller can say so.
func (s *Session) RefreshLinkedCredentials(newPassword string) (failed int) {
	accounts, err := s.GetLinkedAccounts()
	if err != nil {
		s.manager.logger.Printf("linked accounts: cannot list accounts to refresh credentials: %v", err)
		return 0
	}

	newEncrypted, err := s.EncryptPassword(newPassword)
	if err != nil {
		s.manager.logger.Printf("linked accounts: cannot encrypt the new password: %v", err)
		return len(accounts.Accounts)
	}

	for _, acc := range accounts.Accounts {
		if err := s.refreshOne(acc, newEncrypted); err != nil {
			s.manager.logger.Printf("linked accounts: could not refresh this account's credential in %s: %v", acc.Username, err)
			failed++
		}
	}
	return failed
}

func (s *Session) refreshOne(acc LinkedAccount, newEncrypted string) error {
	// The peer's own password, which this account stores and which the password
	// change did not touch.
	peerPassword, err := s.DecryptPassword(acc.PasswordEnc)
	if err != nil {
		return fmt.Errorf("decrypt stored credential: %w", err)
	}

	peerSession, err := s.manager.Put(acc.Username, peerPassword)
	if err != nil {
		return fmt.Errorf("sign in: %w", err)
	}
	defer peerSession.Close()

	peerStore := peerSession.Store()
	peerAccounts, err := getLinkedAccountsViaStore(peerStore)
	if err != nil {
		return fmt.Errorf("read linked accounts: %w", err)
	}

	updated := false
	for i := range peerAccounts.Accounts {
		if peerAccounts.Accounts[i].Username == s.username {
			peerAccounts.Accounts[i].PasswordEnc = newEncrypted
			updated = true
			break
		}
	}
	if !updated {
		// No reverse entry to refresh. Not an error: the other side may have
		// unlinked already.
		return nil
	}

	if err := setLinkedAccountsViaStore(peerStore, peerAccounts); err != nil {
		return fmt.Errorf("write linked accounts: %w", err)
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
