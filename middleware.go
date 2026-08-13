package alps

import (
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
)

// HandlerFunc is a function serving HTTP requests.
type HandlerFunc func(*Context) error

// Middleware is a function that wraps a HandlerFunc.
type Middleware func(HandlerFunc) HandlerFunc

// HTTPHandlerFunc is the standard http.HandlerFunc signature.
type HTTPHandlerFunc func(http.ResponseWriter, *http.Request)

// CSRFMiddleware validates Origin/Referer headers for state-changing requests.
// This provides defense-in-depth alongside SameSite=Strict cookies.
func CSRFMiddleware(next HandlerFunc) HandlerFunc {
	return func(ctx *Context) error {
		method := ctx.Request.Method

		// Only validate state-changing methods
		if method != http.MethodPost && method != http.MethodPut && method != http.MethodDelete && method != http.MethodPatch {
			return next(ctx)
		}

		// Get expected origin from the request. When alps runs behind a trusted
		// TLS-terminating reverse proxy, the proxy forwards over plain HTTP, so the
		// scheme/host as seen by alps do not match what the browser sees. Honor the
		// standard X-Forwarded-Proto / X-Forwarded-Host headers, but only when the
		// immediate peer is a configured trusted proxy (otherwise they are spoofable).
		scheme := "https"
		if !ctx.IsTLS() {
			scheme = "http"
		}
		host := ctx.Request.Host
		if isRequestFromTrustedProxy(ctx) {
			if proto := firstForwardedValue(ctx.Request.Header.Get("X-Forwarded-Proto")); proto != "" {
				scheme = proto
			}
			if fwdHost := firstForwardedValue(ctx.Request.Header.Get("X-Forwarded-Host")); fwdHost != "" {
				host = fwdHost
			}
		}
		expectedOrigin := scheme + "://" + host

		// Additional origins explicitly trusted via config (trusted_origins). Useful
		// when the deployment cannot set forwarded headers or lists trusted proxies.
		var trustedOrigins []string
		if ctx.Server.Options != nil {
			trustedOrigins = ctx.Server.Options.TrustedOrigins
		}

		// Check Origin header first (preferred, sent by modern browsers for POST/PUT/DELETE)
		origin := ctx.Request.Header.Get("Origin")
		if origin != "" {
			if !originMatches(origin, expectedOrigin) && !originInList(origin, trustedOrigins) {
				// Allow localhost origins in development (common with Vite dev server proxy)
				if isLocalhostOrigin(origin) && isLocalhostOrigin(expectedOrigin) {
					ctx.Server.Logger().Printf("CSRF: Allowing localhost origin mismatch in development: got %q, expected %q", origin, expectedOrigin)
					return next(ctx)
				}
				ctx.Server.Logger().Printf("CSRF: Origin mismatch: got %q, expected %q%s", origin, expectedOrigin, csrfMismatchHint(ctx, origin, expectedOrigin))
				return NewHTTPError(http.StatusForbidden, "Invalid origin")
			}
			return next(ctx)
		}

		// Fallback to Referer header (older browsers, or when Origin is stripped)
		referer := ctx.Request.Header.Get("Referer")
		if referer != "" {
			if !refererMatches(referer, expectedOrigin) && !refererInList(referer, trustedOrigins) {
				ctx.Server.Logger().Printf("CSRF: Referer mismatch: got %q, expected %q%s", referer, expectedOrigin, csrfMismatchHint(ctx, referer, expectedOrigin))
				return NewHTTPError(http.StatusForbidden, "Invalid referer")
			}
			return next(ctx)
		}

		// No Origin or Referer header - this is suspicious for state-changing requests
		// However, we allow it because:
		// 1. SameSite=Strict provides primary protection
		// 2. Some privacy-focused browsers/extensions strip these headers
		// 3. We log it for monitoring
		ctx.Server.Logger().Printf("CSRF: No Origin or Referer header for %s %s (allowed due to SameSite=Strict)",
			method, ctx.Request.URL.Path)

		return next(ctx)
	}
}

// originMatches checks if the origin header matches the expected origin.
func originMatches(origin, expected string) bool {
	return strings.EqualFold(origin, expected)
}

