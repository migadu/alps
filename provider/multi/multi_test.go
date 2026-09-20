package multi

import (
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps/provider"
	_ "github.com/migadu/alps/provider/imap"
	_ "github.com/migadu/alps/provider/maildir"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockAutodiscoverer struct {
	server *DiscoveredServer
	err    error
}

func (m *mockAutodiscoverer) Discover(ctx context.Context, domain string) (*DiscoveredServer, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.server, nil
}

func TestMultiConfig_DomainRoutingAndFallback(t *testing.T) {
	tmpDir := t.TempDir()
	passwdPath := filepath.Join(tmpDir, "passwd")
	content := "localuser@local.lan:{PLAIN}pass:1000:1000::" + filepath.Join(tmpDir, "localuser") + "::\n"
	require.NoError(t, os.WriteFile(passwdPath, []byte(content), 0644))

	tomlData := `
default_domain = "migadu.com"
template = "imaps://mail.%d:993"
template_domains = ["*"]

[domains."migadu.com"]
type = "imap"
server = "imaps://imap.migadu.com:993"

[domains."local.lan"]
type = "maildir"
auth_passwd_file = "` + passwdPath + `"

[default]
type = "imap"
server = "imaps://fallback.example.com:993"
`

	var prim toml.Primitive
	meta, err := toml.Decode(tomlData, &prim)
	require.NoError(t, err)

	cfg, err := provider.LoadConfig("multi", &meta, &prim)
	require.NoError(t, err)
	assert.Equal(t, "multi", cfg.Type())

	opts, err := cfg.ToOptions()
	require.NoError(t, err)

	multiOpts, ok := opts.(*Options)
	require.True(t, ok)
	assert.Equal(t, "migadu.com", multiOpts.DefaultDomain)
	assert.Equal(t, "imaps://mail.%d:993", multiOpts.Template)
	assert.NotNil(t, multiOpts.Default)
	assert.Len(t, multiOpts.Domains, 2)

	factory := opts.CreateFactory(5*time.Second, false)
	require.NotNil(t, factory)

	// Test 1: Maildir authentication for local.lan
	p, err := factory("localuser@local.lan", "pass")
	require.NoError(t, err)
	assert.NotNil(t, p)
	mboxes, err := p.ListMailboxes()
	require.NoError(t, err)
	assert.NotEmpty(t, mboxes)
	_ = p.Close()

	// Test 2: Invalid password on Maildir returns AuthError
	_, err = factory("localuser@local.lan", "wrongpass")
	require.Error(t, err)
	var authErr provider.AuthError
	assert.True(t, errors.As(err, &authErr))

	// Test 3: Unmapped domain without template or default would error, but with template it tries imaps://mail.other.com:993
	// which fails to connect to dial on test, producing connection error
	_, err = factory("user@other.com", "pass")
	require.Error(t, err)
}

func TestMultiConfig_GroupedRoutes(t *testing.T) {
	tomlData := `
[[routes]]
domains = ["domain1.com", "domain2.com"]
type = "imap"
server = "imaps://imap.shared.com:993"

[[routes]]
domains = ["domain3.org"]
type = "imap"
server = "imaps://imap.domain3.org:993"
`
	var prim toml.Primitive
	meta, err := toml.Decode(tomlData, &prim)
	require.NoError(t, err)

	cfg, err := provider.LoadConfig("multi", &meta, &prim)
	require.NoError(t, err)

	opts, err := cfg.ToOptions()
	require.NoError(t, err)

	multiOpts := opts.(*Options)
	assert.Len(t, multiOpts.Routes, 2)
	assert.Equal(t, []string{"domain1.com", "domain2.com"}, multiOpts.Routes[0].domains)
}

func TestMultiConfig_Autodiscover(t *testing.T) {
	mockDisc := &mockAutodiscoverer{
		server: &DiscoveredServer{
			Host: "discovered.example.com",
			Port: 993,
			TLS:  true,
		},
	}

	opts := &Options{
		Autodiscover:        true,
		AutodiscoverDomains: []string{"autodomain.com"},
		Autodiscoverer:      mockDisc,
	}

	factory := opts.CreateFactory(time.Second, false)

	// Connect will attempt to dial discovered.example.com:993 and fail with dial error (not unmapped domain error)
	_, err := factory("alice@autodomain.com", "password")
	require.Error(t, err)
	assert.NotContains(t, err.Error(), "no mail provider configured for domain")
}

func TestMultiConfig_UnmappedDomainReturnsAuthError(t *testing.T) {
	opts := &Options{
		Domains: map[string]provider.Options{
			"known.com": nil,
		},
	}

	factory := opts.CreateFactory(time.Second, false)

	// Bare username without default domain
	_, err := factory("bareuser", "pass")
	require.Error(t, err)
	var authErr provider.AuthError
	assert.True(t, errors.As(err, &authErr))
	assert.Contains(t, err.Error(), "missing domain and no default provider")

	// Unknown domain without template, autodiscovery or default
	_, err = factory("user@unknown.com", "pass")
	require.Error(t, err)
	assert.True(t, errors.As(err, &authErr))
	assert.Contains(t, err.Error(), "no mail provider configured for domain \"unknown.com\"")
}

func TestMultiConfig_Errors(t *testing.T) {
	// 1. Empty config
	empty := `default_domain = "migadu.com"`
	var prim toml.Primitive
	meta, err := toml.Decode(empty, &prim)
	require.NoError(t, err)
	cfg, err := provider.LoadConfig("multi", &meta, &prim)
	require.NoError(t, err)
	_, err = cfg.ToOptions()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "no domains, routes, template, autodiscover, or default provider")

	// 2. Empty domain key
	emptyDomain := `
[domains.""]
type = "imap"
server = "imaps://imap.example.com:993"
`
	meta, err = toml.Decode(emptyDomain, &prim)
	require.NoError(t, err)
	cfg, err = provider.LoadConfig("multi", &meta, &prim)
	require.NoError(t, err)
	_, err = cfg.ToOptions()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "domain key cannot be empty")

	// 3. Route with no domains
	noDomainsRoute := `
[[routes]]
type = "imap"
server = "imaps://imap.example.com:993"
`
	meta, err = toml.Decode(noDomainsRoute, &prim)
	require.NoError(t, err)
	cfg, err = provider.LoadConfig("multi", &meta, &prim)
	require.NoError(t, err)
	_, err = cfg.ToOptions()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "has no domains")
}

