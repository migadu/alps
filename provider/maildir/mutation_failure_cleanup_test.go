package maildir

import (
	"errors"
	"github.com/emersion/go-maildir"
	"github.com/migadu/alps/provider"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestCopyMessagesFailureDoesNotPublishDestination(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	ids := putMessages(t, p, "Bad source")
	if err := p.CreateMailbox("Archive"); err != nil {
		t.Fatal(err)
	}
	source, err := mustDir(t, p, "INBOX").MessageByKey(ids[0].String())
	if err != nil {
		t.Fatal(err)
	}
	if err = os.Remove(source.Filename()); err != nil {
		t.Fatal(err)
	}
	if err = os.Mkdir(source.Filename(), 0700); err != nil {
		t.Fatal(err)
	}
	mapping, err := p.CopyMessages("INBOX", "Archive", ids)
	if err == nil || len(mapping) != 0 {
		t.Fatalf("copy failure lost: %v %v", mapping, err)
	}
	for _, sub := range []string{"tmp", "cur", "new"} {
		files, err := os.ReadDir(filepath.Join(string(mustDir(t, p, "Archive")), sub))
		if err != nil {
			t.Fatal(err)
		}
		if len(files) != 0 {
			t.Fatalf("failed copy published %s: %v", sub, files)
		}
	}
}

func TestCopyMessagesPreservesFlagsAndSource(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	ids := putMessages(t, p, "Flagged")
	if err := p.CreateMailbox("Archive"); err != nil {
		t.Fatal(err)
	}
	m, err := mustDir(t, p, "INBOX").MessageByKey(ids[0].String())
	if err != nil {
		t.Fatal(err)
	}
	if err := m.SetFlags([]maildir.Flag{maildir.FlagSeen, maildir.FlagFlagged, maildir.FlagDraft}); err != nil {
		t.Fatal(err)
	}
	mapping, err := p.CopyMessages("INBOX", "Archive", ids)
	if err != nil || len(mapping) != 1 {
		t.Fatalf("copy: %v %v", mapping, err)
	}
	source, err := p.GetMessageMetadata("INBOX", ids[0])
	if err != nil {
		t.Fatal(err)
	}
	copy, err := p.GetMessageMetadata("Archive", mapping[ids[0]])
	if err != nil {
		t.Fatal(err)
	}
	if source.Envelope.Subject != copy.Envelope.Subject || !slices.Equal(source.Flags, copy.Flags) {
		t.Fatalf("copy differs: %+v %+v", source, copy)
	}
}
func TestDeleteMessagesContinuesAfterErrorAndJoinsErrors(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	ids := putMessages(t, p, "Bad1", "Good", "Bad2")
	for _, i := range []int{0, 2} {
		m, err := mustDir(t, p, "INBOX").MessageByKey(ids[i].String())
		if err != nil {
			t.Fatal(err)
		}
		if err = os.Remove(m.Filename()); err != nil {
			t.Fatal(err)
		}
		if err = os.MkdirAll(filepath.Join(m.Filename(), "held"), 0700); err != nil {
			t.Fatal(err)
		}
	}
	err := p.DeleteMessages("INBOX", ids)
	if err == nil || !strings.Contains(err.Error(), ids[0].String()) || !strings.Contains(err.Error(), ids[2].String()) {
		t.Fatalf("did not join both failures: %v", err)
	}
	if _, err = p.GetMessageMetadata("INBOX", ids[1]); !errors.Is(err, provider.ErrMessageNotFound) {
		t.Fatalf("later valid message not removed: %v", err)
	}
}
