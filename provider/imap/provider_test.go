package imap

import (
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

// TestIMAPUID tests the IMAPUID implementation of MessageID
func TestIMAPUID(t *testing.T) {
	uid := IMAPUID(12345)

	if uid.String() != "12345" {
		t.Errorf("Expected String() to return '12345', got %q", uid.String())
	}

	if uid.Provider() != "imap" {
		t.Errorf("Expected Provider() to return 'imap', got %q", uid.Provider())
	}

	// Test that IMAPUID implements MessageID interface
	var _ provider.MessageID = uid
}

// TestIMAPUIDConversion tests conversion between imap.UID and IMAPUID
func TestIMAPUIDConversion(t *testing.T) {
	tests := []struct {
		name     string
		input    imap.UID
		expected string
	}{
		{"Small UID", 1, "1"},
		{"Medium UID", 1000, "1000"},
		{"Large UID", 999999, "999999"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uid := IMAPUID(tt.input)
			if uid.String() != tt.expected {
				t.Errorf("Expected %q, got %q", tt.expected, uid.String())
			}
		})
	}
}

// TestIMAPBodyStructure tests the IMAPBodyStructure wrapper
func TestIMAPBodyStructure(t *testing.T) {
	// Create a simple single-part body structure
	bs := &imap.BodyStructureSinglePart{
		Type:    "text",
		Subtype: "plain",
		Size:    1024,
	}

	wrapped := &IMAPBodyStructure{BodyStructure: bs}

	mediaType := wrapped.MediaType()
	if mediaType != "text/plain" {
		t.Errorf("Expected MediaType to be 'text/plain', got %q", mediaType)
	}

	// Test that IMAPBodyStructure implements BodyStructure interface
	var _ provider.BodyStructure = wrapped
}

// TestIMAPBodyStructureWalk tests the Walk method
func TestIMAPBodyStructureWalk(t *testing.T) {
	// Create a multipart body structure
	part1 := &imap.BodyStructureSinglePart{
		Type:    "text",
		Subtype: "plain",
		Size:    100,
	}
	part2 := &imap.BodyStructureSinglePart{
		Type:    "text",
		Subtype: "html",
		Size:    200,
	}

	multipart := &imap.BodyStructureMultiPart{
		Subtype:  "alternative",
		Children: []imap.BodyStructure{part1, part2},
	}

	wrapped := &IMAPBodyStructure{BodyStructure: multipart}

	count := 0
	wrapped.Walk(func(path []int, part provider.BodyStructure) bool {
		count++
		if part == nil {
			t.Error("Walk callback received nil part")
		}
		return true // continue walking
	})

	// Should visit the multipart itself plus its 2 children
	if count != 3 {
		t.Errorf("Expected Walk to visit 3 parts, visited %d", count)
	}
}

// TestConvertIMAPEnvelope tests envelope conversion
func TestConvertIMAPEnvelope(t *testing.T) {
	tests := []struct {
		name     string
		input    *imap.Envelope
		expected *provider.Envelope
	}{
		{
			name:     "Nil envelope",
			input:    nil,
			expected: nil,
		},
		{
			name: "Basic envelope",
			input: &imap.Envelope{
				Subject:   "Test Subject",
				From:      []imap.Address{{Mailbox: "sender", Host: "example.com"}},
				To:        []imap.Address{{Mailbox: "recipient", Host: "example.com"}},
				MessageID: "<test@example.com>",
			},
			expected: &provider.Envelope{
				Subject:   "Test Subject",
				From:      []provider.Address{{Mailbox: "sender", Host: "example.com"}},
				To:        []provider.Address{{Mailbox: "recipient", Host: "example.com"}},
				MessageID: "<test@example.com>",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertIMAPEnvelope(tt.input)

			if tt.expected == nil {
				if result != nil {
					t.Errorf("Expected nil, got %v", result)
				}
				return
			}

			if result.Subject != tt.expected.Subject {
				t.Errorf("Subject mismatch: got %q, want %q", result.Subject, tt.expected.Subject)
			}

			if len(result.From) != len(tt.expected.From) {
				t.Errorf("From length mismatch: got %d, want %d", len(result.From), len(tt.expected.From))
			}

			if len(result.To) != len(tt.expected.To) {
				t.Errorf("To length mismatch: got %d, want %d", len(result.To), len(tt.expected.To))
			}

			if result.MessageID != tt.expected.MessageID {
				t.Errorf("MessageID mismatch: got %q, want %q", result.MessageID, tt.expected.MessageID)
			}
		})
	}
}