func TestDNSAutodiscoverer_BoundedCache(t *testing.T) {
	// Create autodiscoverer with capacity 3
	disc := NewDNSAutodiscovererWithCapacity(10*time.Minute, 30*time.Second, 3)
	ctx := context.Background()

	// Discover 10 different domains that fail lookup (which caches the error result)
	for i := 0; i < 10; i++ {
		_, _ = disc.Discover(ctx, fmt.Sprintf("domain%d.invalid", i))
	}

	// Cache size must never exceed 3
	assert.LessOrEqual(t, disc.CacheSize(), 3)
}

func TestDNSAutodiscoverer_EmptyDomain(t *testing.T) {
	disc := NewDNSAutodiscoverer(time.Minute)
	_, err := disc.Discover(context.Background(), "   ")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "domain cannot be empty")
}

func TestMultiConfig_DomainValidationAndInjection(t *testing.T) {
	opts := &Options{
		Template:        "imaps://mail.%d:993",
		TemplateDomains: []string{"*"},
	}
	factory := opts.CreateFactory(time.Second, false)

	maliciousUsernames := []string{
		"user@evil.com:999/path",
		"user@evil..com",
		"user@evil.com@other.com",
		"user@evil com",
		"user@evil\ncom",
		"user@-evil.com",
		"user@evil.com-",
	}

	for _, username := range maliciousUsernames {
		_, err := factory(username, "pass")
		require.Error(t, err, "malicious username %q should fail", username)
		var authErr provider.AuthError
		assert.True(t, errors.As(err, &authErr), "should return AuthError for %q", username)
	}
}

