package koushin

import (
	"html/template"

	"github.com/labstack/echo/v4"
)

const pluginDir = "plugins"

// Plugin extends koushin with additional functionality.
type Plugin interface {
	// Name should return the plugin name.
	Name() string
	// LoadTemplate populates t with the plugin's functions and templates.
	LoadTemplate(t *template.Template) error
	// SetRoutes populates group with the plugin's routes.
	SetRoutes(group *echo.Group)
	// Inject is called prior to rendering a template. It can extend the
	// template data by setting new items in the Extra map.
	Inject(name string, data interface{}) error
	// Close is called when the plugin is unloaded.
	Close() error
}

var plugins []Plugin

// RegisterPlugin registers a plugin to be loaded on server startup.
func RegisterPlugin(p Plugin) {
	plugins = append(plugins, p)
}
