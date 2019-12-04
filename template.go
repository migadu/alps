package koushin

import (
	"html/template"
	"io"
	"net/url"

	"github.com/labstack/echo/v4"
)

type tmpl struct {
	// TODO: add support for multiple themes
	t *template.Template
}

func (t *tmpl) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.t.ExecuteTemplate(w, name, data)
}

func loadTemplates(logger echo.Logger, themeName string) (*tmpl, error) {
	base, err := template.New("").Funcs(template.FuncMap{
		"tuple": func(values ...interface{}) []interface{} {
			return values
		},
		"pathescape": func(s string) string {
			return url.PathEscape(s)
		},
	}).ParseGlob("public/*.html")
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
