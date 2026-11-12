package managesieve

import (
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/multi"
	"testing"
)

func TestEnabledManageSieveWithoutAnyEndpointStaysOff(t *testing.T) {
	for _, opts := range []provider.Options{nil, &multi.Options{}} {
		srv := &alps.Server{Options: &alps.Options{Provider: opts, Plugins: map[string]alps.PluginConfig{"managesieve": {Enabled: true}}}}
		p, err := newPlugin(srv)
		if err != nil {
			t.Fatal(err)
		}
		if p != nil {
			t.Fatalf("ManageSieve loaded without an endpoint for provider %T", opts)
		}
	}
}
