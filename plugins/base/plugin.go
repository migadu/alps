package koushinbase

import (
	"git.sr.ht/~emersion/koushin"
)

func init() {
	p := koushin.GoPlugin{Name: "base"}

	p.TemplateFuncs(templateFuncs)
	registerRoutes(&p)

	koushin.RegisterPluginLoader(p.Loader())
}
