package maildir

import (
	"io"
	"testing"

	"github.com/migadu/alps/provider"
)

type mockMessage struct {
	content []byte
}

func (m *mockMessage) WriteTo(w io.Writer) (int64, error) {
	n, err := w.Write(m.content)
	return int64(n), err
}

func TestProviderMailboxes(t *testing.T) {
	tmpDir := t.TempDir()
	p := NewProvider(tmpDir, "testuser")

	// Create INBOX manually since maildir package requires an Init for root
	inboxDir := p.getDir("INBOX")
	if err := inboxDir.Init(); err != nil {
		t.Fatalf("failed to init INBOX: %v", err)
	}

	// Test CreateMailbox
	if err := p.CreateMailbox("Sent"); err != nil {
		t.Fatalf("CreateMailbox failed: %v", err)
	}

	// Test ListMailboxes
	mailboxes, err := p.ListMailboxes()
	if err != nil {
		t.Fatalf("ListMailboxes failed: %v", err)
	}

	foundInbox := false
	foundSent := false
	for _, m := range mailboxes {
		if m.Name == "INBOX" {
			foundInbox = true
		}
		if m.Name == "Sent" {
			foundSent = true
		}
	}

	if !foundInbox || !foundSent {
		t.Errorf("ListMailboxes missing expected mailboxes. Got: %v", mailboxes)
	}

	// Test FindMailboxByType
	sentMbox, err := p.FindMailboxByType(provider.MailboxTypeSent)
	if err != nil {
		t.Errorf("FindMailboxByType failed: %v", err)
	} else if sentMbox.Name != "Sent" {
		t.Errorf("FindMailboxByType returned %v, want Sent", sentMbox.Name)
	}

	// Test RenameMailbox
	if err := p.RenameMailbox("Sent", "Archive"); err != nil {
		t.Errorf("RenameMailbox failed: %v", err)
	}

	// Verify rename
	mailboxes, _ = p.ListMailboxes()
	foundArchive := false
	for _, m := range mailboxes {
		if m.Name == "Archive" {
			foundArchive = true
		}
	}
	if !foundArchive {
		t.Errorf("Mailbox not found after rename")
	}

	// Test DeleteMailbox
	if err := p.DeleteMailbox("Archive"); err != nil {
		t.Errorf("DeleteMailbox failed: %v", err)
	}
}

