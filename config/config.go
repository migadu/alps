package config

import (
	"fmt"

	"github.com/fernet/fernet-go"
	"gopkg.in/ini.v1"
)

type GeneralConfig struct {
	Upstreams []string `ini:"upstreams" delim:","`
}

type ServerConfig struct {
	Address string `ini:"address"`
}

type UIConfig struct {
	Theme      string `ini:"theme"`
	ThemesPath string `ini:"-"`
}

type LogConfig struct {
	Debug bool `ini:"debug"`
}

type SecurityConfig struct {
	LoginKey *fernet.Key `ini:"-"`
}

type AlpsConfig struct {
	General  GeneralConfig  `ini:"general"`
	Server   ServerConfig   `ini:"server"`
	UI       UIConfig       `ini:"ui"`
	Log      LogConfig      `ini:"log"`
	Security SecurityConfig `ini:"security"`
}

func LoadConfig(filename string, themesPath string) (*AlpsConfig, error) {
	config := &AlpsConfig{
		Server: ServerConfig{
			Address: ":1323",
		},
		UI: UIConfig{
			Theme:      "",
			ThemesPath: themesPath,
		},
		Log: LogConfig{
			Debug: false,
		},
	}

	file, err := ini.Load(filename)
	if err != nil {
		return nil, err
	}

	loginKey := file.Section("security").Key("login-key").String()
	if loginKey != "" {
		fernetKey, err := fernet.DecodeKey(loginKey)
		if err != nil {
			return nil, err
		}
		config.Security.LoginKey = fernetKey
	}

	if err := file.MapTo(config); err != nil {
		return nil, err
	}

	if len(config.General.Upstreams) == 0 {
		return nil, fmt.Errorf("Expected at least one upstream IMAP server")
	}

	return config, nil
}
