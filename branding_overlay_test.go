package alps

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"
	"testing/fstest"

	"github.com/stretchr/testify/require"
)

func TestBrandedFrontendHTTPRepresentations(t *testing.T) {
	dist := testDist()
	pkg := map[string][]byte{}
	for _, name := range IconFiles {
		pkg[name] = bytes.Repeat([]byte("custom "+name+"\n"), 100)
	}
	pkg["favicon.svg"] = []byte("<svg xmlns=\"http://www.w3.org/2000/svg\">" + strings.Repeat("<!-- compressible -->", 200) + "</svg>")
	site, icons, err := brandedFrontend(dist, BrandingOptions{DefaultTheme: "nord", LogoPackage: pkg})
	require.NoError(t, err)
	r := NewRouter(&Server{logger: &NilLogger{}})
	r.Frontend(site, icons...)
	r.build = frontendBuild(site)
	request := func(method, path string, headers ...string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, path, nil)
		for i := 0; i < len(headers); i += 2 {
			req.Header.Set(headers[i], headers[i+1])
		}
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		return w
	}
	shell := request("GET", "/")
	sum := sha256.Sum256(shell.Body.Bytes())
	require.Equal(t, hex.EncodeToString(sum[:8]), shell.Header().Get(BuildHeader))
	for _, name := range IconFiles {
		t.Run(name, func(t *testing.T) {
			path := "/" + name
			raw := request("GET", path)
			require.Equal(t, http.StatusOK, raw.Code)
			require.Equal(t, pkg[name], raw.Body.Bytes())
			require.Equal(t, strconv.Itoa(len(pkg[name])), raw.Header().Get("Content-Length"))
			require.Equal(t, "no-cache", raw.Header().Get("Cache-Control"))
			require.Equal(t, "default-src 'none'; style-src 'unsafe-inline'; sandbox", raw.Header().Get("Content-Security-Policy"))
			head := request("HEAD", path)
			require.Equal(t, http.StatusOK, head.Code)
			require.Empty(t, head.Body.Bytes())
			require.Equal(t, raw.Header().Get("Content-Length"), head.Header().Get("Content-Length"))
			require.Equal(t, raw.Header().Get("ETag"), head.Header().Get("ETag"))
			partial := request("GET", path, "Range", "bytes=7-19")
			require.Equal(t, http.StatusPartialContent, partial.Code)
			require.Equal(t, pkg[name][7:20], partial.Body.Bytes())
			weak := request("GET", path, "If-None-Match", "W/"+raw.Header().Get("ETag"))
			require.Equal(t, http.StatusNotModified, weak.Code)
			require.Empty(t, weak.Body.Bytes())
			require.Contains(t, weak.Header().Get("Content-Security-Policy"), "sandbox")
			gz := request("GET", path, "Accept-Encoding", "gzip")
			require.Equal(t, "gzip", gz.Header().Get("Content-Encoding"))
			require.NotEqual(t, raw.Header().Get("ETag"), gz.Header().Get("ETag"))
			zr, err := gzip.NewReader(bytes.NewReader(gz.Body.Bytes()))
			require.NoError(t, err)
			body, err := io.ReadAll(zr)
			require.NoError(t, err)
			require.NoError(t, zr.Close())
			require.Equal(t, pkg[name], body)
			revalidated := request("GET", path, "Accept-Encoding", "gzip", "If-None-Match", gz.Header().Get("ETag"))
			require.Equal(t, http.StatusNotModified, revalidated.Code)
			require.Empty(t, revalidated.Body.Bytes())
			require.Equal(t, "no-cache", revalidated.Header().Get("Cache-Control"))
			require.Contains(t, revalidated.Header().Get("Content-Security-Policy"), "sandbox")
			require.Equal(t, http.StatusOK, request("GET", path, "Accept-Encoding", "gzip", "If-None-Match", raw.Header().Get("ETag")).Code)
		})
	}
	// Escaped exact routes and queries must retain the icon's document sandbox.
	for _, path := range []string{"/%66avicon.svg", "/favicon.svg?cache=1"} {
		w := request("GET", path)
		require.Equal(t, 200, w.Code)
		require.Contains(t, w.Header().Get("Content-Security-Policy"), "sandbox")
	}
	// Opening the overlay twice must give independent, seekable positions and the replacement size.
	a, err := site.Open("favicon.svg")
	require.NoError(t, err)
	defer a.Close()
	b, err := site.Open("favicon.svg")
	require.NoError(t, err)
	defer b.Close()
	info, err := a.Stat()
	require.NoError(t, err)
	require.EqualValues(t, len(pkg["favicon.svg"]), info.Size())
	seeker, ok := a.(io.Seeker)
	require.True(t, ok)
	_, err = seeker.Seek(-6, io.SeekEnd)
	require.NoError(t, err)
	tail, err := io.ReadAll(a)
	require.NoError(t, err)
	require.Equal(t, []byte("</svg>"), tail)
	all, err := io.ReadAll(b)
	require.NoError(t, err)
	require.Equal(t, pkg["favicon.svg"], all)
	// Concurrent first gzip use must remain race-free and stable.
	r = NewRouter(&Server{logger: &NilLogger{}})
	r.Frontend(site, icons...)
	var wg sync.WaitGroup
	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			w := request("GET", "/", "Accept-Encoding", "gzip")
			if w.Code != 200 {
				t.Errorf("status %d", w.Code)
			}
		}()
	}
	wg.Wait()
}

// Directory listings and opened files must describe the same replacement.
// TestFS also checks partial ReadDir calls, EOF, unrelated files and paths.
func TestBrandedFrontendFSConformance(t *testing.T) {
	for _, b := range []BrandingOptions{
		{},
		{DefaultTheme: "migadu"},
		{LogoBuiltin: "migadu"},
		{DefaultTheme: "nord", LogoPackage: map[string][]byte{"favicon.svg": []byte("<svg>custom</svg>")}},
	} {
		dist := testDist()
		dist["assets/untouched.txt"] = &fstest.MapFile{Data: []byte("left unchanged"), Mode: 0600}
		site, _, err := brandedFrontend(dist, b)
		require.NoError(t, err)
		require.NoError(t, fstest.TestFS(site, "index.html", "favicon.svg", "assets/untouched.txt"))
		original, err := fs.Stat(dist, "assets/untouched.txt")
		require.NoError(t, err)
		unchanged, err := fs.Stat(site, "assets/untouched.txt")
		require.NoError(t, err)
		require.Equal(t, original, unchanged)
	}
}
