package alpsbase

import (
	"slices"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

func TestDeltaFlagsOwnOnlyTheCachedCopiesReadBeforeTheFetch(t *testing.T) {
	cache := alps.NewCache(time.Minute)
	defer cache.Close()
	part := func(flags ...provider.Flag) CachedMessagePart {
		return CachedMessagePart{Mailbox: "INBOX", Message: &provider.Message{Flags: flags}}
	}
	thread := func(mailbox string, flags ...imap.Flag) []IMAPMessage {
		return []IMAPMessage{{AlpsUID: "7", Mailbox: mailbox, FetchMessageBuffer: &imapclient.FetchMessageBuffer{Flags: flags}}}
	}
	stable := part()
	oldThread := thread("INBOX")
	otherMember := thread("INBOX:7", imap.FlagFlagged)[0]
	oldThread = append(oldThread, otherMember)
	cache.Set("message:INBOX:7:[3]:limit0", stable)
	cache.Set("message:INBOX:7:[1]:limit0", part())
	cache.Set("message:INBOX:7:[]", part())
	cache.Set("thread:INBOX:7", oldThread)
	cache.Set("thread:Archive:8", thread("INBOX"))
	// The numeric-colon sibling's key also starts with message:INBOX:7:.
	sibling := part(provider.Flag(imap.FlagFlagged))
	sibling.Mailbox = "INBOX:7"
	cache.Set("message:INBOX:7:1:[]", sibling)
	copies := cachedFlagCopies(cache, "INBOX")

	cache.Set("message:INBOX:7:[1]:limit0", part(provider.Flag(imap.FlagFlagged)))
	cache.Set("message:INBOX:7:[2]:limit0", part(provider.Flag(imap.FlagFlagged)))
	cache.Set("thread:Archive:8", thread("INBOX", imap.FlagFlagged))
	cache.Set("thread:New:9", thread("INBOX", imap.FlagFlagged))
	cache.Delete("message:INBOX:7:[]")
	layChangedFlags(cache, "INBOX", map[string][]provider.Flag{"7": {provider.Flag(imap.FlagSeen)}}, copies)

	for _, key := range []string{"message:INBOX:7:[]", "message:INBOX:7:[1]:limit0", "message:INBOX:7:[2]:limit0", "thread:Archive:8", "thread:New:9"} {
		if _, ok := cache.Get(key); ok {
			t.Errorf("changed, new or invalidated copy %s retained the older delta", key)
		}
	}
	value, ok := cache.Get("message:INBOX:7:[3]:limit0")
	if !ok || !slices.Contains(value.(CachedMessagePart).Message.Flags, provider.Flag(imap.FlagSeen)) {
		t.Errorf("unchanged part was not patched: %+v", value)
	}
	value, ok = cache.Get("thread:INBOX:7")
	if !ok {
		t.Fatal("unchanged conversation was dropped")
	}
	updated := value.([]IMAPMessage)
	if !slices.Contains(updated[0].Flags, imap.FlagSeen) || !slices.Equal(updated[1].Flags, []imap.Flag{imap.FlagFlagged}) {
		t.Errorf("conversation flags/provenance: %+v", updated)
	}
	if len(stable.Message.Flags) != 0 || len(oldThread[0].Flags) != 0 {
		t.Fatal("retained pre-delta snapshot was mutated")
	}
	value, ok = cache.Get("message:INBOX:7:1:[]")
	if !ok || value.(CachedMessagePart).Message != sibling.Message {
		t.Fatal("numeric-colon sibling's own metadata was changed")
	}
}

func TestDeltaFlagPatchesKeepTheirOriginalExpiry(t *testing.T) {
	cache := alps.NewCache(50 * time.Millisecond)
	defer cache.Close()
	key := "message:INBOX:7:[]"
	cache.Set(key, CachedMessagePart{Mailbox: "INBOX", Message: &provider.Message{}})
	copies := cachedFlagCopies(cache, "INBOX")
	// Repeated successful patches must not make the original entry immortal.
	deadline := time.Now().Add(100 * time.Millisecond)
	for time.Now().Before(deadline) {
		layChangedFlags(cache, "INBOX", map[string][]provider.Flag{"7": {provider.Flag(imap.FlagSeen)}}, copies)
		copies = cachedFlagCopies(cache, "INBOX")
		time.Sleep(time.Millisecond)
	}
	if _, ok := cache.Get(key); ok {
		t.Fatal("delta patches prolonged the original expiry")
	}
	layChangedFlags(cache, "INBOX", map[string][]provider.Flag{"7": {provider.Flag(imap.FlagFlagged)}}, copies)
	if _, ok := cache.Get(key); ok {
		t.Fatal("an expired entry was resurrected")
	}
}
