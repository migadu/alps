package maildir

import (
	"path/filepath"
	"testing"
)

// An account that has never received mail has no maildir on disk, because
// delivery is what creates one. That is an empty inbox and must list as one.
// It failed instead, on the open of its cur directory, and the mail page drew
// that failed listing as an inbox with no messages and no user menu.
func TestInboxNotYetOnDisk(t *testing.T) {
	p := NewProvider(filepath.Join(t.TempDir(), "never-delivered"), "ada@example.com")

	msgs, page, err := p.ListMessages("INBOX", "desc", 0, 50)
	if err != nil || page.Total != 0 || len(msgs) != 0 {
		t.Errorf("ListMessages: %d messages, total %d, err %v; want an empty inbox", len(msgs), page.Total, err)
	}

	msgs, page, err = p.SearchMessages("INBOX", "", "desc", 0, 50)
	if err != nil || page.Total != 0 || len(msgs) != 0 {
		t.Errorf("SearchMessages: %d messages, total %d, err %v; want an empty inbox", len(msgs), page.Total, err)
	}

	status, err := p.GetMailboxStatus("INBOX")
	if err != nil {
		t.Fatalf("GetMailboxStatus: %v", err)
	}
	if status.NumMessages != 0 || status.NumUnseen != 0 {
		t.Errorf("GetMailboxStatus: %d messages, %d unseen; want none", status.NumMessages, status.NumUnseen)
	}
}
