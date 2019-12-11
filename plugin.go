package koushin

import (
	"html/template"

	"github.com/labstack/echo/v4"
)

const pluginDir = "plugins"

type Plugin interface {
	Name() string
	LoadTemplate(t *template.Template) error
	SetRoutes(group *echo.Group)
	Inject(name string, data interface{}) error
	Close() error
}
