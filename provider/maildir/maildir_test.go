package maildir

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
)

func TestStore_GetAndPut(t *testing.T) {
	// Create a temporary directory to act as the Maildir base path
	basePath := t.TempDir()

	p := NewProvider(basePath, "testuser")
	store, err := p.GetStore()
	assert.NoError(t, err)
	assert.NotNil(t, store)

	// Cast back to *Store to verify internal path
	mdStore, ok := store.(*Store)
	assert.True(t, ok)
	assert.Equal(t, filepath.Join(basePath, "alps_store.json"), mdStore.path)

	// 1. Get from empty/non-existent store should return ErrNoStoreEntry
	var out map[string]string
	err = store.Get("settings", &out)
	assert.Equal(t, provider.ErrNoStoreEntry, err)

	// 2. Put a value
	settings := map[string]string{"theme": "dark", "lang": "en"}
	err = store.Put("settings", settings)
	assert.NoError(t, err)

	// Verify the file was actually written
	_, err = os.Stat(mdStore.path)
	assert.NoError(t, err)

	// 3. Get the value back
	var outSettings map[string]string
	err = store.Get("settings", &outSettings)
	assert.NoError(t, err)
	assert.Equal(t, settings, outSettings)

	// 4. Put another value (updates the file)
	contacts := []string{"alice@example.com", "bob@example.com"}
	err = store.Put("contacts", contacts)
	assert.NoError(t, err)

	// 5. Verify both values are now in the store
	var outContacts []string
	err = store.Get("contacts", &outContacts)
	assert.NoError(t, err)
	assert.Equal(t, contacts, outContacts)

	var outSettings2 map[string]string
	err = store.Get("settings", &outSettings2)
	assert.NoError(t, err)
	assert.Equal(t, settings, outSettings2)

	// 6. Test corrupt JSON handling
	err = os.WriteFile(mdStore.path, []byte("{invalid json"), 0600)
	assert.NoError(t, err)

	err = store.Get("settings", &outSettings)
	assert.Error(t, err)
	assert.NotEqual(t, provider.ErrNoStoreEntry, err) // Should be a JSON syntax error
}
