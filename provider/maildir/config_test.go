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

// Placeholders must be resolved in one pass. Substituting them one after
// another lets a local part containing a literal "%d" be rewritten by the
// following pass, mapping two distinct accounts onto a single maildir.
func TestExpandPathSinglePass(t *testing.T) {
	a, err := expandPath("/var/mail/%u", "bob%d@evil.com")
	require.NoError(t, err)
	b, err := expandPath("/var/mail/%u", "bobevil.com@other.com")
	require.NoError(t, err)

	assert.Equal(t, "/var/mail/bob%d", a)
	assert.Equal(t, "/var/mail/bobevil.com", b)
	assert.NotEqual(t, a, b, "distinct accounts must not share a maildir")
}

func TestExpandPathPlaceholders(t *testing.T) {
	got, err := expandPath("/srv/%d/%u/%n", "alice@example.com")
	require.NoError(t, err)
	assert.Equal(t, "/srv/example.com/alice/alice@example.com", got)

	// No domain part: %u is the whole username and %d is empty.
	got, err = expandPath("/srv/%u", "operator")
	require.NoError(t, err)
	assert.Equal(t, "/srv/operator", got)
}

func TestExpandPathRejectsTraversal(t *testing.T) {
	for _, username := range []string{"../root@example.com", "a/b@example.com", "..@example.com", `a\b@example.com`} {
		_, err := expandPath("/var/mail/%u", username)
		assert.Error(t, err, "username %q must be refused", username)
	}
}

func TestExpandPathRejectsEmptyLocalPart(t *testing.T) {
	for _, username := range []string{"@example.com", "", "@"} {
		_, err := expandPath("/var/mail/%u", username)
		assert.Error(t, err, "username %q with empty local part must be refused", username)
	}
}
