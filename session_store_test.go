package alps

import (
	"errors"
	"io"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

// readCountingStore counts the reads that reach the mail server's store.
type readCountingStore struct {
	*rawStore
	reads atomic.Int32
}

func (s *readCountingStore) Get(key string, out interface{}) error {
	s.reads.Add(1)
	return s.rawStore.Get(key, out)
}

// copyKeepingStore stands for a store that keeps a copy of each entry it has
// read or written, as the IMAP store does for as long as its connection lasts,
// and so can read past it: a provider.FreshStore. It keeps nothing itself and
// reads from the server every time, which lets the test count the reads that
// reach the connection. While freshErr is set, the next fresh read fails with
// it, as a GETMETADATA the server refuses does.
type copyKeepingStore struct {
	readCountingStore
	freshErr error
}

func (s *copyKeepingStore) GetFresh(key string, out interface{}) error {
	if err := s.freshErr; err != nil {
		s.freshErr = nil
		return err
	}
	return s.Get(key, out)
}

// newStoreSession is a session whose every connection reads and writes store,
// and that counts its connections in connects.
func newStoreSession(store provider.Store, connects *int) *Session {
	sm := newSessionManager(func(string, string) (provider.MailProvider, error) {
		*connects++
		p := &provider.MockProvider{}
		p.On("Close").Return(nil)
		p.On("GetStore").Return(store, nil)
		return p, nil
	}, nil, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	return &Session{manager: sm, closed: make(chan struct{}), username: "u", password: "p"}
}

// storedSignature reads the signature from s's settings.
func storedSignature(t *testing.T, s *Session) string {
	t.Helper()
	var settings struct {
		Signature string `json:"signature"`
	}
	if err := s.Store().Get("base.settings", &settings); err != nil {
		t.Fatal(err)
	}
	return settings.Signature
}

// A session answers a read of an entry its connection has read or written
// from its own copy, without waiting for the connection. A new connection
// reads the entry again, as the connection's own copy of it starts over too,
// so the copy is never older than the one the connection kept.
func TestSessionStore_AnEntryIsReadOncePerConnection(t *testing.T) {
	store := &copyKeepingStore{readCountingStore: readCountingStore{rawStore: &rawStore{entries: map[string]string{
		"base.settings": `{"signature": "Ada"}`,
	}}}}
	connects := 0
	s := newStoreSession(store, &connects)
	reads := func() int { return int(store.reads.Load()) }

	if got := storedSignature(t, s); got != "Ada" {
		t.Fatalf("read %q", got)
	}
	storedSignature(t, s)
	if reads() != 1 {
		t.Errorf("two reads of the settings reached the server %d times, want once", reads())
	}

	// What the session writes is what it reads next.
	if err := s.Store().Put("base.settings", map[string]string{"signature": "Ada L."}); err != nil {
		t.Fatal(err)
	}
	if got := storedSignature(t, s); got != "Ada L." || reads() != 1 {
		t.Errorf("after a write, read %q with %d reads of the server, want %q with 1", got, reads(), "Ada L.")
	}

	// An entry that is not there is remembered as well: an account that never
	// saved its settings reads them as often as any other.
	before := reads()
	for i := 0; i < 2; i++ {
		var keys []string
		if err := s.Store().Get("gpg_keys", &keys); err != provider.ErrNoStoreEntry {
			t.Fatalf("a missing entry read %v, %v", keys, err)
		}
	}
	if n := reads() - before; n != 1 {
		t.Errorf("two reads of a missing entry reached the server %d times, want once", n)
	}

	// Another client changes the settings. A fresh read sees the change, and
	// so does every read after it.
	store.rawStore.Put("base.settings", map[string]string{"signature": "Countess"})
	var fresh struct {
		Signature string `json:"signature"`
	}
	if err := provider.GetFresh(s.Store(), "base.settings", &fresh); err != nil || fresh.Signature != "Countess" {
		t.Errorf("read fresh, the settings are %+v, %v; want the signature %q", fresh, err, "Countess")
	}
	if got := storedSignature(t, s); got != "Countess" {
		t.Errorf("after a fresh read, the settings read %q, want %q", got, "Countess")
	}

	// A fresh read the server refuses, which is no reason to connect again,
	// leaves the session without a copy: the connection's store dropped its
	// own before it asked, and reads the entry again next time. Kept, the
	// session's copy would be older than what the connection reads next.
	store.rawStore.Put("base.settings", map[string]string{"signature": "Ada, Countess"})
	store.freshErr = errors.New("GETMETADATA: NO [SERVERBUG] try again later")
	if err := provider.GetFresh(s.Store(), "base.settings", &fresh); err == nil {
		t.Fatal("the refused fresh read did not fail")
	}
	before = reads()
	if got := storedSignature(t, s); got != "Ada, Countess" || reads() != before+1 {
		t.Errorf("after a refused fresh read, the settings read %q with %d reads of the server, want %q read from it", got, reads()-before, "Ada, Countess")
	}

	// A connection that has just been opened reads them as they are now.
	store.rawStore.Put("base.settings", map[string]string{"signature": "Lady Lovelace"})
	if err := s.DoMail(func(provider.MailProvider) error { return io.EOF }); err == nil {
		t.Fatal("the failing operation did not fail")
	}
	if connects != 2 {
		t.Fatalf("the session connected %d times, want once more after the connection failed", connects)
	}
	if got := storedSignature(t, s); got != "Lady Lovelace" {
		t.Errorf("on a new connection, the settings read %q, want %q", got, "Lady Lovelace")
	}

	// So does one opened after the session let its connection go, and one
	// opened for a new password.
	store.rawStore.Put("base.settings", map[string]string{"signature": "A. A. Lovelace"})
	s.providerLocker.Lock()
	s.provider.Close()
	s.provider = nil
	s.providerLocker.Unlock()
	if err := s.DoMail(func(provider.MailProvider) error { return nil }); err != nil {
		t.Fatal(err)
	}
	if connects != 3 {
		t.Fatalf("the session connected %d times, want once more after it let the connection go", connects)
	}
	if got := storedSignature(t, s); got != "A. A. Lovelace" {
		t.Errorf("on a connection opened again, the settings read %q, want %q", got, "A. A. Lovelace")
	}
	store.rawStore.Put("base.settings", map[string]string{"signature": "Augusta"})
	if err := s.manager.UpdatePassword(s, "q"); err != nil {
		t.Fatal(err)
	}
	if got := storedSignature(t, s); got != "Augusta" {
		t.Errorf("on the connection opened for a new password, the settings read %q, want %q", got, "Augusta")
	}
}

// A store that keeps no copy of its own, as the maildir store reads its file
// every time, sees another session's write on its next read. The session
// keeps no copy of it either, which would hide that write until the session
// connected again.
func TestSessionStore_AStoreWithoutCopiesIsReadEveryTime(t *testing.T) {
	store := &readCountingStore{rawStore: &rawStore{entries: map[string]string{
		"base.settings": `{"signature": "Ada"}`,
	}}}
	connects := 0
	s := newStoreSession(store, &connects)

	if got := storedSignature(t, s); got != "Ada" {
		t.Fatalf("read %q", got)
	}
	store.rawStore.Put("base.settings", map[string]string{"signature": "Countess"})
	if got := storedSignature(t, s); got != "Countess" {
		t.Errorf("after another session's write, the settings read %q, want %q", got, "Countess")
	}
	if err := s.Store().Put("base.settings", map[string]string{"signature": "Ada L."}); err != nil {
		t.Fatal(err)
	}
	store.rawStore.Put("base.settings", map[string]string{"signature": "Lady Lovelace"})
	if got := storedSignature(t, s); got != "Lady Lovelace" {
		t.Errorf("after this session's write and another's, the settings read %q, want %q", got, "Lady Lovelace")
	}
	if n := store.reads.Load(); n != 3 {
		t.Errorf("three reads reached the store %d times", n)
	}
	if connects != 1 {
		t.Errorf("the session connected %d times, want once", connects)
	}
}
