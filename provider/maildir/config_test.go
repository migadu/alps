package maildir

import (
	"errors"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
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

	// Nil config factory guard
	nilOpts := &Options{}
	nilFactory := nilOpts.CreateFactory(5*time.Second, false)
	_, err = nilFactory("user", "pass")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "auth_passwd_file is not configured")

	// Non-existent auth passwd file should return filesystem error, NOT provider.AuthError
	badFileOpts := &Options{
		Config: &Config{
			AuthPasswdFile: "/non/existent/passwd/file/alps",
		},
	}
	badFactory := badFileOpts.CreateFactory(5*time.Second, false)
	_, err = badFactory("user", "pass")
	assert.Error(t, err)
	var authErr provider.AuthError
	assert.False(t, errors.As(err, &authErr), "missing file error must not be masked as AuthError")
}
