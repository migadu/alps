package alps

import (
	"embed"
	"errors"
	"fmt"
	"github.com/migadu/alps/internal/serviceurl"
	"io/fs"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
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

	router       *Router
	plugins      []Plugin
	closePlugins sync.Once

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
	if aware, ok := options.Provider.(provider.LoggerAware); ok {
		aware.SetLogger(s.Logger().Slog())
	}
	providerFactory := options.Provider.CreateFactory(options.ProviderTimeout, options.Debug)

	s.Sessions = newSessionManager(providerFactory, s.dialSMTP, logger, options.CacheTTL, options.CacheEnabled, options.LoginKey, options.SessionDuration, options.MaxSessionDuration, options.MaxSessions, options.MaxSessionsPerUser, options.MaxAttachmentMiB, options.MaxSessionAttachmentMiB, options.MaxGlobalAttachmentMiB)
	s.Sessions.davAllowPrivate = options.DAVAllowPrivateServers
	if options.DAVConnectionFreshFor != 0 {
		s.Sessions.davFreshFor = options.DAVConnectionFreshFor
	}
	// A provider that knows the address of a bare login says it: see
	// Session.Address.
	if r, ok := options.Provider.(provider.AddressResolver); ok {
		s.Sessions.addresses = r
	}
	// Set after construction rather than as a fourteenth positional argument to
	// newSessionManager, which every session test already calls.
	if options.AbsoluteSessionDuration != 0 {
		s.Sessions.absoluteSessionDuration = options.AbsoluteSessionDuration
	}
	s.Sessions.broadcaster = options.ClusterBroadcaster
	s.Sessions.backgroundConnections = !options.DisableBackgroundConnection
	// Push waits on the background connection, and needs it.
	s.Sessions.pushNewMail = options.PushNewMail && s.Sessions.backgroundConnections
	if options.PushNewMail && !s.Sessions.pushNewMail {
		logger.Printf("push_new_mail needs background_connection, which is off: new mail is not pushed")
	}
	s.Sessions.trackChanges = options.CondStore
	s.Sessions.pushFolders = options.PushSubscribedFolders && s.Sessions.pushNewMail
	if options.PushSubscribedFolders && !options.PushNewMail {
		logger.Printf("push_subscribed_folders needs push_new_mail, which is off: no news of the folders is pushed")
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
	s.Scheduler.Register("core:cleanup_temp_attachments", func() error {
		threshold := time.Now().Add(-7 * 24 * time.Hour) // 7 days
		return cleanupTempAttachments(os.TempDir(), threshold, s.Sessions.heldUploadFiles())
	})
	s.Scheduler.Start(logger)

	return s, nil
}

// cleanupTempAttachments removes the upload files (multipart-*) in tempDir
// last written before threshold, which a crash or a kill left behind. It keeps
// those in held, the files of uploads alps still holds: a session can keep an
// upload for longer than the threshold, and a send or a draft save of it
// would then fail for want of its file.
func cleanupTempAttachments(tempDir string, threshold time.Time, held map[string]bool) error {
	entries, err := os.ReadDir(tempDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	for _, entry := range entries {
		if !strings.HasPrefix(entry.Name(), "multipart-") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		path := filepath.Join(tempDir, entry.Name())
		if info.ModTime().Before(threshold) && !held[path] {
			os.Remove(path)
		}
	}
	return nil
}

// EndEventStreams ends the pages' event streams, which would otherwise hold a
// graceful shutdown of the HTTP server for as long as it waits: register it
// with http.Server.RegisterOnShutdown. The sessions go on until Close.
func (s *Server) EndEventStreams() {
	s.Sessions.endInboxWatches()
}

func (s *Server) Close() {
	s.Sessions.Close()
	if s.RateLimiter != nil {
		s.RateLimiter.Close()
	}
	if s.Scheduler != nil {
		s.Scheduler.Stop()
	}
	// Plugins load once, at start-up, and shutdown is the only time they are
	// let go. Only the first call closes them: the steps above are safe to
	// repeat, and a plugin's Close need not be.
	s.closePlugins.Do(func() {
		for _, p := range s.plugins {
			if err := p.Close(); err != nil {
				s.Logger().Errorf("Closing plugin %q: %v", p.Name(), err)
			}
		}
	})
}

// LoadedPluginNames returns a list of plugin names that are currently loaded
func (s *Server) LoadedPluginNames() []string {
	var names []string
	for _, p := range s.plugins {
		names = append(names, p.Name())
	}
	return names
}

// DAVDefaultServer returns the endpoint the loaded plugin actually uses after
// parsing and discovery. Settings and connection validation must use that same
// endpoint, including when a provider's invalid route falls back to the global
// server or startup discovery could not find one.
func (s *Server) DAVDefaultServer(service, username string) string {
	for _, p := range s.plugins {
		if p.Name() == service {
			if defaults, ok := p.(interface{ DAVDefaultServer(string) string }); ok {
				return defaults.DAVDefaultServer(username)
			}
		}
	}
	if endpoint := s.ServiceURLFor(service, username); endpoint != "" {
		return endpoint
	}
	return s.Options.Plugins[service].Server
}

// ParseServerURL parses a connection string into a url.URL.
// If the string lacks a scheme, it prepends // to ensure correct parsing of the hostname.
func ParseServerURL(raw string) (*url.URL, error) { return serviceurl.ParseServer(raw) }

// parseSMTPURL resolves a submission server URL into the address to dial and
// the transport it implies. insecureOpt forces insecure mode on regardless of
// scheme, mirroring the [smtp] insecure option.
func parseSMTPURL(raw string, insecureOpt bool) (string, bool, bool, error) {
	return serviceurl.ParseSMTP(raw, insecureOpt)
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

// PluginEnabled applies explicit per-plugin switches and the optional allow-list.
// The base plugin provides the core routes and is always required.
func (s *Server) PluginEnabled(name string) bool {
	if name == "base" || s.Options == nil {
		return true
	}
	if cfg, exists := s.Options.Plugins[name]; exists && !cfg.Enabled {
		return false
	}
	if len(s.Options.EnabledPlugins) == 0 {
		return true
	}
	for _, enabled := range s.Options.EnabledPlugins {
		if enabled == name {
			return true
		}
	}
	return false
}

func (s *Server) loadPlugins() (err error) {
	var plugins []Plugin
	// Until setup succeeds, these resources belong to this invocation rather
	// than s.plugins. Release all of them if a later loader or frontend fails.
	defer func() {
		if err != nil {
			for i := len(plugins) - 1; i >= 0; i-- {
				if closeErr := plugins[i].Close(); closeErr != nil {
					s.Logger().Errorf("Closing plugin %q after failed startup: %v", plugins[i].Name(), closeErr)
				}
			}
		}
	}()
	for _, load := range pluginLoaders {
		l, err := load(s)
		if err != nil {
			plugins = append(plugins, l...)
			return fmt.Errorf("failed to load plugins: %w", err)
		}
		for _, p := range l {
			if !s.PluginEnabled(p.Name()) {
				s.logger.Printf("Plugin %q is disabled", p.Name())
				if err := p.Close(); err != nil {
					s.Logger().Errorf("Closing disabled plugin %q: %v", p.Name(), err)
				}
				continue
			}
			s.logger.Printf("Loaded plugin %q", p.Name())
			plugins = append(plugins, p)
		}
	}

	// An allow-list typo otherwise turns off the intended plugins silently.
	// Do not claim a name is unknown: an external loader can also return no
	// plugin when its backend is unavailable or intentionally unconfigured.
	if s.Options != nil {
		loaded := make(map[string]bool, len(plugins))
		for _, p := range plugins {
			loaded[p.Name()] = true
		}
		for _, name := range s.Options.EnabledPlugins {
			if !loaded[name] {
				s.logger.Warnf("Enabled plugin %q did not load; check its name and backend configuration", name)
				loaded[name] = true // Report duplicate allow-list entries once.
			}
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
	site, icons := fs.FS(distFS), []string(nil)
	if s.Options != nil {
		if site, icons, err = brandedFrontend(distFS, s.Options.Branding); err != nil {
			return err
		}
	}
	router.Frontend(site, icons...)
	router.build = frontendBuild(site)

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
	if s == nil || s.logger == nil {
		// A Server assembled outside New — a test, an embedder — still hands
		// plugins something to log to, rather than a nil to dereference.
		return discardLogger{}
	}
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

// DefaultCacheMaxPartKiB is the largest message part the session cache keeps
// when the config does not say: 1 MiB, above the text and the inline images
// of most messages, below most attachments.
const DefaultCacheMaxPartKiB = 1024

// CacheMaxPartBytes is the largest message part, its header and body as they
// are stored, that the session cache keeps. The cache has no limit of its own,
// and every part read was kept for the life of its entry, attachments of any
// size among them, so a few large attachments opened in one session held their
// whole bytes in the server's memory. A larger part is read again when it is
// asked for again; the browser's copy, revalidated with a 304, saves that.
func (o *Options) CacheMaxPartBytes() int64 {
	if o == nil || o.CacheMaxPartKiB <= 0 {
		return DefaultCacheMaxPartKiB << 10
	}
	return int64(o.CacheMaxPartKiB) << 10
}

type Options struct {
	SMTP     SMTPOptions // SMTP configuration
	Debug    bool
	LoginKey *fernet.Key
	// If true, the CalDAV and CardDAV servers users enter in Settings may use
	// plain HTTP (the +insecure schemes) and loopback or private addresses.
	// Off by default: a personal server is then reached over HTTPS only, at
	// public addresses only, so a mail account cannot make alps probe the
	// network it runs in. Administrator-configured servers are never limited.
	DAVAllowPrivateServers bool
	// How long a session answers DAV requests from the saved CalDAV/CardDAV
	// connection it last read from the mail account's store, before it reads
	// again to see a change made in another session. 0 means the default (30
	// seconds); negative reads on every request. A session's own changes take
	// effect at once either way.
	DAVConnectionFreshFor time.Duration
	EnabledPlugins        []string      // If empty, all plugins are enabled
	CacheTTL              time.Duration // Cache TTL, 0 means use default (10 minutes)
	CacheEnabled          bool          // If false, caching is disabled
	CacheMaxPartKiB       int           // Largest message part the session cache keeps, in KiB; 0 means the default (see CacheMaxPartBytes)
	SessionDuration       time.Duration // Session timeout, 0 means use default (30 minutes)
	MaxSessionDuration    time.Duration // Maximum session duration users can set, 0 means no limit
	// How long a session may live no matter how much it is used. 0 means use
	// the default (7 days); negative disables the cap entirely, which leaves
	// sessions sliding forever — see defaultAbsoluteSessionDuration.
	AbsoluteSessionDuration time.Duration
	MaxSessions             int                     // Maximum total concurrent sessions, 0 means unlimited; the config gives 10000 unless max_sessions is set, and 0 for a negative one
	MaxSessionsPerUser      int                     // Maximum sessions per username, 0 means unlimited; the config gives 10 unless max_sessions_per_user is set, and 0 for a negative one
	MaxAttachmentMiB        int                     // Max attachment size per composer in MiB
	MaxSessionAttachmentMiB int                     // Max attachment size per session in MiB
	MaxGlobalAttachmentMiB  int                     // Max global attachment size in MiB
	RateLimitConfig         *RateLimitConfig        // Rate limiting config, nil = use defaults
	RateLimitEnabled        bool                    // If false, rate limiting is disabled
	AccessLog               bool                    // If true, every request is logged at info level: who, from where, how answered
	TrustedProxies          []*net.IPNet            // Proxy IPs/CIDRs whose X-Forwarded-Proto/Host headers are trusted (e.g. for CSRF origin computation behind a TLS-terminating reverse proxy)
	TrustedOrigins          []string                // Additional origins accepted by the CSRF check (e.g. "https://webmail.example.com"), normalized to lowercase without a trailing slash
	ReadTimeout             time.Duration           // HTTP read timeout, 0 means use default (10 seconds)
	WriteTimeout            time.Duration           // HTTP write timeout, 0 means use default (60 seconds)
	IdleTimeout             time.Duration           // HTTP idle timeout, 0 means use default (120 seconds)
	ProviderTimeout         time.Duration           // Provider connection and response timeout, 0 means use default (30 seconds)
	SMTPTimeout             time.Duration           // SMTP operation timeout, 0 means use default (30 seconds)
	WebAuthn                WebAuthnOptions         // WebAuthn configuration
	Branding                BrandingOptions         // Default theme and login logo; the zero value is alps as it ships
	Plugins                 map[string]PluginConfig // Generic plugin configuration
	Provider                provider.Options        // Mail provider configuration
	ClusterBroadcaster      ClusterBroadcaster      // Optional interface for cluster message broadcasting
	// If true, each session does all its mail work on one connection. By
	// default a session opens a second one, when it is first needed, for the
	// work the user is not waiting for: see Session.DoBackgroundMail.
	DisableBackgroundConnection bool
	// If true, a session waits on its background connection for the mail
	// server's news of the Inbox (IMAP IDLE) while one of its pages holds an
	// event stream open, and tells the page as the news comes: see
	// Session.WatchInbox. Off when DisableBackgroundConnection is set.
	PushNewMail bool
	// If true, each mail connection has the server number the changes to
	// the mailboxes' messages, where the server can (IMAP CONDSTORE), so that
	// a listing whose messages are all still there has only its flags read
	// again: see SessionManager.connectProvider.
	CondStore bool
	// If true, with PushNewMail, the session waits for the news of the
	// subscribed folders as well, where the mail server can tell of them
	// (IMAP NOTIFY): see Session.WatchInbox.
	PushSubscribedFolders bool
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
// loadPlugins calls it once, at start-up.
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
			if err == nil {
				ctx.access.noteSession(ctx.Session)
			}
			if errors.Is(err, ErrSessionExpired) {
				s.logger.Debugf("Auth middleware: session expired for %s", ctx.Request.URL.Path)

				// Attempt to restore session from encrypted login token
				username, password, verified2FA, persistent := ctx.GetLoginToken()
				if username != "" && password != "" {
					s.logger.Debugf("Auth middleware: attempting session restoration from login token for %s", ctx.Request.URL.Path)
					session, err := ctx.Server.Sessions.Put(username, password)
					if err != nil {
						s.logger.Debugf("Auth middleware: session restoration failed for %s: %v", ctx.Request.URL.Path, err)
						// Only a refusal of the password makes the token no
						// good. A mail server that is down, or that will not
						// open a session for now, leaves it as good as it
						// was: the browser keeps it, and the session cookie
						// that has the next request try again. Both were
						// cleared, and a user who came back once the server
						// was up again had to sign in.
						var authErr provider.AuthError
						if !errors.As(err, &authErr) {
							s.logger.Slog().Warn("session not restored",
								"user", username,
								"ip", ctx.ClientIP(),
								"error", err.Error())
							if isPublic(ctx.Request.Method, ctx.Request.URL.Path) {
								return next(ctx)
							}
							return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"error": "mail_server_unavailable"})
						}
						ctx.SetSession(nil)
						ctx.SetLoginToken("", "", false, false)
						return handleUnauthenticated(next, ctx)
					}
					// Restore WebAuthn 2FA verified state
					session.SetAuthenticated2FA(verified2FA)

					s.logger.Debugf("Auth middleware: session restored successfully for %s", ctx.Request.URL.Path)
					s.logger.Slog().Info("session restored",
						"user", username,
						"ip", ctx.ClientIP(),
						"session", session.ID())
					// Restore session with original persistence setting
					ctx.Session = session
					ctx.SetSessionWithExpiry(session, persistent)
					// Clear the pending 2FA cookie
					ctx.SetCookie(&http.Cookie{
						Name:     "alps_2fa_pending",
						Value:    "",
						Path:     "/",
						HttpOnly: true,
						SameSite: http.SameSiteStrictMode,
						Secure:   ctx.IsEffectiveHTTPS(),
						MaxAge:   -1,
					})
					// The restored session takes the same gate as every other:
					// the request that restored it used to run regardless.
					if session.needsSecondFactor() {
						s.logger.Debugf("Auth middleware: restored session needs 2FA for %s", ctx.Request.URL.Path)
						return handleUnauthenticated(next, ctx)
					}
					// Continue with restored session
					ctx.Session.ping()
					err = next(ctx)
					s.logger.Debugf("Auth middleware: handler returned for %s, err=%v", ctx.Request.URL.Path, err)
					return err
				}

				ctx.SetSession(nil)
				return handleUnauthenticated(next, ctx)
			} else if err != nil {
				s.logger.Debugf("Auth middleware: error getting session for %s: %v", ctx.Request.URL.Path, err)
				return err
			}
			s.logger.Debugf("Auth middleware: session OK for %s", ctx.Request.URL.Path)

			// Enforce 2FA verification if required. The account may have
			// enrolled a key since this session was opened, on another node;
			// needsSecondFactor looks again, now and then.
			if ctx.Session.needsSecondFactor() {
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
		s.Close()
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
	// For HTTPError, use the internal message if available. One a route has
	// wrapped, to say what it was doing, is the route's answer all the same.
	var he *HTTPError
	if errors.As(err, &he) {
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

	// A password the mail server refuses logs the user out, login token and
	// all, rather than failing every request after.
	var authErr provider.AuthError
	if errors.As(err, &authErr) {
		s.logger.Debugf("Authentication error detected, logging out user")
		if ctx.Session != nil {
			ctx.Session.CloseWithReason("auth-error")
			ctx.SetSession(nil)
		}
		ctx.SetLoginToken("", "", false, false)
		ctx.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Authentication required",
			"code":  "401",
		})
		return
	}

	// A connection that could not be opened again ends the session (see
	// doMail), but not the sign-in: the password was never in question. The
	// browser keeps the session cookie and the login token, so its next
	// request finds the session gone and restores it from the token once the
	// mail server is back, and is told so until then (see setupMiddleware).
	// Both were cleared, and a user who came back after the outage had to
	// sign in.
	if errors.Is(err, ErrMailProviderUnavailable) {
		s.logger.Debugf("Mail provider connection lost, ending the session")
		if ctx.Session != nil {
			ctx.Session.CloseWithReason("mail-server-unavailable")
		}
		ctx.JSON(http.StatusServiceUnavailable, map[string]string{"error": "mail_server_unavailable"})
		return
	}

	// A message deleted or moved since it was listed is gone, not broken: sending
	// a draft removes the one the reader may still ask for.
	if errors.Is(err, provider.ErrMessageNotFound) {
		err = NewHTTPError(http.StatusNotFound, "Message not found")
	}

	var invalidSearch *provider.InvalidSearchError
	if errors.As(err, &invalidSearch) {
		err = NewHTTPError(http.StatusBadRequest, "Search terms require a value.")
	}

	code := http.StatusInternalServerError
	var he *HTTPError
	if errors.As(err, &he) {
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

// HasServiceRouting reports whether the configured provider may route the
// named service per login.
func (s *Server) HasServiceRouting(service string) bool {
	if s == nil || s.Options == nil {
		return false
	}
	router, ok := s.Options.Provider.(provider.ServiceRouter)
	if !ok {
		return false
	}
	if reporter, ok := router.(provider.ServiceRoutingReporter); ok {
		return reporter.RoutesService(service)
	}
	// Legacy external routers cannot enumerate services. Keep their routing
	// available until they opt into reporting instead of silently disabling it.
	return true
}
