// The access list of a folder the user shares (IMAP ACL, RFC 4314): read,
// granted and revoked.
package imap

import (
	"errors"
	"slices"
	"testing"

	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
)

// The access list of a folder is MYRIGHTS and GETACL, sent together, its
// entries in order whatever order the server lists them in.
func TestFolderAccessReadsTheUsersRightsAndTheList(t *testing.T) {
	srv := &scriptedIMAP{
		caps:   "IMAP4rev1 ACL",
		rights: map[string]string{"Shared/Team": "lrswipkxtea"},
		acl:    map[string][]string{"Shared/Team": {`"zoe@example.test" "lrs"`, `"ada@example.test" "lrswipkxtea"`, `"bob@example.test" "lrswited"`}},
	}
	access, err := scriptedProvider(t, srv).FolderAccess("Shared/Team")
	if err != nil {
		t.Fatal(err)
	}
	want := []provider.FolderAccessEntry{
		{Identifier: "ada@example.test", Rights: "lrswipkxtea"},
		{Identifier: "bob@example.test", Rights: "lrswited"},
		{Identifier: "zoe@example.test", Rights: "lrs"},
	}
	if access.Rights != "lrswipkxtea" || !slices.Equal(access.Entries, want) {
		t.Errorf("FolderAccess() = %+v, want the user's lrswipkxtea and %v", access, want)
	}
}

// A user who may not read the list is refused it, and the refusal is the
// server's, for the caller to tell from a failure.
func TestFolderAccessRefusedIsTheServers(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1 ACL", rights: map[string]string{"Shared/Team": "lrs"}}
	p := scriptedProvider(t, srv)
	_, err := p.FolderAccess("Shared/Team")
	var refused *imap.Error
	if !errors.As(err, &refused) || refused.Code != imap.ResponseCodeNoPerm {
		t.Fatalf("FolderAccess() failed with %v, want the server's NO [NOPERM]", err)
	}
	if _, err := p.ListMailboxes(); err != nil {
		t.Errorf("the folder list failed after the refusal: %v", err)
	}
}

// A grant replaces what the identifier had (no + or - before the rights),
// and a revoke is a DELETEACL. "anyone" and negative rights are never sent.
func TestGrantAndRevokeFolderAccess(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1 ACL"}
	p := scriptedProvider(t, srv)
	if err := p.GrantFolderAccess("Shared/Team", "bob@example.test", "lrs"); err != nil {
		t.Fatal(err)
	}
	if err := p.RevokeFolderAccess("Shared/Team", "bob@example.test"); err != nil {
		t.Fatal(err)
	}
	for _, who := range []string{"anyone", "-bob@example.test"} {
		if err := p.GrantFolderAccess("Shared/Team", who, "lrs"); err == nil {
			t.Errorf("granted %q", who)
		}
		if err := p.RevokeFolderAccess("Shared/Team", who); err == nil {
			t.Errorf("revoked %q", who)
		}
	}
	want := []string{`SETACL "Shared/Team" "bob@example.test" "lrs"`, `DELETEACL "Shared/Team" "bob@example.test"`}
	if got := srv.aclCommands(); !slices.Equal(got, want) {
		t.Errorf("sent %q, want %q", got, want)
	}

	srv.refuseACL = "NO [NONEXISTENT] no such user"
	err := p.GrantFolderAccess("Shared/Team", "nobody@example.test", "lrs")
	var refused *imap.Error
	if !errors.As(err, &refused) || refused.Code != imap.ResponseCodeNonExistent {
		t.Errorf("a refused grant failed with %v, want the server's NO [NONEXISTENT]", err)
	}
}
