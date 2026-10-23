package maildir

import (
	"os"
	"path/filepath"
	"slices"
	"testing"

	"github.com/migadu/alps/provider"
)

func TestCreateMailboxBeforeTheFirstDelivery(t *testing.T) {
	base := filepath.Join(t.TempDir(), "not-yet-delivered", "Maildir")
	p := NewProvider(base, "ada@example.com")
	if err := p.CreateMailbox("Archive"); err != nil {
		t.Fatalf("creating the first folder failed before any delivery initialized INBOX: %v", err)
	}
	for _, dir := range []string{"tmp", "new", "cur"} {
		if _, err := os.Stat(filepath.Join(base, ".Archive", dir)); err != nil {
			t.Errorf("first folder has no %s: %v", dir, err)
		}
	}
}

func TestCreatingInboxReportsItAlreadyExists(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	_, _, _, err := p.AppendMessage("INBOX", &mockMessage{content: []byte("Subject: x\r\n\r\nx\r\n")}, provider.MailboxTypeDrafts)
	if err != nil {
		t.Fatal(err)
	}
	if err := p.CreateMailbox("INBOX"); err == nil {
		t.Error("creating the existing INBOX reported success")
	}
}

func TestMessageKeyCannotEscapeTheMailbox(t *testing.T) {
	p, ids, _, neighbour := jailed(t)
	key := "../../grace/cur/1700000000.grace"
	_, err := p.ParseMessageID(key)
	refusedAsCannot(t, "parse message traversal", err)
	_, err = p.GetMessageMetadata("INBOX", MaildirMessageID(key))
	refusedAsCannot(t, "read another account by message key", err)
	err = p.DeleteMessages("INBOX", []provider.MessageID{MaildirMessageID(key)})
	refusedAsCannot(t, "delete another account by message key", err)
	intact(t, p, ids, neighbour)
}

func TestMalformedMessageKeysAreRefusedAtBothBoundaries(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	malformed := []string{"", ".", "..", "../other", "other/file", "key:2,S", "key\x00suffix"}
	if os.PathSeparator == '\\' {
		malformed = append(malformed, `other\file`)
	}
	for _, key := range malformed {
		t.Run(key, func(t *testing.T) {
			_, err := p.ParseMessageID(key)
			refusedAsCannot(t, "parse invalid key", err)
			_, err = p.GetMessageMetadata("INBOX", MaildirMessageID(key))
			refusedAsCannot(t, "lookup invalid key", err)
		})
	}
	for _, key := range []string{"1700000000.M1P2.host", "opaque-key", "12345,S=42"} {
		if _, err := p.ParseMessageID(key); err != nil {
			t.Errorf("valid key %q: %v", key, err)
		}
	}
}

// A delivery writes a "/" or ":" in its host's name as \057 or \072, as the
// Maildir convention has it and go-maildir does, so a key can hold a
// backslash. Refused with the characters that leave a folder, such a message
// was listed and could not be opened, flagged or moved.
func TestAKeyWithAnEscapedHostNameIsUsable(t *testing.T) {
	for _, key := range []string{`1700000000.M1P2.mail\057relay`, `1700000000.M3P4.mail\072993`} {
		t.Run(key, func(t *testing.T) {
			base := t.TempDir()
			p := NewProvider(base, "ada@example.com")
			if err := p.CreateMailbox("INBOX"); err != nil {
				t.Fatal(err)
			}
			if err := p.CreateMailbox("Archive"); err != nil {
				t.Fatal(err)
			}
			message := "From: charles@remote.test\r\nSubject: Relayed\r\n\r\nbody\r\n"
			if err := os.WriteFile(filepath.Join(base, "cur", key+":2,"), []byte(message), 0o600); err != nil {
				t.Fatal(err)
			}

			id, err := p.ParseMessageID(key)
			if err != nil {
				t.Fatalf("the key of a listed message is refused: %v", err)
			}
			if msg, err := p.GetMessageMetadata("INBOX", id); err != nil || msg.Envelope.Subject != "Relayed" {
				t.Fatalf("the message does not open: %+v, %v", msg, err)
			}
			if err := p.SetMessagesFlags("INBOX", []provider.MessageID{id}, provider.FlagOperation{Op: provider.FlagOpAdd, Flags: []provider.Flag{provider.FlagFlagged}}); err != nil {
				t.Fatal(err)
			}
			if msg, err := p.GetMessageMetadata("INBOX", id); err != nil || !slices.Contains(msg.Flags, provider.FlagFlagged) {
				t.Fatalf("the message is not starred: %+v, %v", msg, err)
			}
			moved, err := p.MoveMessages("INBOX", "Archive", []provider.MessageID{id})
			if err != nil || len(moved) != 1 {
				t.Fatalf("the message does not move: %v, %v", moved, err)
			}
			if msg, err := p.GetMessageMetadata("Archive", moved[id]); err != nil || msg.Envelope.Subject != "Relayed" {
				t.Errorf("the moved message does not open in Archive: %+v, %v", msg, err)
			}
		})
	}
}
