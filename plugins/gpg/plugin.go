package gpg

import (
	"github.com/migadu/alps"
)

func init() {
	p := alps.GoPlugin{Name: "gpg"}

	registerRoutes(&p)

	alps.RegisterPluginLoader(p.Loader())
}
