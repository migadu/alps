package alps

import (
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
)

// immutableCacheControl is the freshness of a file named by a hash of its
// content: the name never comes to mean other bytes, so a browser may keep the
// file for as long as it likes.
const immutableCacheControl = "public, max-age=31536000, immutable"

// hashedName matches the names the build gives what it emits: assets/, then
// the file's name and eight characters of a hash of its content. What it
// copies from frontend/public keeps the name it has there, even under assets/
// (icons/sprite.svg, notify.wav), and can change under that name, so it is
// revalidated like index.html. The sprite's ?v= has not been raised for every
// change to it, and kept for a year, an old sprite would go on showing.
var hashedName = regexp.MustCompile(`^assets/[^/]+-[A-Za-z0-9_-]{8}\.[A-Za-z0-9]+$`)

// frontendFiles serves the built frontend. Its files carry no modification
// time, and http.FileServer sends no validator of its own, so without this a
// browser could reuse nothing it had cached and every page load would download
// every bundle again. The frontend never changes while the server runs, which
// is what lets each file's ETag be computed once, at startup, and its gzip
// once, on the first request for it.
type frontendFiles struct {
	fsys  fs.FS
	hfs   http.FileSystem
	files http.Handler
	// Every regular file in fsys, by its path in fsys. It is filled once and
	// only read after that, and requests for names it lacks never add one.
	byName map[string]*frontendFile
}

type frontendFile struct {
	etag      string // quoted
	immutable bool   // named by a hash of its content
	once      sync.Once
	// The gzipped content and the type it stands for, when compressing it
	// was worth it; nil otherwise.
	gzip  []byte
	ctype string
}

func newFrontendFiles(fsys fs.FS) *frontendFiles {
	hfs := http.FS(fsys)
	f := &frontendFiles{
		fsys:   fsys,
		hfs:    hfs,
		files:  http.FileServer(hfs),
		byName: map[string]*frontendFile{},
	}
	// A file that cannot be read is left out, and http.FileServer answers
	// for it as it always has.
	_ = fs.WalkDir(fsys, ".", func(name string, d fs.DirEntry, err error) error {
		if err != nil || !d.Type().IsRegular() {
			return nil
		}
		data, err := fs.ReadFile(fsys, name)
		if err != nil {
			return nil
		}
		sum := sha256.Sum256(data)
		f.byName[name] = &frontendFile{
			etag:      `"` + hex.EncodeToString(sum[:8]) + `"`,
			immutable: hashedName.MatchString(name),
		}
		return nil
	})
	return f
}

func (f *frontendFiles) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	name := "index.html"
	if req.URL.Path != "/" {
		name = strings.TrimPrefix(req.URL.Path, "/")
	}
	file := f.byName[name]
	// Directories, missing files, and /index.html (which redirects to /)
	// are http.FileServer's to answer, as before.
	if file == nil || name == "index.html" && req.URL.Path != "/" {
		f.files.ServeHTTP(w, req)
		return
	}

	h := w.Header()
	if file.immutable {
		h.Set("Cache-Control", immutableCacheControl)
	} else {
		// index.html names the bundles, so it must be asked about on every
		// load, as must any file whose name stays when its content changes.
		// The ETag makes asking cheap: an unchanged file is a 304.
		h.Set("Cache-Control", "no-cache")
	}

	if gz, ctype := f.gzipped(name, file); gz != nil {
		h.Add("Vary", "Accept-Encoding")
		if acceptsGzip(req.Header.Get("Accept-Encoding")) {
			// The compressed bytes are another representation, so they need
			// a validator of their own.
			h.Set("ETag", strings.TrimSuffix(file.etag, `"`)+`-gzip"`)
			h.Set("Content-Encoding", "gzip")
			h.Set("Content-Type", ctype)
			http.ServeContent(w, req, name, time.Time{}, bytes.NewReader(gz))
			return
		}
	}

	h.Set("ETag", file.etag)
	content, err := f.hfs.Open(name)
	if err != nil {
		f.files.ServeHTTP(w, req)
		return
	}
	defer content.Close()
	http.ServeContent(w, req, name, time.Time{}, content)
}

// gzipped compresses a file the first time it is asked for. Formats that are
// compressed already (images, woff2) come out barely smaller and are sent as
// they are.
func (f *frontendFiles) gzipped(name string, file *frontendFile) ([]byte, string) {
	file.once.Do(func() {
		data, err := fs.ReadFile(f.fsys, name)
		if err != nil {
			return
		}
		// The highest level would save well under 1% more on these
		// bundles, and take one and a half to three times as long, which
		// the first reader waits for.
		var buf bytes.Buffer
		zw := gzip.NewWriter(&buf)
		if _, err := zw.Write(data); err != nil {
			return
		}
		if err := zw.Close(); err != nil {
			return
		}
		if buf.Len() > len(data)-len(data)/8 {
			return
		}
		// Sniffing the compressed bytes would name them gzip, so the type is
		// taken here from what they stand for, the way ServeContent would.
		ctype := mime.TypeByExtension(path.Ext(name))
		if ctype == "" {
			ctype = http.DetectContentType(data)
		}
		file.gzip, file.ctype = buf.Bytes(), ctype
	})
	return file.gzip, file.ctype
}

// acceptsGzip reports whether an Accept-Encoding header lets an answer be
// gzipped: it names gzip, and not with a quality of zero.
func acceptsGzip(header string) bool {
	for _, part := range strings.Split(header, ",") {
		coding, params, _ := strings.Cut(part, ";")
		if !strings.EqualFold(strings.TrimSpace(coding), "gzip") {
			continue
		}
		for _, param := range strings.Split(params, ";") {
			key, value, _ := strings.Cut(strings.TrimSpace(param), "=")
			if strings.EqualFold(strings.TrimSpace(key), "q") {
				q, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
				return err == nil && q > 0
			}
		}
		return true
	}
	return false
}
