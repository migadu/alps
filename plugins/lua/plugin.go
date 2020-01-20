package koushinlua

import (
	"git.sr.ht/~emersion/koushin"
)

func init() {
	koushin.RegisterPluginLoader(loadAllLuaPlugins)
}
