package maildir

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-maildir"
	"github.com/migadu/alps/provider"
)

type Provider struct {
	basePath string
	username string
}

func NewProvider(basePath, username string) *Provider {
	return &Provider{
		basePath: basePath,
		username: username,
	}
}

func (p *Provider) Close() error {
	return nil
}

// getDir is the maildir of the mailbox name: the user's maildir itself for
// INBOX, and a Maildir++ folder in it for any other, its name after a dot
// (Archive.2024 is .Archive.2024).
//
// A name that is not a folder's is refused before anything touches the file
// system. Joined to the maildir as it came, "." named the maildir itself, so
// deleting it deleted every folder the user had; ".." and a path through it
// named directories outside, another user's maildir among them.
func (p *Provider) getDir(name string) (maildir.Dir, error) {
	if name == "INBOX" {
		return maildir.Dir(p.basePath), nil
	}
	if !folderName(name) {
		return "", refused("not a folder name: %q", name)
	}
	return maildir.Dir(filepath.Join(p.basePath, "."+name)), nil
}

// folderName reports whether name names a Maildir++ folder: one or more
// names joined by the delimiter, none of them empty, and no path separator
// or NUL. With that, "." and its name stay one entry of the maildir.
func folderName(name string) bool {
	if name == "" || strings.HasPrefix(name, ".") || strings.HasSuffix(name, ".") || strings.Contains(name, "..") {
		return false
	}
	return !strings.ContainsAny(name, "/\\\x00")
}

// The mailbox verbs answer as an IMAP server does, with the response codes
// the mail routes tell the page from (see mailboxErrorStatus).
func refused(format string, args ...any) error {
	return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeCannot, Text: fmt.Sprintf(format, args...)}
}

func nonexistent(name string) error {
	return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNonExistent, Text: fmt.Sprintf("no folder %q", name)}
}

func alreadyExists(name string) error {
	return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeAlreadyExists, Text: fmt.Sprintf("folder %q exists", name)}
}

// getDirs is getDir for the two mailboxes of a move or a copy.
func (p *Provider) getDirs(source, dest string) (maildir.Dir, maildir.Dir, error) {
	src, err := p.getDir(source)
	if err != nil {
		return "", "", err
	}
	dst, err := p.getDir(dest)
	if err != nil {
		return "", "", err
	}
	return src, dst, nil
}

// isFolder reports whether dir is there, as a directory.
func isFolder(dir maildir.Dir) (bool, error) {
	info, err := os.Lstat(string(dir))
	if errors.Is(err, fs.ErrNotExist) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return info.IsDir(), nil
}

func (p *Provider) ListMailboxes() ([]provider.Mailbox, error) {
	var mailboxes []provider.Mailbox

	// Add INBOX
	inbox, _ := p.getDir("INBOX")
	inboxMsgs, _ := getAllMessages(inbox)
	mailboxes = append(mailboxes, provider.Mailbox{
		Name:       "INBOX",
		Delimiter:  '.',
		Total:      len(inboxMsgs),
		Unseen:     countUnseen(inboxMsgs),
		Subscribed: true,
	})

	// Add subfolders
	entries, err := os.ReadDir(p.basePath)
	if err != nil {
		return mailboxes, nil
	}

	for _, entry := range entries {
		if !entry.IsDir() || !strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		// Exclude special Maildir dirs if they somehow got prefixed with dot (rare)
		if entry.Name() == "." || entry.Name() == ".." {
			continue
		}

		name := strings.TrimPrefix(entry.Name(), ".")
		dir, err := p.getDir(name)
		if err != nil {
			// A directory alps could not name, and so could not open.
			continue
		}
		msgs, _ := getAllMessages(dir)

		mailboxes = append(mailboxes, provider.Mailbox{
			Name:       name,
			Delimiter:  '.',
			Total:      len(msgs),
			Unseen:     countUnseen(msgs),
			Subscribed: true, // Assume all are subscribed for now
		})
	}

	return mailboxes, nil
}

func (p *Provider) GetMailboxStatus(name string) (*provider.MailboxStatus, error) {
	dir, err := p.getDir(name)
	if err != nil {
		return nil, err
	}
	msgs, err := getAllMessages(dir)
	if err != nil {
		return nil, err
	}

	return &provider.MailboxStatus{
		Name:        name,
		NumMessages: uint32(len(msgs)),
		NumUnseen:   uint32(countUnseen(msgs)),
	}, nil
}

// mailboxNameForType maps a special-use mailbox type to its canonical folder name.
func mailboxNameForType(mboxType provider.MailboxType) (string, error) {
	switch mboxType {
	case provider.MailboxTypeSent:
		return "Sent", nil
	case provider.MailboxTypeDrafts:
		return "Drafts", nil
	case provider.MailboxTypeTrash:
		return "Trash", nil
	case provider.MailboxTypeJunk:
		return "Junk", nil
	case provider.MailboxTypeArchive:
		return "Archive", nil
	default:
		return "", fmt.Errorf("unknown mailbox type %v", mboxType)
	}
}

func (p *Provider) FindMailboxByType(mboxType provider.MailboxType) (*provider.Mailbox, error) {
	mailboxes, err := p.ListMailboxes()
	if err != nil {
		return nil, err
	}

	targetName, err := mailboxNameForType(mboxType)
	if err != nil {
		return nil, err
	}

	for _, m := range mailboxes {
		if strings.EqualFold(m.Name, targetName) {
			return &m, nil
		}
	}

	// Try to find a fallback if exact match not found (e.g., "Sent Messages")
	for _, m := range mailboxes {
		if strings.Contains(strings.ToLower(m.Name), strings.ToLower(targetName)) {
			return &m, nil
		}
	}

	// No such folder is answered as none, not as a failure, as the IMAP
	// provider answers it. A conversation read in an account without Sent has
	// no replies to look for there, and was taken for one whose look in Sent
	// had failed.
	return nil, nil
}

