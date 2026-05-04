package provider

import (
	"testing"
	"time"
)

// simpleMessageID is a test implementation of MessageID
type simpleMessageID struct {
	id       string
	provider string
}

func (s simpleMessageID) String() string   { return s.id }
func (s simpleMessageID) Provider() string { return s.provider }

func TestMessageID(t *testing.T) {
	// Test that MessageID interface can be implemented
	var msgID MessageID = simpleMessageID{id: "test123", provider: "test"}

	if msgID.String() != "test123" {
		t.Errorf("Expected String() to return 'test123', got %q", msgID.String())
	}

	if msgID.Provider() != "test" {
		t.Errorf("Expected Provider() to return 'test', got %q", msgID.Provider())
	}
}

func TestMailboxType(t *testing.T) {
	tests := []struct {
		name     string
		mboxType MailboxType
		expected MailboxType
	}{
		{"Sent", MailboxTypeSent, MailboxTypeSent},
		{"Drafts", MailboxTypeDrafts, MailboxTypeDrafts},
		{"Trash", MailboxTypeTrash, MailboxTypeTrash},
		{"Junk", MailboxTypeJunk, MailboxTypeJunk},
		{"Archive", MailboxTypeArchive, MailboxTypeArchive},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.mboxType != tt.expected {
				t.Errorf("MailboxType mismatch: got %v, want %v", tt.mboxType, tt.expected)
			}
		})
	}
}

func TestFlag(t *testing.T) {
	tests := []struct {
		name     string
		flag     Flag
		expected string
	}{
		{"Seen", FlagSeen, "\\Seen"},
		{"Answered", FlagAnswered, "\\Answered"},
		{"Flagged", FlagFlagged, "\\Flagged"},
		{"Deleted", FlagDeleted, "\\Deleted"},
		{"Draft", FlagDraft, "\\Draft"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.flag) != tt.expected {
				t.Errorf("Flag mismatch: got %q, want %q", tt.flag, tt.expected)
			}
		})
	}
}

func TestFlagOperation(t *testing.T) {
	tests := []struct {
		name   string
		op     FlagOperation
		expOp  FlagOp
		expLen int
	}{
		{
			name: "Set flags",
			op: FlagOperation{
				Op:     FlagOpSet,
				Flags:  []Flag{FlagSeen, FlagAnswered},
				Silent: false,
			},
			expOp:  FlagOpSet,
			expLen: 2,
		},
		{
			name: "Add flags",
			op: FlagOperation{
				Op:     FlagOpAdd,
				Flags:  []Flag{FlagFlagged},
				Silent: true,
			},
			expOp:  FlagOpAdd,
			expLen: 1,
		},
		{
			name: "Remove flags",
			op: FlagOperation{
				Op:     FlagOpRemove,
				Flags:  []Flag{FlagDeleted},
				Silent: false,
			},
			expOp:  FlagOpRemove,
			expLen: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.op.Op != tt.expOp {
				t.Errorf("FlagOp mismatch: got %v, want %v", tt.op.Op, tt.expOp)
			}
			if len(tt.op.Flags) != tt.expLen {
				t.Errorf("Flags length mismatch: got %d, want %d", len(tt.op.Flags), tt.expLen)
			}
		})
	}
}

func TestMailbox(t *testing.T) {
	mbox := Mailbox{
		Name:       "INBOX",
		Attributes: []string{"\\HasNoChildren"},
		Total:      10,
		Unseen:     3,
	}

	if mbox.Name != "INBOX" {
		t.Errorf("Expected Name to be 'INBOX', got %q", mbox.Name)
	}

	if len(mbox.Attributes) != 1 {
		t.Errorf("Expected 1 attribute, got %d", len(mbox.Attributes))
	}

	if mbox.Total != 10 {
		t.Errorf("Expected Total to be 10, got %d", mbox.Total)
	}

	if mbox.Unseen != 3 {
		t.Errorf("Expected Unseen to be 3, got %d", mbox.Unseen)
	}
}

