package multi

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/imap"
)

// Config represents the TOML configuration for the multi-provider router.
type Config struct {
	DefaultDomain       string                    `toml:"default_domain"`
	Template            string                    `toml:"template"`
	Autodiscover        bool                      `toml:"autodiscover"`
	AutodiscoverDomains []string                  `toml:"autodiscover_domains"`
	TemplateDomains     []string                  `toml:"template_domains"`
	Default             *toml.Primitive           `toml:"default"`
	Domains             map[string]toml.Primitive `toml:"domains"`
	Routes              []toml.Primitive          `toml:"routes"`

	meta *toml.MetaData
}

func (c *Config) Type() string {
	return "multi"
}

type routeEntry struct {
	domains []string
	options provider.Options
}

// Options implements provider.Options for the multi-provider router.
type Options struct {
	DefaultDomain       string
	Template            string
	Autodiscover        bool
	AutodiscoverDomains []string
	TemplateDomains     []string
	Autodiscoverer      Autodiscoverer
	Default             provider.Options
	Domains             map[string]provider.Options
	Routes              []routeEntry
}

func (o *Options) Type() string {
	return "multi"
}

func (c *Config) ToOptions() (provider.Options, error) {
	if c == nil {
		return nil, fmt.Errorf("multi: configuration is nil")
	}

	domains := make(map[string]provider.Options)
	if len(c.Domains) > 0 {
		if c.meta == nil {
			return nil, fmt.Errorf("multi: configuration metadata is missing (must load via provider.LoadConfig)")
		}
		for domain, prim := range c.Domains {
			domainClean := strings.ToLower(strings.TrimSpace(domain))
			if domainClean == "" {
				return nil, fmt.Errorf("multi: domain key cannot be empty")
			}

			var probe struct {
				Type string `toml:"type"`
			}
			_ = c.meta.PrimitiveDecode(prim, &probe)
			subType := strings.ToLower(strings.TrimSpace(probe.Type))
			if subType == "" {
				subType = "imap"
			}

			subCfg, err := provider.LoadConfig(subType, c.meta, &prim)
			if err != nil {
				return nil, fmt.Errorf("multi: failed to load provider config for domain %q: %w", domain, err)
			}

			subOpt, err := subCfg.ToOptions()
			if err != nil {
				return nil, fmt.Errorf("multi: failed to initialize provider options for domain %q: %w", domain, err)
			}
			domains[domainClean] = subOpt
		}
	}

	var routes []routeEntry
	if len(c.Routes) > 0 {
		if c.meta == nil {
			return nil, fmt.Errorf("multi: configuration metadata is missing (must load via provider.LoadConfig)")
		}
		for i, prim := range c.Routes {
			var probe struct {
				Domains []string `toml:"domains"`
				Type    string   `toml:"type"`
			}
			if err := c.meta.PrimitiveDecode(prim, &probe); err != nil {
				return nil, fmt.Errorf("multi: invalid route at index %d: %w", i, err)
			}
			if len(probe.Domains) == 0 {
				return nil, fmt.Errorf("multi: route at index %d has no domains", i)
			}

			subType := strings.ToLower(strings.TrimSpace(probe.Type))
			if subType == "" {
				subType = "imap"
			}

			subCfg, err := provider.LoadConfig(subType, c.meta, &prim)
			if err != nil {
				return nil, fmt.Errorf("multi: route [%d] failed to load provider: %w", i, err)
			}

			subOpt, err := subCfg.ToOptions()
			if err != nil {
				return nil, fmt.Errorf("multi: route [%d] failed to initialize provider options: %w", i, err)
			}

			var cleanedDomains []string
			for _, d := range probe.Domains {
				d = strings.ToLower(strings.TrimSpace(d))
				if d != "" {
					cleanedDomains = append(cleanedDomains, d)
				}
			}

			routes = append(routes, routeEntry{
				domains: cleanedDomains,
				options: subOpt,
			})
		}
	}

	var defaultOpt provider.Options
	if c.Default != nil {
		if c.meta == nil {
			return nil, fmt.Errorf("multi: configuration metadata is missing (must load via provider.LoadConfig)")
		}
		var probe struct {
			Type string `toml:"type"`
		}
		_ = c.meta.PrimitiveDecode(*c.Default, &probe)
		subType := strings.ToLower(strings.TrimSpace(probe.Type))
		if subType == "" {
			subType = "imap"
		}

		subCfg, err := provider.LoadConfig(subType, c.meta, c.Default)
		if err != nil {
			return nil, fmt.Errorf("multi: failed to load default provider config: %w", err)
		}

		var errOpt error
		defaultOpt, errOpt = subCfg.ToOptions()
		if errOpt != nil {
			return nil, fmt.Errorf("multi: failed to initialize default provider options: %w", errOpt)
		}
	}

	autodiscDomains := cleanDomainList(c.AutodiscoverDomains)
	templateDomains := cleanDomainList(c.TemplateDomains)

	if len(domains) == 0 && len(routes) == 0 && defaultOpt == nil && c.Template == "" && !c.Autodiscover {
		return nil, fmt.Errorf("multi: no domains, routes, template, autodiscover, or default provider configured")
	}

	return &Options{
		DefaultDomain:       strings.ToLower(strings.TrimSpace(c.DefaultDomain)),
		Template:            c.Template,
		Autodiscover:        c.Autodiscover,
		AutodiscoverDomains: autodiscDomains,
		TemplateDomains:     templateDomains,
		Default:             defaultOpt,
		Domains:             domains,
		Routes:              routes,
	}, nil
}

