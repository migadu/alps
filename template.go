package koushin

import (
	"html/template"
	"io"

	"github.com/labstack/echo/v4"
)

type tmpl struct {
	t *template.Template
}

func (t *tmpl) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.t.ExecuteTemplate(w, name, data)
}

func loadTemplates() (*tmpl, error) {
	t, err := template.New("drmdb").Funcs(template.FuncMap{
		"tuple": func(values ...interface{}) []interface{} {
			return values
		},
	}).ParseGlob("public/*.html")
	return &tmpl{t}, err
}
