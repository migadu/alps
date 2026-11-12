package multi

import (
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"testing"
)

func TestServiceRoutingReportsTheNamedService(t *testing.T) {
	for _, opts := range []*Options{
		{},
		{DomainServices: map[string]services{"example.com": {urls: map[string]string{provider.ServiceCalDAV: "https://cal.example.com"}}}},
	} {
		s := &alps.Server{Options: &alps.Options{Provider: opts}}
		if s.HasServiceRouting(provider.ServiceManageSieve) {
			t.Fatal("unconfigured ManageSieve reported as routed")
		}
	}
	for _, opts := range []*Options{
		{DomainServices: map[string]services{"example.com": {urls: map[string]string{provider.ServiceManageSieve: "sieve://example.com"}}}},
		{DefaultServices: services{urls: map[string]string{provider.ServiceManageSieve: "sieve://example.com"}}},
		{Routes: []routeEntry{{services: services{urls: map[string]string{provider.ServiceManageSieve: "sieve://example.com"}}}}},
	} {
		s := &alps.Server{Options: &alps.Options{Provider: opts}}
		if !s.HasServiceRouting(provider.ServiceManageSieve) {
			t.Fatal("configured ManageSieve not reported as routed")
		}
	}
}
