package alps

import (
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

// External providers may implement the original two-method routing contract
// without knowing about startup capability reporting.
type legacyServiceRouter struct{}

func (legacyServiceRouter) Type() string { return "legacy-services" }
func (legacyServiceRouter) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return nil
}
func (legacyServiceRouter) ServiceURL(service, _ string) string {
	if service == provider.ServiceSMTP {
		return "smtps://smtp.routed.example"
	}
	return ""
}
func (legacyServiceRouter) ServiceOptions(service, _ string) map[string]interface{} {
	if service == provider.ServicePassword {
		return map[string]interface{}{"endpoint": "https://password.routed.example"}
	}
	return nil
}

func TestLegacyServiceRouterKeepsItsRoutingContract(t *testing.T) {
	s := &Server{Options: &Options{Provider: legacyServiceRouter{}}}
	if got := s.ServiceURLFor(provider.ServiceSMTP, "ada@example.test"); got != "smtps://smtp.routed.example" {
		t.Errorf("legacy SMTP route lost: %q", got)
	}
	if got := s.ServiceOptionsFor(provider.ServicePassword, "ada@example.test"); got["endpoint"] != "https://password.routed.example" {
		t.Errorf("legacy password route lost: %v", got)
	}
	if !s.HasServiceRouting(provider.ServicePassword) {
		t.Error("legacy router was silently treated as not routing")
	}
}
