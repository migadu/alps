package maildir

import (
	"encoding/json"
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

func (s *Store) readData() (map[string]interface{}, error) {
	data := make(map[string]interface{})

	content, err := os.ReadFile(s.path)
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

	// Write to temporary file first then rename to avoid corruption
	tmpPath := s.path + ".tmp"
	if err := os.WriteFile(tmpPath, b, 0600); err != nil {
		return err
	}

	return os.Rename(tmpPath, s.path)
}
