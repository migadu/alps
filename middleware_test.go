package alps

import (
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOriginMatches(t *testing.T) {
	assert.True(t, originMatches("https://example.com", "https://example.com"))
	assert.True(t, originMatches("HTTPS://EXAMPLE.COM", "https://example.com"))
	assert.False(t, originMatches("https://example.com", "http://example.com"))
}

func TestIsLocalhostOrigin(t *testing.T) {
	assert.True(t, isLocalhostOrigin("http://localhost:3000"))
	assert.True(t, isLocalhostOrigin("http://127.0.0.1:8080"))
	assert.True(t, isLocalhostOrigin("http://[::1]:1323"))
	assert.False(t, isLocalhostOrigin("https://example.com"))
}

func TestRefererMatches(t *testing.T) {
	assert.True(t, refererMatches("https://example.com/path", "https://example.com"))
	assert.True(t, refererMatches("https://example.com", "https://example.com"))
	assert.False(t, refererMatches("https://example.org/path", "https://example.com"))
}

func TestCSRFMiddleware(t *testing.T) {
	server := &Server{
		logger: &NilLogger{},
	}
	nextHandler := func(ctx *Context) error {
		return ctx.String(http.StatusOK, "ok")
	}
	handler := CSRFMiddleware(nextHandler)

	tests := []struct {
		name           string
		method         string
		origin         string
		referer        string
		expectedStatus int
	}{
		{"GET Request (Allowed)", http.MethodGet, "https://evil.com", "", http.StatusOK},
		{"POST Valid Origin", http.MethodPost, "http://example.com", "", http.StatusOK},
		{"POST Invalid Origin", http.MethodPost, "https://evil.com", "", http.StatusForbidden},
		{"POST Valid Referer", http.MethodPost, "", "http://example.com/path", http.StatusOK},
		{"POST Invalid Referer", http.MethodPost, "", "https://evil.com/path", http.StatusForbidden},
		{"POST Missing Headers (Allowed)", http.MethodPost, "", "", http.StatusOK},
		{"POST Localhost Mismatch", http.MethodPost, "http://localhost:3000", "", http.StatusOK},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/", nil)
			req.Host = "example.com"
			if stringsContainsLocalhost(tt.name) {
				req.Host = "localhost:8080"
			}

			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			if tt.referer != "" {
				req.Header.Set("Referer", tt.referer)
			}

			w := httptest.NewRecorder()
			ctx := NewContext(w, req, server)

			err := handler(ctx)
			if tt.expectedStatus == http.StatusForbidden {
				var httpErr *HTTPError
				assert.ErrorAs(t, err, &httpErr)
				assert.Equal(t, http.StatusForbidden, httpErr.Code)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, http.StatusOK, w.Code)
			}
		})
	}
}

func stringsContainsLocalhost(s string) bool {
	return len(s) >= 9 && s[len(s)-9:] == "Localhost Mismatch" || s == "POST Localhost Mismatch"
}

func TestRouterMethods(t *testing.T) {
	server := &Server{logger: &NilLogger{}}
	router := NewRouter(server)

	handle := func(method string) HandlerFunc {
		return func(ctx *Context) error {
			return ctx.String(http.StatusOK, method)
		}
	}

	router.GET("/get", handle("GET"))
	router.POST("/post", handle("POST"))
	router.PUT("/put", handle("PUT"))
	router.DELETE("/delete", handle("DELETE"))

	methods := []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete}

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			path := "/" + strings.ToLower(method)
			req := httptest.NewRequest(method, path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			assert.Equal(t, http.StatusOK, w.Code)
			assert.Equal(t, method, w.Body.String())
		})
	}
}

func TestRouterMiddleware(t *testing.T) {
	server := &Server{logger: &NilLogger{}}
	router := NewRouter(server)

	preMiddlewareRan := false
	useMiddlewareRan := false

	router.Pre(func(next HandlerFunc) HandlerFunc {
		return func(ctx *Context) error {
			preMiddlewareRan = true
			return next(ctx)
		}
	})

	router.Use(func(next HandlerFunc) HandlerFunc {
		return func(ctx *Context) error {
			useMiddlewareRan = true
			return next(ctx)
		}
	})

	router.GET("/test", func(ctx *Context) error {
		return ctx.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.True(t, preMiddlewareRan)
	assert.True(t, useMiddlewareRan)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRouterGroup(t *testing.T) {
	server := &Server{logger: &NilLogger{}}
	router := NewRouter(server)
	group := router.Group("/api")

	group.Add(http.MethodGet, "/test", func(ctx *Context) error {
		return ctx.String(http.StatusOK, "api-test")
	})

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "api-test", w.Body.String())
}

func TestWrapHandlerPanicAndError(t *testing.T) {
	server := &Server{
		logger: &NilLogger{},
	}

	router := NewRouter(server)

	router.GET("/panic", func(ctx *Context) error {
		panic("test panic")
	})

	router.GET("/error", func(ctx *Context) error {
		return errors.New("test error")
	})

	req1 := httptest.NewRequest(http.MethodGet, "/panic", nil)
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusInternalServerError, w1.Code)

	req2 := httptest.NewRequest(http.MethodGet, "/error", nil)
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusInternalServerError, w2.Code)
	assert.Contains(t, w2.Body.String(), "An internal error occurred")
}

