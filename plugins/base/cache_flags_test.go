package alpsbase

import (
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

func flagCache(t *testing.T, unseen uint32, pages map[string][]provider.Message) *alps.Cache {
	t.Helper()
	cache := alps.NewCache(time.Minute)
	t.Cleanup(cache.Close)
	for key, msgs := range pages {
		cache.Set(key, CachedMessages{Messages: msgs, Total: len(msgs)})
	}
	cache.Set("status:INBOX", &MailboxStatus{StatusData: &imap.StatusData{Mailbox: "INBOX", NumUnseen: &unseen}})
	return cache
}

func cachedUnseen(t *testing.T, cache *alps.Cache) (uint32, bool) {
	t.Helper()
	cached, ok := cache.Get("status:INBOX")
	if !ok {
		return 0, false
	}
	return *cached.(*MailboxStatus).NumUnseen, true
}

func noDebug(string, ...interface{}) {}

var seen = []imap.Flag{imap.FlagSeen}

// Opening an unread message adds \Seen twice: the body fetch sets it, and the
// reader marks the message read. The count is one message lower, not two.
func TestReadingAMessageLowersTheUnseenCountOnce(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}
	cache := flagCache(t, 3, map[string][]provider.Message{
		"messages:INBOX:0": {{ID: uid}, {ID: provider.MockMessageID{ID: "8"}}},
	})

	applyFlagsToCache(cache, noDebug, "INBOX", uid, seen, nil)
	applyFlagsToCache(cache, noDebug, "INBOX", uid, seen, nil)

	if got, ok := cachedUnseen(t, cache); !ok || got != 2 {
		t.Fatalf("unseen = %d (cached %v), want 2", got, ok)
	}
}

func TestReadingAReadMessageLeavesTheCountAlone(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}
	cache := flagCache(t, 3, map[string][]provider.Message{
		"messages:INBOX:0": {{ID: uid, Flags: []provider.Flag{provider.Flag(imap.FlagSeen)}}},
	})

	applyFlagsToCache(cache, noDebug, "INBOX", uid, seen, nil)

	if got, _ := cachedUnseen(t, cache); got != 3 {
		t.Fatalf("unseen = %d, want 3", got)
	}
}

func TestMarkingUnreadRaisesTheCountOnce(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}
	cache := flagCache(t, 3, map[string][]provider.Message{
		"messages:INBOX:0": {{ID: uid, Flags: []provider.Flag{provider.Flag(imap.FlagSeen)}}},
	})

	applyFlagsToCache(cache, noDebug, "INBOX", uid, nil, seen)
	applyFlagsToCache(cache, noDebug, "INBOX", uid, nil, seen)

	if got, _ := cachedUnseen(t, cache); got != 4 {
		t.Fatalf("unseen = %d, want 4", got)
	}
}

// Without a trustworthy previous state the count cannot be adjusted, so it is
// dropped and the next listing asks the server.
func TestAnUnknownPreviousStateDropsTheCount(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}

	t.Run("not cached", func(t *testing.T) {
		cache := flagCache(t, 3, nil)
		applyFlagsToCache(cache, noDebug, "INBOX", uid, seen, nil)
		if _, ok := cachedUnseen(t, cache); ok {
			t.Fatal("the count was kept")
		}
	})

	t.Run("copies disagree", func(t *testing.T) {
		cache := flagCache(t, 3, map[string][]provider.Message{
			"messages:INBOX:0": {{ID: uid}},
		})
		cache.Set("message:INBOX:7:[]", CachedMessagePart{Message: &provider.Message{
			ID:    uid,
			Flags: []provider.Flag{provider.Flag(imap.FlagSeen)},
		}})
		applyFlagsToCache(cache, noDebug, "INBOX", uid, seen, nil)
		if _, ok := cachedUnseen(t, cache); ok {
			t.Fatal("the count was kept")
		}
	})
}

func TestOtherFlagsLeaveTheCountAlone(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}
	cache := flagCache(t, 3, nil)

	applyFlagsToCache(cache, noDebug, "INBOX", uid, []imap.Flag{imap.FlagFlagged}, nil)

	if got, ok := cachedUnseen(t, cache); !ok || got != 3 {
		t.Fatalf("unseen = %d (cached %v), want 3", got, ok)
	}
}
