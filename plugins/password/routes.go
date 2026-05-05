package password

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/migadu/alps"
)

type PasswordChangeConfig struct {
	Endpoint       string            `json:"endpoint"`
	Method         string            `json:"method"`
	AuthType       string            `json:"auth_type"`
	Username       string            `json:"username"`
	Password       string            `json:"password"`
	Token          string            `json:"token"`
	Payload        string            `json:"payload"`
	PayloadMapping map[string]string `json:"payload_mapping"`
}

func parseConfig(opts map[string]interface{}) *PasswordChangeConfig {
	if opts == nil {
		return &PasswordChangeConfig{}
	}
	b, _ := json.Marshal(opts)
	var cfg PasswordChangeConfig
	json.Unmarshal(b, &cfg)
	return &cfg
}

func handlePasswordChange(ctx *alps.Context) error {
	pluginCfg, ok := ctx.Server.Options.Plugins["password"]
	if !ok || !pluginCfg.Enabled {
		return ctx.JSON(http.StatusForbidden, map[string]string{"error": "Password change is not enabled"})
	}
	cfg := parseConfig(pluginCfg.Options)

	var req PasswordChangeRequest
	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
		}
	} else {
		req.OldPassword = ctx.FormValue("old_password")
		req.Password = ctx.FormValue("password")
	}

	if req.OldPassword == "" || req.Password == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Old and new password are required"})
	}

	username := ctx.Session.Username()
	parts := strings.SplitN(username, "@", 2)
	local := username
	domain := ""
	if len(parts) == 2 {
		local = parts[0]
		domain = parts[1]
	}

	endpoint := cfg.Endpoint
	endpoint = strings.ReplaceAll(endpoint, "{email}", url.PathEscape(username))
	endpoint = strings.ReplaceAll(endpoint, "{local}", url.PathEscape(local))
	endpoint = strings.ReplaceAll(endpoint, "{domain}", url.PathEscape(domain))

	method := strings.ToUpper(cfg.Method)
	if method == "" {
		method = "POST"
	}

	var body io.Reader
	var contentType string

	// Mapping of internal variables to their values
	internalValues := map[string]string{
		"username":     username,
		"local":        local,
		"domain":       domain,
		"old_password": req.OldPassword,
		"new_password": req.Password,
	}

	// Calculate final payload map
	payloadMap := make(map[string]string)

	for targetKey, internalVar := range cfg.PayloadMapping {
		if val, ok := internalValues[internalVar]; ok {
			payloadMap[targetKey] = val
		}
	}

	payloadFormat := strings.ToLower(cfg.Payload)
	if payloadFormat == "form" {
		form := url.Values{}
		for k, v := range payloadMap {
			form.Set(k, v)
		}
		body = strings.NewReader(form.Encode())
		contentType = "application/x-www-form-urlencoded"
	} else {
		// Default to JSON
		jsonBytes, err := json.Marshal(payloadMap)
		if err != nil {
			return err
		}
		body = bytes.NewReader(jsonBytes)
		contentType = "application/json"
	}

	httpReq, err := http.NewRequestWithContext(ctx.Request.Context(), method, endpoint, body)
	if err != nil {
		return err
	}
	if contentType != "" {
		httpReq.Header.Set("Content-Type", contentType)
	}

	switch strings.ToLower(cfg.AuthType) {
	case "basic":
		httpReq.SetBasicAuth(cfg.Username, cfg.Password)
	case "bearer":
		httpReq.Header.Set("Authorization", "Bearer "+cfg.Token)
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		ctx.Server.Logger().Errorf("Password change HTTP request failed: %v", err)
		return ctx.JSON(http.StatusBadGateway, map[string]string{"error": "Failed to contact password change endpoint"})
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		ctx.Server.Logger().Errorf("Password change failed, status %d: %s", resp.StatusCode, string(bodyBytes))
		return ctx.JSON(resp.StatusCode, map[string]string{"error": "Password change rejected by upstream server"})
	}

	// Update the session password
	err = ctx.Server.Sessions.UpdatePassword(ctx.Session, req.Password)
	if err != nil {
		ctx.Server.Logger().Errorf("Failed to update session password: %v", err)
		return ctx.JSON(http.StatusOK, map[string]string{"message": "Password changed, but please log in again"})
	}

	// Also update login token if present
	if tokenUsername, _, verified2FA := ctx.GetLoginToken(); tokenUsername == username {
		// Keep the persistent status from the old cookie
		loginCookie, _ := ctx.Cookie("alps_login_token")
		isPersistent := loginCookie != nil && loginCookie.Expires.After(time.Now().Add(24*time.Hour))
		ctx.SetLoginToken(username, req.Password, verified2FA, isPersistent)
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "Password successfully changed"})
}

// PasswordChangeRequest represents a password change payload
type PasswordChangeRequest struct {
	OldPassword string `json:"old_password" form:"old_password"`
	Password    string `json:"password" form:"password"`
}