// csrfMismatchHint returns a short, actionable suffix for the rejection log when
// the mismatch looks like a reverse-proxy misconfiguration rather than an actual
// cross-site request. Each shape below is a configuration error an operator can
// fix, and the bare "got X, expected Y" line does not say how. The hint goes to
// the log only, never into the HTTP response.
func csrfMismatchHint(ctx *Context, got, expectedOrigin string) string {
	gotURL, errGot := url.Parse(strings.ToLower(got))
	expURL, errExp := url.Parse(strings.ToLower(expectedOrigin))
	if errGot == nil && errExp == nil && gotURL.Host != "" && expURL.Host != "" {
		// The browser is on HTTPS but alps derived HTTP for the same host: a
		// TLS-terminating proxy that is not forwarding (or is not trusted for)
		// X-Forwarded-Proto.
		if gotURL.Scheme == "https" && expURL.Scheme == "http" && gotURL.Host == expURL.Host {
			if !isRequestFromTrustedProxy(ctx) {
				return " (scheme differs and the peer " + peerIP(ctx) + " is not in trusted_proxies;" +
					" behind a TLS-terminating proxy, forward X-Forwarded-Proto and list the proxy in" +
					" trusted_proxies, or set trusted_origins)"
			}
			if xfp := firstForwardedValue(ctx.Request.Header.Get("X-Forwarded-Proto")); xfp != "" {
				return fmt.Sprintf(" (scheme differs; the trusted proxy forwards X-Forwarded-Proto %q"+
					" instead of \"https\": fix it, or set trusted_origins)", xfp)
			}
			return " (scheme differs; the trusted proxy is not sending X-Forwarded-Proto:" +
				" set it, or set trusted_origins)"
		}

		// Same scheme and hostname but a different (or missing) port: a proxy that
		// strips the port when forwarding the host (e.g. nginx's $host).
		if gotURL.Scheme == expURL.Scheme && gotURL.Hostname() == expURL.Hostname() &&
			gotURL.Port() != expURL.Port() {
			return " (hosts differ only by port; forward the browser-facing host with its port" +
				" — e.g. nginx $http_host, not $host — or set trusted_origins)"
		}
	}

	// Forwarded headers arrived but were ignored because the peer is untrusted —
	// the usual cause is a trusted_proxies list that omits the proxy's real address.
	if !isRequestFromTrustedProxy(ctx) &&
		(ctx.Request.Header.Get("X-Forwarded-Proto") != "" || ctx.Request.Header.Get("X-Forwarded-Host") != "") {
		return " (X-Forwarded-* headers ignored: peer " + peerIP(ctx) + " is not in trusted_proxies)"
	}

	return ""
}

// peerIP returns the immediate peer's IP for diagnostics, falling back to the
// raw RemoteAddr when it is not in host:port form.
func peerIP(ctx *Context) string {
	if host, _, err := net.SplitHostPort(ctx.Request.RemoteAddr); err == nil {
		return host
	}
	return ctx.Request.RemoteAddr
}

// isLocalhostOrigin checks if an origin is localhost (for development).
func isLocalhostOrigin(origin string) bool {
	lower := strings.ToLower(origin)
	return strings.Contains(lower, "://localhost:") ||
		strings.Contains(lower, "://127.0.0.1:") ||
		strings.Contains(lower, "://[::1]:")
}

// refererMatches checks if the referer header is from the expected origin.
func refererMatches(referer, expectedOrigin string) bool {
	// Referer includes the full URL, so we just check if it starts with the expected origin
	return strings.HasPrefix(strings.ToLower(referer), strings.ToLower(expectedOrigin)+"/") ||
		strings.EqualFold(referer, expectedOrigin)
}

// originInList reports whether origin is present in the configured trusted-origins
// allowlist. The allowlist is already normalized to lowercase without a trailing slash.
func originInList(origin string, trustedOrigins []string) bool {
	if len(trustedOrigins) == 0 {
		return false
	}
	normalized := strings.TrimRight(strings.ToLower(origin), "/")
	for _, trusted := range trustedOrigins {
		if normalized == trusted {
			return true
		}
	}
	return false
}

// refererInList reports whether the referer originates from one of the configured
// trusted origins.
func refererInList(referer string, trustedOrigins []string) bool {
	if len(trustedOrigins) == 0 {
		return false
	}
	lower := strings.ToLower(referer)
	for _, trusted := range trustedOrigins {
		if lower == trusted || strings.HasPrefix(lower, trusted+"/") {
			return true
		}
	}
	return false
}

// firstForwardedValue returns the first value of a possibly comma-separated
// forwarded header (e.g. "X-Forwarded-Proto: https, http"), trimmed of whitespace.
func firstForwardedValue(header string) string {
	if header == "" {
		return ""
	}
	if i := strings.IndexByte(header, ','); i >= 0 {
		header = header[:i]
	}
	return strings.TrimSpace(header)
}

// isRequestFromTrustedProxy reports whether the immediate peer (TCP RemoteAddr)
// is one of the configured trusted proxies. Only then may forwarded headers be
// trusted, since any client can otherwise set them.
func isRequestFromTrustedProxy(ctx *Context) bool {
	if ctx.Server == nil || ctx.Server.Options == nil || len(ctx.Server.Options.TrustedProxies) == 0 {
		return false
	}
	remoteIPStr, _, err := net.SplitHostPort(ctx.Request.RemoteAddr)
	if err != nil {
		remoteIPStr = ctx.Request.RemoteAddr
	}
	remoteIP := net.ParseIP(remoteIPStr)
	if remoteIP == nil {
		return false
	}
	for _, cidr := range ctx.Server.Options.TrustedProxies {
		if cidr.Contains(remoteIP) {
			return true
		}
	}
	return false
}

