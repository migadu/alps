package maildir

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-maildir"
	"github.com/migadu/alps/provider"
)

// jailed is a provider whose maildir has a neighbour: another user's maildir
// beside it, as a multi-user layout keeps them. Everything the tests do stays
// inside the test's own temporary directory, the neighbour included.
func jailed(t *testing.T) (p *Provider, ids []provider.MessageID, base, neighbour string) {
	t.Helper()
	root := t.TempDir()
	base = filepath.Join(root, "users", "example.com", "ada")
	neighbour = filepath.Join(root, "users", "example.com", "grace")
	if err := os.MkdirAll(filepath.Join(neighbour, "cur"), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(neighbour, "cur", "1700000000.grace:2,S"), []byte("Subject: hers\r\n\r\nhers\r\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	p = NewProvider(base, "ada@example.com")
	ids = putMessages(t, p, "Engines")
	if err := p.CreateMailbox("Archive"); err != nil {
		t.Fatal(err)
	}
	return p, ids, base, neighbour
}

func intact(t *testing.T, p *Provider, ids []provider.MessageID, neighbour string) {
	t.Helper()
	if _, err := p.GetMessageMetadata("INBOX", ids[0]); err != nil {
		t.Errorf("the user's INBOX lost its message: %v", err)
	}
	if _, err := os.Stat(filepath.Join(neighbour, "cur", "1700000000.grace:2,S")); err != nil {
		t.Errorf("the neighbouring maildir was touched: %v", err)
	}
}

func refusedAsCannot(t *testing.T, what string, err error) {
	t.Helper()
	var imapErr *imap.Error
	if !errors.As(err, &imapErr) || imapErr.Code != imap.ResponseCodeCannot {
		t.Errorf("%s: got %v, want the name refused", what, err)
	}
}

// A mailbox name is a folder of this maildir, or it is refused before the
// file system is touched. "." named the maildir itself, so deleting it
// removed every folder the user had and the account's settings; ".." and a
// path through it named directories outside, another user's maildir among
// them.
func TestAMailboxNameThatIsNotAFolderIsRefused(t *testing.T) {
	for _, name := range []string{
		".", "..", "../grace", "Sent/../../grace", `a\b`, "/etc", "",
		".Sent", "Sent.", "Archive..2024", "nul\x00byte",
	} {
		t.Run(name, func(t *testing.T) {
			p, ids, _, neighbour := jailed(t)
			refusedAsCannot(t, "delete", p.DeleteMailbox(name))
			refusedAsCannot(t, "create", p.CreateMailbox(name))
			refusedAsCannot(t, "rename from", p.RenameMailbox(name, "Elsewhere"))
			refusedAsCannot(t, "rename to", p.RenameMailbox("Archive", name))
			_, err := p.GetMailboxStatus(name)
			refusedAsCannot(t, "status", err)
			_, _, err = p.ListMessages(name, "asc", 0, 10)
			refusedAsCannot(t, "list", err)
			_, err = p.EmptyMailbox(name)
			refusedAsCannot(t, "empty", err)
			_, err = p.MoveMessages("INBOX", name, ids)
			refusedAsCannot(t, "move", err)
			_, err = p.CopyMessages("INBOX", name, ids)
			refusedAsCannot(t, "copy", err)
			// An append to no folder at all files the message by its type.
			if name != "" {
				_, _, _, err = p.AppendMessage(name, &mockMessage{content: []byte("Subject: x\r\n\r\nx\r\n")}, 0)
				refusedAsCannot(t, "append", err)
			}
			intact(t, p, ids, neighbour)
		})
	}
}

// A folder whose name holds the hierarchy's delimiter is still a folder.
func TestANestedFolderNameIsAccepted(t *testing.T) {
	p, _, base, _ := jailed(t)
	if err := p.CreateMailbox("Archive.2024"); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(base, ".Archive.2024", "cur")); err != nil {
		t.Errorf("the folder is not where Maildir++ keeps it: %v", err)
	}
}

// Creating a folder that exists, or deleting or renaming one that does not,
// answers as an IMAP server does, so that the page can say which it was.
// They all answered success: a create changed nothing, a delete removed
// nothing, and the page said both had been done.
func TestMailboxVerbsSayWhatIsAndIsNot(t *testing.T) {
	p, _, _, _ := jailed(t)
	code := func(err error) imap.ResponseCode {
		var imapErr *imap.Error
		if errors.As(err, &imapErr) {
			return imapErr.Code
		}
		return ""
	}
	if got := code(p.CreateMailbox("Archive")); got != imap.ResponseCodeAlreadyExists {
		t.Errorf("creating a folder that exists answered %q", got)
	}
	if got := code(p.DeleteMailbox("Nowhere")); got != imap.ResponseCodeNonExistent {
		t.Errorf("deleting a folder that does not exist answered %q", got)
	}
	if got := code(p.RenameMailbox("Nowhere", "Somewhere")); got != imap.ResponseCodeNonExistent {
		t.Errorf("renaming a folder that does not exist answered %q", got)
	}
	if err := p.CreateMailbox("Old"); err != nil {
		t.Fatal(err)
	}
	if got := code(p.RenameMailbox("Old", "Archive")); got != imap.ResponseCodeAlreadyExists {
		t.Errorf("renaming onto a folder that exists answered %q", got)
	}
	if err := p.RenameMailbox("Old", "New"); err != nil {
		t.Errorf("an ordinary rename: %v", err)
	}
	if err := p.DeleteMailbox("New"); err != nil {
		t.Errorf("an ordinary delete: %v", err)
	}
}

// mustDir is the maildir of a mailbox the test knows to be well named.
func mustDir(t *testing.T, p *Provider, name string) maildir.Dir {
	t.Helper()
	dir, err := p.getDir(name)
	if err != nil {
		t.Fatal(err)
	}
	return maildir.Dir(filepath.Join(p.basePath, dir))
}
