package koushin

import (
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"os"

	"github.com/labstack/echo/v4"
)

const themesDir = "themes"

// GlobalRenderData contains data available in all templates.
type GlobalRenderData struct {
	LoggedIn bool

	// if logged in
	Username string
	// TODO: list of mailboxes

	// additional plugin-specific data
	Extra map[string]interface{}
}

// BaseRenderData is the base type for templates. It should be extended with
// additional template-specific fields:
//
//     type MyRenderData struct {
//         BaseRenderData
//         // add additional fields here
//     }
type BaseRenderData struct {
	GlobalData GlobalRenderData
	// additional plugin-specific data
	Extra map[string]interface{}
}

// Global implements RenderData.
func (brd *BaseRenderData) Global() *GlobalRenderData {
	return &brd.GlobalData
}

// RenderData is implemented by template data structs. It can be used to inject
// additional data to all templates.
type RenderData interface {
	// GlobalData returns a pointer to the global render data.
	Global() *GlobalRenderData
}

// NewBaseRenderData initializes a new BaseRenderData.
//
// It can be used by routes to pre-fill the base data:
//
//     type MyRenderData struct {
//         BaseRenderData
//         // add additional fields here
//     }
//
//     data := &MyRenderData{
//         BaseRenderData: *koushin.NewBaseRenderData(ctx),
//         // other fields...
//     }
func NewBaseRenderData(ctx *Context) *BaseRenderData {
	global := GlobalRenderData{Extra: make(map[string]interface{})}

	if ctx.Session != nil {
		global.LoggedIn = true
		global.Username = ctx.Session.username
	}

	return &BaseRenderData{
		GlobalData: global,
		Extra:      make(map[string]interface{}),
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

	for _, plugin := range ctx.Server.Plugins {
		if err := plugin.Inject(ctx, name, data.(RenderData)); err != nil {
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

	theme, err = theme.ParseGlob(themesDir + "/" + name + "/*.html")
	if err != nil {
		return nil, err
	}

	return theme, nil
}

func loadTemplates(logger echo.Logger, defaultTheme string, plugins []Plugin) (*renderer, error) {
	base := template.New("")

	for _, p := range plugins {
		if err := p.LoadTemplate(base); err != nil {
			return nil, fmt.Errorf("failed to load template for plugin '%v': %v", p.Name(), err)
		}
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
