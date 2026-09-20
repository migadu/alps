package alps

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/migadu/alps/provider"
)

const (
	cookieName           = "alps_session"
	loginTokenCookieName = "alps_login_token"
)

//go:embed all:frontend/dist
var frontendFS embed.FS

// Server holds all the alps server state.
type Server struct {
	logger      Logger
	Sessions    *SessionManager
	RateLimiter *RateLimiter
	Scheduler   *Scheduler
	Options     *Options

	router  *Router
	plugins []Plugin

	WebAuthn *webauthn.WebAuthn // Global WebAuthn instance

	smtp struct {
		host     string
		tls      bool
		insecure bool
	}
}

func newServer(logger Logger, options *Options) (*Server, error) {
	s := &Server{
		logger:  logger,
		Options: options,
	}

	if err := s.parseSMTPServer(); err != nil {
		return nil, err
	}

	if options.Provider == nil {
		return nil, fmt.Errorf("no mail provider configured")
	}

	// Create provider factory
	providerFactory := options.Provider.CreateFactory(options.ProviderTimeout, options.Debug)

	s.Sessions = newSessionManager(providerFactory, s.dialSMTP, logger, options.CacheTTL, options.CacheEnabled, options.LoginKey, options.SessionDuration, options.MaxSessionDuration, options.MaxSessions, options.MaxSessionsPerUser, options.MaxAttachmentMiB, options.MaxSessionAttachmentMiB, options.MaxGlobalAttachmentMiB)
	// Set after construction rather than as a fourteenth positional argument to
	// newSessionManager, which every session test already calls.
	if options.AbsoluteSessionDuration != 0 {
		s.Sessions.absoluteSessionDuration = options.AbsoluteSessionDuration
	}

	// Initialize rate limiter if enabled
	if options.RateLimitEnabled {
		config := DefaultRateLimitConfig()
		if options.RateLimitConfig != nil {
			config = *options.RateLimitConfig
		}
		s.RateLimiter = NewRateLimiter(config, logger, options.ClusterBroadcaster)
		logger.Printf("Rate limiting enabled: IP=%d/min, %d/hour | User=%d/15min, %d/hour | Global=%d/sec",
			config.IPRequestsPerMinute, config.IPRequestsPerHour,
			config.UsernameFailsPerQuarter, config.UsernameFailsPerHour,
			config.GlobalRequestsPerSecond)
	}

	// Initialize Scheduler (runs every 1 hour)
	s.Scheduler = NewScheduler(1 * time.Hour)
	s.Scheduler.Register("core:cleanup_temp_attachments", cleanupTempAttachments)
	s.Scheduler.Start(logger)

	return s, nil
}

