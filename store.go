package koushin

import (
	"encoding/json"
	"fmt"
	"reflect"
	"sync"

	imapmetadata "github.com/emersion/go-imap-metadata"
	imapclient "github.com/emersion/go-imap/client"
	"github.com/labstack/echo/v4"
)

// ErrNoStoreEntry is returned by Store.Get when the entry doesn't exist.
var ErrNoStoreEntry = fmt.Errorf("koushin: no such entry in store")

// Store allows storing per-user persistent data.
//
// Store shouldn't be used from inside Session.DoIMAP.
type Store interface {
	Get(key string, out interface{}) error
	Put(key string, v interface{}) error
}

var warnedTransientStore = false

func newStore(session *Session, logger echo.Logger) (Store, error) {
	s, err := newIMAPStore(session)
	if err == nil {
		return s, nil
	} else if err != errIMAPMetadataUnsupported {
		return nil, err
	}
	if !warnedTransientStore {
		logger.Print("Upstream IMAP server doesn't support the METADATA extension, using transient store instead")
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
		return ErrNoStoreEntry
	}

	reflect.ValueOf(out).Elem().Set(reflect.ValueOf(v).Elem())
	return nil
}

func (s *memoryStore) Put(key string, v interface{}) error {
	s.locker.Lock()
	s.entries[key] = v
	s.locker.Unlock()
	return nil
}

type imapStore struct {
	session *Session
	cache   *memoryStore
}

var errIMAPMetadataUnsupported = fmt.Errorf("koushin: IMAP server doesn't support METADATA extension")

func newIMAPStore(session *Session) (*imapStore, error) {
	err := session.DoIMAP(func(c *imapclient.Client) error {
		mc := imapmetadata.NewClient(c)
		ok, err := mc.SupportMetadata()
		if err != nil {
			return fmt.Errorf("koushin: failed to check for IMAP METADATA support: %v", err)
		}
		if !ok {
			return errIMAPMetadataUnsupported
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &imapStore{session, newMemoryStore()}, nil
}

func (s *imapStore) key(key string) string {
	return "/private/vendor/koushin/" + key
}

func (s *imapStore) Get(key string, out interface{}) error {
	if err := s.cache.Get(key, out); err != ErrNoStoreEntry {
		return err
	}

	var entries map[string]string
	err := s.session.DoIMAP(func(c *imapclient.Client) error {
		mc := imapmetadata.NewClient(c)
		var err error
		entries, err = mc.GetMetadata("", []string{s.key(key)}, nil)
		return err
	})
	if err != nil {
		return fmt.Errorf("koushin: failed to fetch IMAP store entry %q: %v", key, err)
	}
	v, ok := entries[s.key(key)]
	if !ok {
		return ErrNoStoreEntry
	}
	if err := json.Unmarshal([]byte(v), out); err != nil {
		return fmt.Errorf("koushin: failed to unmarshal IMAP store entry %q: %v", key, err)
	}
	return s.cache.Put(key, out)
}

func (s *imapStore) Put(key string, v interface{}) error {
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("koushin: failed to marshal IMAP store entry %q: %v", key, err)
	}
	entries := map[string]string{
		s.key(key): string(b),
	}
	err = s.session.DoIMAP(func(c *imapclient.Client) error {
		mc := imapmetadata.NewClient(c)
		return mc.SetMetadata("", entries)
	})
	if err != nil {
		return fmt.Errorf("koushin: failed to put IMAP store entry %q: %v", key, err)
	}

	return s.cache.Put(key, v)
}
