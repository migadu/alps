package main

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/imap"
	"github.com/migadu/alps/provider/multi"
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

func TestMultiProviderConfig(t *testing.T) {
	data := `
[smtp]
server = "smtps://smtp.example.com:465"

[provider]
type = "multi"

[provider.multi]
default_domain = "migadu.com"
template = "imaps://mail.%d:993"

[provider.multi.domains."migadu.com"]
type = "imap"
server = "imaps://imap.migadu.com:993"
`
	cfg, err := LoadConfigString(data)
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	multiOpts, ok := opts.Provider.(*multi.Options)
	require.True(t, ok)
	assert.Equal(t, "multi", multiOpts.Type())
	assert.Equal(t, "migadu.com", multiOpts.DefaultDomain)
	assert.Contains(t, multiOpts.Domains, "migadu.com")
}

// The per-domain smtp key must survive TOML loading and reach the router the
// server consults when sending.
func TestMultiProviderSMTPRouting(t *testing.T) {
	data := `
[smtp]
server = "smtps://smtp.global.example:465"

[provider]
type = "multi"

[provider.multi]

[provider.multi.domains."open.email"]
type = "imap"
server = "imaps://mail.open.email:993"
smtp = "smtps://mail.open.email:465"

[provider.multi.default]
type = "imap"
server = "imaps://imap.migadu.com:993"
smtp = "smtps://smtp.migadu.com:465"
`
	cfg, err := LoadConfigString(data)
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)

	router, ok := opts.Provider.(provider.ServiceRouter)
	require.True(t, ok, "multi provider must route backends")

	assert.Equal(t, "smtps://mail.open.email:465", router.ServiceURL(provider.ServiceSMTP, "me@open.email"))
	assert.Equal(t, "smtps://smtp.migadu.com:465", router.ServiceURL(provider.ServiceSMTP, "me@elsewhere.example"))
	// The global [smtp] remains configured as the last resort.
	assert.Equal(t, "smtps://smtp.global.example:465", opts.SMTP.Server)
}

// Every backend a login touches must follow the domain that chose its mail
// store, and survive TOML loading to get there.
func TestMultiProviderRoutesAllServices(t *testing.T) {
	data := `
[smtp]
server = "smtps://smtp.global.example:465"

[provider]
type = "multi"

[provider.multi]

[[provider.multi.routes]]
domains = ["open.email", "strb.ac"]
type = "imap"
server = "imaps://mail.open.email:993"
smtp = "smtps://smtp.open.email:465"
carddav = "https://dav.open.email"
caldav = "https://dav.open.email"
managesieve = "managesieves://mail.open.email:4190"

[provider.multi.routes.password]
endpoint = "https://admin.open.email/api/webmail/mailboxes"
auth_type = "basic"
username = "oe-user"

[[provider.multi.routes]]
domains = ["migadu.com"]
type = "imap"
server = "imaps://imap.migadu.com:993"
smtp = "smtps://smtp.migadu.com:465"
carddav = "https://cdav.migadu.net"
`
	cfg, err := LoadConfigString(data)
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	r := opts.Provider.(provider.ServiceRouter)

	// Both domains on the first route reach the same backends.
	for _, u := range []string{"me@open.email", "me@strb.ac"} {
		assert.Equal(t, "smtps://smtp.open.email:465", r.ServiceURL(provider.ServiceSMTP, u))
		assert.Equal(t, "https://dav.open.email", r.ServiceURL(provider.ServiceCardDAV, u))
		assert.Equal(t, "https://dav.open.email", r.ServiceURL(provider.ServiceCalDAV, u))
		assert.Equal(t, "managesieves://mail.open.email:4190", r.ServiceURL(provider.ServiceManageSieve, u))
		assert.Equal(t, "https://admin.open.email/api/webmail/mailboxes",
			r.ServiceOptions(provider.ServicePassword, u)["endpoint"])
	}

	// The second route names no caldav, managesieve or password block, so each
	// of those defers to the global plugin configuration rather than borrowing
	// the other route's.
	assert.Equal(t, "https://cdav.migadu.net", r.ServiceURL(provider.ServiceCardDAV, "me@migadu.com"))
	assert.Equal(t, "", r.ServiceURL(provider.ServiceCalDAV, "me@migadu.com"))
	assert.Equal(t, "", r.ServiceURL(provider.ServiceManageSieve, "me@migadu.com"))
	assert.Nil(t, r.ServiceOptions(provider.ServicePassword, "me@migadu.com"))
}
