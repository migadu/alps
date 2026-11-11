package alpsbase

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"slices"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

func registerDAVSettingsRoutes(p *alps.GoPlugin) {
	p.GET("/settings/dav/{service}", handleDAVSettings)
	p.PUT("/settings/dav/{service}", handleDAVSettings)
	p.DELETE("/settings/dav/{service}", handleDAVSettings)
}

func defaultDAVServer(ctx *alps.Context, service string) string {
	return ctx.Server.DAVDefaultServer(service, ctx.Session.Username())
}

func activeSessionPlugins(ctx *alps.Context, loaded []string) []string {
	active := make([]string, 0, len(loaded))
	for _, name := range loaded {
		if name == provider.ServiceCalDAV || name == provider.ServiceCardDAV {
			settings, err := ctx.Session.DAVConnectionSettings(name, defaultDAVServer(ctx, name))
			if err != nil || !settings.Configured {
				continue
			}
		}
		active = append(active, name)
	}
	return active
}

func handleDAVSettings(ctx *alps.Context) error {
	service := ctx.Param("service")
	if (service != provider.ServiceCalDAV && service != provider.ServiceCardDAV) || !slices.Contains(ctx.Server.LoadedPluginNames(), service) {
		return ctx.JSON(http.StatusNotFound, map[string]string{"error": "dav_not_enabled"})
	}
	defaultServer := defaultDAVServer(ctx, service)
	var settings alps.DAVSettings
	var err error
	switch ctx.Request.Method {
	case http.MethodPut:
		var input alps.DAVConnectionInput
		decoder := json.NewDecoder(http.MaxBytesReader(ctx.Response, ctx.Request.Body, 16<<10))
		if decodeErr := decoder.Decode(&input); decodeErr != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "dav_invalid_server"})
		}
		if decodeErr := decoder.Decode(new(any)); decodeErr != io.EOF {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "dav_invalid_server"})
		}
		settings, err = ctx.Session.SaveDAVConnection(ctx.Request.Context(), service, defaultServer, input)
	case http.MethodDelete:
		settings, err = ctx.Session.DeleteDAVConnection(service, defaultServer)
	default:
		settings, err = ctx.Session.DAVConnectionSettings(service, defaultServer)
	}
	if err != nil {
		code, status := "dav_unavailable", http.StatusBadGateway
		switch {
		case errors.Is(err, alps.ErrDAVInvalidServer):
			code, status = "dav_invalid_server", http.StatusBadRequest
		case errors.Is(err, alps.ErrDAVCredentialsRequired):
			code, status = "dav_credentials_required", http.StatusBadRequest
		case errors.Is(err, alps.ErrDAVPasswordRequired):
			code, status = "dav_password_required", http.StatusBadRequest
		case errors.Is(err, alps.ErrLoginKeyRequired):
			code, status = "dav_login_key_required", http.StatusBadRequest
		case errors.Is(err, alps.ErrDAVValidationFailed):
			code, status = "dav_auth_failed", http.StatusBadRequest
		}
		return ctx.JSON(status, map[string]string{"error": code})
	}
	return ctx.JSON(http.StatusOK, settings)
}
