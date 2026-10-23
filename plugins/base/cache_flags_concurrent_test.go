package alpsbase

import (
	"runtime"
	"slices"
	"sync"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// Search results cache metadata without a folder page. Concurrent idempotent
// marks of one such message must still count just one read/unread transition.
func TestConcurrentMarksOfOneMessageMoveTheCountOnce(t *testing.T) {
	old := runtime.GOMAXPROCS(8)
	defer runtime.GOMAXPROCS(old)
	for _, mark := range []struct {
		name        string
		initial     []provider.Flag
		add, remove []imap.Flag
		want        uint32
	}{
		{name: "read", add: seen, want: 99},
		{name: "unread", initial: []provider.Flag{provider.Flag(imap.FlagSeen)}, remove: seen, want: 101},
	} {
		t.Run(mark.name, func(t *testing.T) {
			for attempt := 0; attempt < 100; attempt++ {
				uid := provider.MockMessageID{ID: "7"}
				cache := flagCache(t, 100, nil)
				cache.Set("message:INBOX:7:[]", CachedMessagePart{Mailbox: "INBOX", Message: &provider.Message{ID: uid, Flags: slices.Clone(mark.initial)}})
				start := make(chan struct{})
				var wg sync.WaitGroup
				for i := 0; i < 40; i++ {
					wg.Add(1)
					go func() {
						defer wg.Done()
						<-start
						applyFlagsToCache(cache, noDebug, "INBOX", uid, mark.add, mark.remove)
					}()
				}
				close(start)
				wg.Wait()
				if got, ok := cachedUnseen(t, cache); !ok || got != mark.want {
					t.Fatalf("attempt %d: unseen=%d (cached %v), want %d after one transition", attempt, got, ok, mark.want)
				}
				entry, _ := cache.Get("message:INBOX:7:[]")
				flags := entry.(CachedMessagePart).Message.Flags
				if slices.Contains(flags, provider.Flag(imap.FlagSeen)) != (len(mark.add) > 0) {
					t.Fatalf("wrong final flags: %v", flags)
				}
				cache.Close()
			}
		})
	}
}
