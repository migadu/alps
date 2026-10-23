package alps

import (
	"bytes"
	"fmt"
	"html"
	"io/fs"
	"net/http"
)

// BrandingOptions is what a deployment changes about how alps looks before
// anyone signs in. The zero value is alps as it ships.
type BrandingOptions struct {
	// DefaultTheme is the colour theme for anyone who has not picked one.
	// Empty means the Alps theme. A theme picked in Settings stays the user's.
	DefaultTheme string
	// LoginLogoBuiltin names a logo alps ships, shown on the sign-in page in
	// place of the edelweiss. It takes the theme's colours in both modes.
	LoginLogoBuiltin string
	// LoginLogo is an image shown there instead, and LoginLogoDark in its
	// place in the dark modes, for a logo that would not show on a dark
	// background. Either may be nil; a dark one needs a light one.
	LoginLogo     *Image
	LoginLogoDark *Image
}

// BuiltinLogos are the logos alps ships, by the name login_logo takes: "alps"
// is the edelweiss the sign-in page shows anyway, the others are symbols in
// the icon sprite (BUILTIN_LOGOS in frontend/src/utils/branding.ts).
var BuiltinLogos = []string{"alps", "migadu"}

// Image is a file alps serves as it was configured.
type Image struct {
	Data []byte
	Type string // media type
}

// Themes lists the colour themes the frontend has (THEME_BUNDLES in
// frontend/src/store/themes.ts), so that a typo in default_theme stops alps
// at start-up rather than quietly showing the Alps theme.
var Themes = []string{"alps", "migadu", "nord", "ocean"}

// Where the sign-in page finds the configured logos.
const (
	loginLogoPath     = "/branding/login-logo"
	loginLogoDarkPath = "/branding/login-logo-dark"
)

// brandedShell returns index.html with the branding the frontend reads before
// anyone signs in, as <meta> tags, or nil when there is none to add. In the
// page itself, not behind a request, so the sign-in page is drawn in the
// configured theme from its first paint.
func brandedShell(index []byte, b BrandingOptions) ([]byte, error) {
	var meta bytes.Buffer
	if b.DefaultTheme != "" {
		fmt.Fprintf(&meta, "\n  <meta name=\"alps-default-theme\" content=\"%s\" />", html.EscapeString(b.DefaultTheme))
	}
	if b.LoginLogoBuiltin != "" {
		fmt.Fprintf(&meta, "\n  <meta name=\"alps-login-logo-builtin\" content=\"%s\" />", html.EscapeString(b.LoginLogoBuiltin))
	}
	if b.LoginLogo != nil {
		fmt.Fprintf(&meta, "\n  <meta name=\"alps-login-logo\" content=\"%s\" />", loginLogoPath)
	}
	if b.LoginLogoDark != nil {
		fmt.Fprintf(&meta, "\n  <meta name=\"alps-login-logo-dark\" content=\"%s\" />", loginLogoDarkPath)
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

// serveBranding answers the root with the branded shell and serves the login
// logos. Without branding it registers nothing, and the shell is the file in
// dist as before.
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
	r.serveImage(loginLogoPath, b.LoginLogo)
	r.serveImage(loginLogoDarkPath, b.LoginLogoDark)
	return nil
}

func (r *Router) serveImage(path string, img *Image) {
	if img == nil {
		return
	}
	r.mux.HandleFunc("GET "+path, func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", img.Type)
		// An SVG opened on its own is a document: it gets to run nothing.
		w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox")
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Write(img.Data)
	})
}
