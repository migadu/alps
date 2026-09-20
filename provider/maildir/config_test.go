package maildir

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMaildirConfig(t *testing.T) {
	cfg := &Config{
		Path:           "/var/mail/%d/%u",
		AuthPasswdFile: "/etc/dovecot/users",
	}

	opt, err := cfg.ToOptions()
	require.NoError(t, err)
	assert.Equal(t, "maildir", opt.Type())

	maildirOpt, ok := opt.(*Options)
	require.True(t, ok)
	assert.Equal(t, "/var/mail/%d/%u", maildirOpt.Path)
	assert.Equal(t, "/etc/dovecot/users", maildirOpt.AuthPasswdFile)

	factory := maildirOpt.CreateFactory(5*time.Second, false)
	assert.NotNil(t, factory)
}

func TestMaildirConfigErrors(t *testing.T) {
	cfg := &Config{
		Path:           "/var/mail/%u",
		AuthPasswdFile: "",
	}

	_, err := cfg.ToOptions()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "auth_passwd_file cannot be empty")
}
