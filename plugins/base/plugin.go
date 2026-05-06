package alpsbase

import (
	"github.com/migadu/alps"
)

func init() {
	p := alps.GoPlugin{Name: "base"}

	registerRoutes(&p)

	p.AddJob("cleanup_bimi_avatars", cleanupBIMIAvatars)

	alps.RegisterPluginLoader(func(s *alps.Server) ([]alps.Plugin, error) {
		// Extract WebAuthn configuration from plugin options
		var webAuthnCfg *WebAuthnConfig
		if s.Options != nil && s.Options.Plugins != nil {
			if baseCfg, ok := s.Options.Plugins["base"]; ok && baseCfg.Options != nil {
				webAuthnCfg = &WebAuthnConfig{}
				if rpID, ok := baseCfg.Options["webauthn_rpid"].(string); ok {
					webAuthnCfg.RPID = rpID
				}
				if rpName, ok := baseCfg.Options["webauthn_display_name"].(string); ok {
					webAuthnCfg.RPDisplayName = rpName
				}
				if origins, ok := baseCfg.Options["webauthn_origins"].([]interface{}); ok {
					for _, o := range origins {
						if origin, ok := o.(string); ok {
							webAuthnCfg.RPOrigins = append(webAuthnCfg.RPOrigins, origin)
						}
					}
				}
			}
		}

		if err := initWebAuthn(webAuthnCfg); err != nil {
			return nil, err
		}
		return p.Loader()(s)
	})
}
