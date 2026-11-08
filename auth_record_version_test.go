package alps

import (
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"testing"
)

type versionTestStore struct {
	mu      sync.Mutex
	entries map[string]json.RawMessage
	putHook func(string, interface{}) error
}

func (s *versionTestStore) List(prefix string) (map[string]json.RawMessage, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	copy := make(map[string]json.RawMessage, len(s.entries))
	for k, v := range s.entries {
		copy[k] = append(json.RawMessage(nil), v...)
	}
	return copy, nil
}

func (s *versionTestStore) putOnce(key string, v interface{}) error {
	if s.putHook != nil {
		if err := s.putHook(key, v); err != nil {
			return err
		}
	}
	return s.apply(key, v)
}

func (s *versionTestStore) apply(key string, v interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if v == nil {
		delete(s.entries, key)
		return nil
	}
	raw, err := json.Marshal(v)
	if err == nil {
		s.entries[key] = raw
	}
	return err
}

func newVersionTestStore(t *testing.T) *versionTestStore {
	t.Helper()
	s := &versionTestStore{entries: make(map[string]json.RawMessage)}
	version, err := beginCredentialVersion(s)
	if err != nil {
		t.Fatal(err)
	}
	if err := version.commit(json.RawMessage(`{"codes":["x","y"],"trust":false}`)); err != nil {
		t.Fatal(err)
	}
	return s
}

func currentVersionData(t *testing.T, s *versionTestStore) string {
	t.Helper()
	v, err := listCredentialVersions(s)
	if err != nil {
		t.Fatal(err)
	}
	return string(v.entries[v.committed].Data)
}

func TestCredentialVersions_CrossNodeSameCodeHasOneWinner(t *testing.T) {
	for repeat := 0; repeat < 100; repeat++ {
		s := newVersionTestStore(t)
		a, err := beginCredentialVersion(s)
		if err != nil {
			t.Fatal(err)
		}
		b, err := beginCredentialVersion(s)
		if err != nil {
			t.Fatal(err)
		}
		// Both nodes have already read the same code as unused. Their writes
		// are independent RPCs; only the metadata version protocol arbitrates.
		start := make(chan struct{})
		done := make(chan error, 2)
		for _, node := range []*credentialVersion{a, b} {
			go func() { <-start; done <- node.commit(json.RawMessage(`{"codes":["y"],"trust":false}`)) }()
		}
		close(start)
		wins := 0
		for range 2 {
			err := <-done
			if err == nil {
				wins++
			} else if !errors.Is(err, ErrWebAuthnConflict) {
				t.Fatal(err)
			}
		}
		if wins != 1 {
			t.Fatalf("%d winners, want exactly one", wins)
		}
		if got := currentVersionData(t, s); got != `{"codes":["y"],"trust":false}` {
			t.Fatal(got)
		}
	}
}

func TestCredentialVersions_PausedWriterCannotRestoreSpentCode(t *testing.T) {
	s := newVersionTestStore(t)
	stale, err := beginCredentialVersion(s)
	if err != nil {
		t.Fatal(err)
	}
	current, err := beginCredentialVersion(s)
	if err != nil {
		t.Fatal(err)
	}
	if err := current.commit(json.RawMessage(`{"codes":["y"],"trust":false}`)); err != nil {
		t.Fatal(err)
	}
	if err := stale.commit(json.RawMessage(`{"codes":["x","y"],"trust":true}`)); !errors.Is(err, ErrWebAuthnConflict) {
		t.Fatalf("stale writer: %v", err)
	}
	if got := currentVersionData(t, s); got != `{"codes":["y"],"trust":false}` {
		t.Fatal(got)
	}
}

func TestCredentialVersions_UnknownDelayedWriteCannotOverwriteRestartedNode(t *testing.T) {
	s := newVersionTestStore(t)
	stale, err := beginCredentialVersion(s)
	if err != nil {
		t.Fatal(err)
	}
	var delayed interface{}
	s.putHook = func(key string, v interface{}) error {
		if key == stale.key {
			delayed = v
			return errors.New("connection lost before reply")
		}
		return nil
	}
	if err := stale.commit(json.RawMessage(`{"codes":["x","y"],"trust":true}`)); err == nil {
		t.Fatal("unacknowledged write succeeded")
	}
	s.putHook = nil
	// No lock cleanup or process-liveness oracle: a fresh node can progress.
	restarted, err := beginCredentialVersion(s)
	if err != nil {
		t.Fatal(err)
	}
	if err := restarted.commit(json.RawMessage(`{"codes":["y"],"trust":false}`)); err != nil {
		t.Fatal(err)
	}
	if err := s.apply(stale.key, delayed); err != nil {
		t.Fatal(err)
	}
	if got := currentVersionData(t, s); got != `{"codes":["y"],"trust":false}` {
		t.Fatal(got)
	}
}

func TestCredentialVersions_CrashAfterProposalDoesNotBlockCommit(t *testing.T) {
	s := newVersionTestStore(t)
	writing, err := beginCredentialVersion(s)
	if err != nil {
		t.Fatal(err)
	}
	var once sync.Once
	s.putHook = func(key string, v interface{}) error {
		if envelope, ok := v.(credentialEnvelope); ok && envelope.Committed && key == writing.key {
			once.Do(func() {
				// The competing node announces, then disappears forever.
				if _, err := beginCredentialVersion(s); err != nil {
					t.Fatal(err)
				}
			})
		}
		return nil
	}
	if err := writing.commit(json.RawMessage(`{"codes":["y"],"trust":false}`)); err != nil {
		t.Fatal(err)
	}
	if got := currentVersionData(t, s); got != `{"codes":["y"],"trust":false}` {
		t.Fatal(got)
	}
}

func TestCredentialVersions_PrunesOldStateButKeepsTombstone(t *testing.T) {
	s := newVersionTestStore(t)
	for i := 0; i < 100; i++ {
		v, err := beginCredentialVersion(s)
		if err != nil {
			t.Fatal(err)
		}
		if err := v.commit(json.RawMessage(fmt.Sprintf(`{"sequence":%d}`, i))); err != nil {
			t.Fatal(err)
		}
		if len(s.entries) > 3 {
			t.Fatalf("unbounded metadata growth: %d", len(s.entries))
		}
	}
	v, err := beginCredentialVersion(s)
	if err != nil {
		t.Fatal(err)
	}
	if err := v.commit(nil); err != nil {
		t.Fatal(err)
	}
	if _, err := beginCredentialVersion(s); err != nil {
		t.Fatal(err)
	}
	current, err := listCredentialVersions(s)
	if err != nil {
		t.Fatal(err)
	}
	if current.committed == "" || string(current.entries[current.committed].Data) != "null" {
		t.Fatal("deletion tombstone lost")
	}
}

func TestCredentialVersions_MissingSnapshotDataIsNotADeletion(t *testing.T) {
	s := newVersionTestStore(t)
	s.entries["webauthn-state/00000000000000000002-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"] = json.RawMessage(`{"version":1,"committed":true}`)
	if _, err := listCredentialVersions(s); err == nil {
		t.Fatal("incomplete snapshot silently disabled the second factor")
	}
}
