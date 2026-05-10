package alps

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/imap"
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

	// maps protocols to URLs (protocol can be empty for auto-discovery)
	upstreams map[string]*url.URL
	WebAuthn  *webauthn.WebAuthn // Global WebAuthn instance

	imap struct {
		host     string
		tls      bool
		insecure bool
	}
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

	s.upstreams = make(map[string]*url.URL, len(options.Upstreams))
	for _, upstream := range options.Upstreams {
		u, err := parseUpstream(upstream)
		if err != nil {
			return nil, fmt.Errorf("failed to parse upstream %q: %v", upstream, err)
		}
		if _, ok := s.upstreams[u.Scheme]; ok {
			return nil, fmt.Errorf("found two upstream servers for scheme %q", u.Scheme)
		}
		s.upstreams[u.Scheme] = u
	}

	if err := s.parseIMAPUpstream(); err != nil {
		return nil, err
	}
	if err := s.parseSMTPUpstream(); err != nil {
		return nil, err
	}

	// Create provider factory
	providerFactory := s.createProviderFactory()

	s.Sessions = newSessionManager(providerFactory, s.dialSMTP, logger, options.CacheTTL, options.CacheEnabled, options.LoginKey, options.SessionDuration, options.MaxSessionDuration, options.MaxSessions, options.MaxSessionsPerUser, options.MaxAttachmentMiB, options.MaxSessionAttachmentMiB, options.MaxGlobalAttachmentMiB)

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

// createProviderFactory creates a factory function for mail providers
func (s *Server) createProviderFactory() provider.AuthenticatedProviderFactory {
	return func(username, password string) (provider.MailProvider, error) {
		// Currently only IMAP provider is supported
		client, err := imap.Connect(s.imap.host, s.imap.tls, s.imap.insecure, s.Options.IMAPTimeout, s.Options.Debug)
		if err != nil {
			return nil, err
		}

		if err := client.Login(username, password).Wait(); err != nil {
			client.Logout()
			return nil, AuthError{err}
		}

		return imap.NewIMAPProvider(client, s.Options.Debug), nil
	}
}

func parseUpstream(str string) (*url.URL, error) {
	if !strings.ContainsAny(str, ":/") {
		// This is a raw domain name, make it an URL with an empty scheme
		str = "//" + str
	}
	return url.Parse(str)
}

type NoUpstreamError struct {
	schemes []string
}

func (err *NoUpstreamError) Error() string {
	return fmt.Sprintf("no upstream server configured for schemes %v", err.schemes)
}

// Upstream retrieves the configured upstream server URL for the provided
// schemes. If no configured upstream server matches, a *NoUpstreamError is
// returned. An empty URL.Scheme means that the caller needs to perform
// auto-discovery with URL.Host.
func (s *Server) Upstream(schemes ...string) (*url.URL, error) {
	var urls []*url.URL
	for _, scheme := range append(schemes, "") {
		u, ok := s.upstreams[scheme]
		if ok {
			urls = append(urls, u)
		}
	}
	if len(urls) == 0 {
		return nil, &NoUpstreamError{schemes}
	}
	if len(urls) > 1 {
		return nil, fmt.Errorf("multiple upstream servers are configured for schemes %v", schemes)
	}
	return urls[0], nil
}

func (s *Server) parseIMAPUpstream() error {
	u, err := s.Upstream("imap", "imaps", "imap+insecure")
	if err != nil {
		return fmt.Errorf("failed to parse upstream IMAP server: %v", err)
	}

	if u.Scheme == "" {
		return fmt.Errorf("upstream IMAP server requires a scheme (imaps://, imap://, imap+insecure://), got: %v", u.String())
	}

	switch u.Scheme {
	case "imaps":
		s.imap.tls = true
	case "imap+insecure":
		s.imap.insecure = true
	}

	s.imap.host = u.Host
	if !strings.ContainsRune(s.imap.host, ':') {
		if u.Scheme == "imaps" {
			s.imap.host += ":993"
		} else {
			s.imap.host += ":143"
		}
	}

	s.logger.Printf("Configured upstream IMAP server: %v", u)
	return nil
}

