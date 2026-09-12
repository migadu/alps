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
// sieveError logs what actually happened and answers with a stable slug.
//
// Every 500 in this file returned err.Error() in the body. For connectClient
// that renders the ManageSieve host, port and TLS failure verbatim; for the rest
// it relays the server's own protocol response. Neither is something the user
// can act on, and both describe the deployment to anyone who can reach the web
// UI — the shape 6cdf808 corrected for the mailbox verbs.
//
// The script VALIDATION errors are deliberately left as they are: those are
// produced locally by go-sieve against content the user just typed, and they
// are the whole point of the editor.
func sieveError(ctx *alps.Context, op string, err error) error {
	ctx.Server.Logger().Printf("managesieve: failed to %s: %v", op, err)
	return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "sieve_unavailable"})
}

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

	// Upgrade to TLS before authenticating. Credentials are sent as SASL PLAIN,
	// so a plaintext connection would disclose the account password. Require
	// STARTTLS unless the operator explicitly opted into insecure mode; do not
	// silently fall back to cleartext just because the (unauthenticated,
	// spoofable) capability list omits STARTTLS — that is a downgrade attack.
	if _, ok := c.capabilities["STARTTLS"]; ok {
		host, _, _ := strings.Cut(addr, ":")
		if err := c.StartTLS(&tls.Config{ServerName: host, InsecureSkipVerify: p.insecure}); err != nil {
			c.Close()
			return nil, fmt.Errorf("STARTTLS failed: %w", err)
		}
	} else if !p.insecure {
		c.Close()
		return nil, fmt.Errorf("ManageSieve server does not offer STARTTLS; refusing to send credentials over an unencrypted connection (use the managesieve+insecure:// scheme to override)")
	} else {
		ctx.Server.Logger().Printf("WARNING: ManageSieve connecting without TLS (insecure scheme); credentials are sent in cleartext")
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
		return sieveError(ctx, "connect to the sieve server", err)
	}
	defer c.Close()

	scripts, err := c.ListScripts()
	if err != nil {
		return sieveError(ctx, "list scripts", err)
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
		return sieveError(ctx, "get script", err)
	}

	return ctx.JSON(http.StatusOK, map[string]string{"content": content})
}

// The largest Sieve script this endpoint will read. Real filter sets are a few
// kilobytes; the ManageSieve server enforces its own MAXSCRIPTSIZE on top. The
// point of the cap here is that json.Decode on an unbounded body buffers
// whatever is sent before anything gets to judge it — the same gap 6fd59a1
// closed on the attachment and compose routes.
const maxScriptBytes = 1 << 20

func (p *plugin) handlePutScript(ctx *alps.Context) error {
	ctx.Request.Body = http.MaxBytesReader(ctx.Response, ctx.Request.Body, maxScriptBytes)

	var payload ScriptPayload
	if err := json.NewDecoder(ctx.Request.Body).Decode(&payload); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	c, err := p.connectClient(ctx)
	if err != nil {
		return sieveError(ctx, "connect to the sieve server", err)
	}
	defer c.Close()

	// Extract allowed extensions from capabilities
	sieveCaps := c.capabilities["SIEVE"]
	allowedExts := strings.Fields(sieveCaps)

	if strings.TrimSpace(payload.Content) == "" {
		// Deactivate script if empty
		if err := c.SetActive(""); err != nil {
			return sieveError(ctx, "deactivate script", err)
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
		return sieveError(ctx, "list scripts", err)
	}
	name := activeScript(scripts)
	if name == "" {
		name = defaultScriptName
	}

	// Upload the script
	if err := c.PutScript(name, payload.Content); err != nil {
		return sieveError(ctx, "upload script", err)
	}

	// Activate it
	if err := c.SetActive(name); err != nil {
		return sieveError(ctx, "activate script", err)
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "Script saved and activated successfully"})
}

func (p *plugin) handleValidate(ctx *alps.Context) error {
	ctx.Request.Body = http.MaxBytesReader(ctx.Response, ctx.Request.Body, maxScriptBytes)

	var payload ScriptPayload
	if err := json.NewDecoder(ctx.Request.Body).Decode(&payload); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request payload"})
	}

	c, err := p.connectClient(ctx)
	if err != nil {
		return sieveError(ctx, "connect to the sieve server", err)
	}
	defer c.Close()

	sieveCaps := c.capabilities["SIEVE"]
	allowedExts := strings.Fields(sieveCaps)

	if err := ValidateScript(payload.Content, allowedExts); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid Sieve script: " + err.Error()})
	}

	return ctx.JSON(http.StatusOK, map[string]string{"message": "Script is valid"})
}
