package alps

// PluginDir is the path to the plugins directory.
const PluginDir = "plugins"

// Plugin extends alps with additional functionality.
type Plugin interface {
	// Name should return the plugin name.
	Name() string
	// SetRoutes populates group with the plugin's routes.
	SetRoutes(group *Group)
	// Close is called once, by Server.Close at shutdown. Plugins load once,
	// at start-up, and are never unloaded or reloaded before that.
	Close() error
}

// PluginLoaderFunc loads plugins for the provided server.
type PluginLoaderFunc func(*Server) ([]Plugin, error)

var pluginLoaders []PluginLoaderFunc

// RegisterPluginLoader registers a plugin loader. The loader is called once, at
// server start-up; plugins are not reloaded.
func RegisterPluginLoader(f PluginLoaderFunc) {
	pluginLoaders = append(pluginLoaders, f)
}
