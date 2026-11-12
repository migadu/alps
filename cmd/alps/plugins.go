package main

import (
	_ "github.com/migadu/alps/plugins/base"
	_ "github.com/migadu/alps/plugins/caldav"
	_ "github.com/migadu/alps/plugins/carddav"
	_ "github.com/migadu/alps/plugins/gpg"
	_ "github.com/migadu/alps/plugins/managesieve"
	_ "github.com/migadu/alps/plugins/password"
)

// All plugins are imported here for registration.
// The required config file selects plugins using enabled in [plugin.<name>].
// Plugins load once at startup; SIGHUP only reopens the log file.
