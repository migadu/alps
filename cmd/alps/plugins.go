package main

import (
	_ "github.com/migadu/alps/plugins/base"
	_ "github.com/migadu/alps/plugins/caldav"
	_ "github.com/migadu/alps/plugins/carddav"
	_ "github.com/migadu/alps/plugins/gpg"
	_ "github.com/migadu/alps/plugins/managesieve"
	_ "github.com/migadu/alps/plugins/password"
)

// All plugins are imported here for registration. They load once, at start-up.
// The [plugin.<name>] sections of the config file choose which: if any of them
// sets enabled = true, only the plugins so enabled load; otherwise all do.
