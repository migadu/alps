package main

import (
	"fmt"
	"testing"
	"github.com/migadu/alps/provider/imap"

	"github.com/stretchr/testify/assert"
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
