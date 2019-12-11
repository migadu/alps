package koushin

import (
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"net/url"
	"os"

	"github.com/labstack/echo/v4"
)

const themesDir = "public/themes"

// GlobalRenderData contains data available in all templates.
type GlobalRenderData struct {
	LoggedIn bool

	// if logged in
	Username string
	// TODO: list of mailboxes

	Extra map[string]interface{}
}

// RenderData is the base type for templates. It should be extended with new
// template-specific fields.
type RenderData struct {
	Global GlobalRenderData
	Extra  map[string]interface{}
}

func NewRenderData(ctx *Context) *RenderData {
	global := GlobalRenderData{Extra: make(map[string]interface{})}

	if ctx.Session != nil {
		global.LoggedIn = true
		global.Username = ctx.Session.username
	}

	return &RenderData{
		Global: global,
		Extra:  make(map[string]interface{}),
	}
}

type renderer struct {
	base         *template.Template
	themes       map[string]*template.Template
	defaultTheme string
}

func (r *renderer) Render(w io.Writer, name string, data interface{}, ectx echo.Context) error {
	// ectx is the raw *echo.context, not our own *Context
	ctx := ectx.Get("context").(*Context)

	for _, plugin := range ctx.Server.plugins {
		if err := plugin.Inject(name, data); err != nil {
			return fmt.Errorf("failed to run plugin '%v': %v", plugin.Name(), err)
		}
	}

	// TODO: per-user theme selection
	t := r.base
	if r.defaultTheme != "" {
		t = r.themes[r.defaultTheme]
	}
	return t.ExecuteTemplate(w, name, data)
}

func loadTheme(name string, base *template.Template) (*template.Template, error) {
	theme, err := base.Clone()
	if err != nil {
		return nil, err
	}

	theme, err = theme.ParseGlob("public/themes/" + name + "/*.html")
	if err != nil {
		return nil, err
	}

	return theme, nil
}

func loadTemplates(logger echo.Logger, defaultTheme string, plugins []Plugin) (*renderer, error) {
	base := template.New("").Funcs(template.FuncMap{
		"tuple": func(values ...interface{}) []interface{} {
			return values
		},
		"pathescape": func(s string) string {
			return url.PathEscape(s)
		},
	})
	for _, p := range plugins {
		base = base.Funcs(p.Filters())
	}

	base, err := base.ParseGlob("public/*.html")
	if err != nil {
		return nil, err
	}

	themes := make(map[string]*template.Template)

	files, err := ioutil.ReadDir(themesDir)
	if err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	for _, fi := range files {
		if !fi.IsDir() {
			continue
		}

		logger.Printf("Loading theme '%v'", fi.Name())
		var err error
		if themes[fi.Name()], err = loadTheme(fi.Name(), base); err != nil {
			return nil, fmt.Errorf("failed to load theme '%v': %v", fi.Name(), err)
		}
	}

	if defaultTheme != "" {
		if _, ok := themes[defaultTheme]; !ok {
			return nil, fmt.Errorf("failed to find default theme '%v'", defaultTheme)
		}
	}

	return &renderer{
		base:         base,
		themes:       themes,
		defaultTheme: defaultTheme,
	}, nil
}
