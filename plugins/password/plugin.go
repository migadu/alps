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

// load refuses to start with a global option block that could not run. A block
// routed per domain is checked when it is used, and refused then.
func load(s *alps.Server) ([]alps.Plugin, error) {
	if s.Options == nil || !s.Options.Plugins["password"].Enabled {
		return nil, nil
	}
	if _, err := parseConfig(s.Options.Plugins["password"].Options); err != nil {
		return nil, fmt.Errorf("plugin.password: %v", err)
	}
	return plugin.Loader()(s)
}
