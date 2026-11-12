package password

import (
	"fmt"
	"strings"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

var plugin = alps.GoPlugin{Name: "password"}

func init() {
	plugin.POST("/password/change", handlePasswordChange)

	alps.RegisterPluginLoader(load)
}

// load offers Password settings only when enabled and a global or routed
// backend exists. Invalid global command options stop startup; routed option
// blocks are checked when used.
func load(s *alps.Server) ([]alps.Plugin, error) {
	if s.Options == nil {
		return nil, nil
	}
	cfg, ok := s.Options.Plugins["password"]
	if !ok || !cfg.Enabled {
		return nil, nil
	}
	backend, err := parseConfig(cfg.Options)
	if err != nil {
		return nil, fmt.Errorf("plugin.password: %v", err)
	}
	if strings.TrimSpace(backend.Endpoint) == "" && len(backend.Command) == 0 && !s.HasServiceRouting(provider.ServicePassword) {
		s.Logger().Printf("password: enabled without an endpoint, command or routed backend; plugin disabled")
		return nil, nil
	}
	return plugin.Loader()(s)
}