func TestMultiConfig_MultipleAtSymbols(t *testing.T) {
	opts := &Options{
		Domains: map[string]provider.Options{
			"target.com": &provider.MockOptions{},
		},
	}
	factory := opts.CreateFactory(time.Second, false)

	// Quoted local-part with multiple @ is valid RFC syntax and routes to "target.com"
	p, err := factory("\"foo@bar\"@target.com", "pass")
	require.NoError(t, err)
	assert.NotNil(t, p)

	// Unquoted multiple @ is malformed and returns AuthError
	_, err = factory("foo@bar@target.com", "pass")
	require.Error(t, err)
	var authErr provider.AuthError
	assert.True(t, errors.As(err, &authErr))
	assert.Contains(t, err.Error(), "multiple unquoted '@' symbols")
}

func TestMultiConfig_DynamicFactoryBounded(t *testing.T) {
	opts := &Options{
		// Use an external IP target to avoid external network DNS lookups in unit tests
		Template:        "imaps://198.51.100.1:993",
		TemplateDomains: []string{"*"},
	}
	factory := opts.CreateFactory(10*time.Millisecond, false)

	// Call factory with 50 different valid domains
	for i := 0; i < 50; i++ {
		_, _ = factory(fmt.Sprintf("user@domain%d.com", i), "pass")
	}
}

func TestMultiConfig_Concurrency(t *testing.T) {
	opts := &Options{
		DefaultDomain: "default.lan",
		Domains: map[string]provider.Options{
			"default.lan": nil,
			"mapped.com":  nil,
		},
		Template:        "imaps://mail.%d:993",
		TemplateDomains: []string{"*"},
	}
	factory := opts.CreateFactory(100*time.Millisecond, false)

	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			switch id % 3 {
			case 0:
				_, _ = factory("user@mapped.com", "pass")
			case 1:
				_, _ = factory("user", "pass") // default domain
			case 2:
				_, _ = factory("user@test.org", "pass") // template
			}
		}(i)
	}
	wg.Wait()
}

func TestMultiConfig_NilSafety(t *testing.T) {
	// 1. Nil options
	var nilOpts *Options
	f := nilOpts.CreateFactory(time.Second, false)
	_, err := f("user@domain.com", "pass")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "has no configuration")

	// 2. Empty options
	emptyOpts := &Options{}
	f2 := emptyOpts.CreateFactory(time.Second, false)
	_, err = f2("user@domain.com", "pass")
	require.Error(t, err)
	var authErr provider.AuthError
	assert.True(t, errors.As(err, &authErr))
}

func TestDiscoveredServer_ServerURL(t *testing.T) {
	s1 := &DiscoveredServer{Host: "mail.example.com", Port: 993, TLS: true}
	assert.Equal(t, "imaps://mail.example.com:993", s1.ServerURL())

	s2 := &DiscoveredServer{Host: "mail.example.com", Port: 143, TLS: false}
	assert.Equal(t, "imap://mail.example.com:143", s2.ServerURL())
}

type slowAutodiscoverer struct{}

func (s *slowAutodiscoverer) Discover(ctx context.Context, domain string) (*DiscoveredServer, error) {
	select {
	case <-time.After(500 * time.Millisecond):
		return &DiscoveredServer{Host: "slow.example.com", Port: 993, TLS: true}, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func TestMultiConfig_AutodiscoverTimeoutRespected(t *testing.T) {
	opts := &Options{
		Autodiscover:        true,
		AutodiscoverDomains: []string{"slowdomain.com"},
		Autodiscoverer:      &slowAutodiscoverer{},
	}
	// Configure short timeout of 50ms
	factory := opts.CreateFactory(50*time.Millisecond, false)

	start := time.Now()
	_, err := factory("user@slowdomain.com", "pass")
	elapsed := time.Since(start)

	require.Error(t, err)
	assert.Less(t, elapsed, 400*time.Millisecond, "autodiscovery should cancel before slow provider finishes")
}

func TestMultiConfig_AutodiscoverSSRFBlocked(t *testing.T) {
	// 1. Target resolving to restricted loopback address
	mockDisc := &mockAutodiscoverer{
		server: &DiscoveredServer{
			Host: "127.0.0.1",
			Port: 993,
			TLS:  true,
		},
	}
	opts := &Options{
		Autodiscover:        true,
		AutodiscoverDomains: []string{"victim.com"},
		Autodiscoverer:      mockDisc,
	}
	factory := opts.CreateFactory(time.Second, false)
	_, err := factory("user@victim.com", "pass")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "restricted")

	// 2. Domain not in AutodiscoverDomains allowlist
	optsNoAllowlist := &Options{
		Autodiscover:   true,
		Autodiscoverer: mockDisc,
	}
	f2 := optsNoAllowlist.CreateFactory(time.Second, false)
	_, err = f2("user@unlisted.com", "pass")
	require.Error(t, err)
	var authErr provider.AuthError
	assert.True(t, errors.As(err, &authErr))
	assert.Contains(t, err.Error(), "no mail provider configured for domain")
}

func TestMultiConfig_TemplateSSRFBlocked(t *testing.T) {
	// 1. Injection via %u containing invalid characters (colons, slashes, ports)
	opts := &Options{
		Template:        "imaps://%u.internal.example:993",
		TemplateDomains: []string{"*"},
	}
	factory := opts.CreateFactory(time.Second, false)
	_, err := factory("127.0.0.1:PORT#@corp.com", "pass")
	require.Error(t, err)
	var authErr provider.AuthError
	assert.True(t, errors.As(err, &authErr))
	assert.Contains(t, err.Error(), "invalid username local-part")

	// 2. Direct template target to restricted address
	optsLoopback := &Options{
		Template:        "imaps://127.0.0.1:993",
		TemplateDomains: []string{"*"},
	}
	fLoop := optsLoopback.CreateFactory(time.Second, false)
	_, err = fLoop("user@example.com", "pass")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "restricted")
}

