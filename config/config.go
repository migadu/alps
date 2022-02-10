package config

import (
	"fmt"
	"time"

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
	LoginKey                     *fernet.Key   `ini:"-"`
	CookieName                   string        `ini:"cookie-name"`
	CookieLoginTokenSessionName  string        `ini:"cookie-login-token-session-name"`
	CookieLoginTokenRememberName string        `ini:"cookie-login-token-remember-name"`
	LoginTokenSessionLifetime    time.Duration `ini:"login-token-session-lifetime"`
	LoginTokenRememberLifetime   time.Duration `ini:"login-token-remember-lifetime"`
}

type SessionConfig struct {
	IdleTimeout         time.Duration `ini:"idle-timeout"`
	AttachmentCacheSize int64         `ini:"-"`
}

type AlpsConfig struct {
	General  GeneralConfig  `ini:"general"`
	Server   ServerConfig   `ini:"server"`
	UI       UIConfig       `ini:"ui"`
	Log      LogConfig      `ini:"log"`
	Security SecurityConfig `ini:"security"`
	Session  SessionConfig  `ini:"session"`
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
		Security: SecurityConfig{
			CookieName:                   "alps_session",
			CookieLoginTokenSessionName:  "alps_login_token_session",
			CookieLoginTokenRememberName: "alps_login_token_remember",
			LoginTokenSessionLifetime:    30 * time.Minute,
			LoginTokenRememberLifetime:   30 * 24 * time.Hour,
		},
		Session: SessionConfig{
			IdleTimeout: 30 * time.Minute,
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

	attachmentCacheMebi := file.Section("session").Key("attachment-cache-size").MustInt(32)
	config.Session.AttachmentCacheSize = int64(attachmentCacheMebi) << 20

	if err := file.MapTo(config); err != nil {
		return nil, err
	}

	if len(config.General.Upstreams) == 0 {
		return nil, fmt.Errorf("Expected at least one upstream IMAP server")
	}

	return config, nil
}
