package maildir

import (
	"errors"
	"testing"

	"github.com/migadu/alps/provider"
)

// A key that matches no file is a message that is gone, or never was. The
// provider names that case instead of passing on the maildir library's
// "matches 0 files", so the web layer can tell it from a failing disk.
func TestAMessageThatIsGoneIsNotFound(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	content := []byte("From: charles@remote.test\r\nSubject: Engines\r\n\r\nbody\r\n")
	for range 2 {
		if _, _, _, err := p.AppendMessage("INBOX", &mockMessage{content: content}, 0); err != nil {
			t.Fatal(err)
		}
	}
	listed, _, err := p.ListMessages("INBOX", "asc", 0, 10)
	if err != nil || len(listed) != 2 {
		t.Fatalf("listing: %d messages, err %v", len(listed), err)
	}
	ids := []provider.MessageID{listed[0].ID, listed[1].ID}
	if err := p.DeleteMessages("INBOX", ids[:1]); err != nil {
		t.Fatal(err)
	}

	for _, id := range []provider.MessageID{ids[0], MaildirMessageID("1700000000.never-delivered")} {
		reads := []struct {
			how  string
			read func() error
		}{
			{"metadata", func() error { _, err := p.GetMessageMetadata("INBOX", id); return err }},
			{"part", func() error { _, _, err := p.GetMessagePart("INBOX", id, nil); return err }},
			{"part with data", func() error { _, _, _, _, err := p.GetMessagePartWithData("INBOX", id, nil); return err }},
			{"raw part", func() error { _, _, _, err := p.GetMessagePartRaw("INBOX", id, nil, 0); return err }},
		}
		for _, r := range reads {
			if err := r.read(); !errors.Is(err, provider.ErrMessageNotFound) {
				t.Errorf("%s, %s: err = %v, want ErrMessageNotFound", id, r.how, err)
			}
		}
	}
	if _, err := p.GetMessageMetadata("INBOX", ids[1]); err != nil {
		t.Errorf("the message that is still there: %v", err)
	}
}
