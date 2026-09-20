package provider

import (
	"fmt"
	"io"
	"regexp"
	"time"

	"github.com/emersion/go-message"
)

// AuthenticatedProviderFactory creates an authenticated provider instance
type AuthenticatedProviderFactory func(username, password string) (MailProvider, error)

// MailProvider abstracts mail backend (IMAP, JMAP, etc.)
type MailProvider interface {
	// Connection lifecycle
	Close() error

	// Storage operations
	GetStore() (Store, error)

	// Mailbox operations
	ListMailboxes() ([]Mailbox, error)
	GetMailboxStatus(name string) (*MailboxStatus, error)
	FindMailboxByType(mboxType MailboxType) (*Mailbox, error)
	CreateMailbox(name string) error
	RenameMailbox(oldName, newName string) error
	DeleteMailbox(name string) error
	// EmptyMailbox discards every message in a mailbox and reports how many
	// there were to discard. A count of zero means the mailbox was already
	// empty: the caller can say so rather than claim work it did not do.
	EmptyMailbox(name string) (int, error)
	SubscribeMailbox(name string) error
	UnsubscribeMailbox(name string) error

	// Message listing and search
	ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]Message, int, error)
	SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]Message, int, error)

	// Message operations
	ParseMessageID(id string) (MessageID, error)
	GetMessageMetadata(mailbox string, id MessageID) (*Message, error)
	GetMessagePart(mailbox string, id MessageID, partPath []int) (*Message, *message.Entity, error)
	GetMessagePartRaw(mailbox string, id MessageID, partPath []int, limit int64) (*Message, []byte, []byte, error)
	GetMessagePartWithData(mailbox string, id MessageID, partPath []int) (*Message, *message.Entity, []byte, []byte, error)

	// Message manipulation
	SetMessagesFlags(mailbox string, ids []MessageID, op FlagOperation) error
	MarkAnswered(mailbox string, id MessageID) error
	AppendMessage(mailbox string, msg OutgoingMessageWriter, mboxType MailboxType) (*Mailbox, MessageID, uint32, error)
	DeleteMessages(mailbox string, ids []MessageID) error
	MoveMessages(sourceMailbox, destMailbox string, ids []MessageID) (map[MessageID]MessageID, error)
	CopyMessages(sourceMailbox, destMailbox string, ids []MessageID) (map[MessageID]MessageID, error)
}

// OutgoingMessageWriter is an interface for messages being sent
type OutgoingMessageWriter interface {
	WriteTo(w io.Writer) (int64, error)
}

// MailboxType represents common mailbox categories
type MailboxType int

const (
	MailboxTypeSent MailboxType = iota
	MailboxTypeDrafts
	MailboxTypeTrash
	MailboxTypeJunk
	MailboxTypeArchive
)

// Mailbox represents a mail folder
type Mailbox struct {
	Name       string
	Delimiter  rune
	Attributes []string
	Total      int
	Unseen     int
	Subscribed bool
}

// MailboxStatus contains mailbox metadata
type MailboxStatus struct {
	Name           string
	NumMessages    uint32
	NumUnseen      uint32
	UIDValidity    uint32
	PermanentFlags []Flag
}

// Message represents an email message
type Message struct {
	ID            MessageID
	SeqNum        uint32
	Mailbox       string
	Flags         []Flag
	Envelope      *Envelope
	BodyStructure BodyStructure
	Size          uint32
	BimiPotential bool
	BimiFailed    bool
	References    []string
	ThreadCount   int       `json:"ThreadCount,omitempty"`
	ThreadUIDs    []string  `json:"ThreadUIDs,omitempty"`
	SubMessages   []Message `json:"SubMessages,omitempty"`
}

// MessageID is a provider-specific message identifier
type MessageID interface {
	String() string
	Provider() string
}

// Envelope contains message header information
type Envelope struct {
	Date      time.Time
	Subject   string
	From      []Address
	Sender    []Address
	ReplyTo   []Address
	To        []Address
	Cc        []Address
	Bcc       []Address
	InReplyTo string
	MessageID string
}

// Address represents an email address
type Address struct {
	Name    string
	Mailbox string
	Host    string
}

// BodyStructure represents message structure
type BodyStructure interface {
	MediaType() string
	Walk(func(path []int, part BodyStructure) bool)
}

// Flag represents a message flag
type Flag string

const (
	FlagSeen     Flag = "\\Seen"
	FlagAnswered Flag = "\\Answered"
	FlagFlagged  Flag = "\\Flagged"
	FlagDeleted  Flag = "\\Deleted"
	FlagDraft    Flag = "\\Draft"
)

// FlagOperation represents a flag modification
type FlagOperation struct {
	Op     FlagOp
	Silent bool
	Flags  []Flag
}

// FlagOp represents the type of flag operation
type FlagOp int

const (
	FlagOpSet FlagOp = iota
	FlagOpAdd
	FlagOpRemove
)

// ProviderFactory creates a MailProvider instance
type ProviderFactory func() (MailProvider, error)

// MessagePart represents a MIME part of a message
type MessagePart struct {
	Path     []int
	MIMEType string
	Filename string
	Size     uint32
	Entity   *message.Entity
	Reader   io.Reader
}

// ErrNoStoreEntry is returned by Store.Get when the entry doesn't exist.
var ErrNoStoreEntry = fmt.Errorf("provider: no such entry in store")

// ErrMessageNotFound is returned, possibly wrapped, when a mailbox does not
// hold the requested message: it was deleted or moved since it was listed, or
// never existed. It is not a failure of the backend.
var ErrMessageNotFound = fmt.Errorf("provider: no such message")

// Store allows storing per-user persistent data.
type Store interface {
	Get(key string, out interface{}) error
	Put(key string, v interface{}) error
}

// A FreshStore can read an entry from where it is kept, past any copy it
// holds, and keeps what it read. A copy is only what this connection last
// saw: another client may have written the entry since.
type FreshStore interface {
	Store
	GetFresh(key string, out interface{}) error
}

// GetFresh reads key from s, past any copy s keeps when it can.
func GetFresh(s Store, key string, out interface{}) error {
	if f, ok := s.(FreshStore); ok {
		return f.GetFresh(key, out)
	}
	return s.Get(key, out)
}

var messageIDRegex = regexp.MustCompile(`<([^>]+)>`)

// ParseReferences parses a references string and returns a slice of Message-IDs.
func ParseReferences(refStr string) []string {
	matches := messageIDRegex.FindAllStringSubmatch(refStr, -1)
	if len(matches) == 0 {
		return nil
	}
	refs := make([]string, 0, len(matches))
	for _, m := range matches {
		if len(m) > 1 {
			refs = append(refs, m[1])
		}
	}
	return refs
}

// AuthVerdict is a message's authentication verdict, as its receiving server
// recorded it.
type AuthVerdict struct {
	BimiPotential bool // DMARC passed, so a brand logo may be shown
	BimiFailed    bool // DMARC, DKIM or SPF failed
}

// AuthVerdictProvider is implemented by a provider that can read messages'
// authentication verdicts on request. A provider without it shows no brand
// logos beyond the verdicts its listings carry.
type AuthVerdictProvider interface {
	// AuthVerdicts returns the verdicts of the messages among ids that exist in
	// mailbox, keyed by the ID's String(), and a scope naming what those IDs
	// referred to: the same ID under a different scope is a different message.
	AuthVerdicts(mailbox string, ids []MessageID) (verdicts map[string]AuthVerdict, scope string, err error)
}
