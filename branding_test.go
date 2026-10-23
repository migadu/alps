package alps

import (
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testShell = "<!DOCTYPE html>\n<html>\n<head>\n  <title>Alps Webmail</title>\n</head>\n<body></body>\n</html>\n"

func brandedRouter(t *testing.T, b BrandingOptions) *Router {
	t.Helper()
	dist := fstest.MapFS{"index.html": &fstest.MapFile{Data: []byte(testShell)}}
	router := NewRouter(&Server{logger: &NilLogger{}})
	router.StaticFS("", http.FS(dist))
	require.NoError(t, router.serveBranding(dist, b))
	return router
}

func get(router *Router, path string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	router.ServeHTTP(w, httptest.NewRequest(http.MethodGet, path, nil))
	return w
}

// TestBrandingInTheShell: the sign-in page learns the default theme and the
// logo from the page it is served in, so it is drawn branded from its first
// paint, and the shell keeps the CSP every other answer has.
func TestBrandingInTheShell(t *testing.T) {
	router := brandedRouter(t, BrandingOptions{
		DefaultTheme:  "migadu",
		LoginLogo:     &Image{Data: []byte("<svg/>"), Type: "image/svg+xml"},
		LoginLogoDark: &Image{Data: []byte("<svg id=dark/>"), Type: "image/svg+xml"},
	})

	w := get(router, "/")
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/html; charset=utf-8", w.Header().Get("Content-Type"))
	assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
	assert.Contains(t, w.Header().Get("Content-Security-Policy"), "default-src 'self'")
	assert.Contains(t, w.Body.String(), "<head>\n  <meta name=\"alps-default-theme\" content=\"migadu\" />\n  <meta name=\"alps-login-logo\" content=\"/branding/login-logo\" />\n  <meta name=\"alps-login-logo-dark\" content=\"/branding/login-logo-dark\" />\n  <title>")

	// The file server's own path to the shell ends up at the branded one.
	w = get(router, "/index.html")
	assert.Equal(t, http.StatusMovedPermanently, w.Code)
	assert.Equal(t, "./", w.Header().Get("Location"))
}

// TestLoginLogoServed: the logo comes from alps itself, as the CSP allows no
// image from elsewhere, and an SVG opened on its own runs nothing.
func TestLoginLogoServed(t *testing.T) {
	router := brandedRouter(t, BrandingOptions{LoginLogo: &Image{Data: []byte("<svg/>"), Type: "image/svg+xml"}})

	w := get(router, "/branding/login-logo")
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "image/svg+xml", w.Header().Get("Content-Type"))
	assert.Equal(t, "<svg/>", w.Body.String())
	assert.Contains(t, w.Header().Get("Content-Security-Policy"), "sandbox")

	// A logo alone still marks the shell, and names no theme and no dark logo.
	body := get(router, "/").Body.String()
	assert.Contains(t, body, `name="alps-login-logo"`)
	assert.NotContains(t, body, `name="alps-default-theme"`)
	assert.NotContains(t, body, `name="alps-login-logo-dark"`)
	assert.Equal(t, http.StatusNotFound, get(router, "/branding/login-logo-dark").Code)
}

func TestDarkLoginLogoServed(t *testing.T) {
	router := brandedRouter(t, BrandingOptions{
		LoginLogo:     &Image{Data: []byte("light"), Type: "image/png"},
		LoginLogoDark: &Image{Data: []byte("dark"), Type: "image/webp"},
	})
	w := get(router, "/branding/login-logo-dark")
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "image/webp", w.Header().Get("Content-Type"))
	assert.Equal(t, "dark", w.Body.String())
	assert.Equal(t, "light", get(router, "/branding/login-logo").Body.String())
}

// TestBuiltinLogoInTheShell: a logo alps ships needs no route, only its name.
func TestBuiltinLogoInTheShell(t *testing.T) {
	router := brandedRouter(t, BrandingOptions{DefaultTheme: "migadu", LoginLogoBuiltin: "migadu"})
	body := get(router, "/").Body.String()
	assert.Contains(t, body, `<meta name="alps-login-logo-builtin" content="migadu" />`)
	assert.NotContains(t, body, `name="alps-login-logo"`)
	assert.Equal(t, http.StatusNotFound, get(router, "/branding/login-logo").Code)
}

// TestBuiltinLogosMatchTheFrontend: every logo login_logo may name, besides
// the edelweiss, is one the frontend can draw.
func TestBuiltinLogosMatchTheFrontend(t *testing.T) {
	branding, err := os.ReadFile("frontend/src/utils/branding.ts")
	require.NoError(t, err)
	sprite, err := os.ReadFile("frontend/public/assets/icons/sprite.svg")
	require.NoError(t, err)
	var named []string
	for _, m := range regexp.MustCompile(`(?m)^  ([a-z]+): '0 0 [0-9 ]+',$`).FindAllStringSubmatch(string(branding), -1) {
		named = append(named, m[1])
	}
	assert.ElementsMatch(t, BuiltinLogos, append([]string{"alps"}, named...))
	for _, name := range named {
		assert.Contains(t, string(sprite), `<symbol id="`+name+`" `, "the sprite draws %q", name)
	}
}

// TestNoBrandingServesTheShellAsBuilt: without branding nothing is added, and
// there is no logo to fetch.
func TestNoBrandingServesTheShellAsBuilt(t *testing.T) {
	router := brandedRouter(t, BrandingOptions{})

	w := get(router, "/")
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, testShell, w.Body.String())
	assert.Equal(t, http.StatusNotFound, get(router, "/branding/login-logo").Code)
}

// TestThemesMatchTheFrontend: default_theme is checked against Themes, so a
// theme missing from the frontend would pass start-up and show Alps, and one
// missing here would be refused.
func TestThemesMatchTheFrontend(t *testing.T) {
	src, err := os.ReadFile("frontend/src/store/themes.ts")
	require.NoError(t, err)
	var bundles []string
	for _, m := range regexp.MustCompile(`'([a-z]+)-light': \{`).FindAllStringSubmatch(string(src), -1) {
		bundles = append(bundles, m[1])
	}
	assert.ElementsMatch(t, Themes, bundles)
}

func TestBrandedShellNeedsAHead(t *testing.T) {
	_, err := brandedShell([]byte("<html><body></body></html>"), BrandingOptions{DefaultTheme: "migadu"})
	assert.Error(t, err)
}