func cleanupTempAttachments() error {
	tempDir := os.TempDir()
	entries, err := os.ReadDir(tempDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	threshold := time.Now().Add(-7 * 24 * time.Hour) // 7 days
	for _, entry := range entries {
		if !strings.HasPrefix(entry.Name(), "multipart-") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		if info.ModTime().Before(threshold) {
			os.Remove(filepath.Join(tempDir, entry.Name()))
		}
	}
	return nil
}

func (s *Server) Close() {
	s.Sessions.Close()
	if s.RateLimiter != nil {
		s.RateLimiter.Close()
	}
	if s.Scheduler != nil {
		s.Scheduler.Stop()
	}
}

// LoadedPluginNames returns a list of plugin names that are currently loaded
func (s *Server) LoadedPluginNames() []string {
	var names []string
	for _, p := range s.plugins {
		names = append(names, p.Name())
	}
	return names
}

// ParseServerURL parses a connection string into a url.URL.
// If the string lacks a scheme, it prepends // to ensure correct parsing of the hostname.
func ParseServerURL(str string) (*url.URL, error) {
	if !strings.ContainsAny(str, ":/") {
		// This is a raw domain name, make it an URL with an empty scheme
		str = "//" + str
	}
	return url.Parse(str)
}

// parseSMTPURL resolves a submission server URL into the address to dial and
// the transport it implies. insecureOpt forces insecure mode on regardless of
// scheme, mirroring the [smtp] insecure option.
func parseSMTPURL(raw string, insecureOpt bool) (host string, tls bool, insecure bool, err error) {
	u, err := ParseServerURL(raw)
	if err != nil {
		return "", false, false, fmt.Errorf("failed to parse SMTP server: %v", err)
	}

	if u.Scheme == "" {
		return "", false, false, fmt.Errorf("SMTP server requires a scheme (smtps://, smtp://, smtp+insecure://), got: %v", u.String())
	}

	switch u.Scheme {
	case "smtps":
		tls = true
	case "smtp+insecure":
		insecure = true
	case "smtp":
	default:
		return "", false, false, fmt.Errorf("unknown scheme for SMTP server: %v", u.Scheme)
	}

	if insecureOpt {
		insecure = true
	}

	host = u.Host
	if host == "" {
		return "", false, false, fmt.Errorf("SMTP server host cannot be empty")
	}
	if !strings.ContainsRune(host, ':') {
		if u.Scheme == "smtps" {
			host += ":465"
		} else {
			host += ":587"
		}
	}

	return host, tls, insecure, nil
}

func (s *Server) parseSMTPServer() error {
	if s.Options.SMTP.Server == "" {
		return fmt.Errorf("no SMTP server configured")
	}

	host, tls, insecure, err := parseSMTPURL(s.Options.SMTP.Server, s.Options.SMTP.Insecure)
	if err != nil {
		return err
	}
	s.smtp.host, s.smtp.tls, s.smtp.insecure = host, tls, insecure

	s.logger.Printf("Configured SMTP server: %v", s.Options.SMTP.Server)
	return nil
}

func (s *Server) loadPlugins() error {
	if s.Scheduler != nil {
		s.Scheduler.Clear()
	}

	var plugins []Plugin
	for _, load := range pluginLoaders {
		l, err := load(s)
		if err != nil {
			return fmt.Errorf("failed to load plugins: %v", err)
		}
		for _, p := range l {
			// Filter plugins based on EnabledPlugins list
			if len(s.Options.EnabledPlugins) > 0 {
				enabled := false
				for _, name := range s.Options.EnabledPlugins {
					if p.Name() == name {
						enabled = true
						break
					}
				}
				if !enabled {
					s.logger.Printf("Plugin %q is disabled (not in enabled list)", p.Name())
					continue
				}
			}
			s.logger.Printf("Loaded plugin %q", p.Name())
			plugins = append(plugins, p)
		}
	}

	// Create a new router for the plugins
	router := NewRouter(s)

	// Setup middleware on the new router
	s.setupMiddleware(router)

	// Register plugin routes
	for _, p := range plugins {
		p.SetRoutes(router.Group(""))
	}

	// Setup static routes using embedded filesystem
	distFS, err := fs.Sub(frontendFS, "frontend/dist")
	if err != nil {
		return fmt.Errorf("failed to get frontend/dist sub-filesystem: %v", err)
	}
	router.StaticFS("", http.FS(distFS))
	router.build = frontendBuild(distFS)

	s.router = router
	s.plugins = plugins

	return nil
}

// initialLoad sets up the router with middleware, static routes, and plugins during initial server creation.
func (s *Server) initialLoad() error {
	// Load plugins (which also sets up the router)
	return s.loadPlugins()
}

// Logger returns this server's logger.
func (s *Server) Logger() Logger {
	return s.logger
}

func isPublic(method, path string) bool {
	if strings.HasPrefix(path, "/plugins/") {
		parts := strings.Split(path, "/")
		if len(parts) >= 4 && parts[3] == "assets" {
			return true
		}
	}

	// Allow WebAuthn verification endpoints (uses pending 2FA cookie for auth)
	if strings.HasPrefix(path, "/webauthn/verify") {
		return true
	}
	// Signing in needs no session, and signing out must work without one: it
	// also clears the login token. Reading the session is an authenticated
	// request like any other, and was let through without one to a handler
	// that dereferenced it — a 500 on every reload of an expired tab.
	return path == "/session" && (method == http.MethodPost || method == http.MethodDelete)
}

func redirectToLogin(ctx *Context) error {
	return ctx.JSON(http.StatusUnauthorized, map[string]string{
		"error": "Unauthorized",
		"code":  "401",
	})
}

func handleUnauthenticated(next HandlerFunc, ctx *Context) error {
	// Require auth for all requests except /login and assets
	path := ctx.Request.URL.Path
	public := isPublic(ctx.Request.Method, path)
	ctx.Server.logger.Debugf("handleUnauthenticated: path=%s, isPublic=%v", path, public)
	if public {
		return next(ctx)
	} else {
		return redirectToLogin(ctx)
	}
}

type Options struct {
	SMTP               SMTPOptions // SMTP configuration
	Debug              bool
	LoginKey           *fernet.Key
	EnabledPlugins     []string      // If empty, all plugins are enabled
	CacheTTL           time.Duration // Cache TTL, 0 means use default (10 minutes)
	CacheEnabled       bool          // If false, caching is disabled
	SessionDuration    time.Duration // Session timeout, 0 means use default (30 minutes)
	MaxSessionDuration time.Duration // Maximum session duration users can set, 0 means no limit
	// How long a session may live no matter how much it is used. 0 means use
	// the default (7 days); negative disables the cap entirely, which leaves
	// sessions sliding forever — see defaultAbsoluteSessionDuration.
	AbsoluteSessionDuration time.Duration
	MaxSessions             int                     // Maximum total concurrent sessions, 0 means unlimited (default: 10000)
	MaxSessionsPerUser      int                     // Maximum sessions per username, 0 means unlimited (default: 10)
	MaxAttachmentMiB        int                     // Max attachment size per composer in MiB
	MaxSessionAttachmentMiB int                     // Max attachment size per session in MiB
	MaxGlobalAttachmentMiB  int                     // Max global attachment size in MiB
	RateLimitConfig         *RateLimitConfig        // Rate limiting config, nil = use defaults
	RateLimitEnabled        bool                    // If false, rate limiting is disabled
	TrustedProxies          []*net.IPNet            // Proxy IPs/CIDRs whose X-Forwarded-Proto/Host headers are trusted (e.g. for CSRF origin computation behind a TLS-terminating reverse proxy)
	TrustedOrigins          []string                // Additional origins accepted by the CSRF check (e.g. "https://webmail.example.com"), normalized to lowercase without a trailing slash
	ReadTimeout             time.Duration           // HTTP read timeout, 0 means use default (10 seconds)
	WriteTimeout            time.Duration           // HTTP write timeout, 0 means use default (30 seconds)
	IdleTimeout             time.Duration           // HTTP idle timeout, 0 means use default (120 seconds)
	ProviderTimeout         time.Duration           // Provider connect timeout, 0 means use default (30 seconds)
	SMTPTimeout             time.Duration           // SMTP operation timeout, 0 means use default (30 seconds)
	WebAuthn                WebAuthnOptions         // WebAuthn configuration
	Plugins                 map[string]PluginConfig // Generic plugin configuration
	Provider                provider.Options        // Mail provider configuration
	ClusterBroadcaster      ClusterBroadcaster      // Optional interface for cluster message broadcasting
}

type SMTPOptions struct {
	Server   string
	Insecure bool
}

type WebAuthnOptions struct {
	RPID          string
	RPDisplayName string
	RPOrigins     []string
}

type PluginConfig struct {
	Enabled bool                   `toml:"enabled"`
	Server  string                 `toml:"server"`
	Options map[string]interface{} `toml:"options"`
}

// setupMiddleware registers middleware on the router.
// This is called both during initial setup and during reload.
func (s *Server) setupMiddleware(router *Router) {
	// Baseline security headers (CSP, nosniff, DNS-prefetch) are applied to every
	// response in Router.ServeHTTP so they also cover static assets (the SPA shell
	// and JS/CSS bundles) served directly on the mux, which bypass this chain.

	// CSRF protection middleware (validates Origin/Referer for state-changing requests)
	router.Use(CSRFMiddleware)

	router.Use(func(next HandlerFunc) HandlerFunc {
		return func(ctx *Context) error {
			cookie, err := ctx.Cookie(cookieName)
			if err == http.ErrNoCookie {
				s.logger.Debugf("Auth middleware: no cookie for %s", ctx.Request.URL.Path)
				return handleUnauthenticated(next, ctx)
			} else if err != nil {
				return err
			}

			s.logger.Debugf("Auth middleware: found cookie for %s", ctx.Request.URL.Path)
			ctx.Session, err = ctx.Server.Sessions.get(cookie.Value)
			if errors.Is(err, ErrSessionExpired) {
				s.logger.Debugf("Auth middleware: session expired for %s", ctx.Request.URL.Path)
				ctx.SetSession(nil)

				// Attempt to restore session from encrypted login token
				username, password, verified2FA, persistent := ctx.GetLoginToken()
				if username != "" && password != "" {
					s.logger.Debugf("Auth middleware: attempting session restoration from login token for %s", ctx.Request.URL.Path)
					session, err := ctx.Server.Sessions.Put(username, password)
					if err != nil {
						s.logger.Debugf("Auth middleware: session restoration failed for %s: %v", ctx.Request.URL.Path, err)
						// Clear invalid login token
						ctx.SetLoginToken("", "", false, false)
						return handleUnauthenticated(next, ctx)
					}
					// Restore WebAuthn 2FA verified state
					session.SetAuthenticated2FA(verified2FA)

					s.logger.Debugf("Auth middleware: session restored successfully for %s", ctx.Request.URL.Path)
					// Restore session with original persistence setting
					ctx.Session = session
					ctx.SetSessionWithExpiry(session, persistent)
					// Clear 2FA cookies
					ctx.SetCookie(&http.Cookie{
						Name:     "alps_2fa_pending",
						Value:    "",
						Path:     "/",
						HttpOnly: true,
						SameSite: http.SameSiteStrictMode,
						Secure:   ctx.IsEffectiveHTTPS(),
						MaxAge:   -1,
					})
					ctx.SetCookie(&http.Cookie{
						Name:     "alps_2fa_remember",
						Value:    "",
						Path:     "/",
						HttpOnly: true,
						SameSite: http.SameSiteStrictMode,
						Secure:   ctx.IsEffectiveHTTPS(),
						MaxAge:   -1,
					})
					// The restored session takes the same gate as every other:
					// the request that restored it used to run regardless.
					if session.Requires2FA() && !session.IsAuthenticated2FA() {
						s.logger.Debugf("Auth middleware: restored session needs 2FA for %s", ctx.Request.URL.Path)
						return handleUnauthenticated(next, ctx)
					}
					// Continue with restored session
					ctx.Session.ping()
					err = next(ctx)
					s.logger.Debugf("Auth middleware: handler returned for %s, err=%v", ctx.Request.URL.Path, err)
					return err
				}

				return handleUnauthenticated(next, ctx)
			} else if err != nil {
				s.logger.Debugf("Auth middleware: error getting session for %s: %v", ctx.Request.URL.Path, err)
				return err
			}
			s.logger.Debugf("Auth middleware: session OK for %s", ctx.Request.URL.Path)

			// Enforce 2FA verification if required
			if ctx.Session.Requires2FA() && !ctx.Session.IsAuthenticated2FA() {
				s.logger.Debugf("Auth middleware: 2FA required but not verified for %s", ctx.Request.URL.Path)
				return handleUnauthenticated(next, ctx)
			}

			ctx.Session.ping()

			s.logger.Debugf("Auth middleware: calling handler for %s", ctx.Request.URL.Path)
			err = next(ctx)
			s.logger.Debugf("Auth middleware: handler returned for %s, err=%v", ctx.Request.URL.Path, err)
			return err
		}
	})
}

// New creates a new server.
func New(logger Logger, options *Options) (*Server, error) {
	s, err := newServer(logger, options)
	if err != nil {
		return nil, err
	}

	// Initial load: sets up router with middleware, static routes, and plugins
	if err := s.initialLoad(); err != nil {
		return nil, err
	}

	return s, nil
}

// ServeHTTP implements http.Handler.
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if s.router == nil {
		http.Error(w, "Server initializing", http.StatusServiceUnavailable)
		return
	}
	s.router.ServeHTTP(w, r)
}