func mustCIDR(s string) *net.IPNet {
	_, n, err := net.ParseCIDR(s)
	if err != nil {
		panic(err)
	}
	return n
}

// TestCSRFMiddlewareBehindProxy covers running alps behind a TLS-terminating
// reverse proxy (issue #5): forwarded headers are honored only from trusted
// proxies, and an explicit trusted_origins allowlist is also accepted.
func TestCSRFMiddlewareBehindProxy(t *testing.T) {
	nextHandler := func(ctx *Context) error {
		return ctx.String(http.StatusOK, "ok")
	}
	handler := CSRFMiddleware(nextHandler)

	tests := []struct {
		name           string
		remoteAddr     string
		trustedProxies []*net.IPNet
		trustedOrigins []string
		xfProto        string
		xfHost         string
		origin         string
		referer        string
		expectedStatus int
	}{
		{
			name:           "trusted proxy X-Forwarded-Proto https accepts https origin",
			remoteAddr:     "10.0.0.1:5000",
			trustedProxies: []*net.IPNet{mustCIDR("10.0.0.0/8")},
			xfProto:        "https",
			origin:         "https://example.com",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "X-Forwarded-Proto ignored when peer not trusted",
			remoteAddr:     "203.0.113.7:5000",
			trustedProxies: []*net.IPNet{mustCIDR("10.0.0.0/8")},
			xfProto:        "https",
			origin:         "https://example.com",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "X-Forwarded-Proto ignored when no trusted proxies configured",
			remoteAddr:     "10.0.0.1:5000",
			xfProto:        "https",
			origin:         "https://example.com",
			expectedStatus: http.StatusForbidden,
		},
		{
			name:           "trusted proxy honors X-Forwarded-Host",
			remoteAddr:     "10.0.0.1:5000",
			trustedProxies: []*net.IPNet{mustCIDR("10.0.0.0/8")},
			xfProto:        "https",
			xfHost:         "webmail.example.com",
			origin:         "https://webmail.example.com",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "trusted proxy honors comma-separated X-Forwarded-Proto",
			remoteAddr:     "10.0.0.1:5000",
			trustedProxies: []*net.IPNet{mustCIDR("10.0.0.0/8")},
			xfProto:        "https, http",
			origin:         "https://example.com",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "trusted_origins allowlist accepts origin",
			remoteAddr:     "203.0.113.7:5000",
			trustedOrigins: []string{"https://example.com"},
			origin:         "https://example.com",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "trusted_origins allowlist accepts referer",
			remoteAddr:     "203.0.113.7:5000",
			trustedOrigins: []string{"https://example.com"},
			referer:        "https://example.com/mailbox",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "origin not in trusted_origins is rejected",
			remoteAddr:     "203.0.113.7:5000",
			trustedOrigins: []string{"https://example.com"},
			origin:         "https://evil.com",
			expectedStatus: http.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := &Server{
				logger: &NilLogger{},
				Options: &Options{
					TrustedProxies: tt.trustedProxies,
					TrustedOrigins: tt.trustedOrigins,
				},
			}
			req := httptest.NewRequest(http.MethodPost, "/", nil)
			req.Host = "example.com"
			req.RemoteAddr = tt.remoteAddr
			if tt.xfProto != "" {
				req.Header.Set("X-Forwarded-Proto", tt.xfProto)
			}
			if tt.xfHost != "" {
				req.Header.Set("X-Forwarded-Host", tt.xfHost)
			}
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			if tt.referer != "" {
				req.Header.Set("Referer", tt.referer)
			}

			w := httptest.NewRecorder()
			ctx := NewContext(w, req, server)

			err := handler(ctx)
			if tt.expectedStatus == http.StatusForbidden {
				var httpErr *HTTPError
				assert.ErrorAs(t, err, &httpErr)
				assert.Equal(t, http.StatusForbidden, httpErr.Code)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, http.StatusOK, w.Code)
			}
		})
	}
}

func TestFirstForwardedValue(t *testing.T) {
	assert.Equal(t, "https", firstForwardedValue("https"))
	assert.Equal(t, "https", firstForwardedValue("https, http"))
	assert.Equal(t, "https", firstForwardedValue("  https , http "))
	assert.Equal(t, "", firstForwardedValue(""))
}

func TestOriginInList(t *testing.T) {
	list := []string{"https://webmail.example.com"}
	assert.True(t, originInList("https://webmail.example.com", list))
	assert.True(t, originInList("HTTPS://WEBMAIL.EXAMPLE.COM", list))
	assert.True(t, originInList("https://webmail.example.com/", list))
	assert.False(t, originInList("http://webmail.example.com", list))
	assert.False(t, originInList("https://evil.com", list))
	assert.False(t, originInList("https://webmail.example.com", nil))
}
