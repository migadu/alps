package imap

import (
	"testing"
	"github.com/stretchr/testify/assert"
)


func TestIMAPConfig(t *testing.T) {

	// Test 1: Only domain name with scheme
	cfg := &Config{
		Server: "imaps://example.com",
	}
	opt, err := cfg.ToOptions()
	assert.NoError(t, err)
	imapOpt := opt.(*Options)
	assert.Equal(t, "example.com:993", imapOpt.address)

	// Test 2: Specific schemes
	cfg = &Config{
		Server: "imaps://imap.example.com:993",
	}
	opt, err = cfg.ToOptions()
	assert.NoError(t, err)
	imapOpt = opt.(*Options)
	assert.True(t, imapOpt.tls)
	assert.Equal(t, "imap.example.com:993", imapOpt.address)
}
