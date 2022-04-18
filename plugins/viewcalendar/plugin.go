package alpsviewcalendar

import (
	"git.sr.ht/~migadu/alps"
)

func init() {
	p := alps.GoPlugin{Name: "viewcalendar"}
	alps.RegisterPluginLoader(p.Loader())
}
