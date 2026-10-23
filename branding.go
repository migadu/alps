package alps

import (
	"bytes"
	"fmt"
	"html"
	"io/fs"
	"net/http"
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

// serveBranding answers the root with the branded shell, and the icon paths
// with the logo's favicon package. Without branding it registers nothing, and
// the shell and icons are the files in dist as before.
func (r *Router) serveBranding(dist fs.FS, b BrandingOptions) error {
	index, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return fmt.Errorf("failed to read index.html: %v", err)
	}
	shell, err := brandedShell(index, b)
	if err != nil {
		return err
	}
	if shell != nil {
		// The root only; the file server sends /index.html here as well.
		r.mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, req *http.Request) {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-cache")
			w.Write(shell)
		})
	}

	icons := b.LogoPackage
	if b.LogoBuiltin != "" {
		icons = make(map[string][]byte, len(IconFiles))
		for _, name := range IconFiles {
			if icons[name], err = fs.ReadFile(dist, "assets/logos/"+b.LogoBuiltin+"/"+name); err != nil {
				return fmt.Errorf("the %s logo has no %s: %v", b.LogoBuiltin, name, err)
			}
		}
	}
	for name, data := range icons {
		r.mux.HandleFunc("GET /"+name, func(w http.ResponseWriter, req *http.Request) {
			// An SVG opened on its own is a document: it gets to run nothing.
			w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox")
			http.ServeContent(w, req, name, time.Time{}, bytes.NewReader(data))
		})
	}
	return nil
}
