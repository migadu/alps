package koushin

import (
	"html/template"

	"github.com/labstack/echo/v4"
)

// PluginDir is the path to the plugins directory.
const PluginDir = "plugins"

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
	Inject(ctx *Context, name string, data RenderData) error
	// Close is called when the plugin is unloaded.
	Close() error
}

// PluginLoaderFunc loads plugins for the provided server.
type PluginLoaderFunc func(*Server) ([]Plugin, error)

var pluginLoaders []PluginLoaderFunc

// RegisterPluginLoader registers a plugin loader. The loader will be called on
// server start-up and reload.
func RegisterPluginLoader(f PluginLoaderFunc) {
	pluginLoaders = append(pluginLoaders, f)
}
