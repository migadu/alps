package koushinbase

import (
	"git.sr.ht/~emersion/koushin"
)

const messagesPerPage = 50

func init() {
	p := koushin.GoPlugin{Name: "base"}

	p.TemplateFuncs(templateFuncs)
	registerRoutes(&p)

	koushin.RegisterPluginLoader(p.Loader())
}
