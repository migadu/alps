package imap

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestIMAPConfig(t *testing.T) {
	// Test 1: Only domain name with imaps scheme
	cfg := &Config{
		Server: "imaps://example.com",
	}
	opt, err := cfg.ToOptions()
	require.NoError(t, err)
	imapOpt, ok := opt.(*Options)
	require.True(t, ok)
	assert.True(t, imapOpt.tls)
	assert.False(t, imapOpt.Insecure)
	assert.Equal(t, "example.com:993", imapOpt.address)

	// Test 2: Standard imap with default port
	cfg = &Config{
		Server: "imap://mail.example.com",
	}
	opt, err = cfg.ToOptions()
	require.NoError(t, err)
	imapOpt = opt.(*Options)
	assert.False(t, imapOpt.tls)
	assert.False(t, imapOpt.Insecure)
	assert.Equal(t, "mail.example.com:143", imapOpt.address)

	// Test 3: Specific port and imap+insecure scheme
	cfg = &Config{
		Server: "imap+insecure://imap.example.com:1143",
	}
	opt, err = cfg.ToOptions()
	require.NoError(t, err)
	imapOpt = opt.(*Options)
	assert.False(t, imapOpt.tls)
	assert.True(t, imapOpt.Insecure)
	assert.Equal(t, "imap.example.com:1143", imapOpt.address)

	// Test 4: Factory creation with debug flag
	factory := imapOpt.CreateFactory(5*time.Second, true)
	assert.NotNil(t, factory)
}

func TestIMAPConfigErrors(t *testing.T) {
	tests := []struct {
		name      string
		server    string
		errSubstr string
	}{
		{
			name:      "empty server",
			server:    "",
			errSubstr: "requires a scheme",
		},
		{
			name:      "missing scheme",
			server:    "imap.example.com:993",
			errSubstr: "requires a scheme",
		},
		{
			name:      "unknown scheme",
			server:    "smtp://imap.example.com:993",
			errSubstr: "unknown scheme for IMAP server: smtp",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := &Config{Server: tt.server}
			_, err := cfg.ToOptions()
			assert.Error(t, err)
			assert.Contains(t, err.Error(), tt.errSubstr)
		})
	}
}

// Options built directly, rather than through Config.ToOptions, must still
// resolve a dial address instead of silently connecting to "".
func TestIMAPOptionsBuiltDirectly(t *testing.T) {
	opt := &Options{Config: &Config{Server: "imaps://direct.example.com"}}

	address, tls, insecure, err := opt.resolve()
	require.NoError(t, err)
	assert.Equal(t, "direct.example.com:993", address)
	assert.True(t, tls)
	assert.False(t, insecure)

	// A zero value has nothing to resolve and must surface an error from the
	// factory rather than dialing an empty address.
	_, err = (&Options{}).CreateFactory(time.Second, false)("user", "pass")
	assert.Error(t, err)
}
