package maildir

import (
	"errors"
	"io"
	"os"
	"path/filepath"
	"slices"
	"sync"
	"testing"

	"github.com/migadu/alps/provider"
)

// AppendMessage names the message it stored, as the IMAP provider does from
// APPENDUID: a draft save tells the page its new draft by it, and replaces
// the draft by it on the next save. It answered an empty ID, which named
// nothing.
func TestAppendMessageNamesTheMessageItStored(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	content := []byte("From: ada@example.com\r\nSubject: Notes\r\n\r\nremember the milk\r\n")
	mbox, id, _, err := p.AppendMessage("", &mockMessage{content: content}, provider.MailboxTypeDrafts)
	if err != nil {
		t.Fatal(err)
	}
	if id == nil || id.String() == "" {
		t.Fatal("AppendMessage named no message")
	}
	stored, err := p.GetMessageMetadata(mbox.Name, id)
	if err != nil || stored.Envelope.Subject != "Notes" {
		t.Fatalf("message %q in %s: %+v, %v", id, mbox.Name, stored, err)
	}
	listed, _, err := p.ListMessages(mbox.Name, "asc", 0, 10)
	if err != nil || len(listed) != 1 || listed[0].ID.String() != id.String() {
		t.Errorf("%s lists %+v (%v), want the message %q", mbox.Name, listed, err, id)
	}
}

// Messages appended at once are each named, and each name is its own.
func TestAppendMessageNamesEachOfManyAtOnce(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	const n = 20
	ids := make([]string, n)
	var wg sync.WaitGroup
	for i := range n {
		wg.Add(1)
		go func() {
			defer wg.Done()
			content := []byte("From: ada@example.com\r\nSubject: Notes\r\n\r\nbody\r\n")
			if _, id, _, err := p.AppendMessage("INBOX", &mockMessage{content: content}, 0); err == nil {
				ids[i] = id.String()
			}
		}()
	}
	wg.Wait()
	seen := map[string]bool{}
	for _, id := range ids {
		if id == "" || seen[id] {
			t.Fatalf("the messages were named %q", ids)
		}
		seen[id] = true
	}
	listed, _, err := p.ListMessages("INBOX", "asc", 0, n)
	if err != nil || len(listed) != n {
		t.Fatalf("listing: %d messages, err %v", len(listed), err)
	}
	for _, m := range listed {
		if !seen[m.ID.String()] {
			t.Errorf("message %q is listed under a name AppendMessage did not give", m.ID)
		}
	}
}

// failingMessage writes the start of a message and then fails, as one whose
// attachment cannot be read does.
type failingMessage struct{}

func (failingMessage) WriteTo(w io.Writer) (int64, error) {
	n, _ := io.WriteString(w, "From: ada@example.com\r\nSubject: Notes\r\n\r\n")
	return int64(n), errors.New("the attachment is gone")
}

// A message that cannot be written is not stored, not even in part.
func TestAppendMessageStoresNothingItCouldNotWrite(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	if _, _, _, err := p.AppendMessage("INBOX", failingMessage{}, 0); err == nil {
		t.Fatal("AppendMessage stored a message it could not write")
	}
	for _, sub := range []string{"tmp", "new", "cur"} {
		entries, err := os.ReadDir(filepath.Join(string(p.getDir("INBOX")), sub))
		if err != nil || len(entries) != 0 {
			t.Errorf("%s holds %d files (%v)", sub, len(entries), err)
		}
	}
}

// A message alps files as its own, a message the user sent or a draft, is
// stored seen, and a draft as a draft, as the IMAP provider appends them. They
// were stored with no flags: every sent message and every draft was unread,
// and counted in their folder's unread count.
func TestAppendMessageStoresItsOwnMessagesSeen(t *testing.T) {
	for mboxType, want := range map[provider.MailboxType][]provider.Flag{
		provider.MailboxTypeSent:   {provider.FlagSeen},
		provider.MailboxTypeDrafts: {provider.FlagDraft, provider.FlagSeen},
	} {
		p := NewProvider(t.TempDir(), "ada@example.com")
		content := []byte("From: ada@example.com\r\nSubject: Notes\r\n\r\nremember the milk\r\n")
		mbox, id, _, err := p.AppendMessage("", &mockMessage{content: content}, mboxType)
		if err != nil {
			t.Fatal(err)
		}
		stored, err := p.GetMessageMetadata(mbox.Name, id)
		if err != nil {
			t.Fatal(err)
		}
		if !slices.Equal(stored.Flags, want) {
			t.Errorf("%s: stored with %v, want %v", mbox.Name, stored.Flags, want)
		}
		if status, err := p.GetMailboxStatus(mbox.Name); err != nil || status.NumUnseen != 0 {
			t.Errorf("%s: %+v unread (%v), want none", mbox.Name, status, err)
		}
	}
}

// A message stored into a folder the caller names is stored as it is, as a
// delivery is: unread.
func TestAppendMessageToANamedFolderStoresItUnread(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	id := appendOne(t, p, "From: charles@remote.test\r\nSubject: Engines\r\n\r\nbody\r\n")
	stored, err := p.GetMessageMetadata("INBOX", id)
	if err != nil || len(stored.Flags) != 0 {
		t.Errorf("stored with %v (%v), want no flags", stored.Flags, err)
	}
}
