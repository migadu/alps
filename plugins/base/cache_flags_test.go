package alpsbase

import (
	"slices"
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

// A listing caches each row twice, in the page and as the message on its
// own, and the two are the same message in memory. They are one copy, not two
// that disagree: reading the message lowers the count rather than dropping it.
func TestReadingAListedMessageLowersTheCount(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}
	msgs := []provider.Message{{ID: uid}, {ID: provider.MockMessageID{ID: "8"}}}
	cache := flagCache(t, 3, nil)
	cache.Set("messages:INBOX:0", CachedMessages{Messages: msgs, Total: len(msgs)})
	cache.Set("message:INBOX:7:[]", CachedMessagePart{Message: &msgs[0], Mailbox: "INBOX"})

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

// The pages a mailbox has cached move with its count. A page was read at a
// count, and is served only while the server still answers it (see
// CachedMessages.Counts); reading a message changes that answer, and a page
// left at the old one would be read again for a change it already shows.
func TestReadingAMessageMovesThePagesWithTheCount(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}
	at := mailboxCounts{Known: true, Messages: 5, Unseen: 3}
	cache := flagCache(t, 3, nil)
	cache.Set("messages:INBOX:page0", CachedMessages{Messages: []provider.Message{{ID: uid}}, Counts: at})
	// Another page, which does not list the message but counts it all the same.
	cache.Set("messages:INBOX:page1", CachedMessages{Messages: []provider.Message{{ID: provider.MockMessageID{ID: "8"}}}, Counts: at})
	// Another folder's page is not this count's.
	cache.Set("messages:INBOX2:page0", CachedMessages{Counts: at})

	applyFlagsToCache(cache, noDebug, "INBOX", uid, seen, nil)
	applyFlagsToCache(cache, noDebug, "INBOX", uid, seen, nil)

	want := map[string]mailboxCounts{
		"messages:INBOX:page0":  {Known: true, Messages: 5, Unseen: 2},
		"messages:INBOX:page1":  {Known: true, Messages: 5, Unseen: 2},
		"messages:INBOX2:page0": at,
	}
	for key, counts := range want {
		cached, _ := cache.Get(key)
		if got := cached.(CachedMessages).Counts; got != counts {
			t.Errorf("%s was read at %+v, want %+v", key, got, counts)
		}
	}

	applyFlagsToCache(cache, noDebug, "INBOX", uid, nil, seen)
	cached, _ := cache.Get("messages:INBOX:page1")
	if got := cached.(CachedMessages).Counts; got != at {
		t.Errorf("marked unread again, the page was read at %+v, want %+v", got, at)
	}
}

// When the copies cannot say what the message was, the pages keep the count
// they were read at, and the server's next answer decides whether they stand.
func TestAnUnknownPreviousStateLeavesThePagesAtTheirCount(t *testing.T) {
	at := mailboxCounts{Known: true, Messages: 5, Unseen: 3}
	cache := flagCache(t, 3, nil)
	cache.Set("messages:INBOX:page0", CachedMessages{Messages: []provider.Message{{ID: provider.MockMessageID{ID: "8"}}}, Counts: at})

	applyFlagsToCache(cache, noDebug, "INBOX", provider.MockMessageID{ID: "7"}, seen, nil)

	cached, _ := cache.Get("messages:INBOX:page0")
	if got := cached.(CachedMessages).Counts; got != at {
		t.Errorf("the page was read at %+v, want %+v", got, at)
	}
}

// In a threaded page a row is a conversation's latest message, and its
// earlier messages are carried as SubMessages, each drawn with its own flags.
// A change to one of them is patched there, and counts as the row's would.
func TestAFlagChangeReachesAnEarlierMessageOfAThreadedRow(t *testing.T) {
	older := provider.MockMessageID{ID: "7"}
	cache := flagCache(t, 3, map[string][]provider.Message{
		"messages:INBOX:0": {{
			ID:          provider.MockMessageID{ID: "9"},
			SubMessages: []provider.Message{{ID: older}},
		}},
	})

	applyFlagsToCache(cache, noDebug, "INBOX", older, []imap.Flag{imap.FlagAnswered, imap.FlagSeen}, nil)

	cached, _ := cache.Get("messages:INBOX:0")
	sub := cached.(CachedMessages).Messages[0].SubMessages[0]
	if !slices.Contains(sub.Flags, provider.Flag(imap.FlagAnswered)) {
		t.Errorf("the earlier message is held with %v; want \\Answered", sub.Flags)
	}
	if got, ok := cachedUnseen(t, cache); !ok || got != 2 {
		t.Errorf("unseen = %d (cached %v), want 2", got, ok)
	}
}

// Each part of a message the session holds carries the message's flags, and
// is answered with them.
func TestAFlagChangeReachesEveryPartHeld(t *testing.T) {
	uid := provider.MockMessageID{ID: "7"}
	cache := flagCache(t, 3, nil)
	for _, key := range []string{"message:INBOX:7:[]", "message:INBOX:7:[1]:limit0", "message:INBOX:7:[2]:limit0"} {
		cache.Set(key, CachedMessagePart{Message: &provider.Message{ID: uid}, Mailbox: "INBOX"})
	}
	cache.Set("message:INBOX:70:[1]:limit0", CachedMessagePart{Message: &provider.Message{ID: provider.MockMessageID{ID: "70"}}, Mailbox: "INBOX"})

	applyFlagsToCache(cache, noDebug, "INBOX", uid, []imap.Flag{imap.FlagFlagged}, nil)

	for _, key := range []string{"message:INBOX:7:[]", "message:INBOX:7:[1]:limit0", "message:INBOX:7:[2]:limit0"} {
		cached, _ := cache.Get(key)
		if flags := cached.(CachedMessagePart).Message.Flags; !slices.Contains(flags, provider.Flag(imap.FlagFlagged)) {
			t.Errorf("%s holds %v; want \\Flagged", key, flags)
		}
	}
	cached, _ := cache.Get("message:INBOX:70:[1]:limit0")
	if flags := cached.(CachedMessagePart).Message.Flags; len(flags) != 0 {
		t.Errorf("another message took the change: %v", flags)
	}
}
