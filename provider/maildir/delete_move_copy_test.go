package maildir

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/migadu/alps/provider"
)

// putMessages stores a message per subject in INBOX, and returns their IDs
// in that order.
func putMessages(t *testing.T, p *Provider, subjects ...string) []provider.MessageID {
	t.Helper()
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	var ids []provider.MessageID
	for _, subject := range subjects {
		content := []byte("From: charles@remote.test\r\nSubject: " + subject + "\r\n\r\nbody\r\n")
		if _, _, _, err := p.AppendMessage("INBOX", &mockMessage{content: content}, 0); err != nil {
			t.Fatal(err)
		}
		listed, _, err := p.ListMessages("INBOX", "asc", 0, 100)
		if err != nil {
			t.Fatal(err)
		}
		for _, m := range listed {
			if m.Envelope.Subject == subject {
				ids = append(ids, m.ID)
			}
		}
	}
	if len(ids) != len(subjects) {
		t.Fatalf("stored %d of %d messages", len(ids), len(subjects))
	}
	return ids
}

var neverDelivered = MaildirMessageID("1700000000.never-delivered")

// A delete that fails is reported, and the message stays. Every failure was
// ignored, and the page was told the message had gone.
func TestDeleteMessagesReportsWhatItCouldNotDelete(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	ids := putMessages(t, p, "Engines", "Looms")
	// Looms cannot be removed: where its file was is a directory that is not
	// empty.
	looms, err := mustDir(t, p, "INBOX").MessageByKey(ids[1].String())
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Remove(looms.Filename()); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(looms.Filename(), "held"), 0o700); err != nil {
		t.Fatal(err)
	}

	if err := p.DeleteMessages("INBOX", ids); err == nil {
		t.Error("a delete that failed was reported as done")
	}
	if _, err := p.GetMessageMetadata("INBOX", ids[0]); !errors.Is(err, provider.ErrMessageNotFound) {
		t.Errorf("Engines, which could be deleted, was not: %v", err)
	}
	if _, err := os.Stat(looms.Filename()); err != nil {
		t.Errorf("Looms went: %v", err)
	}
}

// A message that is already gone, deleted by another client or by an earlier
// click, counts as deleted: what was asked for is so.
func TestDeleteMessagesOfAMessageAlreadyGoneSucceeds(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	ids := putMessages(t, p, "Engines")
	for range 2 {
		if err := p.DeleteMessages("INBOX", append(ids, neverDelivered)); err != nil {
			t.Errorf("deleting what is gone: %v", err)
		}
	}
}

// A move that fails is reported, and the message stays where it was. It was
// reported as moved, and was in neither folder the user expected it in.
func TestMoveMessagesReportsWhatItCouldNotMove(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	ids := putMessages(t, p, "Engines")

	mapping, err := p.MoveMessages("INBOX", "Nowhere", ids)
	if err == nil || len(mapping) != 0 {
		t.Errorf("a move to a folder that does not exist answered %v, %v", mapping, err)
	}
	if _, err := p.GetMessageMetadata("INBOX", ids[0]); err != nil {
		t.Errorf("the message left INBOX: %v", err)
	}
}

// A message that is gone is not moved, or copied: reported as done, it would
// be looked for in a folder that does not have it. The others are, and are
// named in the answer.
func TestMoveAndCopyReportAMessageThatIsGone(t *testing.T) {
	for name, transfer := range map[string]func(*Provider, []provider.MessageID) (map[provider.MessageID]provider.MessageID, error){
		"move": func(p *Provider, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
			return p.MoveMessages("INBOX", "Archive", ids)
		},
		"copy": func(p *Provider, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
			return p.CopyMessages("INBOX", "Archive", ids)
		},
	} {
		t.Run(name, func(t *testing.T) {
			p := NewProvider(t.TempDir(), "ada@example.com")
			ids := putMessages(t, p, "Engines")
			if err := p.CreateMailbox("Archive"); err != nil {
				t.Fatal(err)
			}
			mapping, err := transfer(p, []provider.MessageID{neverDelivered, ids[0]})
			if !errors.Is(err, provider.ErrMessageNotFound) {
				t.Errorf("the message that is gone was reported as %v", err)
			}
			moved, ok := mapping[ids[0]]
			if !ok || len(mapping) != 1 {
				t.Fatalf("the answer names %v", mapping)
			}
			if _, err := p.GetMessageMetadata("Archive", moved); err != nil {
				t.Errorf("Engines is not in Archive: %v", err)
			}
		})
	}
}

// A copy that fails is reported.
func TestCopyMessagesReportsWhatItCouldNotCopy(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	ids := putMessages(t, p, "Engines")
	if mapping, err := p.CopyMessages("INBOX", "Nowhere", ids); err == nil || len(mapping) != 0 {
		t.Errorf("a copy to a folder that does not exist answered %v, %v", mapping, err)
	}
}

// A flag change that cannot rename the message's file is reported, and the
// file keeps its name, as a delete or a move that fails is. Discarded, the
// failure was answered as success, and the page showed the message starred
// while its file said otherwise. A message that is gone is still no failure.
func TestAFlagChangeThatCannotBeWrittenIsReported(t *testing.T) {
	base := t.TempDir()
	p := NewProvider(base, "ada@example.com")
	ids := putMessages(t, p, "Engines")
	stored := filepath.Join(base, "cur", ids[0].String()+":2,")
	if _, err := os.Stat(stored); err != nil {
		t.Fatal(err)
	}
	// Where the starred file would go, something else is.
	if err := os.MkdirAll(filepath.Join(base, "cur", ids[0].String()+":2,F", "held"), 0o700); err != nil {
		t.Fatal(err)
	}

	star := provider.FlagOperation{Op: provider.FlagOpAdd, Flags: []provider.Flag{provider.FlagFlagged}}
	if err := p.SetMessagesFlags("INBOX", ids, star); err == nil {
		t.Error("the flag change that could not be written answered success")
	}
	if _, err := os.Stat(stored); err != nil {
		t.Errorf("the message's file changed: %v", err)
	}

	if err := p.SetMessagesFlags("INBOX", []provider.MessageID{MaildirMessageID("1700000000.gone")}, star); err != nil {
		t.Errorf("starring a message that is gone answered %v, want it passed over", err)
	}
}
