package maildir

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

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

func (p *Provider) getDir(name string) maildir.Dir {
	if name == "INBOX" {
		return maildir.Dir(p.basePath)
	}
	// Maildir++ subfolders
	if !strings.HasPrefix(name, ".") {
		name = "." + name
	}
	return maildir.Dir(filepath.Join(p.basePath, name))
}

func (p *Provider) ListMailboxes() ([]provider.Mailbox, error) {
	var mailboxes []provider.Mailbox

	// Add INBOX
	inbox := p.getDir("INBOX")
	inboxUnseen, _ := inbox.UnseenCount()
	inboxMsgs, _ := getAllMessages(inbox)
	mailboxes = append(mailboxes, provider.Mailbox{
		Name:       "INBOX",
		Delimiter:  '.',
		Total:      len(inboxMsgs),
		Unseen:     inboxUnseen,
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

		folderName := strings.TrimPrefix(entry.Name(), ".")
		dir := p.getDir(folderName)
		unseen, _ := dir.UnseenCount()
		msgs, _ := getAllMessages(dir)

		mailboxes = append(mailboxes, provider.Mailbox{
			Name:       folderName,
			Delimiter:  '.',
			Total:      len(msgs),
			Unseen:     unseen,
			Subscribed: true, // Assume all are subscribed for now
		})
	}

	return mailboxes, nil
}

func (p *Provider) GetMailboxStatus(name string) (*provider.MailboxStatus, error) {
	dir := p.getDir(name)
	unseen, err := dir.UnseenCount()
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
		NumUnseen:   uint32(unseen),
	}, nil
}

func (p *Provider) FindMailboxByType(mboxType provider.MailboxType) (*provider.Mailbox, error) {
	mailboxes, err := p.ListMailboxes()
	if err != nil {
		return nil, err
	}

	var targetName string
	switch mboxType {
	case provider.MailboxTypeSent:
		targetName = "Sent"
	case provider.MailboxTypeDrafts:
		targetName = "Drafts"
	case provider.MailboxTypeTrash:
		targetName = "Trash"
	case provider.MailboxTypeJunk:
		targetName = "Junk"
	case provider.MailboxTypeArchive:
		targetName = "Archive"
	default:
		return nil, fmt.Errorf("unknown mailbox type")
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

	return nil, fmt.Errorf("mailbox not found")
}

func (p *Provider) CreateMailbox(name string) error {
	dir := p.getDir(name)
	return dir.Init()
}

func (p *Provider) RenameMailbox(oldName, newName string) error {
	oldDir := p.getDir(oldName)
	newDir := p.getDir(newName)
	return os.Rename(string(oldDir), string(newDir))
}

func (p *Provider) DeleteMailbox(name string) error {
	if name == "INBOX" {
		return fmt.Errorf("cannot delete INBOX")
	}
	dir := p.getDir(name)
	return os.RemoveAll(string(dir))
}

func (p *Provider) EmptyMailbox(name string) error {
	dir := p.getDir(name)
	messages, err := getAllMessages(dir)
	if err != nil {
		return err
	}
	for _, msg := range messages {
		msg.Remove()
	}
	return nil
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
	if id == "" {
		return nil, fmt.Errorf("invalid Maildir message ID: empty string")
	}
	return MaildirMessageID(id), nil
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
