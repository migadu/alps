package imap

import (
	"encoding/json"
	"fmt"
	"reflect"
	"sync"
	"log"

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
		log.Print("alps/provider: Upstream IMAP server doesn't support the METADATA extension, using transient store instead")
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

	// out is a pointer, v is the actual value (not a pointer)
	reflect.ValueOf(out).Elem().Set(reflect.ValueOf(v))
	return nil
}

func (s *memoryStore) Put(key string, v interface{}) error {
	s.locker.Lock()
	// Always store the dereferenced value so Get can assign it correctly
	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		s.entries[key] = val.Elem().Interface()
	} else {
		s.entries[key] = v
	}
	s.locker.Unlock()
	return nil
}

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
	if err := s.cache.Get(key, out); err != provider.ErrNoStoreEntry {
		return err
	}

	data, err := s.client.GetMetadata("", []string{s.key(key)}, nil).Wait()
	if err != nil {
		return fmt.Errorf("provider/imap: failed to fetch IMAP store entry %q: %v", key, err)
	}
	entries := data.Entries
	v, ok := entries[s.key(key)]
	if !ok || v == nil {
		return provider.ErrNoStoreEntry
	}
	if err := json.Unmarshal(*v, out); err != nil {
		return fmt.Errorf("provider/imap: failed to unmarshal IMAP store entry %q: %v", key, err)
	}
	// Store the dereferenced value in cache, not the pointer
	return s.cache.Put(key, reflect.ValueOf(out).Elem().Interface())
}

func (s *imapStore) Put(key string, v interface{}) error {
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("provider/imap: failed to marshal IMAP store entry %q: %v", key, err)
	}
	entries := map[string]*[]byte{s.key(key): &b}
	if err := s.client.SetMetadata("", entries).Wait(); err != nil {
		return fmt.Errorf("provider/imap: failed to put IMAP store entry %q: %v", key, err)
	}

	return s.cache.Put(key, v)
}
