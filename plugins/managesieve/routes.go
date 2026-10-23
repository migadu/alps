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
// account that has none active. When a script is active, alps edits that one
// in place rather than creating a separate script.
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

	ep := p.endpointFor(ctx.Session.Username())
	if ep.url == nil {
		return nil, fmt.Errorf("ManageSieve server is not configured")
	}

	addr := ep.url.Host
	if ep.url.Port() == "" {
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
		serverName := ep.url.Hostname()
		if err := c.StartTLS(&tls.Config{ServerName: serverName, InsecureSkipVerify: ep.insecure}); err != nil {
			c.Close()
			return nil, fmt.Errorf("STARTTLS failed: %w", err)
		}
	} else if !ep.insecure {
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

// sieveExtensions is the server's SIEVE capability as a list: the extensions a
// script may require. The page reads it to offer only what the server runs —
// an auto-reply needs "vacation", and its dates "date" and "relational" — and
// it is never nil, so a server that advertises nothing answers [] and not null.
func sieveExtensions(c *MSClient) []string {
	return append([]string{}, strings.Fields(c.capabilities["SIEVE"])...)
}

func (p *plugin) handleGetScript(ctx *alps.Context) error {
	c, err := p.connectClient(ctx)
	if err != nil {
		return sieveError(ctx, "connect to the sieve server", err)
	}
	defer c.Close()

	// Taken before the first command: every response read through
	// readResponse starts the capability map afresh.
	extensions := sieveExtensions(c)

	scripts, err := c.ListScripts()
	if err != nil {
		return sieveError(ctx, "list scripts", err)
	}

	// Load the currently active script, whatever its name. This surfaces
	// filters created outside alps (e.g. an existing "catchall") instead of
	// showing "No rules defined". If nothing is active there's nothing to show.
	name := activeScript(scripts)
	if name == "" {
		return ctx.JSON(http.StatusOK, map[string]any{"content": "", "extensions": extensions})
	}

	content, err := c.GetScript(name)
	if err != nil {
		if strings.Contains(err.Error(), "script not found") {
			return ctx.JSON(http.StatusOK, map[string]any{"content": "", "extensions": extensions})
		}
		return sieveError(ctx, "get script", err)
	}

	return ctx.JSON(http.StatusOK, map[string]any{"content": content, "extensions": extensions})
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
		scripts, err := c.ListScripts()
		if err != nil {
			return sieveError(ctx, "list scripts", err)
		}
		active := activeScript(scripts)
		// Deactivate script if empty
		if err := c.SetActive(""); err != nil {
			return sieveError(ctx, "deactivate script", err)
		}
		// And empty it: the rules were removed, and rules left in a script that
		// is switched off read as filters paused elsewhere, which a later save
		// keeps (see scriptNameToCreate). Filtering is off either way, so a
		// server that refuses the empty script only costs the next save a new
		// name.
		if active != "" {
			if err := c.PutScript(active, ""); err != nil {
				ctx.Server.Logger().Printf("managesieve: failed to empty the deactivated script %q: %v", active, err)
			}
		}

		return ctx.JSON(http.StatusOK, map[string]string{"message": "Script deactivated successfully"})
	}

	// Validate the script
	if err := ValidateScript(payload.Content, allowedExts); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid Sieve script: " + err.Error()})
	}

	// Edit the currently active script in place rather than creating a
	// separate one. Only fall back to a name of alps's own when the account
	// has no active script.
	scripts, err := c.ListScripts()
	if err != nil {
		return sieveError(ctx, "list scripts", err)
	}
	name := activeScript(scripts)
	if name == "" {
		if name, err = scriptNameToCreate(c, scripts); err != nil {
			return sieveError(ctx, "get script", err)
		}
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

// scriptNameToCreate is the name to save the filters under when no script is
// active: alps-filters, or, when that holds rules, alps-filters-2, -3 and so
// on, the first that is not stored or holds nothing.
//
// With no script active the page shows no rules, as handleGetScript reads
// only the active script, and a save to alps-filters replaced whatever it
// held with the rules on the page: filters paused from another client, or by
// an administrator, were lost unseen. Those are left as they are, switched
// off, and the rules saved go beside them. alps empties a script it switches
// off itself, so that one is used again.
func scriptNameToCreate(c *MSClient, scripts []Script) (string, error) {
	stored := make(map[string]bool, len(scripts))
	for _, s := range scripts {
		stored[s.Name] = true
	}
	for n := 1; ; n++ {
		name := defaultScriptName
		if n > 1 {
			name = fmt.Sprintf("%s-%d", defaultScriptName, n)
		}
		if !stored[name] {
			return name, nil
		}
		content, err := c.GetScript(name)
		if err != nil && !strings.Contains(err.Error(), "script not found") {
			return "", err
		}
		if strings.TrimSpace(content) == "" {
			return name, nil
		}
	}
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
