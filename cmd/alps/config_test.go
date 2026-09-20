package main

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider/imap"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIMAPDefaultMissing(t *testing.T) {

	config := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n"
	_, err := LoadConfigString(config)
	var wantErr ConfigError
	assert.ErrorAs(t, err, &wantErr, "missing provider.imap should be caught")
	assert.Equal(t, wantErr.Location, "provider.imap", "expected location provider.imap, but got %s", wantErr.Location)
}

func TestIMAPValidDefaultConfig(t *testing.T) {

	cases := []string{
		"imap://imap.example.com",
		"imaps://imap.example.com:993",
	}

	for _, c := range cases {
		data := fmt.Sprintf("[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nServer = %q\n", c)
		cfg, err := LoadConfigString(data)
		assert.NoError(t, err)
		opts, err := cfg.ToOptions()
		assert.NoError(t, err)
		_, ok := opts.Provider.(*imap.Options)
		assert.True(t, ok, "unexpected type for provider options")
	}
}

func TestProviderCaseInsensitive(t *testing.T) {
	data := "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider]\ntype = \"IMAP\"\n[provider.IMAP]\nserver = \"imaps://imap.example.com:993\"\n"
	cfg, err := LoadConfigString(data)
	assert.NoError(t, err)
	opts, err := cfg.ToOptions()
	assert.NoError(t, err)
	assert.Equal(t, "imap", opts.Provider.Type())
}

// Map iteration is randomised, so a fold match must never be picked from a set
// of several: the same config would otherwise bind a different [provider.*]
// section per start-up.
func TestProviderSectionLookupIsDeterministic(t *testing.T) {
	const base = `
[smtp]
server = "smtps://smtp.example.com:465"
[provider]
type = "imap"
`
	// Exact match wins over a differently-cased sibling, every time.
	both := base + `
[provider.imap]
server = "imaps://lower.example.com:993"
[provider.IMAP]
server = "imaps://UPPER.example.com:993"
`
	for i := 0; i < 200; i++ {
		cfg, err := LoadConfigString(both)
		require.NoError(t, err)
		opts, err := cfg.ToOptions()
		require.NoError(t, err)
		require.Equal(t, "lower.example.com:993", imapAddress(t, opts))
	}

	// A single fold match is still accepted.
	cfg, err := LoadConfigString(base + "\n[provider.IMAP]\nserver = \"imaps://only.example.com:993\"\n")
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	assert.Equal(t, "only.example.com:993", imapAddress(t, opts))

	// Several fold matches with no exact one are ambiguous and must be refused.
	_, err = LoadConfigString(base + "\n[provider.IMAP]\nserver = \"imaps://a.example.com:993\"\n[provider.Imap]\nserver = \"imaps://b.example.com:993\"\n")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "ambiguous")
}

func imapAddress(t *testing.T, o alps.Options) string {
	t.Helper()
	v := reflect.ValueOf(o.Provider).Elem().FieldByName("address")
	return v.String()
}
