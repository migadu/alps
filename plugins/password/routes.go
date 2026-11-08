package password

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/migadu/alps/provider"
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

	// Command runs a program in place of the HTTP request: the program first,
	// then each of its arguments. See command.go.
	Command []string `json:"-"`
	Stdin   string   `json:"stdin"`
}

// parseConfig reads an option block. It is lenient about the HTTP options, as
// it always was, and strict about a command, which must run as written.
func parseConfig(opts map[string]interface{}) (*PasswordChangeConfig, error) {
	var cfg PasswordChangeConfig
	if opts == nil {
		return &cfg, nil
	}
	b, _ := json.Marshal(opts)
	json.Unmarshal(b, &cfg)
	if raw, ok := opts["command"]; ok {
		b, _ := json.Marshal(raw)
		if err := json.Unmarshal(b, &cfg.Command); err != nil || len(cfg.Command) == 0 {
			return nil, errors.New("command must be a list: the program, then each of its arguments")
		}
	}
	if err := cfg.validateCommand(); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func handlePasswordChange(ctx *alps.Context) error {
	pluginCfg, ok := ctx.Server.Options.Plugins["password"]
	if !ok || !pluginCfg.Enabled {
		return ctx.JSON(http.StatusForbidden, map[string]string{"error": "Password change is not enabled", "code": "password_change_disabled"})
	}
	// A provider that routes per domain names its own admin API here: two
	// backends mean two APIs with separate credentials, so the whole block is
	// replaced rather than merged. A nil answer keeps the global one.
	opts := pluginCfg.Options
	if routed := ctx.Server.ServiceOptionsFor(provider.ServicePassword, ctx.Session.Username()); routed != nil {
		opts = routed
	}
	cfg, err := parseConfig(opts)
	if err != nil {
		ctx.Server.Logger().Errorf("Password change is misconfigured: %v", err)
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Password change service unavailable", "code": "password_service_unavailable"})
	}

	var req PasswordChangeRequest
	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
	} else {
		req.OldPassword = ctx.FormValue("old_password")
		req.Password = ctx.FormValue("password")
	}

	if req.OldPassword == "" || req.Password == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Old and new password are required", "code": "password_required"})
	}

	// Verify the supplied current password against the authenticated session
	// before contacting the backend. Without this, a hijacked or CSRF'd (but
	// authenticated) session could set a new password without proving knowledge
	// of the current one — the backend only enforces old_password if the
	// deployment's payload_mapping happens to forward it. The check takes the
	// same time whatever was typed; see CheckPassword.
	//
	// The check counts against the login limits for the account and the
	// address it comes from, as the login form and the second factor's
	// password confirmations do.
	username := ctx.Session.Username()
	if allowed, reason, retryAfter := ctx.Server.RateLimiter.CheckLoginAllowed(ctx.Request, username); !allowed {
		ctx.Server.Logger().Printf("Password change: current password check rate limited for %s", username)
		seconds := int(retryAfter.Seconds())
		if seconds > 0 {
			ctx.Response.Header().Set("Retry-After", fmt.Sprintf("%d", seconds))
		}
		return ctx.JSON(http.StatusTooManyRequests, map[string]interface{}{
			"error":       reason,
			"code":        "rate_limited",
			"retry_after": seconds,
		})
	}
	correct := ctx.Session.CheckPassword(req.OldPassword)
	ctx.Server.RateLimiter.RecordLoginAttempt(ctx.Request, username, correct)
	if !correct {
		return ctx.JSON(http.StatusForbidden, map[string]string{"error": "Current password is incorrect", "code": "current_password_incorrect"})
	}

	parts := strings.SplitN(username, "@", 2)
	local := username
	domain := ""
	if len(parts) == 2 {
		local = parts[0]
		domain = parts[1]
	}

	if len(cfg.Command) > 0 {
		failure := runCommand(ctx.Request.Context(), cfg, map[string]string{
			"{email}":        username,
			"{local}":        local,
			"{domain}":       domain,
			"{old_password}": req.OldPassword,
			"{new_password}": req.Password,
		})
		if failure != nil {
			ctx.Server.Logger().Errorf("Password change command failed for %s: %v", username, failure.err)
			return ctx.JSON(failure.status, map[string]string{"error": failure.message, "code": failure.code})
		}
		return passwordChanged(ctx, username, req.Password)
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
		return ctx.JSON(http.StatusBadGateway, map[string]string{"error": "Failed to contact password change endpoint", "code": "password_service_unavailable"})
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		ctx.Server.Logger().Errorf("Password change failed, status %d: %s", resp.StatusCode, string(bodyBytes))
		return ctx.JSON(resp.StatusCode, map[string]string{"error": "Password change rejected by server", "code": "password_change_rejected"})
	}

	return passwordChanged(ctx, username, req.Password)
}

// passwordChanged brings the session up to date with a password the backend
// has just changed.
func passwordChanged(ctx *alps.Context, username, password string) error {
	// Update the session password
	err := ctx.Server.Sessions.UpdatePasswordContext(ctx.Request.Context(), ctx.Session, password)
	if err != nil {
		ctx.Server.Logger().Errorf("Failed to update session password: %v", err)
		return ctx.JSON(http.StatusOK, map[string]string{"message": "Password changed, but please log in again", "code": "reauthenticate"})
	}

	// Also update login token if present, preserving the persistence setting
	if tokenUsername, _, verified2FA, persistent := ctx.GetLoginToken(); tokenUsername == username {
		ctx.SetLoginToken(username, password, verified2FA, persistent)
	}

	// Every account this one is linked to stores this account's password,
	// encrypted, in its own METADATA — and the change just made all of those
	// stale. Switching back from any of them would be rejected with the old
	// password, silently.
	if failed := ctx.Session.RefreshLinkedCredentials(password); failed > 0 {
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"message": "Password successfully changed",
			"warning": "linked_accounts_not_refreshed",
			"count":   failed,
		})
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "Password successfully changed", "code": "password_changed"})
}

// PasswordChangeRequest represents a password change payload
type PasswordChangeRequest struct {
	OldPassword string `json:"old_password" form:"old_password"`
	Password    string `json:"password" form:"password"`
}
