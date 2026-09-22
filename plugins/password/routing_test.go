package password

import (
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// optionRouter routes a whole option block for one login and has no opinion
// about any other.
type optionRouter struct {
	user  string
	block map[string]interface{}
}

func (optionRouter) Type() string { return "stub" }
func (optionRouter) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return nil
}
func (optionRouter) ServiceURL(string, string) string { return "" }
func (r optionRouter) ServiceOptions(service, username string) map[string]interface{} {
	if service == provider.ServicePassword && username == r.user {
		return r.block
	}
	return nil
}

// Two backends mean two admin APIs with separate credentials, so a routed
// block replaces the global one entirely. Merging would carry one deployment's
// credentials to the other's endpoint.
func TestRoutedPasswordBlockReplacesRatherThanMerges(t *testing.T) {
	global := map[string]interface{}{
		"endpoint":  "https://admin.global.example/api",
		"auth_type": "basic",
		"username":  "global-user",
		"password":  "global-secret",
	}
	routed := map[string]interface{}{
		"endpoint": "https://admin.routed.example/api",
	}

	srv := &alps.Server{Options: &alps.Options{Provider: optionRouter{user: "routed@example.com", block: routed}}}

	got := srv.ServiceOptionsFor(provider.ServicePassword, "routed@example.com")
	if got == nil {
		t.Fatal("the routed login got no block of its own")
	}
	cfg := parseConfig(got)
	if cfg.Endpoint != "https://admin.routed.example/api" {
		t.Errorf("routed endpoint is %q, want the backend's own", cfg.Endpoint)
	}
	// The decisive part: nothing from the global block survives into it.
	if cfg.Username == "global-user" || cfg.Password == "global-secret" {
		t.Error("the global admin credentials reached another backend's endpoint")
	}

	// A login the provider has no opinion about keeps the global block.
	if got := srv.ServiceOptionsFor(provider.ServicePassword, "other@example.com"); got != nil {
		t.Errorf("an unrouted login got %v, want the global configuration", got)
	}

	// A provider that does not route at all leaves everything alone.
	plain := &alps.Server{Options: &alps.Options{}}
	if got := plain.ServiceOptionsFor(provider.ServicePassword, "routed@example.com"); got != nil {
		t.Errorf("a non-routing provider produced %v, want nothing", got)
	}
	_ = global
}
