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
