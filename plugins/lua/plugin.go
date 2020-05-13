package alpslua

import (
	"git.sr.ht/~emersion/alps"
)

func init() {
	alps.RegisterPluginLoader(loadAllLuaPlugins)
}
