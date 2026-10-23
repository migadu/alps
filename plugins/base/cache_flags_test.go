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

// A message marked read twice is one message read: the count is one lower,
// not two.
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

// A threaded page lists a conversation's other messages under its row, and
// the row is drawn bold while any of them is unread. Marking one of them read
// moves the page's count, so the page's copy of it has to move too: left
// unread, the page matched the server's next count and was served again, with
// the conversation bold. Opening the message from its card writes a row of its
// own, which is the state the count goes by.
func TestMarkingAThreadedMessageMovesThePagesCopyOfIt(t *testing.T) {
	for _, withRow := range []bool{false, true} {
		name := "listed under its conversation"
		if withRow {
			name += ", and opened"
		}
		t.Run(name, func(t *testing.T) {
			member := provider.Message{ID: provider.MockMessageID{ID: "7"}}
			conversation := provider.Message{ID: provider.MockMessageID{ID: "8"}, SubMessages: []provider.Message{member}}
			at := mailboxCounts{Known: true, Messages: 2, Unseen: 2}
			cache := flagCache(t, 2, nil)
			cache.Set("messages:INBOX:page0", CachedMessages{Messages: []provider.Message{conversation}, Counts: at})
			cache.Set("message:INBOX:8:[]", CachedMessagePart{Message: &conversation, Mailbox: "INBOX"})
			if withRow {
				opened := member
				cacheMessageRow(cache, "INBOX", &opened, 0)
			}

			check := func(write string, wantSeen bool, wantUnseen uint32) {
				t.Helper()
				cached, _ := cache.Get("messages:INBOX:page0")
				page := cached.(CachedMessages)
				copySeen := slices.Contains(page.Messages[0].SubMessages[0].Flags, provider.Flag(imap.FlagSeen))
				if copySeen != wantSeen {
					t.Errorf("%s, the page's copy of the message has flags %v", write, page.Messages[0].SubMessages[0].Flags)
				}
				if page.Counts.Unseen != wantUnseen {
					t.Errorf("%s, the page was read at %d unseen, want %d", write, page.Counts.Unseen, wantUnseen)
				}
				if unseen, ok := cachedUnseen(t, cache); ok && unseen != page.Counts.Unseen {
					t.Errorf("%s, the folder counts %d unseen and the page %d", write, unseen, page.Counts.Unseen)
				}
			}

			applyFlagsToCache(cache, noDebug, "INBOX", member.ID, seen, nil)
			check("marked read", true, 1)
			applyFlagsToCache(cache, noDebug, "INBOX", member.ID, nil, seen)
			check("marked unread", false, 2)
		})
	}
}
