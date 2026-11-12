package password

import (
	"fmt"

	"github.com/migadu/alps"
)

var plugin = alps.GoPlugin{Name: "password"}

func init() {
	plugin.POST("/password/change", handlePasswordChange)

	alps.RegisterPluginLoader(load)
}

// load loads the plugin only where [plugin.password] has enabled = true, the
// test handlePasswordChange makes, so that /session and Settings offer the
// page exactly where a change can run. It refuses to start with a global
// option block that could not run. A block routed per domain is checked when
// it is used, and refused then.
func load(s *alps.Server) ([]alps.Plugin, error) {
	if s.Options == nil {
		return nil, nil
	}
	cfg, ok := s.Options.Plugins["password"]
	if !ok || !cfg.Enabled {
		return nil, nil
	}
	if _, err := parseConfig(cfg.Options); err != nil {
		return nil, fmt.Errorf("plugin.password: %v", err)
	}
	return plugin.Loader()(s)
}
