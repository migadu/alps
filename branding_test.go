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

const testShell = "<!DOCTYPE html>\n<html>\n<head>\n  <title>Webmail</title>\n</head>\n<body></body>\n</html>\n"

// testDist is a frontend build with alps's own icons and the Migadu logo's.
func testDist() fstest.MapFS {
	dist := fstest.MapFS{"index.html": &fstest.MapFile{Data: []byte(testShell)}}
	for _, name := range IconFiles {
		dist[name] = &fstest.MapFile{Data: []byte("edelweiss " + name)}
		dist["assets/logos/migadu/"+name] = &fstest.MapFile{Data: []byte("migadu " + name)}
	}
	return dist
}

func brandedRouter(t *testing.T, dist fstest.MapFS, b BrandingOptions) *Router {
	t.Helper()
	router := NewRouter(&Server{logger: &NilLogger{}})
	site, icons, err := brandedFrontend(dist, b)
	require.NoError(t, err)
	router.Frontend(site, icons...)
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
	router := brandedRouter(t, testDist(), BrandingOptions{DefaultTheme: "migadu", LogoBuiltin: "migadu"})

	w := get(router, "/")
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/html; charset=utf-8", w.Header().Get("Content-Type"))
	assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
	assert.Contains(t, w.Header().Get("Content-Security-Policy"), "default-src 'self'")
	assert.Contains(t, w.Body.String(), "<head>\n  <meta name=\"alps-default-theme\" content=\"migadu\" />\n  <meta name=\"alps-logo-builtin\" content=\"migadu\" />\n  <title>")

	// The file server's own path to the shell ends up at the branded one.
	w = get(router, "/index.html")
	assert.Equal(t, http.StatusMovedPermanently, w.Code)
	assert.Equal(t, "./", w.Header().Get("Location"))
}

// TestBuiltinLogoIcons: a built-in logo is the tab's icon too, at every path
// a browser, a home screen or the manifest asks for.
func TestBuiltinLogoIcons(t *testing.T) {
	router := brandedRouter(t, testDist(), BrandingOptions{LogoBuiltin: "migadu"})
	for _, name := range IconFiles {
		w := get(router, "/"+name)
		require.Equal(t, http.StatusOK, w.Code, name)
		assert.Equal(t, "migadu "+name, w.Body.String())
	}

	// A built-in logo missing one of them stops alps at start-up.
	dist := testDist()
	delete(dist, "assets/logos/migadu/favicon.ico")
	_, _, err := brandedFrontend(dist, BrandingOptions{LogoBuiltin: "migadu"})
	assert.Error(t, err)
}

// TestLogoPackageServed: a deployment's own favicon package answers every
// icon path, and the page shows its favicon.svg. The icons come from alps
// itself, as the CSP takes no image from elsewhere, and an SVG opened on its
// own runs nothing.
func TestLogoPackageServed(t *testing.T) {
	pkg := map[string][]byte{}
	for _, name := range IconFiles {
		pkg[name] = []byte("own " + name)
	}
	router := brandedRouter(t, testDist(), BrandingOptions{LogoPackage: pkg})

	for _, name := range IconFiles {
		w := get(router, "/"+name)
		require.Equal(t, http.StatusOK, w.Code, name)
		assert.Equal(t, "own "+name, w.Body.String())
		assert.Contains(t, w.Header().Get("Content-Security-Policy"), "sandbox")
	}
	assert.Equal(t, "image/svg+xml", get(router, "/favicon.svg").Header().Get("Content-Type"))

	body := get(router, "/").Body.String()
	assert.Contains(t, body, `<meta name="alps-logo" content="/favicon.svg" />`)
	assert.NotContains(t, body, `name="alps-logo-builtin"`)
	assert.NotContains(t, body, `name="alps-default-theme"`)
}

// TestNoBrandingServesTheShellAsBuilt: without branding nothing is added, and
// the icons are alps's own.
func TestNoBrandingServesTheShellAsBuilt(t *testing.T) {
	router := brandedRouter(t, testDist(), BrandingOptions{})

	w := get(router, "/")
	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, testShell, w.Body.String())
	assert.Equal(t, "edelweiss favicon.ico", get(router, "/favicon.ico").Body.String())
}

func TestBrandedShellNeedsAHead(t *testing.T) {
	_, err := brandedShell([]byte("<html><body></body></html>"), BrandingOptions{DefaultTheme: "migadu"})
	assert.Error(t, err)
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

// TestBuiltinLogosMatchTheFrontend: every logo `logo` may name, besides the
// edelweiss, is one the frontend can draw and has a full favicon package.
func TestBuiltinLogosMatchTheFrontend(t *testing.T) {
	branding, err := os.ReadFile("frontend/src/utils/branding.ts")
	require.NoError(t, err)
	sprite, err := os.ReadFile("frontend/public/assets/icons/sprite.svg")
	require.NoError(t, err)
	var named []string
	list := regexp.MustCompile(`const BUILTIN_LOGOS = \[([^\]]*)\]`).FindSubmatch(branding)
	require.NotNil(t, list, "BUILTIN_LOGOS in branding.ts")
	for _, m := range regexp.MustCompile(`'([a-z]+)'`).FindAllSubmatch(list[1], -1) {
		named = append(named, string(m[1]))
	}
	assert.ElementsMatch(t, BuiltinLogos, append([]string{"alps"}, named...))
	for _, name := range named {
		assert.Contains(t, string(sprite), `<symbol id="`+name+`" `, "the sprite draws %q", name)
		for _, icon := range IconFiles {
			assert.FileExists(t, "frontend/public/assets/logos/"+name+"/"+icon)
		}
	}
}
