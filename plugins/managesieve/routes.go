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

type ScriptPayload struct {
	Content string `json:"content"`
}

func (p *plugin) connectClient(ctx *alps.Context) (*MSClient, error) {
	username := ctx.Session.Username()
	
	if p.url == nil {
		return nil, fmt.Errorf("ManageSieve upstream is not configured")
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

	content, err := c.GetScript("alps-filters")
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

	// Upload the script
	if err := c.PutScript("alps-filters", payload.Content); err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to upload script: " + err.Error()})
	}

	// Activate it
	if err := c.SetActive("alps-filters"); err != nil {
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
