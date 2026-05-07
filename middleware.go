package alps

import (
	"net/http"
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

		// Get expected origin from request host
		scheme := "https"
		if !ctx.IsTLS() {
			scheme = "http"
		}
		expectedOrigin := scheme + "://" + ctx.Request.Host

		// Check Origin header first (preferred, sent by modern browsers for POST/PUT/DELETE)
		origin := ctx.Request.Header.Get("Origin")
		if origin != "" {
			if !originMatches(origin, expectedOrigin) {
				// Allow localhost origins in development (common with Vite dev server proxy)
				if isLocalhostOrigin(origin) && isLocalhostOrigin(expectedOrigin) {
					ctx.Server.Logger().Printf("CSRF: Allowing localhost origin mismatch in development: got %q, expected %q", origin, expectedOrigin)
					return next(ctx)
				}
				ctx.Server.Logger().Printf("CSRF: Origin mismatch: got %q, expected %q", origin, expectedOrigin)
				return NewHTTPError(http.StatusForbidden, "Invalid origin")
			}
			return next(ctx)
		}

		// Fallback to Referer header (older browsers, or when Origin is stripped)
		referer := ctx.Request.Header.Get("Referer")
		if referer != "" {
			if !refererMatches(referer, expectedOrigin) {
				ctx.Server.Logger().Printf("CSRF: Referer mismatch: got %q, expected %q", referer, expectedOrigin)
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

// ServeHTTP implements http.Handler.
func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
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