func (s *Server) parseSMTPUpstream() error {
	u, err := s.Upstream("smtp", "smtps", "smtp+insecure")
	if _, ok := err.(*NoUpstreamError); ok {
		return nil
	} else if err != nil {
		return fmt.Errorf("failed to parse upstream SMTP server: %v", err)
	}

	if u.Scheme == "" {
		return fmt.Errorf("upstream SMTP server requires a scheme (smtps://, smtp://, smtp+insecure://), got: %v", u.String())
	}

	switch u.Scheme {
	case "smtps":
		s.smtp.tls = true
	case "smtp+insecure":
		s.smtp.insecure = true
	}

	s.smtp.host = u.Host
	if !strings.ContainsRune(s.smtp.host, ':') {
		if u.Scheme == "smtps" {
			s.smtp.host += ":465"
		} else {
			s.smtp.host += ":587"
		}
	}

	s.logger.Printf("Configured upstream SMTP server: %v", u)
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

func isPublic(path string) bool {
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
	return path == "/session"
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
	ctx.Server.logger.Debugf("handleUnauthenticated: path=%s, isPublic=%v", path, isPublic(path))
	if isPublic(path) {
		return next(ctx)
	} else {
		return redirectToLogin(ctx)
	}
}

type Options struct {
	Upstreams               []string
	Debug                   bool
	LoginKey                *fernet.Key
	EnabledPlugins          []string                // If empty, all plugins are enabled
	CacheTTL                time.Duration           // Cache TTL, 0 means use default (10 minutes)
	CacheEnabled            bool                    // If false, caching is disabled
	SessionDuration         time.Duration           // Session timeout, 0 means use default (30 minutes)
	MaxSessionDuration      time.Duration           // Maximum session duration users can set, 0 means no limit
	MaxSessions             int                     // Maximum total concurrent sessions, 0 means unlimited (default: 10000)
	MaxSessionsPerUser      int                     // Maximum sessions per username, 0 means unlimited (default: 10)
	MaxAttachmentMiB        int                     // Max attachment size per composer in MiB
	MaxSessionAttachmentMiB int                     // Max attachment size per session in MiB
	MaxGlobalAttachmentMiB  int                     // Max global attachment size in MiB
	RateLimitConfig         *RateLimitConfig        // Rate limiting config, nil = use defaults
	RateLimitEnabled        bool                    // If false, rate limiting is disabled
	ReadTimeout             time.Duration           // HTTP read timeout, 0 means use default (10 seconds)
	WriteTimeout            time.Duration           // HTTP write timeout, 0 means use default (30 seconds)
	IdleTimeout             time.Duration           // HTTP idle timeout, 0 means use default (120 seconds)
	IMAPTimeout             time.Duration           // IMAP operation timeout, 0 means use default (30 seconds)
	SMTPTimeout             time.Duration           // SMTP operation timeout, 0 means use default (30 seconds)
	WebAuthn                WebAuthnOptions         // WebAuthn configuration
	Plugins                 map[string]PluginConfig // Generic plugin configuration
	ClusterBroadcaster      ClusterBroadcaster      // Optional interface for cluster message broadcasting
}

type WebAuthnOptions struct {
	RPID          string
	RPDisplayName string
	RPOrigins     []string
}

type PluginConfig struct {
	Enabled  bool                   `toml:"enabled"`
	Upstream string                 `toml:"upstream"`
	Options  map[string]interface{} `toml:"options"`
}

// setupMiddleware registers middleware on the router.
// This is called both during initial setup and during reload.
func (s *Server) setupMiddleware(router *Router) {
	// Security headers middleware
	router.Use(func(next HandlerFunc) HandlerFunc {
		return func(ctx *Context) error {
			// `style-src 'unsafe-inline'` is required for e-mails with embedded stylesheets
			// `img-src data:` and `font-src data:` are required for placeholder resources in sandboxed iframes
			ctx.Response.Header().Set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline'")
			// DNS prefetching has privacy implications
			ctx.Response.Header().Set("X-DNS-Prefetch-Control", "off")
			return next(ctx)
		}
	})

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
			if err == ErrSessionExpired {
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
					// Clear any stale 2FA cookies from previous login attempts
					ctx.SetCookie(&http.Cookie{
						Name:     "alps_2fa_pending",
						Value:    "",
						Path:     "/",
						HttpOnly: true,
						MaxAge:   -1,
					})
					ctx.SetCookie(&http.Cookie{
						Name:     "alps_2fa_remember",
						Value:    "",
						Path:     "/",
						HttpOnly: true,
						MaxAge:   -1,
					})
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
	var authErr AuthError
	shouldLogout := false

	if errors.As(err, &authErr) {
		s.logger.Debugf("Authentication error detected, logging out user")
		shouldLogout = true
	} else if strings.Contains(err.Error(), "failed to re-connect to IMAP server") {
		s.logger.Debugf("IMAP reconnection failed, logging out user")
		shouldLogout = true
	} else if strings.Contains(err.Error(), "connection") && strings.Contains(err.Error(), "refused") {
		s.logger.Debugf("Connection refused, logging out user")
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