func TestMultiConfig_RoutingDoesNotFailOpen(t *testing.T) {
	mockDefault := &provider.MockOptions{}
	opts := &Options{
		Template:        "imaps://unreachable.invalid.domain:993",
		TemplateDomains: []string{"*"},
		Default:         mockDefault,
	}
	factory := opts.CreateFactory(100*time.Millisecond, false)

	// User matches template; connection will fail to resolve/dial
	// It MUST NOT fall through to the default provider!
	p, err := factory("user@corp.com", "pass")
	require.Error(t, err)
	assert.Nil(t, p)
	assert.NotContains(t, err.Error(), "mock", "should not fall open to default provider")
}

func TestMultiConfig_RFC1035DomainValidation(t *testing.T) {
	invalidDomains := []string{
		"a.-b.com",                       // label starts with hyphen
		"a.b-.com",                       // label ends with hyphen
		strings.Repeat("a", 64) + ".com", // label exceeds 63 characters
		"example..com",                   // empty label
	}

	for _, d := range invalidDomains {
		assert.False(t, isValidDomain(d), "domain %q should be invalid under RFC 1035/1123", d)
	}

	validDomains := []string{
		"example.com",
		"sub.domain.example.com",
		"a-b.com",
		"mail-123.migadu.com",
	}

	for _, d := range validDomains {
		assert.True(t, isValidDomain(d), "domain %q should be valid", d)
	}
}

func TestMultiConfig_ToOptionsNilSafety(t *testing.T) {
	// 1. Direct Config without c.meta when using Template
	cfg := &Config{
		Template: "imaps://mail.%d:993",
	}
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	assert.NotNil(t, opts)

	// 2. Direct Config with Domains but c.meta == nil returns clean error without panic
	var dummyPrim toml.Primitive
	cfgWithDomains := &Config{
		Domains: map[string]toml.Primitive{
			"example.com": dummyPrim,
		},
	}
	_, err = cfgWithDomains.ToOptions()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "configuration metadata is missing")

	// 3. Nil Config
	var nilCfg *Config
	_, err = nilCfg.ToOptions()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "configuration is nil")
}

func TestDNSAutodiscoverer_NegativeCacheTTL(t *testing.T) {
	// Positive TTL = 10m, Negative TTL = 50ms
	disc := NewDNSAutodiscovererWithCapacity(10*time.Minute, 50*time.Millisecond, 10)
	ctx := context.Background()

	// Query failing domain
	_, err := disc.Discover(ctx, "nonexistent.invalid")
	require.Error(t, err)
	assert.Equal(t, 1, disc.CacheSize())

	// Wait for negative TTL to expire
	time.Sleep(60 * time.Millisecond)

	// Second query should detect expiration and re-attempt
	disc.mu.Lock()
	entry := disc.cache["nonexistent.invalid"]
	disc.mu.Unlock()
	assert.True(t, time.Now().After(entry.expiry), "negative entry should expire within negative TTL")
}

