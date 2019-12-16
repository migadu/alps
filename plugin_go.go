package koushin

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

	paths, err := filepath.Glob(pluginDir + "/" + p.p.Name + "/public/*.html")
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
		group.Add(r.Method, r.Path, r.Handler)
	}

	group.Static("/plugins/" + p.p.Name + "/assets", pluginDir + "/" + p.p.Name + "/public/assets")
}

func (p *goPlugin) Inject(name string, data interface{}) error {
	return nil
}

func (p *goPlugin) Close() error {
	return nil
}

type goPluginRoute struct {
	Method  string
	Path    string
	Handler echo.HandlerFunc
}

type GoPlugin struct {
	Name string

	routes []goPluginRoute

	templateFuncs template.FuncMap
}

func (p *GoPlugin) AddRoute(method, path string, handler echo.HandlerFunc) {
	p.routes = append(p.routes, goPluginRoute{method, path, handler})
}

func (p *GoPlugin) DELETE(path string, handler echo.HandlerFunc) {
	p.AddRoute(http.MethodDelete, path, handler)
}

func (p *GoPlugin) GET(path string, handler echo.HandlerFunc) {
	p.AddRoute(http.MethodGet, path, handler)
}

func (p *GoPlugin) POST(path string, handler echo.HandlerFunc) {
	p.AddRoute(http.MethodPost, path, handler)
}

func (p *GoPlugin) PUT(path string, handler echo.HandlerFunc) {
	p.AddRoute(http.MethodPut, path, handler)
}

func (p *GoPlugin) TemplateFuncs(funcs template.FuncMap) {
	if p.templateFuncs == nil {
		p.templateFuncs = make(template.FuncMap, len(funcs))
	}

	for k, f := range funcs {
		p.templateFuncs[k] = f
	}
}

func (p *GoPlugin) Plugin() Plugin {
	return &goPlugin{p}
}
