package koushinviewtext

import (
	"git.sr.ht/~emersion/koushin"
)

func init() {
	p := koushin.GoPlugin{Name: "viewtext"}
	koushin.RegisterPluginLoader(p.Loader())
}
