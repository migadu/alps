package alps

import (
	"html/template"
	"net/http"
	"path/filepath"

	"github.com/labstack/echo/v4"
)

type goPlugin struct {
	p *GoPlugin
}

func (p *goPlugin) Name() string {
	return p.p.Name
}

func (p *goPlugin) LoadTemplate(t *template.Template) error {
	t.Funcs(p.p.templateFuncs)

	paths, err := filepath.Glob(PluginDir + "/" + p.p.Name + "/public/*.html")
	if err != nil {
		return err
	}
	if len(paths) > 0 {
		if _, err := t.ParseFiles(paths...); err != nil {
			return err
		}
	}

	return nil
}

func (p *goPlugin) SetRoutes(group *echo.Group) {
	for _, r := range p.p.routes {
		h := r.Handler
		group.Add(r.Method, r.Path, func(ectx echo.Context) error {
			return h(ectx.(*Context))
		})
	}

	group.Static("/plugins/"+p.p.Name+"/assets", PluginDir+"/"+p.p.Name+"/public/assets")
}

func (p *goPlugin) Inject(ctx *Context, name string, data RenderData) error {
	if f, ok := p.p.injectFuncs["*"]; ok {
		if err := f(ctx, data); err != nil {
			return err
		}
	}
	if f, ok := p.p.injectFuncs[name]; ok {
		return f(ctx, data)
	}
	return nil
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

	templateFuncs template.FuncMap
	injectFuncs   map[string]InjectFunc
}

// HandlerFunc is a function serving HTTP requests.
type HandlerFunc func(*Context) error

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

// TemplateFuncs registers new template functions.
func (p *GoPlugin) TemplateFuncs(funcs template.FuncMap) {
	if p.templateFuncs == nil {
		p.templateFuncs = make(template.FuncMap, len(funcs))
	}

	for k, f := range funcs {
		p.templateFuncs[k] = f
	}
}

// InjectFunc is a function that injects data prior to rendering a template.
type InjectFunc func(ctx *Context, data RenderData) error

// Inject registers a function to execute prior to rendering a template. The
// special name "*" matches any template.
func (p *GoPlugin) Inject(name string, f InjectFunc) {
	if p.injectFuncs == nil {
		p.injectFuncs = make(map[string]InjectFunc)
	}
	p.injectFuncs[name] = f
}

// Plugin returns an object implementing Plugin.
func (p *GoPlugin) Plugin() Plugin {
	return &goPlugin{p}
}

// Loader returns a loader function for this plugin.
func (p *GoPlugin) Loader() PluginLoaderFunc {
	return func(*Server) ([]Plugin, error) {
		return []Plugin{p.Plugin()}, nil
	}
}