func (o *Options) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	if o == nil {
		return func(username, password string) (provider.MailProvider, error) {
			return nil, fmt.Errorf("multi provider has no configuration")
		}
	}

	domainFactories := make(map[string]provider.AuthenticatedProviderFactory)
	for d, opt := range o.Domains {
		if opt != nil {
			domainFactories[d] = opt.CreateFactory(timeout, debug)
		}
	}

	type routeFactory struct {
		domains []string
		factory provider.AuthenticatedProviderFactory
	}
	var routeFactories []routeFactory
	for _, r := range o.Routes {
		if r.options != nil {
			routeFactories = append(routeFactories, routeFactory{
				domains: r.domains,
				factory: r.options.CreateFactory(timeout, debug),
			})
		}
	}

	var defaultFactory provider.AuthenticatedProviderFactory
	if o.Default != nil {
		defaultFactory = o.Default.CreateFactory(timeout, debug)
	}

	// One bound for every network step a login may take: the SRV lookup, the
	// restricted-host lookup and the dial.
	netTimeout := 5 * time.Second
	if timeout > 0 && timeout < netTimeout {
		netTimeout = timeout
	}

	restrictedIPGuard := func(ip net.IP) error {
		if isRestrictedIP(ip) {
			return fmt.Errorf("target address %s is restricted", ip)
		}
		return nil
	}

	type dynEntry struct {
		factory provider.AuthenticatedProviderFactory
		created time.Time
	}
	const maxDynamicFactories = 1024
	var dynMu sync.Mutex
	dynFactories := make(map[string]dynEntry)
	getDynamicFactory := func(ctx context.Context, serverURL string) (provider.AuthenticatedProviderFactory, error) {
		dynMu.Lock()
		entry, ok := dynFactories[serverURL]
		dynMu.Unlock()
		if ok {
			return entry.factory, nil
		}

		// Everything below resolves DNS, so it runs outside dynMu: holding the
		// lock across a lookup serialises every dynamic login behind the
		// slowest nameserver.
		u, err := url.Parse(serverURL)
		if err != nil {
			return nil, fmt.Errorf("failed to parse dynamic server URL: %w", err)
		}
		host := u.Hostname()
		if err := checkRestrictedHost(ctx, nil, host); err != nil {
			return nil, fmt.Errorf("access to restricted server address %q is forbidden: %w", host, err)
		}

		// checkRestrictedHost validates the name we resolved just now; the dial
		// resolves again, so the guard re-checks the address actually reached.
		cfg := &imap.Config{Server: serverURL, TargetGuard: restrictedIPGuard}
		imapOpts, err := cfg.ToOptions()
		if err != nil {
			return nil, err
		}
		f := imapOpts.CreateFactory(timeout, debug)

		dynMu.Lock()
		defer dynMu.Unlock()
		// Another login may have built the same one while we were resolving.
		if entry, ok := dynFactories[serverURL]; ok {
			return entry.factory, nil
		}
		if len(dynFactories) >= maxDynamicFactories {
			var oldestKey string
			var oldestTime time.Time
			first := true
			for k, v := range dynFactories {
				if first || v.created.Before(oldestTime) {
					oldestKey = k
					oldestTime = v.created
					first = false
				}
			}
			if !first {
				delete(dynFactories, oldestKey)
			}
		}
		dynFactories[serverURL] = dynEntry{factory: f, created: time.Now()}
		return f, nil
	}

	autodiscoverer := o.Autodiscoverer
	if autodiscoverer == nil && o.Autodiscover {
		autodiscoverer = NewDNSAutodiscoverer(15 * time.Minute)
	}

	return func(username, password string) (provider.MailProvider, error) {
		user, domain := username, ""
		atCount := strings.Count(username, "@")
		if atCount == 1 {
			parts := strings.Split(username, "@")
			user, domain = parts[0], parts[1]
		} else if atCount > 1 {
			if strings.HasPrefix(username, "\"") {
				idx := strings.LastIndex(username, "@")
				user, domain = username[:idx], username[idx+1:]
			} else {
				return nil, provider.AuthError{Cause: fmt.Errorf("malformed username %q: multiple unquoted '@' symbols", username)}
			}
		}
		domain = strings.ToLower(strings.TrimSpace(domain))

		if domain == "" && o.DefaultDomain != "" {
			domain = strings.ToLower(strings.TrimSpace(o.DefaultDomain))
		}

		// 1. Explicit domain map
		if domain != "" {
			if f, ok := domainFactories[domain]; ok {
				return f(username, password)
			}
		}

		// 2. Grouped routes
		if domain != "" {
			for _, rf := range routeFactories {
				for _, d := range rf.domains {
					if d == domain {
						return rf.factory(username, password)
					}
				}
			}
		}

		// 3. URL template (%d -> domain, %u -> user, %n -> username)
		// The template reaches servers named by the login, so it applies only
		// to domains the administrator allowlisted. A domain outside the list
		// is not a failure: the rule simply does not match, and routing
		// continues to autodiscover and the default provider.
		if domain != "" && o.Template != "" && domainAllowed(o.TemplateDomains, domain) {
			if !isValidDomain(domain) {
				return nil, provider.AuthError{Cause: fmt.Errorf("invalid domain %q for template routing", domain)}
			}
			if strings.Contains(o.Template, "%u") || strings.Contains(o.Template, "%n") {
				if !isValidLocalPart(user) {
					return nil, provider.AuthError{Cause: fmt.Errorf("invalid username local-part %q for template routing", user)}
				}
			}
			replacer := strings.NewReplacer("%d", domain, "%u", user, "%n", username)
			serverURL := replacer.Replace(o.Template)

			ctx, cancel := context.WithTimeout(context.Background(), netTimeout)
			f, err := getDynamicFactory(ctx, serverURL)
			cancel()
			if err != nil {
				return nil, err
			}
			return f(username, password)
		}

		// 4. RFC 6186 DNS autodiscover
		if domain != "" && autodiscoverer != nil {
			if !isValidDomain(domain) {
				return nil, provider.AuthError{Cause: fmt.Errorf("invalid domain %q for autodiscovery", domain)}
			}

			// Autodiscover requires an explicit allowlist to prevent SSRF.
			isAllowed := domainAllowed(o.AutodiscoverDomains, domain)

			if isAllowed {
				ctx, cancel := context.WithTimeout(context.Background(), netTimeout)
				discovered, err := autodiscoverer.Discover(ctx, domain)
				if err != nil {
					cancel()
					return nil, fmt.Errorf("autodiscovery failed for domain %q: %w", domain, err)
				}
				f, dynErr := getDynamicFactory(ctx, discovered.ServerURL())
				cancel()
				if dynErr != nil {
					return nil, fmt.Errorf("failed to initialize autodiscovered server: %w", dynErr)
				}
				return f(username, password)
			}
		}

		// 5. Default provider fallback
		// Only reached when NO explicit map, grouped route, template, or autodiscover rule matched.
		if defaultFactory != nil {
			return defaultFactory(username, password)
		}

		if domain == "" {
			return nil, provider.AuthError{Cause: fmt.Errorf("no mail provider configured for username %q (missing domain and no default provider)", username)}
		}
		return nil, provider.AuthError{Cause: fmt.Errorf("no mail provider configured for domain %q", domain)}
	}
}

