package alps

import (
	"bytes"
	"fmt"
	"html"
	"io/fs"
	"path"
	"time"
)

// BrandingOptions is what a deployment changes about how alps looks. The zero
// value is alps as it ships.
type BrandingOptions struct {
	// DefaultTheme is the colour theme for anyone who has not picked one.
	// Empty means the Alps theme. A theme picked in Settings stays the user's.
	DefaultTheme string
	// A logo is a favicon package: the files in IconFiles. It stands where
	// the edelweiss is, on the sign-in page and in the header, and its icons
	// are the tab's and the home screen's. LogoBuiltin names one alps ships,
	// drawn in the theme's colours; LogoPackage is one read from disk, whose
	// favicon.svg the page shows. At most one is set.
	LogoBuiltin string
	LogoPackage map[string][]byte
}

// BuiltinLogos are the logos alps ships, by the name `logo` takes: "alps" is
// the edelweiss alps shows anyway. Each other has a symbol in the icon sprite
// (BUILTIN_LOGOS in frontend/src/utils/branding.ts) and a favicon package in
// frontend/public/assets/logos/<name>/.
var BuiltinLogos = []string{"alps", "migadu"}

// Themes lists the colour themes the frontend has (THEME_BUNDLES in
// frontend/src/store/themes.ts), so that a typo in default_theme stops alps
// at start-up rather than quietly showing the Alps theme.
var Themes = []string{"alps", "migadu", "nord", "ocean"}

// IconFiles make a favicon package: the icons browsers, home screens and the
// web manifest ask for, at the paths index.html and site.webmanifest give
// them. The names are the ones RealFaviconGenerator writes.
var IconFiles = []string{
	"favicon.svg",
	"favicon-96x96.png",
	"favicon.ico",
	"apple-touch-icon.png",
	"web-app-manifest-192x192.png",
	"web-app-manifest-512x512.png",
}

// brandedShell returns index.html with the branding the frontend reads before
// anyone signs in, as <meta> tags, or nil when there is none to add. In the
// page itself, not behind a request, so the sign-in page is drawn in the
// configured theme from its first paint.
func brandedShell(index []byte, b BrandingOptions) ([]byte, error) {
	var meta bytes.Buffer
	if b.DefaultTheme != "" {
		fmt.Fprintf(&meta, "\n  <meta name=\"alps-default-theme\" content=\"%s\" />", html.EscapeString(b.DefaultTheme))
	}
	if b.LogoBuiltin != "" {
		fmt.Fprintf(&meta, "\n  <meta name=\"alps-logo-builtin\" content=\"%s\" />", html.EscapeString(b.LogoBuiltin))
	}
	if b.LogoPackage != nil {
		meta.WriteString("\n  <meta name=\"alps-logo\" content=\"/favicon.svg\" />")
	}
	if meta.Len() == 0 {
		return nil, nil
	}
	head := []byte("<head>")
	i := bytes.Index(index, head)
	if i < 0 {
		return nil, fmt.Errorf("index.html has no <head> to put the branding in")
	}
	i += len(head)
	shell := make([]byte, 0, len(index)+meta.Len())
	shell = append(shell, index[:i]...)
	shell = append(shell, meta.Bytes()...)
	return append(shell, index[i:]...), nil
}

// brandedFrontend is the frontend as this deployment serves it: dist, with
// the branded shell in place of index.html and the logo's favicon package in
// place of alps's icons, and the names of the icons it replaced. Without
// branding it is dist as built, and replaces nothing.
//
// The branded files are served by the frontend's own file server, as every
// other file of it is: with Cache-Control, an ETag a reload revalidates with,
// gzip, and the build named by the page actually served. They had handlers of
// their own, which sent the page with no ETag and uncompressed, so every load
// downloaded it whole, and the icons with no Cache-Control and no ETag; and
// the build was named by the unbranded page, so a change of branding asked
// nobody to reload.
func brandedFrontend(dist fs.FS, b BrandingOptions) (fs.FS, []string, error) {
	index, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read index.html: %v", err)
	}
	shell, err := brandedShell(index, b)
	if err != nil {
		return nil, nil, err
	}
	files := map[string][]byte{}
	if shell != nil {
		files["index.html"] = shell
	}

	icons := b.LogoPackage
	if b.LogoBuiltin != "" {
		icons = make(map[string][]byte, len(IconFiles))
		for _, name := range IconFiles {
			if icons[name], err = fs.ReadFile(dist, "assets/logos/"+b.LogoBuiltin+"/"+name); err != nil {
				return nil, nil, fmt.Errorf("the %s logo has no %s: %v", b.LogoBuiltin, name, err)
			}
		}
	}
	var replaced []string
	for name, data := range icons {
		files[name] = data
		replaced = append(replaced, name)
	}
	if len(files) == 0 {
		return dist, nil, nil
	}
	return overlayFS{FS: dist, files: files}, replaced, nil
}

// overlayFS is an fs.FS with some of its files' content replaced. It lists
// what the FS under it lists, so a replaced file must be one that FS has.
type overlayFS struct {
	fs.FS
	files map[string][]byte
}

func (o overlayFS) Open(name string) (fs.File, error) {
	data, ok := o.files[name]
	if ok {
		return &overlayFile{Reader: bytes.NewReader(data), info: overlayInfo{name: path.Base(name), size: int64(len(data))}}, nil
	}
	f, err := o.FS.Open(name)
	if err != nil {
		return nil, err
	}
	if dir, ok := f.(fs.ReadDirFile); ok {
		info, err := f.Stat()
		if err != nil {
			f.Close()
			return nil, err
		}
		if info.IsDir() {
			return &overlayDir{ReadDirFile: dir, name: name, files: o.files}, nil
		}
	}
	return f, nil
}

// overlayDir keeps the underlying directory's order and read position, but
// reports the same metadata for replaced files as opening those files does.
type overlayDir struct {
	fs.ReadDirFile
	name  string
	files map[string][]byte
}

func (d *overlayDir) ReadDir(n int) ([]fs.DirEntry, error) {
	entries, err := d.ReadDirFile.ReadDir(n)
	for i, entry := range entries {
		if data, ok := d.files[path.Join(d.name, entry.Name())]; ok {
			entries[i] = fs.FileInfoToDirEntry(overlayInfo{name: entry.Name(), size: int64(len(data))})
		}
	}
	return entries, err
}

// overlayFile is a replaced file, open. It seeks, as http.ServeContent needs.
type overlayFile struct {
	*bytes.Reader
	info overlayInfo
}

func (f *overlayFile) Stat() (fs.FileInfo, error) { return f.info, nil }
func (f *overlayFile) Close() error               { return nil }

type overlayInfo struct {
	name string
	size int64
}

func (i overlayInfo) Name() string       { return i.name }
func (i overlayInfo) Size() int64        { return i.size }
func (i overlayInfo) Mode() fs.FileMode  { return 0o444 }
func (i overlayInfo) ModTime() time.Time { return time.Time{} }
func (i overlayInfo) IsDir() bool        { return false }
func (i overlayInfo) Sys() any           { return nil }
