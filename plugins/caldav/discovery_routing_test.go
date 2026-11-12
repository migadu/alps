package alpscaldav

import (
	"context"
	"errors"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"testing"
)

func TestFailedDefaultDiscoveryKeepsRoutedCalDAV(t *testing.T) {
	old := discoverCalDAVURL
	discoverCalDAVURL = func(context.Context, string) (string, error) { return "", errors.New("discovery unavailable") }
	t.Cleanup(func() { discoverCalDAVURL = old })
	srv := stubServer(routerStub{service: provider.ServiceCalDAV, user: "alice@example.com", url: "https://routed.example"})
	srv.Options.Plugins = map[string]alps.PluginConfig{"caldav": {Enabled: true, Server: "default.example"}}
	pl, err := newPlugin(srv)
	if err != nil {
		t.Fatal(err)
	}
	if pl == nil {
		t.Fatal("failed global discovery disabled routed CalDAV")
	}
}
