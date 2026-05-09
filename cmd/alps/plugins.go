package main

import (
	_ "github.com/migadu/alps/plugins/base"
	_ "github.com/migadu/alps/plugins/carddav"
	_ "github.com/migadu/alps/plugins/password"
)

// All plugins are imported here for registration.
// When using a config file, you can control which plugins are enabled
// via the [plugins] section. Without a config file, all plugins are enabled.
