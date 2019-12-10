package koushin

import (
	"html/template"

	"github.com/labstack/echo/v4"
)

type Plugin interface {
	Name() string
	Filters() template.FuncMap
	SetRoutes(group *echo.Group)
	Render(name string, data interface{}) error
	Close() error
}
