package alps

import (
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/assert"
)

// TestSecurityHeadersAppliedToStaticAssets verifies that baseline security
// headers reach every response, including static files served via StaticFS.
// StaticFS registers its handler directly on the mux, bypassing the Use/Pre
// middleware chain, so headers set only there would never reach the SPA shell
// or JS/CSS bundles — the document where CSP actually matters.
func TestSecurityHeadersAppliedToStaticAssets(t *testing.T) {
	server := &Server{logger: &NilLogger{}}
	router := NewRouter(server)

	router.GET("/api/thing", func(ctx *Context) error {
		return ctx.String(http.StatusOK, "ok")
	})
	router.StaticFS("", http.FS(fstest.MapFS{
		"index.html": &fstest.MapFile{Data: []byte("<!doctype html>")},
		"app.js":     &fstest.MapFile{Data: []byte("console.log(1)")},
	}))

	for _, path := range []string{"/api/thing", "/", "/app.js"} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
			assert.NotEmpty(t, w.Header().Get("Content-Security-Policy"),
				"CSP must be set on %q, including static assets", path)
			assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"),
				"nosniff must be set on %q", path)
			assert.Equal(t, "off", w.Header().Get("X-DNS-Prefetch-Control"),
				"DNS-prefetch header must be set on %q", path)
		})
	}
}

// encodeURIComponentJS mimics JavaScript's encodeURIComponent: it percent-encodes
// every byte except the unreserved set A-Za-z0-9 and -_.!~*'(). Notably it uses
// %20 for spaces (unlike url.QueryEscape which uses "+"), matching what the
// browser sends and what the frontend encodeMailboxPath() helper produces.
func encodeURIComponentJS(s string) string {
	const upperhex = "0123456789ABCDEF"
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
			strings.IndexByte("-_.!~*'()", c) >= 0 {
			b.WriteByte(c)
		} else {
			b.WriteByte('%')
			b.WriteByte(upperhex[c>>4])
			b.WriteByte(upperhex[c&0xF])
		}
	}
	return b.String()
}

// TestRouterMailboxWithSlash covers issue #4: mailbox names that contain the
// IMAP hierarchy delimiter (e.g. Gmail's "[Gmail]/All Mail"). The frontend
// double-encodes the mailbox path segment so that ServeMux does not split it on
// "/", and the handler recovers the original name with a single url.PathUnescape.
func TestRouterMailboxWithSlash(t *testing.T) {
	server := &Server{logger: &NilLogger{}}
	router := NewRouter(server)

	var gotMbox string
	handler := func(ctx *Context) error {
		name, err := url.PathUnescape(ctx.Param("mbox"))
		if err != nil {
			return NewHTTPError(http.StatusBadRequest, "bad mbox")
		}
		gotMbox = name
		return ctx.String(http.StatusOK, name)
	}
	router.GET("/mailboxes/{mbox}", handler)
	router.GET("/mailboxes/{mbox}/status", handler)

	// doubleEncode mirrors the frontend encodeMailboxPath() helper, which applies
	// encodeURIComponent twice.
	doubleEncode := func(s string) string {
		return encodeURIComponentJS(encodeURIComponentJS(s))
	}

	names := []string{
		"INBOX",
		"Sent",
		"All Mail",
		"[Gmail]/All Mail",
		"[Gmail]/Sent Mail",
		"parent/child/grandchild",
		"weird%name",
	}

	for _, name := range names {
		t.Run(name, func(t *testing.T) {
			for _, suffix := range []string{"", "/status"} {
				gotMbox = ""
				path := "/mailboxes/" + doubleEncode(name) + suffix
				req := httptest.NewRequest(http.MethodGet, path, nil)
				w := httptest.NewRecorder()
				router.ServeHTTP(w, req)
				assert.Equal(t, http.StatusOK, w.Code, "path %q should route to the handler", path)
				assert.Equal(t, name, gotMbox, "handler should recover the original mailbox name for %q", path)
			}
		})
	}
}
