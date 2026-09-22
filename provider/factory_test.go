package provider

import (
	"testing"

	"github.com/BurntSushi/toml"
	"github.com/stretchr/testify/assert"
)

func TestRegisterAndLoadConfig(t *testing.T) {
	dummyFactory := func(meta *toml.MetaData, data *toml.Primitive) (Config, error) {
		return nil, nil
	}

	// The registry is process-global, so drop the entry again to keep the
	// test re-runnable (go test -count=2 ./provider).
	t.Cleanup(func() {
		providerMu.Lock()
		defer providerMu.Unlock()
		delete(providerMap, "test-custom")
	})

	Register("test-custom", dummyFactory)

	// Duplicate registration should panic (including case-insensitive)
	assert.Panics(t, func() {
		Register("test-custom", dummyFactory)
	})
	assert.Panics(t, func() {
		Register("TEST-CUSTOM", dummyFactory)
	})

	// Empty name registration should panic
	assert.Panics(t, func() {
		Register("", dummyFactory)
	})

	// Case-insensitive lookup should succeed
	cfg, err := LoadConfig("TEST-CUSTOM", &toml.MetaData{}, &toml.Primitive{})
	assert.NoError(t, err)
	assert.Nil(t, cfg)

	// Unknown provider should error
	_, err = LoadConfig("unknown-provider-xyz", nil, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unknown provider type 'unknown-provider-xyz'")

	// Empty provider should error
	_, err = LoadConfig("", nil, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no provider type")
}

// The registered factories dereference both TOML arguments, so LoadConfig must
// reject nil ones instead of panicking.
func TestLoadConfigNilTOML(t *testing.T) {
	dummyFactory := func(meta *toml.MetaData, data *toml.Primitive) (Config, error) {
		return nil, nil
	}

	t.Cleanup(func() {
		providerMu.Lock()
		defer providerMu.Unlock()
		delete(providerMap, "test-nil-toml")
	})
	Register("test-nil-toml", dummyFactory)

	_, err := LoadConfig("test-nil-toml", nil, nil)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no TOML configuration")
}
