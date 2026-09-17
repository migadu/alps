package imap

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"reflect"
	"sync"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

var warnedTransientStore = false

func newStore(client *imapclient.Client) (provider.Store, error) {
	s, err := newIMAPStore(client)
	if err == nil {
		return s, nil
	} else if err != errIMAPMetadataUnsupported {
		return nil, err
	}
	if !warnedTransientStore {
		log.Print("alps/provider: IMAP server doesn't support the METADATA extension, using transient store instead")
		warnedTransientStore = true
	}
	return newMemoryStore(), nil
}

type memoryStore struct {
	locker  sync.RWMutex
	entries map[string]interface{}
}

func newMemoryStore() *memoryStore {
	return &memoryStore{entries: make(map[string]interface{})}
}

func (s *memoryStore) Get(key string, out interface{}) error {
	s.locker.RLock()
	defer s.locker.RUnlock()

	v, ok := s.entries[key]
	if !ok {
		return provider.ErrNoStoreEntry
	}

	// Try direct assignment first
	outVal := reflect.ValueOf(out).Elem()
	vVal := reflect.ValueOf(v)

	if outVal.Type() == vVal.Type() {
		outVal.Set(vVal)
		return nil
	}

	// If types differ, bridge via JSON (allows map[string]interface{} -> struct or vice versa)
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, out)
}

func (s *memoryStore) Put(key string, v interface{}) error {
	s.locker.Lock()
	defer s.locker.Unlock()

	if v == nil {
		delete(s.entries, key)
		return nil
	}

	// Always store the dereferenced value so Get can assign it correctly
	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		s.entries[key] = val.Elem().Interface()
	} else {
		s.entries[key] = v
	}
	return nil
}

// imapStore keeps each entry in the server's METADATA, and caches it as the
// JSON the server holds. Callers decode the same entry into different types:
// signing in reads only the auto-logout from the settings, a listing only the
// threading choice, the settings page all of it. Caching what the first of
// them decoded handed everyone after it that caller's part, and defaults for
// the rest, which the settings page then saved over the account's settings.
type imapStore struct {
	client *imapclient.Client
	cache  *memoryStore
}

var errIMAPMetadataUnsupported = fmt.Errorf("provider: IMAP server doesn't support METADATA extension")

func newIMAPStore(client *imapclient.Client) (*imapStore, error) {
	if caps := client.Caps(); !caps.Has(imap.CapMetadata) && !caps.Has(imap.CapMetadataServer) {
		return nil, errIMAPMetadataUnsupported
	}
	return &imapStore{client, newMemoryStore()}, nil
}

func (s *imapStore) key(key string) string {
	return "/private/vendor/alps/" + key
}

func (s *imapStore) Get(key string, out interface{}) error {
	var cached json.RawMessage
	if err := s.cache.Get(key, &cached); err == nil {
		return json.Unmarshal(cached, out)
	} else if err != provider.ErrNoStoreEntry {
		return err
	}

	data, err := s.client.GetMetadata("", []string{s.key(key)}, nil).Wait()
	if err != nil {
		return fmt.Errorf("provider/imap: failed to fetch IMAP store entry %q: %v", key, err)
	}
	entries := data.Entries
	v, ok := entries[s.key(key)]
	if !ok || v == nil || len(*v) == 0 || string(*v) == "NIL" {
		return provider.ErrNoStoreEntry
	}
	if err := json.Unmarshal(*v, out); err != nil {
		log.Printf("provider/imap: ignoring invalid store entry %q (err: %v)", key, err)
		return provider.ErrNoStoreEntry
	}
	return s.cache.Put(key, json.RawMessage(bytes.Clone(*v)))
}

func (s *imapStore) Put(key string, v interface{}) error {
	var bPtr *[]byte
	if v != nil {
		b, err := json.Marshal(v)
		if err != nil {
			return fmt.Errorf("provider/imap: failed to marshal IMAP store entry %q: %v", key, err)
		}
		bPtr = &b
	}
	entries := map[string]*[]byte{s.key(key): bPtr}
	if err := s.client.SetMetadata("", entries).Wait(); err != nil {
		return fmt.Errorf("provider/imap: failed to put IMAP store entry %q: %v", key, err)
	}

	if bPtr == nil {
		return s.cache.Put(key, nil)
	}
	return s.cache.Put(key, json.RawMessage(*bPtr))
}
