package alps

import (
	"bytes"
	"compress/gzip"
	"io"
	"io/fs"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"regexp"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestFrontendServedCacheable: the built frontend, as the server assembles
// it, is what every page load downloads. A bundle under assets/ is named by
// its content, so the browser may keep it for good; the page that names the
// bundles must be asked about every time, and answered with a 304 when it has
// not changed, as must the icon sprite, whose name stays when it changes; and
// text goes over the wire compressed.
func TestFrontendServedCacheable(t *testing.T) {
	s := &Server{logger: &NilLogger{}, Options: &Options{}}
	require.NoError(t, s.loadPlugins())
	dist, err := fs.Sub(frontendFS, "frontend/dist")
	require.NoError(t, err)

	index, err := fs.ReadFile(dist, "index.html")
	require.NoError(t, err)
	bundle := regexp.MustCompile(`/assets/index-[^"]+\.js`).Find(index)
	require.NotEmpty(t, bundle, "index.html names its main bundle")
	want, err := fs.ReadFile(dist, string(bundle[1:]))
	require.NoError(t, err)

	get := func(path string, header ...string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		for i := 0; i+1 < len(header); i += 2 {
			req.Header.Set(header[i], header[i+1])
		}
		w := httptest.NewRecorder()
		s.router.ServeHTTP(w, req)
		return w
	}

	t.Run("a bundle is kept for good", func(t *testing.T) {
		w := get(string(bundle))
		require.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "public, max-age=31536000, immutable", w.Header().Get("Cache-Control"))
		assert.Equal(t, want, w.Body.Bytes())
	})

	t.Run("the icon sprite is revalidated", func(t *testing.T) {
		w := get("/assets/icons/sprite.svg")
		require.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
		assert.NotEmpty(t, w.Header().Get("ETag"))
	})

	t.Run("the page is revalidated", func(t *testing.T) {
		w := get("/")
		require.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
		etag := w.Header().Get("ETag")
		require.NotEmpty(t, etag, "the page carries a validator to revalidate with")

		again := get("/", "If-None-Match", etag)
		assert.Equal(t, http.StatusNotModified, again.Code)
		assert.Empty(t, again.Body.Bytes())
	})

	t.Run("a bundle is sent compressed", func(t *testing.T) {
		w := get(string(bundle), "Accept-Encoding", "gzip, deflate, br")
		require.Equal(t, http.StatusOK, w.Code)
		require.Equal(t, "gzip", w.Header().Get("Content-Encoding"))
		assert.Contains(t, w.Header().Values("Vary"), "Accept-Encoding")
		assert.Less(t, w.Body.Len(), len(want)/2)
		zr, err := gzip.NewReader(bytes.NewReader(w.Body.Bytes()))
		require.NoError(t, err)
		got, err := io.ReadAll(zr)
		require.NoError(t, err)
		assert.Equal(t, want, got)
	})
}

