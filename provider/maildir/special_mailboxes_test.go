package maildir

import (
	"testing"

	"github.com/migadu/alps/provider"
)

func TestFindMailboxByTypeDistinguishesAbsenceFromFailure(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	for _, kind := range []provider.MailboxType{provider.MailboxTypeDrafts, provider.MailboxTypeSent} {
		mailbox, err := p.FindMailboxByType(kind)
		if mailbox != nil || err != nil {
			t.Errorf("an absent mailbox returned %v, %v; want nil, nil", mailbox, err)
		}
	}
	if _, err := p.FindMailboxByType(provider.MailboxType(-1)); err == nil {
		t.Error("an unsupported mailbox type was treated as an absent mailbox")
	}
}

func TestSpecialFolderNamesMustMatchExactly(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	for _, name := range []string{"Presentations", "Unsent", "Contract drafts", "Trashy", "Junkyard", "Archived contracts"} {
		if err := p.CreateMailbox(name); err != nil {
			t.Fatal(err)
		}
	}
	for _, kind := range []provider.MailboxType{provider.MailboxTypeSent, provider.MailboxTypeDrafts, provider.MailboxTypeTrash, provider.MailboxTypeJunk, provider.MailboxTypeArchive} {
		box, err := p.FindMailboxByType(kind)
		if err != nil || box != nil {
			t.Errorf("type %v: got %v, %v; want absent", kind, box, err)
		}
	}
}

func TestSpecialFolderAliasesMatchTheWebmail(t *testing.T) {
	for _, tc := range []struct {
		name string
		kind provider.MailboxType
	}{
		{"Draft", provider.MailboxTypeDrafts}, {"Deleted", provider.MailboxTypeTrash}, {"Deleted Items", provider.MailboxTypeTrash}, {"Spam", provider.MailboxTypeJunk}, {"Archives", provider.MailboxTypeArchive},
	} {
		t.Run(tc.name, func(t *testing.T) {
			p := NewProvider(t.TempDir(), "alice@example.com")
			if err := p.CreateMailbox(tc.name); err != nil {
				t.Fatal(err)
			}
			box, err := p.FindMailboxByType(tc.kind)
			if err != nil || box == nil || box.Name != tc.name {
				t.Fatalf("resolved %+v, %v; want %q", box, err, tc.name)
			}
		})
	}
}
