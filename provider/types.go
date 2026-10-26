package provider

import (
	"fmt"
	"io"
	"regexp"
	"time"

	"github.com/emersion/go-message"
)

// AuthError wraps an authentication error.
type AuthError struct {
	Cause error
}

func (err AuthError) Error() string {
	return fmt.Sprintf("authentication failed: %v", err.Cause)
}

func (err AuthError) Unwrap() error {
	return err.Cause
}

// LimitError is a request the mail server refused for one of its limits:
// RFC 5530's [LIMIT], with which Sora refuses a search once the account's
// search budget is used up, and a sign-in once the account holds as many
// connections as it may. It is neither the user's mistake nor a failure of
// the server, and the same request may succeed later. RetryAfter is how long
// the server said to wait, or 0 when it did not say.
type LimitError struct {
	RetryAfter time.Duration
	Cause      error
}

func (err *LimitError) Error() string {
	return fmt.Sprintf("refused for a server limit: %v", err.Cause)
}

func (err *LimitError) Unwrap() error {
	return err.Cause
}

// AuthenticatedProviderFactory creates an authenticated provider instance
type AuthenticatedProviderFactory func(username, password string) (MailProvider, error)

type Config interface {
	Type() string
	ToOptions() (Options, error)
}

type Options interface {
	Type() string
	CreateFactory(timeout time.Duration, debug bool) AuthenticatedProviderFactory
}

// MailProvider abstracts mail backend (IMAP, JMAP, etc.)
type MailProvider interface {
	// Connection lifecycle
	Close() error

	// Storage operations
	GetStore() (Store, error)

	// Mailbox operations
	ListMailboxes() ([]Mailbox, error)
	GetMailboxStatus(name string) (*MailboxStatus, error)
	// FindMailboxByType returns nil, nil when no mailbox has that type. An
	// error means the lookup failed, so absence cannot be inferred from it.
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
	ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]Message, PageInfo, error)
	SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]Message, PageInfo, error)
	// SearchMessageIDs answers every message of the mailbox the query matches,
	// and nothing about them: the operand of an action taken on a whole folder,
	// which must not depend on what a page of the listing happens to hold. An
	// empty query is the whole mailbox, as an empty listing query is.
	SearchMessageIDs(mailbox, query string) ([]MessageID, error)

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
	// MoveMessages and CopyMessages answer the new ID of each message they
	// moved or copied. A nil answer says nothing of which did, as from a mail
	// server that does not name its copies; an empty one, that none did.
	MoveMessages(sourceMailbox, destMailbox string, ids []MessageID) (map[MessageID]MessageID, error)
	CopyMessages(sourceMailbox, destMailbox string, ids []MessageID) (map[MessageID]MessageID, error)
}

// ChangeTracker is a MailProvider whose mail server numbers the changes to a
// mailbox's messages (IMAP CONDSTORE, RFC 7162), so that what changed since a
// listing was read can be asked for rather than the listing read again.
type ChangeTracker interface {
	// TrackChanges has the mail server number the changes from now on, where
	// it can, and reports whether it does. It is called once, before the
	// connection is first used: IMAP takes ENABLE only before a mailbox is
	// selected (RFC 5161). An error says that the connection failed.
	TrackChanges() (bool, error)
	// ChangedFlags answers the messages among ids whose flags changed after
	// the change numbered since, each with its ID and its flags now. A
	// message not answered has the flags it had then, or is gone.
	ChangedFlags(mailbox string, ids []MessageID, since uint64) ([]Message, error)
}

// Idler is a MailProvider whose mail server can tell it, unasked, of changes
// to a mailbox as they happen (IMAP IDLE, RFC 2177).
type Idler interface {
	// CanIdle reports whether the mail server can. An error says that it
	// could not be asked, which is no answer either way.
	CanIdle() (bool, error)
	// OnMailboxNews has news called, with the mailbox's name, whenever the
	// mail server says unasked that a message arrived in the mailbox
	// selected on the connection, or went from it; nil stops the news. It is
	// called from the connection's reader, and must neither block nor use
	// the connection.
	OnMailboxNews(news func(mailbox string))
	// Idle selects mailbox and waits for the mail server's news of it until
	// stop is closed or the connection fails. It then ends the wait, and
	// returns once the server has answered, with the connection free for
	// other commands; when the server does not answer in time, the
	// connection is closed and the error is a network error. started is
	// called once the server has begun to wait.
	Idle(mailbox string, stop <-chan struct{}, started func()) error
}

