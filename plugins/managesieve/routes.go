package managesieve

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/emersion/go-sasl"
	"github.com/migadu/alps"
)

// defaultScriptName is the name alps uses when creating a script for an
// account that has none yet. When a script already exists, alps edits that
// one in place rather than creating a separate script.
const defaultScriptName = "alps-filters"

type ScriptPayload struct {
	Content string `json:"content"`
}

// activeScript returns the name of the currently active script, or "" if none.
func activeScript(scripts []Script) string {
	for _, s := range scripts {
		if s.Active {
			return s.Name
		}
	}
	return ""
}

func (p *plugin) connectClient(ctx *alps.Context) (*MSClient, error) {
	username := ctx.Session.Username()

	if p.url == nil {
		return nil, fmt.Errorf("ManageSieve server is not configured")
	}

	addr := p.url.Host
	if p.url.Port() == "" {
		addr = fmt.Sprintf("%s:4190", addr)
	}

	c, err := Dial(addr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ManageSieve server: %w", err)
	}

	if ctx.Server.Options.Debug {
		c.SetDebug(os.Stdout)
	}

	// Upgrade to TLS if supported
	if _, ok := c.capabilities["STARTTLS"]; ok {
		host, _, _ := strings.Cut(addr, ":")
		if err := c.StartTLS(&tls.Config{ServerName: host}); err != nil {
			c.Close()
			return nil, fmt.Errorf("STARTTLS failed: %w", err)
		}
	}

	// Authenticate
	auth := sasl.NewPlainClient("", username, ctx.Session.Password())
	if err := c.Authenticate(auth); err != nil {
		c.Close()
		return nil, fmt.Errorf("authentication failed: %w", err)
	}

	return c, nil
}

func (p *plugin) handleGetScript(ctx *alps.Context) error {
	c, err := p.connectClient(ctx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer c.Close()

	scripts, err := c.ListScripts()
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to list scripts: " + err.Error()})
	}

	// Load the currently active script, whatever its name. This surfaces
	// filters created outside alps (e.g. an existing "catchall") instead of
	// showing "No rules defined". If nothing is active there's nothing to show.
	name := activeScript(scripts)
	if name == "" {
		return ctx.JSON(http.StatusOK, map[string]string{"content": ""})
	}

	content, err := c.GetScript(name)
	if err != nil {
		if strings.Contains(err.Error(), "script not found") {
			return ctx.JSON(http.StatusOK, map[string]string{"content": ""})
		}
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to get script: " + err.Error()})
	}

	return ctx.JSON(http.StatusOK, map[string]string{"content": content})
}

func (p *plugin) handlePutScript(ctx *alps.Context) error {
	var payload ScriptPayload
	if err := json.NewDecoder(ctx.Request.Body).Decode(&payload); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	c, err := p.connectClient(ctx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer c.Close()

	// Extract allowed extensions from capabilities
	sieveCaps := c.capabilities["SIEVE"]
	allowedExts := strings.Fields(sieveCaps)

	if strings.TrimSpace(payload.Content) == "" {
		// Deactivate script if empty
		if err := c.SetActive(""); err != nil {
			return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to deactivate script: " + err.Error()})
		}
		// Optionally delete it

		return ctx.JSON(http.StatusOK, map[string]string{"message": "Script deactivated successfully"})
	}

	// Validate the script
	if err := ValidateScript(payload.Content, allowedExts); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid Sieve script: " + err.Error()})
	}

	// Edit the currently active script in place rather than creating a
	// separate one. Only fall back to the default name when the account has
	// no active script yet.
	scripts, err := c.ListScripts()
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to list scripts: " + err.Error()})
	}
	name := activeScript(scripts)
	if name == "" {
		name = defaultScriptName
	}

	// Upload the script
	if err := c.PutScript(name, payload.Content); err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to upload script: " + err.Error()})
	}

	// Activate it
	if err := c.SetActive(name); err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to activate script: " + err.Error()})
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "Script saved and activated successfully"})
}

func (p *plugin) handleValidate(ctx *alps.Context) error {
	var payload ScriptPayload
	if err := json.NewDecoder(ctx.Request.Body).Decode(&payload); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	c, err := p.connectClient(ctx)
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	defer c.Close()

	sieveCaps := c.capabilities["SIEVE"]
	allowedExts := strings.Fields(sieveCaps)

	if err := ValidateScript(payload.Content, allowedExts); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid Sieve script: " + err.Error()})
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "Script is valid"})
}