func isValidDomain(domain string) bool {
	if len(domain) == 0 || len(domain) > 253 {
		return false
	}
	labels := strings.Split(domain, ".")
	for _, label := range labels {
		if len(label) == 0 || len(label) > 63 {
			return false
		}
		first, last := label[0], label[len(label)-1]
		if !isAlphanumeric(first) || !isAlphanumeric(last) {
			return false
		}
		for i := 1; i < len(label)-1; i++ {
			c := label[i]
			if !isAlphanumeric(c) && c != '-' {
				return false
			}
		}
	}
	return true
}

func isAlphanumeric(c byte) bool {
	return (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')
}

func isValidLocalPart(local string) bool {
	if len(local) == 0 || len(local) > 128 {
		return false
	}
	// Reject only what can change how the resulting URL is parsed, plus control
	// characters and whitespace. RFC 5321 atext is wider than [A-Za-z0-9._+-],
	// so an allowlist that narrow turns a legitimate mailbox such as "o'brien"
	// into a login failure. A few atext characters ("/" and "?") still have to
	// go: they would re-point the URL even though the address is valid.
	for i := 0; i < len(local); i++ {
		c := local[i]
		if c <= ' ' || c >= 0x7f {
			return false
		}
		switch c {
		case ':', '/', '?', '#', '@', '[', ']', '\\', '%':
			return false
		}
	}
	return true
}

func configure(meta *toml.MetaData, raw *toml.Primitive) (provider.Config, error) {
	var cfg Config
	if err := meta.PrimitiveDecode(*raw, &cfg); err != nil {
		return nil, fmt.Errorf("error decoding configuration for [provider.multi]: %w", err)
	}
	cfg.meta = meta
	return &cfg, nil
}

func init() {
	provider.Register("multi", configure)
}

func cleanDomainList(in []string) []string {
	var out []string
	for _, d := range in {
		d = strings.ToLower(strings.TrimSpace(d))
		if d != "" {
			out = append(out, d)
		}
	}
	return out
}

// domainAllowed reports whether domain is covered by an allowlist. An empty
// list allows nothing: the dynamic routes reach servers the administrator did
// not name, so they stay off until a list opts in.
func domainAllowed(allowlist []string, domain string) bool {
	for _, d := range allowlist {
		if d == "*" || d == domain {
			return true
		}
	}
	return false
}
