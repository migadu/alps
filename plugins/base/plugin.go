package alpsbase

import (
	"git.sr.ht/~migadu/alps"
)

func init() {
	p := alps.GoPlugin{Name: "base"}

	p.TemplateFuncs(templateFuncs)
	registerRoutes(&p)

	alps.RegisterPluginLoader(p.Loader())
}
