package alpscaldav

import (
	"context"
	"errors"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

func TestFailedDiscoveryRetainsProviderRoutedCalDAV(t *testing.T) {
	old := discoverCalDAVURL
	t.Cleanup(func() { discoverCalDAVURL = old })
	discoverCalDAVURL = func(context.Context, string) (string, error) { return "", errors.New("no SRV records") }
	srv := stubServer(routerStub{service: provider.ServiceCalDAV, user: "routed@example.com", url: "https://cal.routed.example"})
	srv.Options.Plugins = map[string]alps.PluginConfig{"caldav": {Enabled: true, Server: "dav.example.com"}}
	pl, err := newPlugin(srv)
	if err != nil || pl == nil {
		t.Fatalf("routed plugin lost after discovery failed: plugin=%v err=%v", pl, err)
	}
}

func TestInvalidDiscoveredURLIsStillAnErrorWithProviderRouting(t *testing.T) {
	old := discoverCalDAVURL
	t.Cleanup(func() { discoverCalDAVURL = old })
	discoverCalDAVURL = func(context.Context, string) (string, error) { return "https:/dav.example.com", nil }
	srv := stubServer(routerStub{service: provider.ServiceCalDAV, user: "routed@example.com", url: "https://cal.routed.example"})
	srv.Options.Plugins = map[string]alps.PluginConfig{"caldav": {Enabled: true, Server: "dav.example.com"}}
	if pl, err := newPlugin(srv); err == nil {
		t.Fatalf("invalid discovered URL accepted: plugin=%v", pl)
	}
}