func TestDNSAutodiscoverer_DeterministicOldestEviction(t *testing.T) {
	// Capacity 2
	disc := NewDNSAutodiscovererWithCapacity(10*time.Minute, 10*time.Minute, 2)
	disc.Resolver = &net.Resolver{
		PreferGo: true,
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			return nil, fmt.Errorf("mock dns offline")
		},
	}
	now := time.Now()

	disc.mu.Lock()
	disc.cache["domain1.com"] = cacheEntry{expiry: now.Add(1 * time.Minute)} // oldest expiry
	disc.cache["domain2.com"] = cacheEntry{expiry: now.Add(5 * time.Minute)} // newer expiry
	disc.mu.Unlock()

	// Add 3rd entry
	_, _ = disc.Discover(context.Background(), "domain3.com")

	disc.mu.Lock()
	defer disc.mu.Unlock()
	// domain1.com must be evicted because it had the earliest expiry
	_, hasDomain1 := disc.cache["domain1.com"]
	_, hasDomain2 := disc.cache["domain2.com"]
	assert.False(t, hasDomain1, "oldest entry domain1.com must be evicted")
	assert.True(t, hasDomain2, "newer entry domain2.com must be kept")
}

// Concurrent logins for one dynamic target must collapse onto a single cached
// factory: the lookup now runs outside the cache lock, so two callers can be
// in flight at once and the second must not lose its entry. IP literals keep
// this free of DNS, which no wall-clock assertion could depend on reliably.
func TestMultiConfig_DynamicFactoryCachingIsRaceSafe(t *testing.T) {
	opts := &Options{Template: "imaps://%d:993", TemplateDomains: []string{"*"}}
	factory := opts.CreateFactory(50*time.Millisecond, false)

	var wg sync.WaitGroup
	for i := 0; i < 32; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			// Two distinct public targets, hit concurrently and repeatedly.
			_, _ = factory(fmt.Sprintf("user@198.51.100.%d", 1+i%2), "pw")
		}(i)
	}
	wg.Wait()
}

// A template names servers from user input, so it must apply only to
// allowlisted domains. A domain outside the list is not an error: the rule does
// not match and routing continues to the default provider.
func TestMultiConfig_TemplateRequiresAllowlist(t *testing.T) {
	mockDefault := &provider.MockOptions{}
	opts := &Options{
		Template:        "imaps://mail.%d:993",
		TemplateDomains: []string{"allowed.example"},
		Default:         mockDefault,
	}
	factory := opts.CreateFactory(time.Second, false)

	// Not allowlisted: falls through to the default provider.
	p, err := factory("user@other.example", "pass")
	require.NoError(t, err)
	assert.NotNil(t, p)

	// With no default configured, an unlisted domain is refused outright.
	bare := (&Options{Template: "imaps://mail.%d:993"}).CreateFactory(time.Second, false)
	_, err = bare("user@other.example", "pass")
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no mail provider configured")
}

func TestIsValidLocalPart(t *testing.T) {
	// RFC 5321 atext is wider than [A-Za-z0-9._+-].
	for _, ok := range []string{"o'brien", "a!$&*=^_`{|}~b", "plain.user+tag", "a=b"} {
		assert.True(t, isValidLocalPart(ok), "%q should be accepted", ok)
	}
	// Anything that could re-point the URL, plus control characters.
	// "/" and "?" are RFC-legal in a local part but would re-point the URL.
	for _, bad := range []string{"a:b", "a/b", "a?c", "a#b", "a@b", "a[b]", "a%2f", "a b", "a\nb", ""} {
		assert.False(t, isValidLocalPart(bad), "%q should be refused", bad)
	}
}

