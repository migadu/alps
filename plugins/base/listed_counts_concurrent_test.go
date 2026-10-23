package alpsbase

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"slices"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
)

// Concurrent status answers for distinct folders must retain every folder's
// new counts. The long list makes the read/replace overlap observable without
// changing cache internals or putting a hook in the production path.
func TestHTTP_ConcurrentStatusChecksKeepEveryFoldersListedCounts(t *testing.T) {
	s := newTestServer(t)
	names := make([]string, 8)
	for i := range names {
		names[i] = fmt.Sprintf("Work:%d", i)
		if err := s.store.CreateMailbox(names[i]); err != nil {
			t.Fatal(err)
		}
	}
	s.login()
	s.statusPage("/mailboxes/INBOX?page=0")
	cache := s.signedInSession().Cache()
	initial, ok := cache.Get("mailboxes")
	if !ok {
		t.Fatal("folder list was not cached")
	}
	base := slices.Clone(initial.([]MailboxInfo))
	for i := 0; i < 32768; i++ {
		base = append(base, MailboxInfo{ListData: &imap.ListData{Mailbox: fmt.Sprintf("Unchanged-%05d", i)}, Total: 77, Unseen: 3})
	}
	for _, name := range names {
		s.deliver(name, "New in "+name)
	}
	for attempt := 0; attempt < 5; attempt++ {
		cache.Set("mailboxes", slices.Clone(base))
		var zero uint32
		for _, name := range names {
			cache.Set("status:"+name, &MailboxStatus{StatusData: &imap.StatusData{Mailbox: name, NumMessages: &zero, NumUnseen: &zero}})
		}
		start := make(chan struct{})
		var wg sync.WaitGroup
		for _, name := range names {
			wg.Add(1)
			go func(name string) {
				defer wg.Done()
				<-start
				r := s.do("GET", "/mailboxes/"+url.PathEscape(name)+"/status", nil)
				if r.status != http.StatusOK {
					t.Errorf("status %s: %d %s", name, r.status, r.body)
					return
				}
				var answer MailboxStatusResponse
				if err := json.Unmarshal(r.body, &answer); err != nil || answer.Total != 1 || answer.Unseen != 1 {
					t.Errorf("status %s returned %+v (%v), want 1 message/1 unread", name, answer, err)
				}
			}(name)
		}
		close(start)
		wg.Wait()
		// Like an independently expired status, dropping the separate counters
		// requires the kept folder list itself to answer with its patched values.
		for _, name := range names {
			cache.Delete("status:" + name)
		}
		got, ok := cache.Get("mailboxes")
		if !ok {
			t.Fatal("status checks unexpectedly dropped the cached folder list")
		}
		for _, name := range names {
			list := got.([]MailboxInfo)
			i := slices.IndexFunc(list, func(m MailboxInfo) bool { return m.Name() == name })
			if i < 0 {
				t.Fatalf("folder %s disappeared from the patched list", name)
			}
			if list[i].Total != 1 || list[i].Unseen != 1 {
				t.Fatalf("attempt %d: status patch for %s was lost: %+v", attempt, name, list[i])
			}
		}
	}
}

// A patched list is still the snapshot of its original full read: a reader
// holding it is unaffected, and frequent checks must not extend its lifetime.
func TestListedCountPatchesRetainSnapshotAndExpiry(t *testing.T) {
	const lifetime = 60 * time.Millisecond
	cache := alps.NewCache(time.Minute)
	t.Cleanup(cache.Close)
	original := []MailboxInfo{{ListData: &imap.ListData{Mailbox: "Work"}, Total: 0, Unseen: 0}}
	var total, unseen uint32 = 2, 1
	status := &MailboxStatus{StatusData: &imap.StatusData{Mailbox: "Work", NumMessages: &total, NumUnseen: &unseen}}
	cache.Set("mailboxes", original)
	patchListedCounts(cache, []string{"Work"}, []*MailboxStatus{status})
	got, ok := cache.Get("mailboxes")
	if !ok || got.([]MailboxInfo)[0].Total != 2 || original[0].Total != 0 {
		t.Fatalf("patch changed a retained snapshot or lost new counts: old %+v new %+v", original, got)
	}
	expiring := alps.NewCache(lifetime)
	t.Cleanup(expiring.Close)
	expiring.Set("mailboxes", original)
	started := time.Now()
	for time.Since(started) < 2*lifetime {
		patchListedCounts(expiring, []string{"Work"}, []*MailboxStatus{status})
		time.Sleep(time.Millisecond)
	}
	if _, ok := expiring.Get("mailboxes"); ok {
		t.Error("continuous status patches renewed the full-list expiry")
	}
	cache.Set("mailboxes", original)
	cache.Delete("mailboxes")
	patchListedCounts(cache, []string{"Work"}, []*MailboxStatus{status})
	if _, ok := cache.Get("mailboxes"); ok {
		t.Error("late status patch recreated an invalidated list")
	}
	for _, tc := range []struct {
		name   string
		status *MailboxStatus
	}{
		{"Missing", status},
		{"Work", nil},
		{"Work", &MailboxStatus{StatusData: &imap.StatusData{Mailbox: "Work", NumMessages: &total}}},
	} {
		cache.Set("mailboxes", original)
		patchListedCounts(cache, []string{tc.name}, []*MailboxStatus{tc.status})
		if _, ok := cache.Get("mailboxes"); ok {
			t.Errorf("unusable counts for %s kept a misleading list", tc.name)
		}
	}
}
