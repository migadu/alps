package provider

import (
	"fmt"
	"github.com/BurntSushi/toml"
)

type ConfigFactory func(meta *toml.MetaData, data *toml.Primitive) (Config, error)

var providerMap = make(map[string]ConfigFactory)

func Register(name string, f ConfigFactory) {

	_, ok := providerMap[name]
	if ok {
		panic(fmt.Sprintf("Duplicate provider name %s", name))
	}
	providerMap[name] = f
}

func LoadConfig(name string, meta *toml.MetaData, data *toml.Primitive) (Config, error) {

	if name == "" {
		return nil, fmt.Errorf("no provider type")
	}
	pcf, ok := providerMap[name]
	if !ok {
		return nil, fmt.Errorf("unknown provider type '%s'", name)
	}

	return pcf(meta, data)
}
