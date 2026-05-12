package maildir

import (
	"os"
	"path/filepath"
	"testing"
)

func TestStore(t *testing.T) {
	tmpDir := t.TempDir()

	provider := NewProvider(tmpDir, "testuser")
	store, err := provider.GetStore()
	if err != nil {
		t.Fatalf("failed to get store: %v", err)
	}

	type testData struct {
		Name  string `json:"name"`
		Value int    `json:"value"`
	}

	// Test writing
	data := testData{Name: "test", Value: 123}
	if err := store.Put("key1", data); err != nil {
		t.Fatalf("failed to put data: %v", err)
	}

	// Test reading
	var out testData
	if err := store.Get("key1", &out); err != nil {
		t.Fatalf("failed to get data: %v", err)
	}

	if out.Name != "test" || out.Value != 123 {
		t.Errorf("got %v, want {Name: 'test', Value: 123}", out)
	}

	// Test getting non-existent key
	var out2 testData
	if err := store.Get("nonexistent", &out2); err == nil {
		t.Errorf("expected error getting non-existent key, got nil")
	}

	// Verify file was created
	storePath := filepath.Join(tmpDir, "alps_store.json")
	if _, err := os.Stat(storePath); os.IsNotExist(err) {
		t.Errorf("store file was not created")
	}
}
