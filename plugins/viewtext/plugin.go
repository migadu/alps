package alpsviewtext

import (
	"git.sr.ht/~migadu/alps"
)

func init() {
	p := alps.GoPlugin{Name: "viewtext"}
	alps.RegisterPluginLoader(p.Loader())
}
