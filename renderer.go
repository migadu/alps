package alps

import (
	"fmt"
	"html/template"
	"io"
	"io/ioutil"
	"net/url"
	"os"
	"strings"

	"github.com/labstack/echo/v4"
)

const themesDir = "themes"

// GlobalRenderData contains data available in all templates.
type GlobalRenderData struct {
	Path []string
	URL  *url.URL

	LoggedIn bool

	// if logged in
	Username string

	Title string

	HavePlugin func(name string) bool

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
//         BaseRenderData: *alps.NewBaseRenderData(ctx),
//         // other fields...
//     }
func NewBaseRenderData(ctx *Context) *BaseRenderData {
	global := GlobalRenderData{
		Extra: make(map[string]interface{}),
		Path:  strings.Split(ctx.Request().URL.Path, "/")[1:],
		Title: "Webmail",
		URL:   ctx.Request().URL,

		HavePlugin: func(name string) bool {
			for _, plugin := range ctx.Server.plugins {
				if plugin.Name() == name {
					return true
				}
			}
			return false
		},
	}

	if ctx.Session != nil {
		global.LoggedIn = true
		global.Username = ctx.Session.username
	}

	return &BaseRenderData{
		GlobalData: global,
		Extra:      make(map[string]interface{}),
	}
}

func (brd *BaseRenderData) WithTitle(title string) *BaseRenderData {
	brd.GlobalData.Title = title
	return brd
}

type renderer struct {
	logger       echo.Logger
	defaultTheme string

	base   *template.Template
	themes map[string]*template.Template
}

func (r *renderer) Render(w io.Writer, name string, data interface{}, ectx echo.Context) error {
	// ectx is the raw *echo.context, not our own *Context
	ctx := ectx.Get("context").(*Context)

	var renderData RenderData
	if data == nil {
		renderData = &struct{ BaseRenderData }{*NewBaseRenderData(ctx)}
	} else {
		var ok bool
		renderData, ok = data.(RenderData)
		if !ok {
			return fmt.Errorf("data passed to template %q doesn't implement RenderData", name)
		}
	}

	for _, plugin := range ctx.Server.plugins {
		if err := plugin.Inject(ctx, name, renderData); err != nil {
			return fmt.Errorf("failed to run plugin %q: %v", plugin.Name(), err)
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

func (r *renderer) Load(plugins []Plugin) error {
	base := template.New("")

	for _, p := range plugins {
		if err := p.LoadTemplate(base); err != nil {
			return fmt.Errorf("failed to load template for plugin %q: %v", p.Name(), err)
		}
	}

	themes := make(map[string]*template.Template)

	files, err := ioutil.ReadDir(themesDir)
	if err != nil && !os.IsNotExist(err) {
		return err
	}

	for _, fi := range files {
		if !fi.IsDir() {
			continue
		}

		r.logger.Printf("Loading theme %q", fi.Name())
		var err error
		if themes[fi.Name()], err = loadTheme(fi.Name(), base); err != nil {
			return fmt.Errorf("failed to load theme %q: %v", fi.Name(), err)
		}
	}

	if r.defaultTheme != "" {
		if _, ok := themes[r.defaultTheme]; !ok {
			return fmt.Errorf("failed to find default theme %q", r.defaultTheme)
		}
	}

	r.base = base
	r.themes = themes
	return nil
}

func newRenderer(logger echo.Logger, defaultTheme string) *renderer {
	return &renderer{
		logger:       logger,
		defaultTheme: defaultTheme,
	}
}