// CreateMailbox makes the folder, and says so when it is there already.
// INBOX is the maildir, which is there from the start.
func (p *Provider) CreateMailbox(name string) error {
	dir, err := p.getDir(name)
	if err != nil {
		return err
	}
	if name == "INBOX" {
		// Provider setup may initialize a never-delivered INBOX. Once its
		// cur directory exists, creating it again is an existing mailbox.
		if _, err := os.Stat(filepath.Join(p.basePath, "cur")); err == nil {
			return alreadyExists(name)
		} else if !errors.Is(err, fs.ErrNotExist) {
			return err
		}
		if err := os.MkdirAll(p.basePath, 0o700); err != nil {
			return err
		}
		return dir.Init()
	}
	// An account may have no physical INBOX before its first delivery. The
	// configured root must exist before creating its first Maildir++ folder.
	if err := os.MkdirAll(p.basePath, 0o700); err != nil {
		return err
	}
	if err := maildir.Dir(p.basePath).Init(); err != nil {
		return err
	}
	// The folder itself first, alone, so that one that exists is told
	// from one made now.
	if err := os.Mkdir(string(dir), 0o700); errors.Is(err, fs.ErrExist) {
		return alreadyExists(name)
	} else if err != nil {
		return err
	}
	return dir.Init()
}

// RenameMailbox renames a folder, which must be there, to a name no folder
// has.
func (p *Provider) RenameMailbox(oldName, newName string) error {
	oldDir, err := p.getDir(oldName)
	if err != nil {
		return err
	}
	newDir, err := p.getDir(newName)
	if err != nil {
		return err
	}
	if ok, err := isFolder(oldDir); err != nil {
		return err
	} else if !ok {
		return nonexistent(oldName)
	}
	if _, err := os.Lstat(string(newDir)); err == nil {
		return alreadyExists(newName)
	} else if !errors.Is(err, fs.ErrNotExist) {
		return err
	}
	return os.Rename(string(oldDir), string(newDir))
}

// DeleteMailbox removes a folder and everything in it. A folder that is not
// there is said to be missing, as an IMAP server says it.
func (p *Provider) DeleteMailbox(name string) error {
	if name == "INBOX" {
		return fmt.Errorf("cannot delete INBOX")
	}
	dir, err := p.getDir(name)
	if err != nil {
		return err
	}
	if ok, err := isFolder(dir); err != nil {
		return err
	} else if !ok {
		return nonexistent(name)
	}
	return os.RemoveAll(string(dir))
}

// EmptyMailbox removes every message in a mailbox and returns how many it
// removed, so a caller can tell an emptied folder from one that was already
// empty. A removal that fails is not counted and is reported: the folder is
// then still holding mail the user was told had gone.
func (p *Provider) EmptyMailbox(name string) (int, error) {
	dir, err := p.getDir(name)
	if err != nil {
		return 0, err
	}
	messages, err := getAllMessages(dir)
	if err != nil {
		return 0, err
	}
	removed := 0
	for _, msg := range messages {
		if err := msg.Remove(); err != nil {
			return removed, err
		}
		removed++
	}
	return removed, nil
}

func (p *Provider) SubscribeMailbox(name string) error {
	// Not natively supported by Maildir, ignore or implement custom store later
	return nil
}

func (p *Provider) UnsubscribeMailbox(name string) error {
	return nil
}

// MaildirMessageID implements provider.MessageID
type MaildirMessageID string

func (id MaildirMessageID) String() string {
	return string(id)
}

func (id MaildirMessageID) Provider() string {
	return "maildir"
}

func (p *Provider) ParseMessageID(id string) (provider.MessageID, error) {
	if !messageKey(id) {
		return nil, refused("not a Maildir message key: %q", id)
	}
	return MaildirMessageID(id), nil
}

// A key identifies one entry, before the Maildir flag suffix. Refuse path
// components even when an internal caller constructs an ID directly.
func messageKey(key string) bool {
	return key != "" && key != "." && key != ".." && !strings.ContainsAny(key, "/\\:\x00")
}

// Map maildir flags to provider flags
func maildirFlagsToProviderFlags(mdFlags []maildir.Flag) []provider.Flag {
	var flags []provider.Flag
	for _, f := range mdFlags {
		switch f {
		case maildir.FlagPassed:
			// Passed?
		case maildir.FlagReplied:
			flags = append(flags, provider.FlagAnswered)
		case maildir.FlagSeen:
			flags = append(flags, provider.FlagSeen)
		case maildir.FlagTrashed:
			flags = append(flags, provider.FlagDeleted)
		case maildir.FlagDraft:
			flags = append(flags, provider.FlagDraft)
		case maildir.FlagFlagged:
			flags = append(flags, provider.FlagFlagged)
		}
	}
	return flags
}

func providerFlagsToMaildirFlags(pFlags []provider.Flag) []maildir.Flag {
	var flags []maildir.Flag
	for _, f := range pFlags {
		switch f {
		case provider.FlagAnswered:
			flags = append(flags, maildir.FlagReplied)
		case provider.FlagSeen:
			flags = append(flags, maildir.FlagSeen)
		case provider.FlagDeleted:
			flags = append(flags, maildir.FlagTrashed)
		case provider.FlagDraft:
			flags = append(flags, maildir.FlagDraft)
		case provider.FlagFlagged:
			flags = append(flags, maildir.FlagFlagged)
		}
	}
	return flags
}
