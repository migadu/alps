package alpsbase

import (
	"reflect"
	"slices"
	"strconv"
	"sync"
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
		cache.Set(key, CachedMessages{Mailbox: "INBOX", Messages: msgs, Total: len(msgs)})
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
	cache.Set("messages:INBOX:0", CachedMessages{Mailbox: "INBOX", Messages: msgs, Total: len(msgs)})
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
	cache.Set("messages:INBOX:page0", CachedMessages{Mailbox: "INBOX", Messages: []provider.Message{{ID: uid}}, Counts: at})
	// Another page, which does not list the message but counts it all the same.
	cache.Set("messages:INBOX:page1", CachedMessages{Mailbox: "INBOX", Messages: []provider.Message{{ID: provider.MockMessageID{ID: "8"}}}, Counts: at})
	// Another folder's page is not this count's.
	cache.Set("messages:INBOX2:page0", CachedMessages{Mailbox: "INBOX2", Counts: at})

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
	cache.Set("messages:INBOX:page0", CachedMessages{Mailbox: "INBOX", Messages: []provider.Message{{ID: provider.MockMessageID{ID: "8"}}}, Counts: at})

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
			cache.Set("messages:INBOX:page0", CachedMessages{Mailbox: "INBOX", Messages: []provider.Message{conversation}, Counts: at})
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

// A UID names a different message in each folder, and the pages of Work:Sub
// have keys under Work's prefix (see CachedMessages.Mailbox). Starring and
// reading UID 7 of Work starred UID 7 of Work:Sub in its page as well. Read
// there, it was taken for Work's message read already, and Work's unread count
// was dropped instead of lowered; unread there, it was marked read, and the
// page of Work:Sub was moved to an unread count Work:Sub did not have.
func TestAFlagChangeLeavesAFolderNamedLikeAnotherAlone(t *testing.T) {
	for _, subSeen := range []bool{true, false} {
		name := "unread in Work:Sub"
		if subSeen {
			name = "read in Work:Sub"
		}
		t.Run(name, func(t *testing.T) {
			uid := provider.MockMessageID{ID: "7"}
			sibling := func() CachedMessages {
				var flags []provider.Flag
				if subSeen {
					flags = []provider.Flag{provider.Flag(imap.FlagSeen)}
				}
				return CachedMessages{
					Mailbox:  "Work:Sub",
					Messages: []provider.Message{{ID: uid, Flags: flags}, {ID: provider.MockMessageID{ID: "8"}}},
					Counts:   mailboxCounts{Known: true, Messages: 2, Unseen: uint32(2 - len(flags))},
				}
			}
			unseen := uint32(1)
			cache := alps.NewCache(time.Minute)
			t.Cleanup(cache.Close)
			cache.Set("status:Work", &MailboxStatus{StatusData: &imap.StatusData{Mailbox: "Work", NumUnseen: &unseen}})
			cache.Set("messages:Work:page0", CachedMessages{
				Mailbox:  "Work",
				Messages: []provider.Message{{ID: uid}},
				Counts:   mailboxCounts{Known: true, Messages: 1, Unseen: 1},
			})
			cache.Set("messages:Work:Sub:page0", sibling())

			applyFlagsToCache(cache, noDebug, "Work", uid, []imap.Flag{imap.FlagSeen, imap.FlagFlagged}, nil)

			cached, _ := cache.Get("messages:Work:Sub:page0")
			if got, want := cached.(CachedMessages), sibling(); !reflect.DeepEqual(got, want) {
				t.Errorf("the page of Work:Sub took Work's change: UID 7 there carries %v, at %d unread, want %v, at %d",
					got.Messages[0].Flags, got.Counts.Unseen, want.Messages[0].Flags, want.Counts.Unseen)
			}
			cached, ok := cache.Get("status:Work")
			if !ok {
				t.Fatal("Work's unread count was dropped, want it lowered")
			}
			if got := *cached.(*MailboxStatus).NumUnseen; got != 0 {
				t.Errorf("Work counts %d unread, want 0", got)
			}
		})
	}
}

// A request answers from what it read of the cache, and a flag change made
// meanwhile publishes new copies of what it changes. The copies already read
// stay as they were: changed in place, a page's rows, the earlier messages of
// a threaded row, the message's own entry and its parts, and the folder's
// counts moved under a request that was writing them out, a data race with
// it, and a flag list with room to spare was written in place through every
// slice that shared it.
func TestAFlagChangeLeavesWhatWasReadAsItWas(t *testing.T) {
	starred := func() []provider.Flag {
		flags := make([]provider.Flag, 1, 4)
		flags[0] = provider.Flag(imap.FlagFlagged)
		return flags
	}
	latest, earlier := provider.MockMessageID{ID: "7"}, provider.MockMessageID{ID: "5"}
	rows := []provider.Message{
		{ID: latest, Flags: starred()},
		{ID: provider.MockMessageID{ID: "9"}, SubMessages: []provider.Message{{ID: earlier, Flags: starred()}}},
	}
	cache := flagCache(t, 3, nil)
	cache.Set("messages:INBOX:0", CachedMessages{Mailbox: "INBOX", Messages: rows, Total: len(rows)})
	// As a listing caches its rows: the entry is the page's row in memory.
	cache.Set("message:INBOX:7:[]", CachedMessagePart{Message: &rows[0], Mailbox: "INBOX"})
	cache.Set("message:INBOX:7:[1]:limit0", CachedMessagePart{Message: &provider.Message{ID: latest, Flags: starred()}, Mailbox: "INBOX"})

	read := func(key string) interface{} {
		t.Helper()
		cached, ok := cache.Get(key)
		if !ok {
			t.Fatalf("%s is not held", key)
		}
		return cached
	}
	page := read("messages:INBOX:0").(CachedMessages)
	entry := read("message:INBOX:7:[]").(CachedMessagePart)
	part := read("message:INBOX:7:[1]:limit0").(CachedMessagePart)
	status := read("status:INBOX").(*MailboxStatus)
	// Slices of their own over the same flags, as a copy of a row holds.
	rowFlags, partFlags := page.Messages[0].Flags, part.Message.Flags

	applyFlagsToCache(cache, noDebug, "INBOX", latest, seen, nil)
	applyFlagsToCache(cache, noDebug, "INBOX", latest, nil, []imap.Flag{imap.FlagFlagged})
	applyFlagsToCache(cache, noDebug, "INBOX", earlier, seen, nil)

	want := []provider.Flag{provider.Flag(imap.FlagFlagged)}
	for name, got := range map[string][]provider.Flag{
		"the page's row":               page.Messages[0].Flags,
		"the earlier message of a row": page.Messages[1].SubMessages[0].Flags,
		"the message's own entry":      entry.Message.Flags,
		"the part":                     part.Message.Flags,
		"a copy of the page's row":     rowFlags,
		"a copy of the part":           partFlags,
	} {
		if !slices.Equal(got, want) {
			t.Errorf("%s, as read before the change, carries %v; want %v", name, got, want)
		}
	}
	if *status.NumUnseen != 3 {
		t.Errorf("the counts read before the change say %d unseen; want 3", *status.NumUnseen)
	}

	page = read("messages:INBOX:0").(CachedMessages)
	entry = read("message:INBOX:7:[]").(CachedMessagePart)
	part = read("message:INBOX:7:[1]:limit0").(CachedMessagePart)
	seenOnly := []provider.Flag{provider.Flag(imap.FlagSeen)}
	for name, got := range map[string][]provider.Flag{
		"the page's row":      page.Messages[0].Flags,
		"the message's entry": entry.Message.Flags,
		"the part":            part.Message.Flags,
		"the earlier message": page.Messages[1].SubMessages[0].Flags,
	} {
		wantNow := seenOnly
		if name == "the earlier message" {
			wantNow = []provider.Flag{provider.Flag(imap.FlagFlagged), provider.Flag(imap.FlagSeen)}
		}
		if !slices.Equal(got, wantNow) {
			t.Errorf("%s is held with %v; want %v", name, got, wantNow)
		}
	}
	if got, ok := cachedUnseen(t, cache); !ok || got != 1 {
		t.Errorf("unseen = %d (cached %v), want 1", got, ok)
	}
}

// Requests mark messages read side by side, and each change is made to the
// copies the cache holds when it is made, not to the ones another change read
// before it: none is lost, and the count falls by one for each.
func TestFlagChangesSideBySideAreAllKept(t *testing.T) {
	const n = 40
	rows := make([]provider.Message, n)
	for i := range rows {
		rows[i] = provider.Message{ID: provider.MockMessageID{ID: strconv.Itoa(i + 1)}}
	}
	cache := flagCache(t, n, map[string][]provider.Message{"messages:INBOX:0": rows})

	start := make(chan struct{})
	var wg sync.WaitGroup
	for i := range rows {
		wg.Add(1)
		go func(id provider.MessageID) {
			defer wg.Done()
			<-start
			applyFlagsToCache(cache, noDebug, "INBOX", id, seen, nil)
		}(rows[i].ID)
	}
	close(start)
	wg.Wait()

	cached, _ := cache.Get("messages:INBOX:0")
	for _, row := range cached.(CachedMessages).Messages {
		if !slices.Contains(row.Flags, provider.Flag(imap.FlagSeen)) {
			t.Errorf("message %s lost its change: %v", row.ID, row.Flags)
		}
	}
	if got, ok := cachedUnseen(t, cache); !ok || got != 0 {
		t.Errorf("unseen = %d (cached %v), want 0", got, ok)
	}
}
