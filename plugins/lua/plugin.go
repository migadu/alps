package alpslua

import (
	"git.sr.ht/~migadu/alps"
)

func init() {
	alps.RegisterPluginLoader(loadAllLuaPlugins)
}
