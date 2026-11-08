package maildir

import (
	"fmt"
	"testing"

	"github.com/migadu/alps/provider"
)

// A session's preference write and another session's credential update both
// rewrite alps_store.json. They must preserve each other's entries and cannot
// share an unprotected .tmp file, even though GetStore returns new instances.
func TestStore_ConcurrentInstancesPreserveEveryEntry(t *testing.T) {
	const writers = 32
	dir := t.TempDir()
	stores := make([]provider.Store, writers)
	for i := range stores {
		var err error
		stores[i], err = NewProvider(dir, "ada").GetStore()
		if err != nil {
			t.Fatal(err)
		}
	}
	start := make(chan struct{})
	done := make(chan error, writers)
	for i, store := range stores {
		go func() {
			<-start
			done <- store.Put(fmt.Sprintf("entry%d", i), i)
		}()
	}
	close(start)
	for range stores {
		if err := <-done; err != nil {
			t.Error(err)
		}
	}
	for i := range stores {
		var got int
		if err := stores[0].Get(fmt.Sprintf("entry%d", i), &got); err != nil || got != i {
			t.Errorf("entry%d: got %d, %v", i, got, err)
		}
	}
}