func TestProviderMessages(t *testing.T) {
	tmpDir := t.TempDir()
	p := NewProvider(tmpDir, "testuser")

	inboxDir := p.getDir("INBOX")
	inboxDir.Init()

	// 1. Test AppendMessage
	msgContent := []byte("From: test@example.com\r\nTo: user@example.com\r\nSubject: Test Subject\r\n\r\nThis is a test message body.")
	msg := &mockMessage{content: msgContent}

	mbox, _, size, err := p.AppendMessage("INBOX", msg, 0)
	if err != nil {
		t.Fatalf("AppendMessage failed: %v", err)
	}
	if mbox == nil {
		t.Fatal("AppendMessage returned a nil mailbox (would panic in the adapter)")
	}
	if size == 0 {
		t.Errorf("AppendMessage returned size 0")
	}

	// 2. Test ListMessages
	msgs, total, err := p.ListMessages("INBOX", "desc", 0, 10)
	if err != nil {
		t.Fatalf("ListMessages failed: %v", err)
	}
	if total != 1 || len(msgs) != 1 {
		t.Fatalf("Expected 1 message, got %d (total: %d)", len(msgs), total)
	}

	firstMsg := msgs[0]
	if firstMsg.Envelope.Subject != "Test Subject" {
		t.Errorf("Expected subject 'Test Subject', got '%s'", firstMsg.Envelope.Subject)
	}

	// 3. Test SearchMessages
	_, searchTotal, err := p.SearchMessages("INBOX", "test message body", "desc", 0, 10)
	if err != nil {
		t.Fatalf("SearchMessages failed: %v", err)
	}
	if searchTotal != 1 {
		t.Errorf("Expected SearchMessages to find 1 message, got %d", searchTotal)
	}

	// 4. Test GetMailboxStatus
	status, err := p.GetMailboxStatus("INBOX")
	if err != nil {
		t.Fatalf("GetMailboxStatus failed: %v", err)
	}
	if status.NumMessages != 1 {
		t.Errorf("Expected 1 message in status, got %d", status.NumMessages)
	}
	if status.NumUnseen != 1 {
		t.Errorf("Expected 1 unseen message before marking seen, got %d", status.NumUnseen)
	}

	// 5. Test Flags
	if err := p.SetMessagesFlags("INBOX", []provider.MessageID{firstMsg.ID}, provider.FlagOperation{
		Op:    provider.FlagOpAdd,
		Flags: []provider.Flag{provider.FlagSeen},
	}); err != nil {
		t.Fatalf("SetMessagesFlags failed: %v", err)
	}

	msgs, _, _ = p.ListMessages("INBOX", "desc", 0, 10)
	hasSeen := false
	for _, f := range msgs[0].Flags {
		if f == provider.FlagSeen {
			hasSeen = true
		}
	}
	if !hasSeen {
		t.Errorf("Message flags did not include \\Seen after update")
	}

	// Unseen count must drop to 0 now that the only message is \Seen. Before the
	// fix this stayed at whatever new/ held and could not reflect the flag.
	if status, err := p.GetMailboxStatus("INBOX"); err != nil {
		t.Fatalf("GetMailboxStatus failed: %v", err)
	} else if status.NumUnseen != 0 {
		t.Errorf("Expected 0 unseen after marking the message seen, got %d", status.NumUnseen)
	}

	// 6. Test DeleteMessages
	if err := p.DeleteMessages("INBOX", []provider.MessageID{firstMsg.ID}); err != nil {
		t.Fatalf("DeleteMessages failed: %v", err)
	}

	msgs, total, _ = p.ListMessages("INBOX", "desc", 0, 10)
	if total != 0 {
		t.Errorf("Expected 0 messages after delete, got %d", total)
	}
}

// TestMaildir_SortOrderAscending verifies "asc" actually sorts ascending. The
// callers pass "asc"/"desc" (frontend values); the maildir code previously
// checked for "date-asc", so "asc" was ignored and always sorted descending.
func TestMaildir_SortOrderAscending(t *testing.T) {
	tmpDir := t.TempDir()
	p := NewProvider(tmpDir, "testuser")
	if err := p.getDir("INBOX").Init(); err != nil {
		t.Fatalf("init INBOX: %v", err)
	}

	for _, subj := range []string{"First", "Second"} {
		content := []byte("From: a@example.com\r\nSubject: " + subj + "\r\n\r\nbody")
		if _, _, _, err := p.AppendMessage("INBOX", &mockMessage{content: content}, 0); err != nil {
			t.Fatalf("append %s: %v", subj, err)
		}
	}

	desc, _, err := p.ListMessages("INBOX", "desc", 0, 10)
	if err != nil || len(desc) != 2 {
		t.Fatalf("desc list: err=%v n=%d", err, len(desc))
	}
	asc, _, err := p.ListMessages("INBOX", "asc", 0, 10)
	if err != nil || len(asc) != 2 {
		t.Fatalf("asc list: err=%v n=%d", err, len(asc))
	}

	if desc[0].Envelope.Subject != asc[1].Envelope.Subject ||
		desc[1].Envelope.Subject != asc[0].Envelope.Subject {
		t.Errorf("asc order should reverse desc: desc=[%s,%s] asc=[%s,%s]",
			desc[0].Envelope.Subject, desc[1].Envelope.Subject,
			asc[0].Envelope.Subject, asc[1].Envelope.Subject)
	}
}
