package koushin

import (
	"fmt"
	"html/template"
	"io"
	"net/url"

	"github.com/labstack/echo/v4"
)

type tmpl struct {
	// TODO: add support for multiple themes
	t *template.Template
}

func (t *tmpl) Render(w io.Writer, name string, data interface{}, ectx echo.Context) error {
	// ectx is the raw *echo.context, not our own *context
	ctx := ectx.Get("context").(*context)

	for _, plugin := range ctx.server.plugins {
		if err := plugin.Render(name, data); err != nil {
			return fmt.Errorf("failed to run plugin '%v': %v", plugin.Name(), err)
		}
	}

	return t.t.ExecuteTemplate(w, name, data)
}

func loadTemplates(logger echo.Logger, themeName string, plugins []Plugin) (*tmpl, error) {
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

	theme, err := base.Clone()
	if err != nil {
		return nil, err
	}

	if themeName != "" {
		logger.Printf("Loading theme \"%s\"", themeName)
		if _, err := theme.ParseGlob("public/themes/" + themeName + "/*.html"); err != nil {
			return nil, err
		}
	}

	return &tmpl{theme}, err
}
