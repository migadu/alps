package unified

import (
	"os"
	"fmt"
	"log"
	"encoding/json"
	"github.com/migadu/alps/provider"
)

type fileStore struct {
	path string
	cache *userConfig
}

func newFileStore(path string) (*fileStore, error) {

	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg userConfig
	err = json.Unmarshal(content, &cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to parse JSON data: %w", err)
	}
	if cfg.Settings == nil {
		cfg.Settings = make(map[string]json.RawMessage)
	}

	return &fileStore {
		path: path,
		cache: &cfg,
	}, nil
}

func (s *fileStore) accounts() []*backendConfig {

	return s.cache.Accounts
}

func (s *fileStore) unified() []string {

	return s.cache.Unified
}

func (f *fileStore) saveSettings() {

	b, err := json.MarshalIndent(f.cache, "", "   ")
	if err != nil {
		log.Printf("provider/%s: save settings marshal failed: %s", providerName, err)
		return
	}
	err = os.WriteFile(f.path, b, 0644)
	if err != nil {
		log.Printf("provider/%s: save settings write failed: %s", providerName, err)
		return
	}
}

func (f *fileStore) Get(key string, out interface{}) error {

	raw, ok := f.cache.Settings[key]
	if !ok || raw == nil || len(raw) == 0 || string(raw) == "NIL" {
		return provider.ErrNoStoreEntry
	}
	if err := json.Unmarshal(raw, out); err != nil {
		log.Printf("provider/%s: ignoring invalid store entry %q (err: %v)", providerName, key, err)
		return provider.ErrNoStoreEntry
	}
	return nil
}

func (f *fileStore) Put(key string, v interface{}) error {

	if v != nil {
		b, err := json.MarshalIndent(v, "   ", "   ")
		if err != nil {
			return fmt.Errorf("provider/%s: failed to marshal unified store entry %q: %v", providerName, key, err)
		}
		f.cache.Settings[key] = json.RawMessage(b)
	} else {
		delete(f.cache.Settings, key)
	}
	f.saveSettings()
	return nil
}
