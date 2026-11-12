package alps

// PluginDir is the path to the plugins directory.
const PluginDir = "plugins"

// Plugin extends alps with additional functionality.
type Plugin interface {
	// Name should return the plugin name.
	Name() string
	// SetRoutes populates group with the plugin's routes.
	SetRoutes(group *Group)
	// Close releases a plugin at shutdown or when it is discarded during startup.
	Close() error
}

// PluginLoaderFunc loads plugins for the provided server.
type PluginLoaderFunc func(*Server) ([]Plugin, error)

var pluginLoaders []PluginLoaderFunc

// RegisterPluginLoader registers a plugin loader. The loader will be called on
// server start-up. Plugins are loaded once.
func RegisterPluginLoader(f PluginLoaderFunc) {
	pluginLoaders = append(pluginLoaders, f)
}