func TestMultiConfig_ServiceRouting(t *testing.T) {
	opts := &Options{
		DefaultDomain: "fallback.example",
		Domains: map[string]provider.Options{
			"open.email":     nil,
			"nosmtp.example": nil,
		},
		DomainServices: map[string]services{
			"open.email": {urls: map[string]string{
				provider.ServiceSMTP:        "smtps://smtp.open.email:465",
				provider.ServiceCardDAV:     "https://dav.open.email",
				provider.ServiceManageSieve: "managesieves://mail.open.email:4190",
			}},
			"nosmtp.example": {},
		},
		Routes: []routeEntry{
			{domains: []string{"r1.example", "r2.example"}, services: services{
				urls: map[string]string{provider.ServiceSMTP: "smtps://shared.example:465"},
			}},
		},
		DefaultServices: services{urls: map[string]string{
			provider.ServiceSMTP:   "smtps://smtp.default.example:465",
			provider.ServiceCalDAV: "https://dav.default.example",
		}},
	}

	// A backend's own endpoints win, for every service it names.
	assert.Equal(t, "smtps://smtp.open.email:465", opts.ServiceURL(provider.ServiceSMTP, "me@open.email"))
	assert.Equal(t, "https://dav.open.email", opts.ServiceURL(provider.ServiceCardDAV, "me@open.email"))
	assert.Equal(t, "managesieves://mail.open.email:4190", opts.ServiceURL(provider.ServiceManageSieve, "me@open.email"))
	// Case and spacing in the login must not change the answer.
	assert.Equal(t, "https://dav.open.email", opts.ServiceURL(provider.ServiceCardDAV, "Me@OPEN.Email"))

	// A service that backend does not name defers to the global config, and
	// must not borrow the default backend's.
	assert.Equal(t, "", opts.ServiceURL(provider.ServiceCalDAV, "me@open.email"))
	assert.Equal(t, "", opts.ServiceURL(provider.ServiceSMTP, "me@nosmtp.example"))

	// Grouped routes answer for every domain they cover.
	assert.Equal(t, "smtps://shared.example:465", opts.ServiceURL(provider.ServiceSMTP, "me@r1.example"))
	assert.Equal(t, "smtps://shared.example:465", opts.ServiceURL(provider.ServiceSMTP, "me@r2.example"))

	// Anything unmatched lands on the default backend.
	assert.Equal(t, "smtps://smtp.default.example:465", opts.ServiceURL(provider.ServiceSMTP, "me@unknown.example"))
	assert.Equal(t, "https://dav.default.example", opts.ServiceURL(provider.ServiceCalDAV, "me@unknown.example"))

	// A bare login takes DefaultDomain; a malformed one must not pick a server
	// from a domain it never proved.
	assert.Equal(t, "smtps://smtp.default.example:465", opts.ServiceURL(provider.ServiceSMTP, "bare"))
	assert.Equal(t, "smtps://smtp.default.example:465", opts.ServiceURL(provider.ServiceSMTP, "a@b@c"))

	// Nil receiver defers rather than panicking.
	var nilOpts *Options
	assert.Equal(t, "", nilOpts.ServiceURL(provider.ServiceSMTP, "me@open.email"))
	assert.Nil(t, nilOpts.ServiceOptions(provider.ServicePassword, "me@open.email"))
}

func TestMultiConfig_ServiceOptionsRouting(t *testing.T) {
	openBlock := map[string]interface{}{"endpoint": "https://admin.open.email/api", "username": "a"}
	opts := &Options{
		Domains:         map[string]provider.Options{"open.email": nil, "plain.example": nil},
		DomainServices:  map[string]services{"open.email": {password: openBlock}, "plain.example": {}},
		DefaultServices: services{password: map[string]interface{}{"endpoint": "https://admin.default.example/api"}},
	}

	assert.Equal(t, openBlock, opts.ServiceOptions(provider.ServicePassword, "me@open.email"))
	// Named by a backend that carries no block: defer to the global one.
	assert.Nil(t, opts.ServiceOptions(provider.ServicePassword, "me@plain.example"))
	// Unmatched falls to the default backend's block.
	assert.Equal(t, "https://admin.default.example/api",
		opts.ServiceOptions(provider.ServicePassword, "me@unknown.example")["endpoint"])
	// Only the password service is configured by a block.
	assert.Nil(t, opts.ServiceOptions(provider.ServiceSMTP, "me@open.email"))
}

// The provider must satisfy the interface the server uses to route backends.
func TestMultiOptionsImplementsServiceRouter(t *testing.T) {
	var _ provider.ServiceRouter = (*Options)(nil)
}