func TestMailboxStatus(t *testing.T) {
	status := MailboxStatus{
		Name:           "INBOX",
		NumMessages:    100,
		NumUnseen:      5,
		UIDValidity:    12345,
		PermanentFlags: []Flag{FlagSeen, FlagAnswered, FlagFlagged},
	}

	if status.Name != "INBOX" {
		t.Errorf("Expected Name to be 'INBOX', got %q", status.Name)
	}

	if status.NumMessages != 100 {
		t.Errorf("Expected NumMessages to be 100, got %d", status.NumMessages)
	}

	if status.NumUnseen != 5 {
		t.Errorf("Expected NumUnseen to be 5, got %d", status.NumUnseen)
	}

	if status.UIDValidity != 12345 {
		t.Errorf("Expected UIDValidity to be 12345, got %d", status.UIDValidity)
	}

	if len(status.PermanentFlags) != 3 {
		t.Errorf("Expected 3 permanent flags, got %d", len(status.PermanentFlags))
	}
}

func TestMessage(t *testing.T) {
	msg := Message{
		ID:      simpleMessageID{id: "123", provider: "test"},
		SeqNum:  1,
		Mailbox: "INBOX",
		Flags:   []Flag{FlagSeen},
		Size:    1024,
	}

	if msg.ID.String() != "123" {
		t.Errorf("Expected ID to be '123', got %q", msg.ID.String())
	}

	if msg.SeqNum != 1 {
		t.Errorf("Expected SeqNum to be 1, got %d", msg.SeqNum)
	}

	if msg.Mailbox != "INBOX" {
		t.Errorf("Expected Mailbox to be 'INBOX', got %q", msg.Mailbox)
	}

	if len(msg.Flags) != 1 {
		t.Errorf("Expected 1 flag, got %d", len(msg.Flags))
	}

	if msg.Size != 1024 {
		t.Errorf("Expected Size to be 1024, got %d", msg.Size)
	}
}

func TestEnvelope(t *testing.T) {
	testDate, err := time.Parse(time.RFC1123Z, "Mon, 02 Jan 2006 15:04:05 -0700")
	if err != nil {
		t.Fatalf("Failed to parse test date: %v", err)
	}
	env := Envelope{
		Date:      testDate,
		Subject:   "Test Subject",
		From:      []Address{{Name: "Sender", Mailbox: "sender", Host: "example.com"}},
		To:        []Address{{Name: "Recipient", Mailbox: "recipient", Host: "example.com"}},
		MessageID: "<test@example.com>",
	}

	if env.Date.IsZero() {
		t.Error("Expected Date to be set")
	}

	if env.Subject != "Test Subject" {
		t.Errorf("Expected Subject to be 'Test Subject', got %q", env.Subject)
	}

	if len(env.From) != 1 {
		t.Errorf("Expected 1 From address, got %d", len(env.From))
	}

	if env.From[0].Mailbox != "sender" {
		t.Errorf("Expected From mailbox to be 'sender', got %q", env.From[0].Mailbox)
	}

	if len(env.To) != 1 {
		t.Errorf("Expected 1 To address, got %d", len(env.To))
	}

	if env.MessageID != "<test@example.com>" {
		t.Errorf("Expected MessageID to be '<test@example.com>', got %q", env.MessageID)
	}
}

func TestAddress(t *testing.T) {
	addr := Address{
		Name:    "John Doe",
		Mailbox: "john",
		Host:    "example.com",
	}

	if addr.Name != "John Doe" {
		t.Errorf("Expected Name to be 'John Doe', got %q", addr.Name)
	}

	if addr.Mailbox != "john" {
		t.Errorf("Expected Mailbox to be 'john', got %q", addr.Mailbox)
	}

	if addr.Host != "example.com" {
		t.Errorf("Expected Host to be 'example.com', got %q", addr.Host)
	}
}
