package multi

import (
	"context"
	"errors"
	"net"
	"sync/atomic"
	"testing"
)

func offlineResolver() *net.Resolver {
	return &net.Resolver{PreferGo: true, Dial: func(context.Context, string, string) (net.Conn, error) {
		return nil, errors.New("DNS disabled by fixture")
	}}
}

func TestRoutingFixturesDoNotUseSystemDNS(t *testing.T) {
	saved := net.DefaultResolver
	var queries atomic.Int64
	net.DefaultResolver = &net.Resolver{PreferGo: true, Dial: func(context.Context, string, string) (net.Conn, error) {
		queries.Add(1)
		return nil, errors.New("unexpected system DNS lookup")
	}}
	t.Cleanup(func() { net.DefaultResolver = saved })
	for _, tc := range []struct {
		name string
		run  func(*testing.T)
	}{
		{"cache bounds", TestDNSAutodiscoverer_BoundedCache},
		{"negative cache", TestDNSAutodiscoverer_NegativeCacheTTL},
		{"concurrent routing", TestMultiConfig_Concurrency},
		{"autodiscovery", TestMultiConfig_Autodiscover},
		{"domain fallback", TestMultiConfig_DomainRoutingAndFallback},
		{"template restriction", TestMultiConfig_TemplateSSRFBlocked},
		{"routing failure", TestMultiConfig_RoutingDoesNotFailOpen},
	} {
		t.Run(tc.name, tc.run)
	}
	if got := queries.Load(); got != 0 {
		t.Fatalf("routing fixtures attempted %d system DNS queries", got)
	}
}