// Router wraps http.ServeMux and provides middleware support.
type Router struct {
	mux         *http.ServeMux
	server      *Server
	middlewares []Middleware
	preware     []Middleware
}

// NewRouter creates a new Router.
func NewRouter(server *Server) *Router {
	return &Router{
		mux:    http.NewServeMux(),
		server: server,
	}
}

// Pre adds middleware that runs before routing.
func (r *Router) Pre(m Middleware) {
	r.preware = append(r.preware, m)
}

// Use adds middleware that runs after routing.
func (r *Router) Use(m Middleware) {
	r.middlewares = append(r.middlewares, m)
}

// Add registers a new route with method and path.
func (r *Router) Add(method, path string, handler HandlerFunc) {
	pattern := method + " " + path
	r.mux.HandleFunc(pattern, r.wrapHandler(handler))
}

// GET registers a GET route.
func (r *Router) GET(path string, handler HandlerFunc) {
	r.Add(http.MethodGet, path, handler)
}

// POST registers a POST route.
func (r *Router) POST(path string, handler HandlerFunc) {
	r.Add(http.MethodPost, path, handler)
}

// PUT registers a PUT route.
func (r *Router) PUT(path string, handler HandlerFunc) {
	r.Add(http.MethodPut, path, handler)
}

// DELETE registers a DELETE route.
func (r *Router) DELETE(path string, handler HandlerFunc) {
	r.Add(http.MethodDelete, path, handler)
}

// Static serves static files from the given directory.
func (r *Router) Static(prefix, dir string) {
	fs := http.FileServer(http.Dir(dir))
	pattern := "GET " + prefix + "/"
	r.mux.Handle(pattern, http.StripPrefix(prefix, fs))
}

// StaticFS serves static files from the given http.FileSystem.
func (r *Router) StaticFS(prefix string, hfs http.FileSystem) {
	fileServer := http.FileServer(hfs)
	pattern := "GET " + prefix + "/"
	r.mux.Handle(pattern, http.StripPrefix(prefix, fileServer))
}

// wrapHandler converts our HandlerFunc to http.HandlerFunc and applies middleware.
func (r *Router) wrapHandler(h HandlerFunc) http.HandlerFunc {
	// Apply middlewares in reverse order
	for i := len(r.middlewares) - 1; i >= 0; i-- {
		h = r.middlewares[i](h)
	}

	return func(w http.ResponseWriter, req *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				r.server.logger.Errorf("PANIC in handler for %s: %v", req.URL.Path, rec)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()

		ctx := NewContext(w, req, r.server)
		r.server.logger.Debugf("wrapHandler: handling %s", req.URL.Path)

		// Apply preware
		handler := h
		for i := len(r.preware) - 1; i >= 0; i-- {
			handler = r.preware[i](handler)
		}

		if err := handler(ctx); err != nil {
			// Don't call handleError for redirects since response is already sent
			if err != ErrRedirect {
				r.server.logger.Debugf("Handler returned error for %s: %v", req.URL.Path, err)
				r.server.handleError(err, ctx)
			}
		}
	}
}

// setSecurityHeaders applies baseline security headers to every response.
// It runs here, at the single request choke point, rather than as Use/Pre
// middleware because static file handlers (StaticFS/Static) are registered
// directly on the mux and bypass the middleware chain — so the SPA shell and
// all JS/CSS bundles would otherwise be served with no CSP at all. Handlers may
// still override these with a stricter policy after dispatch (e.g. the BIMI and
// /proxy endpoints set `default-src 'none'`); Set() replaces, so the stricter
// value wins.
func setSecurityHeaders(h http.Header) {
	// `style-src 'unsafe-inline'` is required for e-mails with embedded stylesheets.
	// `img-src`/`font-src data:` are required for placeholder resources in sandboxed iframes.
	h.Set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline'")
	// DNS prefetching has privacy implications.
	h.Set("X-DNS-Prefetch-Control", "off")
	// Never allow browsers to MIME-sniff a response away from its declared type.
	h.Set("X-Content-Type-Options", "nosniff")
}

// ServeHTTP implements http.Handler.
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	setSecurityHeaders(w.Header())
	r.mux.ServeHTTP(w, req)
}

// Group creates a route group (for plugin routing compatibility).
type Group struct {
	router *Router
	prefix string
}

// Group creates a new route group with a prefix.
func (r *Router) Group(prefix string) *Group {
	return &Group{
		router: r,
		prefix: prefix,
	}
}

// Add registers a route in the group.
func (g *Group) Add(method, path string, handler HandlerFunc) {
	g.router.Add(method, g.prefix+path, handler)
}

// Static serves static files in the group.
func (g *Group) Static(path, dir string) {
	g.router.Static(g.prefix+path, dir)
}

// StaticFS serves static files in the group from the given http.FileSystem.
func (g *Group) StaticFS(path string, hfs http.FileSystem) {
	g.router.StaticFS(g.prefix+path, hfs)
}
