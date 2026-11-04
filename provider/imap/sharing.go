package imap

import (
	"fmt"
	"slices"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

var _ provider.FolderSharer = (*IMAPProvider)(nil)

// FolderAccess: see provider.FolderSharer. MYRIGHTS and GETACL (RFC 4314
// §3.3, §3.6), sent together. A user who may not administer the folder is
// refused the list with NOPERM, and the refusal is answered as it came.
func (p *IMAPProvider) FolderAccess(mailbox string) (*provider.FolderAccess, error) {
	mine := p.client.MyRights(mailbox)
	list := p.client.GetACL(mailbox)
	own, ownErr := mine.Wait()
	data, err := list.Wait()
	if ownErr != nil {
		return nil, p.lostIf(fmt.Errorf("imap: MYRIGHTS failed: %w", ownErr))
	}
	if err != nil {
		return nil, p.lostIf(fmt.Errorf("imap: GETACL failed: %w", err))
	}
	access := &provider.FolderAccess{Rights: string(own.Rights)}
	for identifier, rights := range data.Rights {
		access.Entries = append(access.Entries, provider.FolderAccessEntry{Identifier: string(identifier), Rights: string(rights)})
	}
	// The answer is a map: in its order, the people with access moved about
	// from one reading to the next.
	slices.SortFunc(access.Entries, func(a, b provider.FolderAccessEntry) int {
		return strings.Compare(a.Identifier, b.Identifier)
	})
	return access, nil
}

// FolderRights: see provider.FolderSharer. MYRIGHTS (RFC 4314 §3.6).
func (p *IMAPProvider) FolderRights(mailbox string) (string, error) {
	data, err := p.client.MyRights(mailbox).Wait()
	if err != nil {
		return "", p.lostIf(fmt.Errorf("imap: MYRIGHTS failed: %w", err))
	}
	return string(data.Rights), nil
}

// GrantFolderAccess: see provider.FolderSharer. SETACL with the rights alone,
// which replaces what the identifier had (RFC 4314 §3.1). "anyone" and an
// identifier for negative rights ("-" first, §2) are not given to it: they
// name no one person.
func (p *IMAPProvider) GrantFolderAccess(mailbox, identifier, rights string) error {
	who, err := imap.NewRightsIdentifierUsername(identifier)
	if err != nil {
		return err
	}
	if err := p.client.SetACL(mailbox, who, imap.RightModificationReplace, imap.RightSet(rights)).Wait(); err != nil {
		return p.lostIf(fmt.Errorf("imap: SETACL failed: %w", err))
	}
	return nil
}

// RevokeFolderAccess: see provider.FolderSharer. DELETEACL (RFC 4314 §3.2).
func (p *IMAPProvider) RevokeFolderAccess(mailbox, identifier string) error {
	who, err := imap.NewRightsIdentifierUsername(identifier)
	if err != nil {
		return err
	}
	if err := p.client.DeleteACL(mailbox, who).Wait(); err != nil {
		return p.lostIf(fmt.Errorf("imap: DELETEACL failed: %w", err))
	}
	return nil
}
