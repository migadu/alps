package koushinviewhtml

import (
	"git.sr.ht/~emersion/koushin"
)

func init() {
	p := koushin.GoPlugin{Name: "viewhtml"}
	koushin.RegisterPluginLoader(p.Loader())
}
