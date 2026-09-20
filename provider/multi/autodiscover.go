package multi

import (
	"context"
	"fmt"
	"net"
	"strings"
	"sync"
	"time"
)

// DiscoveredServer holds the host, port, and TLS mode discovered via RFC 6186.
type DiscoveredServer struct {
	Host string
	Port uint16
	TLS  bool
}

func (s *DiscoveredServer) ServerURL() string {
	scheme := "imap"
	if s.TLS {
		scheme = "imaps"
	}
	return fmt.Sprintf("%s://%s", scheme, net.JoinHostPort(s.Host, fmt.Sprintf("%d", s.Port)))
}

// Autodiscoverer resolves mail servers for a domain.
type Autodiscoverer interface {
	Discover(ctx context.Context, domain string) (*DiscoveredServer, error)
}

// DNSAutodiscoverer implements RFC 6186 DNS SRV discovery with a bounded cache.
type DNSAutodiscoverer struct {
	Resolver    *net.Resolver
	maxEntries  int
	mu          sync.Mutex
	cache       map[string]cacheEntry
	ttl         time.Duration
	negativeTTL time.Duration
}

type cacheEntry struct {
	server *DiscoveredServer
	err    error
	expiry time.Time
}

const (
	defaultMaxCacheEntries = 2048
	defaultNegativeTTL     = 30 * time.Second
)

func NewDNSAutodiscoverer(ttl time.Duration) *DNSAutodiscoverer {
	return NewDNSAutodiscovererWithCapacity(ttl, defaultNegativeTTL, defaultMaxCacheEntries)
}

func NewDNSAutodiscovererWithCapacity(ttl, negativeTTL time.Duration, maxEntries int) *DNSAutodiscoverer {
	if ttl <= 0 {
		ttl = 15 * time.Minute
	}
	if negativeTTL <= 0 {
		negativeTTL = defaultNegativeTTL
	}
	if maxEntries <= 0 {
		maxEntries = defaultMaxCacheEntries
	}
	return &DNSAutodiscoverer{
		Resolver:    net.DefaultResolver,
		maxEntries:  maxEntries,
		cache:       make(map[string]cacheEntry),
		ttl:         ttl,
		negativeTTL: negativeTTL,
	}
}

// CacheSize returns the current number of cached entries.
func (d *DNSAutodiscoverer) CacheSize() int {
	d.mu.Lock()
	defer d.mu.Unlock()
	return len(d.cache)
}

// Discover queries RFC 6186 SRV records (_imaps._tcp.<domain> then _imap._tcp.<domain>).
func (d *DNSAutodiscoverer) Discover(ctx context.Context, domain string) (*DiscoveredServer, error) {
	domain = strings.TrimSuffix(strings.ToLower(strings.TrimSpace(domain)), ".")
	if domain == "" {
		return nil, fmt.Errorf("autodiscover: domain cannot be empty")
	}

	now := time.Now()
	d.mu.Lock()
	if entry, ok := d.cache[domain]; ok {
		if now.Before(entry.expiry) {
			d.mu.Unlock()
			return entry.server, entry.err
		}
		delete(d.cache, domain)
	}
	d.mu.Unlock()

	server, err := d.discover(ctx, domain)

	d.mu.Lock()
	// If at capacity, prune expired entries first
	if len(d.cache) >= d.maxEntries {
		for k, v := range d.cache {
			if now.After(v.expiry) {
				delete(d.cache, k)
			}
		}
		// If still at capacity, evict the entry with the earliest expiry (oldest)
		if len(d.cache) >= d.maxEntries {
			var oldestKey string
			var earliestExpiry time.Time
			first := true
			for k, v := range d.cache {
				if first || v.expiry.Before(earliestExpiry) {
					oldestKey = k
					earliestExpiry = v.expiry
					first = false
				}
			}
			if !first {
				delete(d.cache, oldestKey)
			}
		}
	}

	expiry := now.Add(d.ttl)
	if err != nil {
		expiry = now.Add(d.negativeTTL)
	}

	d.cache[domain] = cacheEntry{
		server: server,
		err:    err,
		expiry: expiry,
	}
	d.mu.Unlock()

	return server, err
}

func (d *DNSAutodiscoverer) discover(ctx context.Context, domain string) (*DiscoveredServer, error) {
	resolver := d.Resolver
	if resolver == nil {
		resolver = net.DefaultResolver
	}

	// 1. Try _imaps._tcp.<domain> (RFC 6186 §3.2: IMAPS / implicit TLS)
	_, addrs, err := resolver.LookupSRV(ctx, "imaps", "tcp", domain)
	if err == nil && len(addrs) > 0 {
		for _, srv := range addrs {
			target := strings.TrimSuffix(strings.TrimSpace(srv.Target), ".")
			// RFC 6186 §3.2: Target of "." means service decidedly not available
			if target != "" && target != "." && srv.Port > 0 {
				if err := checkRestrictedHost(ctx, resolver, target); err == nil {
					return &DiscoveredServer{
						Host: target,
						Port: srv.Port,
						TLS:  true,
					}, nil
				}
			}
		}
	}

	// 2. Try _imap._tcp.<domain> (RFC 6186 §3.2: IMAP / STARTTLS)
	_, addrs, err = resolver.LookupSRV(ctx, "imap", "tcp", domain)
	if err == nil && len(addrs) > 0 {
		for _, srv := range addrs {
			target := strings.TrimSuffix(strings.TrimSpace(srv.Target), ".")
			if target != "" && target != "." && srv.Port > 0 {
				if err := checkRestrictedHost(ctx, resolver, target); err == nil {
					return &DiscoveredServer{
						Host: target,
						Port: srv.Port,
						TLS:  false,
					}, nil
				}
			}
		}
	}

	return nil, fmt.Errorf("autodiscover: no valid external IMAP SRV records found for domain %q", domain)
}

func isRestrictedIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsUnspecified() {
		return true
	}
	if ip4 := ip.To4(); ip4 != nil {
		if ip4.IsLoopback() || ip4.IsPrivate() || ip4.IsLinkLocalUnicast() || ip4.IsLinkLocalMulticast() || ip4.IsUnspecified() {
			return true
		}
		// 100.64.0.0/10 Carrier Grade NAT
		if ip4[0] == 100 && (ip4[1]&0xc0) == 64 {
			return true
		}
		if ip4.Equal(net.IPv4bcast) {
			return true
		}
	}
	return false
}

func checkRestrictedHost(ctx context.Context, resolver *net.Resolver, host string) error {
	if resolver == nil {
		resolver = net.DefaultResolver
	}
	host = strings.TrimSpace(host)
	if ip := net.ParseIP(host); ip != nil {
		if isRestrictedIP(ip) {
			return fmt.Errorf("target address %s is restricted", host)
		}
		return nil
	}
	// Resolve host IPs to guard against DNS rebinding / private targets
	addrs, err := resolver.LookupIPAddr(ctx, host)
	if err != nil {
		return err
	}
	if len(addrs) == 0 {
		return fmt.Errorf("host %s has no IP addresses", host)
	}
	for _, addr := range addrs {
		if isRestrictedIP(addr.IP) {
			return fmt.Errorf("target host %s resolves to restricted address %s", host, addr.IP.String())
		}
	}
	return nil
}
