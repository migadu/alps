package alpsviewtext

import (
	"git.sr.ht/~emersion/alps"
)

func init() {
	p := alps.GoPlugin{Name: "viewtext"}
	alps.RegisterPluginLoader(p.Loader())
}