// FolderWatcher is an Idler whose mail server can also tell it of the
// mailboxes other than the one selected (IMAP NOTIFY, RFC 5465).
type FolderWatcher interface {
	// WatchFolders has the mail server tell, from now on, of the messages
	// that arrive in the subscribed mailboxes or go from them, as of those of
	// the mailbox selected, through OnMailboxNews; a flag changed is no news.
	// It reports whether the server does: not when it cannot, or refused,
	// which the error then says. begun says that it began to now: what
	// changed before went unheard. The server may stop telling (Idle then
	// returns), and the next call asks again. Any other error is the
	// connection's, as Idle's.
	WatchFolders() (watched, begun bool, err error)
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
	// UIDValidity, UIDNext and HighestModSeq come with Total and Unseen where
	// the listing carries each folder's status (see MailboxStatus), and are 0
	// otherwise.
	UIDValidity   uint32
	UIDNext       uint32
	HighestModSeq uint64
	Subscribed    bool
}

// MailboxStatus contains mailbox metadata
type MailboxStatus struct {
	Name        string
	NumMessages uint32
	NumUnseen   uint32
	UIDValidity uint32
	// UIDNext is the UID the next message stored in the mailbox will get, or
	// 0 where the provider has no UIDs. A message that arrives moves it even
	// when another goes at the same time and leaves both counts as they were.
	UIDNext        uint32
	PermanentFlags []Flag
	// HighestModSeq numbers the latest change to the mailbox's messages: a
	// flag set or cleared, a message stored or taken out (IMAP CONDSTORE,
	// RFC 7162). It is 0 where the provider does not track changes (see
	// ChangeTracker).
	HighestModSeq uint64
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

// ErrAppendNotStarted marks an AppendMessage failure known to have happened
// before APPEND was issued. Only this outcome permits retrying an append;
// an unmarked connection error may have lost the reply to a committed write.
var ErrAppendNotStarted = fmt.Errorf("provider: APPEND was not started")

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

// MailboxStatusBatcher is implemented by a provider that can ask for several
// mailboxes' status in one round trip. A provider without it is asked one
// mailbox at a time.
type MailboxStatusBatcher interface {
	// GetMailboxStatuses returns the status of each of names, in the same
	// order. Where errs holds an error, that mailbox's status could not be
	// read and its entry in statuses is nil.
	GetMailboxStatuses(names []string) (statuses []*MailboxStatus, errs []error)
}

// ServiceRouter is implemented by provider Options that resolve backends per
// login. A provider that routes the mail store by domain can route everything
// else the same way, so a user does not read from one host while sending,
// syncing contacts or changing a password somewhere unrelated.
//
// Both methods return a zero value to mean "no opinion", in which case the
// caller keeps whatever is configured globally. Providers that do not
// implement this interface behave exactly as before.
type ServiceRouter interface {
	// ServiceURL resolves a single endpoint: "smtp", "carddav", "caldav" or
	// "managesieve". An empty string defers to the global configuration.
	ServiceURL(service, username string) string

	// ServiceOptions resolves a whole plugin option block, for services whose
	// configuration is more than an address. The password plugin needs this:
	// two backends mean two admin APIs with separate credentials. A nil map
	// defers to the global configuration.
	ServiceOptions(service, username string) map[string]interface{}
}

// AddressResolver is implemented by provider Options that know the email
// address of a login that is not one. The multi provider takes a bare user
// name under its default_domain, and the address is the two together.
type AddressResolver interface {
	// AddressOf returns the address of a login with no "@" in it, or "" when
	// the provider cannot tell.
	AddressOf(username string) string
}

// Service names understood by ServiceRouter.
const (
	ServiceSMTP        = "smtp"
	ServiceCardDAV     = "carddav"
	ServiceCalDAV      = "caldav"
	ServiceManageSieve = "managesieve"
	ServicePassword    = "password"
)

// PageInfo describes the page a listing returned.
//
// Total counts rows of the kind the page actually contains, and Threaded says
// which kind that is. The two travel together because a provider may not be
// able to keep its promise: threading is answered over the whole mailbox, so
// it is the first thing a loaded server refuses, and a listing that cannot
// group still shows the folder — flat, and counted in messages rather than
// conversations.
//
// That makes Threaded part of the pagination contract, not a decoration. The
// same mailbox can answer 12 (conversations) to one request and 48 (messages)
// to the next, so a caller holding a page number must treat a change in
// Threaded as a reset rather than paging on with an offset that now means
// something else.
type PageInfo struct {
	// Total is the number of rows available to page through: conversations
	// when Threaded, individual messages otherwise.
	Total int

	// Threaded reports whether each row is a conversation.
	Threaded bool
}
