package maildir

import (
	"github.com/migadu/alps/provider"
	"slices"
	"testing"
)

func TestUnsupportedFlagsAreRefusedWithoutChangingMessages(t *testing.T) {
	for _, op := range []provider.FlagOp{provider.FlagOpSet, provider.FlagOpAdd, provider.FlagOpRemove} {
		p := NewProvider(t.TempDir(), "alice@example.com")
		ids := putMessages(t, p, "Tagged")
		if err := p.SetMessagesFlags("INBOX", ids, provider.FlagOperation{Op: provider.FlagOpSet, Flags: []provider.Flag{provider.FlagSeen, provider.FlagFlagged}}); err != nil {
			t.Fatal(err)
		}
		err := p.SetMessagesFlags("INBOX", ids, provider.FlagOperation{Op: op, Flags: []provider.Flag{provider.FlagDraft, "$label1"}})
		if err == nil {
			t.Errorf("operation %v silently accepted unsupported keyword", op)
		}
		message, err := p.GetMessageMetadata("INBOX", ids[0])
		if err != nil {
			t.Fatal(err)
		}
		if !slices.Contains(message.Flags, provider.FlagSeen) || !slices.Contains(message.Flags, provider.FlagFlagged) || slices.Contains(message.Flags, provider.FlagDraft) {
			t.Errorf("operation %v changed flags: %v", op, message.Flags)
		}
	}
}
