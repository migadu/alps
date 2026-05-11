package alps

import (
	"net/http"
)

type goPlugin struct {
	p *GoPlugin
}

func (p *goPlugin) Name() string {
	return p.p.Name
}

func (p *goPlugin) SetRoutes(group *Group) {
	for _, r := range p.p.routes {
		group.Add(r.Method, r.Path, r.Handler)
	}

	group.Static("/plugins/"+p.p.Name+"/assets", PluginDir+"/"+p.p.Name+"/public/assets")
}

func (p *goPlugin) Close() error {
	return nil
}

type goPluginRoute struct {
	Method  string
	Path    string
	Handler HandlerFunc
}

// GoPlugin is a helper to create Go plugins.
//
// Use this struct to define your plugin, then call RegisterPluginLoader:
//
//	p := GoPlugin{Name: "my-plugin"}
//	// Define routes, template functions, etc
//	alps.RegisterPluginLoader(p.Loader())
type GoPlugin struct {
	Name string

	routes []goPluginRoute
	jobs   map[string]JobFunc
}

// AddRoute registers a new HTTP route.
func (p *GoPlugin) AddRoute(method, path string, handler HandlerFunc) {
	p.routes = append(p.routes, goPluginRoute{method, path, handler})
}

func (p *GoPlugin) DELETE(path string, handler HandlerFunc) {
	p.AddRoute(http.MethodDelete, path, handler)
}

func (p *GoPlugin) GET(path string, handler HandlerFunc) {
	p.AddRoute(http.MethodGet, path, handler)
}

func (p *GoPlugin) POST(path string, handler HandlerFunc) {
	p.AddRoute(http.MethodPost, path, handler)
}

func (p *GoPlugin) PUT(path string, handler HandlerFunc) {
	p.AddRoute(http.MethodPut, path, handler)
}

func (p *GoPlugin) PATCH(path string, handler HandlerFunc) {
	p.AddRoute(http.MethodPatch, path, handler)
}

// AddJob registers a background job to run periodically.
func (p *GoPlugin) AddJob(name string, handler JobFunc) {
	if p.jobs == nil {
		p.jobs = make(map[string]JobFunc)
	}
	p.jobs[name] = handler
}

// Plugin returns an object implementing Plugin.
func (p *GoPlugin) Plugin() Plugin {
	return &goPlugin{p}
}

// Loader returns a loader function for this plugin.
func (p *GoPlugin) Loader() PluginLoaderFunc {
	return func(s *Server) ([]Plugin, error) {
		if s.Scheduler != nil {
			for name, job := range p.jobs {
				s.Scheduler.Register(p.Name+":"+name, job)
			}
		}
		return []Plugin{p.Plugin()}, nil
	}
}