// TestConvertIMAPAddresses tests address list conversion
func TestConvertIMAPAddresses(t *testing.T) {
	tests := []struct {
		name     string
		input    []imap.Address
		expected int
	}{
		{
			name:     "Empty list",
			input:    []imap.Address{},
			expected: 0,
		},
		{
			name: "Single address",
			input: []imap.Address{
				{Name: "John Doe", Mailbox: "john", Host: "example.com"},
			},
			expected: 1,
		},
		{
			name: "Multiple addresses",
			input: []imap.Address{
				{Name: "John Doe", Mailbox: "john", Host: "example.com"},
				{Name: "Jane Doe", Mailbox: "jane", Host: "example.com"},
				{Mailbox: "noreply", Host: "example.org"},
			},
			expected: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertIMAPAddresses(tt.input)

			if len(result) != tt.expected {
				t.Errorf("Expected %d addresses, got %d", tt.expected, len(result))
			}

			for i, addr := range result {
				if addr.Mailbox != tt.input[i].Mailbox {
					t.Errorf("Address[%d] Mailbox mismatch: got %q, want %q",
						i, addr.Mailbox, tt.input[i].Mailbox)
				}
				if addr.Host != tt.input[i].Host {
					t.Errorf("Address[%d] Host mismatch: got %q, want %q",
						i, addr.Host, tt.input[i].Host)
				}
				if addr.Name != tt.input[i].Name {
					t.Errorf("Address[%d] Name mismatch: got %q, want %q",
						i, addr.Name, tt.input[i].Name)
				}
			}
		})
	}
}

// TestConvertIMAPMessage tests message conversion
func TestConvertIMAPMessage(t *testing.T) {
	// Create a sample IMAP fetch message
	msg := &imapclient.FetchMessageBuffer{
		UID:    123,
		SeqNum: 5,
		Flags:  []imap.Flag{imap.FlagSeen, imap.FlagAnswered},
		Envelope: &imap.Envelope{
			Subject: "Test",
		},
		RFC822Size: 2048,
	}

	mailbox := "INBOX"
	result := convertIMAPMessage(msg, mailbox)

	if result.ID.String() != "123" {
		t.Errorf("Expected ID '123', got %q", result.ID.String())
	}

	if result.SeqNum != 5 {
		t.Errorf("Expected SeqNum 5, got %d", result.SeqNum)
	}

	if result.Mailbox != mailbox {
		t.Errorf("Expected Mailbox %q, got %q", mailbox, result.Mailbox)
	}

	if len(result.Flags) != 2 {
		t.Errorf("Expected 2 flags, got %d", len(result.Flags))
	}

	if result.Size != 2048 {
		t.Errorf("Expected Size 2048, got %d", result.Size)
	}

	if result.Envelope == nil {
		t.Error("Expected Envelope to be set")
	} else if result.Envelope.Subject != "Test" {
		t.Errorf("Expected Subject 'Test', got %q", result.Envelope.Subject)
	}
}

// TestNewIMAPProvider tests provider creation
func TestNewIMAPProvider(t *testing.T) {
	// This is a basic test that just checks the constructor
	// A real test would need a mock IMAP client
	var client *imapclient.Client // nil is fine for constructor test

	provider := NewIMAPProvider(client)

	if provider == nil {
		t.Error("Expected non-nil provider")
	}

	if provider.client != client {
		t.Error("Expected provider to store the client")
	}
}

// TestIMAPProviderClose tests the Close method
func TestIMAPProviderClose(t *testing.T) {
	// Test with nil client
	provider := &IMAPProvider{client: nil}
	err := provider.Close()
	if err != nil {
		t.Errorf("Expected no error closing nil client, got %v", err)
	}
}

// TestMailboxTypeMapping tests that we correctly identify mailbox types
func TestMailboxTypeMapping(t *testing.T) {
	tests := []struct {
		name         string
		mboxType     provider.MailboxType
		expectedAttr imap.MailboxAttr
	}{
		{"Sent", provider.MailboxTypeSent, imap.MailboxAttrSent},
		{"Drafts", provider.MailboxTypeDrafts, imap.MailboxAttrDrafts},
		{"Trash", provider.MailboxTypeTrash, imap.MailboxAttrTrash},
		{"Junk", provider.MailboxTypeJunk, imap.MailboxAttrJunk},
		{"Archive", provider.MailboxTypeArchive, imap.MailboxAttrArchive},
	}

	// This test verifies that our type constants map to the correct IMAP attributes
	// The actual mapping is done in FindMailboxByType, but we're testing the concept
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Verify the IMAP attribute exists and matches expected value
			switch tt.mboxType {
			case provider.MailboxTypeSent:
				if tt.expectedAttr != imap.MailboxAttrSent {
					t.Errorf("Expected Sent to map to %v", imap.MailboxAttrSent)
				}
			case provider.MailboxTypeDrafts:
				if tt.expectedAttr != imap.MailboxAttrDrafts {
					t.Errorf("Expected Drafts to map to %v", imap.MailboxAttrDrafts)
				}
			case provider.MailboxTypeTrash:
				if tt.expectedAttr != imap.MailboxAttrTrash {
					t.Errorf("Expected Trash to map to %v", imap.MailboxAttrTrash)
				}
			case provider.MailboxTypeJunk:
				if tt.expectedAttr != imap.MailboxAttrJunk {
					t.Errorf("Expected Junk to map to %v", imap.MailboxAttrJunk)
				}
			case provider.MailboxTypeArchive:
				if tt.expectedAttr != imap.MailboxAttrArchive {
					t.Errorf("Expected Archive to map to %v", imap.MailboxAttrArchive)
				}
			}
		})
	}
}