// sanitizeError returns a safe error message for client consumption.
// Full error details are logged server-side only.
func sanitizeError(err error, code int) string {
	// For HTTPError, use the internal message if available
	if he, ok := err.(*HTTPError); ok {
		if he.Message != nil {
			if msg, ok := he.Message.(string); ok && msg != "" {
				return msg
			}
		}
	}

	// Generic messages based on status code
	switch code {
	case http.StatusBadRequest:
		return "Bad request"
	case http.StatusUnauthorized:
		return "Authentication required"
	case http.StatusForbidden:
		return "Access denied"
	case http.StatusNotFound:
		return "Resource not found"
	case http.StatusMethodNotAllowed:
		return "Method not allowed"
	case http.StatusRequestEntityTooLarge:
		return "Request too large"
	case http.StatusTooManyRequests:
		return "Too many requests"
	case http.StatusServiceUnavailable:
		return "Service temporarily unavailable"
	default:
		// Never expose internal error details
		return "An internal error occurred"
	}
}

// handleError handles errors returned by handlers.
func (s *Server) handleError(err error, ctx *Context) {
	// Log the full error server-side for debugging
	ctx.Logger().Errorf("Request error: %v", err)

	// Check if this is an authentication or connection error - if so, log out the user
	// to prevent endless loops
	var authErr provider.AuthError
	shouldLogout := false

	if errors.As(err, &authErr) {
		s.logger.Debugf("Authentication error detected, logging out user")
		shouldLogout = true
	} else if errors.Is(err, ErrMailProviderUnavailable) {
		s.logger.Debugf("Mail provider connection lost, logging out user")
		shouldLogout = true
	}

	if shouldLogout {
		if ctx.Session != nil {
			ctx.Session.Close()
			ctx.SetSession(nil)
		}
		ctx.SetLoginToken("", "", false, false)
		// Return 401 JSON response
		ctx.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Authentication required",
			"code":  "401",
		})
		return
	}

	// A message deleted or moved since it was listed is gone, not broken: sending
	// a draft removes the one the reader may still ask for.
	if errors.Is(err, provider.ErrMessageNotFound) {
		err = NewHTTPError(http.StatusNotFound, "Message not found")
	}

	code := http.StatusInternalServerError
	if he, ok := err.(*HTTPError); ok {
		code = he.Code
	}

	type ErrorResponse struct {
		Error  string `json:"error"`
		Code   int    `json:"code"`
		Status string `json:"status"`
	}

	response := ErrorResponse{
		Error:  sanitizeError(err, code),
		Code:   code,
		Status: http.StatusText(code),
	}

	if err := ctx.JSON(code, response); err != nil {
		ctx.Logger().Error(fmt.Errorf(
			"Error occured sending error JSON: %w", err))
	}
}

// ServiceURLFor asks the configured provider which endpoint a given login
// should use for a named service. It returns "" when the provider does not
// route per login, or has no opinion for this one, and the caller then keeps
// whatever is configured globally.
func (s *Server) ServiceURLFor(service, username string) string {
	router, ok := s.Options.Provider.(provider.ServiceRouter)
	if !ok {
		return ""
	}
	return router.ServiceURL(service, username)
}

// ServiceOptionsFor is ServiceURLFor for services configured by a block rather
// than an address. It returns nil when the global configuration should stand.
func (s *Server) ServiceOptionsFor(service, username string) map[string]interface{} {
	router, ok := s.Options.Provider.(provider.ServiceRouter)
	if !ok {
		return nil
	}
	return router.ServiceOptions(service, username)
}
