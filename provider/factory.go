package provider

import (
	"fmt"
	"sync"

	"github.com/BurntSushi/toml"
)

type ConfigFactory func(meta *toml.MetaData, data *toml.Primitive) (Config, error)

var (
	providerMu  sync.RWMutex
	providerMap = make(map[string]ConfigFactory)
)

func Register(name string, f ConfigFactory) {
	providerMu.Lock()
	defer providerMu.Unlock()

	if _, ok := providerMap[name]; ok {
		panic(fmt.Sprintf("Duplicate provider name %s", name))
	}
	providerMap[name] = f
}

func LoadConfig(name string, meta *toml.MetaData, data *toml.Primitive) (Config, error) {
	if name == "" {
		return nil, fmt.Errorf("no provider type")
	}

	providerMu.RLock()
	pcf, ok := providerMap[name]
	providerMu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("unknown provider type '%s'", name)
	}

	// Guard the factories, which all dereference both arguments.
	if meta == nil || data == nil {
		return nil, fmt.Errorf("no TOML configuration for provider type '%s'", name)
	}

	return pcf(meta, data)
}
