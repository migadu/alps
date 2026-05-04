package password

import (
	"github.com/migadu/alps"
)

func init() {
	p := alps.GoPlugin{Name: "password"}

	p.POST("/password/change", handlePasswordChange)

	alps.RegisterPluginLoader(p.Loader())
}
