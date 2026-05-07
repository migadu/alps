package alpsbase

import (
	"github.com/migadu/alps"
)

func init() {
	p := alps.GoPlugin{Name: "base"}

	registerRoutes(&p)

	p.AddJob("cleanup_bimi_avatars", cleanupBIMIAvatars)

	alps.RegisterPluginLoader(func(s *alps.Server) ([]alps.Plugin, error) {
		return p.Loader()(s)
	})
}