// TestFrontendFiles pins the edges of serving the frontend: what is not a
// file stays with http.FileServer and is never marked as kept for good, a
// client that refuses gzip is not sent it, and a file that does not compress
// is sent as it is.
func TestFrontendFiles(t *testing.T) {
	script := bytes.Repeat([]byte("console.log('alps');\n"), 200)
	// Random bytes stand in for an image, which gzip cannot shrink.
	png := make([]byte, 4096)
	rand.New(rand.NewSource(1)).Read(png)
	router := NewRouter(&Server{logger: &NilLogger{}})
	router.Frontend(fstest.MapFS{
		"index.html":                &fstest.MapFile{Data: []byte(`<script src="/assets/index-B0ENZW0W.js"></script>`)},
		"assets/index-B0ENZW0W.js":  &fstest.MapFile{Data: script},
		"assets/photo-CiBQ2DWP.png": &fstest.MapFile{Data: png},
		"site.webmanifest":          &fstest.MapFile{Data: bytes.Repeat([]byte(`{"name":"Alps"}`), 100)},
		// Copied from frontend/public under the names they have there.
		"assets/icons/sprite.svg": &fstest.MapFile{Data: bytes.Repeat([]byte(`<symbol id="mail"></symbol>`), 50)},
		"assets/notify.wav":       &fstest.MapFile{Data: png},
	})
	get := func(path string, header ...string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		for i := 0; i+1 < len(header); i += 2 {
			req.Header.Set(header[i], header[i+1])
		}
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		return w
	}

	t.Run("gzip refused", func(t *testing.T) {
		for _, accept := range []string{"", "identity", "gzip;q=0", "br, gzip; q=0.0"} {
			w := get("/assets/index-B0ENZW0W.js", "Accept-Encoding", accept)
			assert.Equal(t, http.StatusOK, w.Code, accept)
			assert.Empty(t, w.Header().Get("Content-Encoding"), accept)
			assert.Equal(t, script, w.Body.Bytes(), accept)
			assert.Contains(t, w.Header().Values("Vary"), "Accept-Encoding", accept)
		}
		w := get("/assets/index-B0ENZW0W.js", "Accept-Encoding", "GZIP;q=0.5")
		assert.Equal(t, "gzip", w.Header().Get("Content-Encoding"))
		assert.Equal(t, "text/javascript; charset=utf-8", w.Header().Get("Content-Type"))
	})

	t.Run("each representation revalidates on its own", func(t *testing.T) {
		plain := get("/assets/index-B0ENZW0W.js").Header().Get("ETag")
		gz := get("/assets/index-B0ENZW0W.js", "Accept-Encoding", "gzip").Header().Get("ETag")
		require.NotEmpty(t, plain)
		require.NotEmpty(t, gz)
		assert.NotEqual(t, plain, gz)
		assert.Equal(t, http.StatusNotModified, get("/assets/index-B0ENZW0W.js", "If-None-Match", plain).Code)
		assert.Equal(t, http.StatusNotModified, get("/assets/index-B0ENZW0W.js", "If-None-Match", gz, "Accept-Encoding", "gzip").Code)
		assert.Equal(t, http.StatusOK, get("/assets/index-B0ENZW0W.js", "If-None-Match", plain, "Accept-Encoding", "gzip").Code)
	})

	t.Run("an incompressible file is sent as it is", func(t *testing.T) {
		w := get("/assets/photo-CiBQ2DWP.png", "Accept-Encoding", "gzip")
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Empty(t, w.Header().Get("Content-Encoding"))
		assert.Empty(t, w.Header().Values("Vary"))
		assert.Equal(t, png, w.Body.Bytes())
		assert.Equal(t, immutableCacheControl, w.Header().Get("Cache-Control"))
	})

	t.Run("an unhashed file is revalidated, compressed with its own type", func(t *testing.T) {
		w := get("/site.webmanifest", "Accept-Encoding", "gzip")
		assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
		assert.Equal(t, "gzip", w.Header().Get("Content-Encoding"))
		assert.NotContains(t, w.Header().Get("Content-Type"), "gzip")
	})

	t.Run("a file under assets/ that the build did not name is revalidated", func(t *testing.T) {
		for _, path := range []string{"/assets/icons/sprite.svg", "/assets/notify.wav"} {
			w := get(path)
			require.Equal(t, http.StatusOK, w.Code, path)
			assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"), path)
			etag := w.Header().Get("ETag")
			require.NotEmpty(t, etag, path)
			assert.Equal(t, http.StatusNotModified, get(path, "If-None-Match", etag).Code, path)
		}
	})

	t.Run("not a file", func(t *testing.T) {
		missing := get("/assets/index-Zz9Zz9Zz.js", "Accept-Encoding", "gzip")
		assert.Equal(t, http.StatusNotFound, missing.Code)
		assert.Empty(t, missing.Header().Get("Cache-Control"), "a missing bundle is not kept for good")

		listing := get("/assets/")
		assert.NotEqual(t, immutableCacheControl, listing.Header().Get("Cache-Control"))

		index := get("/index.html")
		assert.Equal(t, http.StatusMovedPermanently, index.Code)
		assert.Equal(t, "./", index.Header().Get("Location"))
	})

	t.Run("a range of the file", func(t *testing.T) {
		w := get("/assets/index-B0ENZW0W.js", "Range", "bytes=0-6")
		assert.Equal(t, http.StatusPartialContent, w.Code)
		assert.Equal(t, "console", w.Body.String())
	})
}

// TestPublicFilesKeepPlainNames: the build copies what frontend/public holds
// under the names it has there, and such a file can change under its name. A
// name of the form the build gives a hashed file, such as
// assets/notify-incoming.wav, would have browsers keep the file for a year.
func TestPublicFilesKeepPlainNames(t *testing.T) {
	require.True(t, hashedName.MatchString("assets/notify-incoming.wav"))
	var names []string
	err := filepath.WalkDir("frontend/public", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		name, err := filepath.Rel("frontend/public", path)
		if err != nil {
			return err
		}
		names = append(names, filepath.ToSlash(name))
		return nil
	})
	require.NoError(t, err)
	require.Contains(t, names, "assets/icons/sprite.svg")
	for _, name := range names {
		assert.False(t, hashedName.MatchString(name), "frontend/public/%s has a name the build gives hashed files, so it would be kept for good; rename it", name)
	}
}
