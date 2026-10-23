package maildir

import (
	"os"
	"path/filepath"
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
	for _, key := range []string{"", ".", "..", "../other", "other/file", `other\file`, "key:2,S", "key\x00suffix"} {
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
