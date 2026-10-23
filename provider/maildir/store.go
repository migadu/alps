package maildir

import (
	"encoding/json"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"sync"

	"github.com/migadu/alps/provider"
)

type Store struct {
	path string
	mu   sync.RWMutex
}

func (p *Provider) GetStore() (provider.Store, error) {
	// Use a file named alps_store.json in the base path of the maildir
	storePath := filepath.Join(p.basePath, "alps_store.json")
	return &Store{
		path: storePath,
	}, nil
}

// openRoot opens the maildir the store's file is in, which the file is read
// and written beneath, as the mail is (see box): a settings file linked out of
// the maildir is neither read nor written.
func (s *Store) openRoot() (*os.Root, error) {
	return os.OpenRoot(filepath.Dir(s.path))
}

func (s *Store) readData() (map[string]interface{}, error) {
	data := make(map[string]interface{})

	root, err := s.openRoot()
	if errors.Is(err, fs.ErrNotExist) {
		return data, nil
	}
	if err != nil {
		return nil, err
	}
	defer root.Close()
	content, err := root.ReadFile(filepath.Base(s.path))
	if err != nil {
		if os.IsNotExist(err) {
			return data, nil
		}
		return nil, err
	}

	if len(content) > 0 {
		if err := json.Unmarshal(content, &data); err != nil {
			return nil, err
		}
	}

	return data, nil
}

func (s *Store) Get(key string, out interface{}) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	data, err := s.readData()
	if err != nil {
		return err
	}

	val, ok := data[key]
	if !ok {
		return provider.ErrNoStoreEntry
	}

	// Re-marshal to unmarshal into the specific output type correctly
	b, err := json.Marshal(val)
	if err != nil {
		return err
	}

	return json.Unmarshal(b, out)
}

func (s *Store) Put(key string, v interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	data, err := s.readData()
	if err != nil {
		return err
	}

	if v == nil {
		delete(data, key)
	} else {
		data[key] = v
	}

	b, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	root, err := s.openRoot()
	if err != nil {
		return err
	}
	defer root.Close()

	// Write to temporary file first then rename to avoid corruption
	name := filepath.Base(s.path)
	if err := root.WriteFile(name+".tmp", b, 0600); err != nil {
		return err
	}

	return root.Rename(name+".tmp", name)
}
