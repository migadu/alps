package main

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/migadu/alps"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const brandingBase = "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\n"

func brandingOptions(t *testing.T, section string) (alps.BrandingOptions, error) {
	t.Helper()
	cfg, err := LoadConfigString(brandingBase + "[branding]\n" + section)
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	return opts.Branding, err
}

// faviconPackage writes a full favicon package into a new folder.
func faviconPackage(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	for _, name := range alps.IconFiles {
		require.NoError(t, os.WriteFile(filepath.Join(dir, name), []byte("own "+name), 0o644))
	}
	return dir
}

// Without [branding], alps looks as it ships.
func TestBrandingDefaultsToNone(t *testing.T) {
	cfg, err := LoadConfigString(brandingBase)
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	assert.Empty(t, opts.Branding.DefaultTheme)
	assert.Empty(t, opts.Branding.LogoBuiltin)
	assert.Nil(t, opts.Branding.LogoPackage)
}

// The Migadu theme brings its own logo, unless logo names another; a logo is
// picked by name in any theme, or read from a folder.
func TestBrandingLogo(t *testing.T) {
	pkg := faviconPackage(t)
	for _, c := range []struct {
		name, section, builtin string
		pkg                    bool
	}{
		{"the theme's own", "default_theme = \" Migadu \"\n", "migadu", false},
		{"by name", "logo = \"Migadu\"\n", "migadu", false},
		{"the edelweiss in the Migadu theme", "default_theme = \"migadu\"\nlogo = \"alps\"\n", "", false},
		{"a package in the Migadu theme", fmt.Sprintf("default_theme = \"migadu\"\nlogo = %q\n", pkg), "", true},
		{"none for a theme without one", "default_theme = \"nord\"\n", "", false},
	} {
		t.Run(c.name, func(t *testing.T) {
			opts, err := brandingOptions(t, c.section)
			require.NoError(t, err)
			assert.Equal(t, c.builtin, opts.LogoBuiltin)
			assert.Equal(t, c.pkg, opts.LogoPackage != nil)
		})
	}
}

func TestBrandingReadsAFaviconPackage(t *testing.T) {
	opts, err := brandingOptions(t, fmt.Sprintf("logo = %q\n", faviconPackage(t)))
	require.NoError(t, err)
	require.Len(t, opts.LogoPackage, len(alps.IconFiles))
	for _, name := range alps.IconFiles {
		assert.Equal(t, []byte("own "+name), opts.LogoPackage[name])
	}
}

// A mistake in [branding] stops alps at start-up, where it is seen, instead of
// leaving the page quietly unbranded.
func TestBrandingRefusesMistakes(t *testing.T) {
	incomplete := faviconPackage(t)
	require.NoError(t, os.Remove(filepath.Join(incomplete, "favicon.ico")))
	big := faviconPackage(t)
	require.NoError(t, os.WriteFile(filepath.Join(big, "favicon.svg"), make([]byte, maxIconBytes+1), 0o644))
	file := filepath.Join(t.TempDir(), "logo.svg")
	require.NoError(t, os.WriteFile(file, []byte("<svg/>"), 0o644))

	for name, section := range map[string]string{
		"unknown theme":      "default_theme = \"migado\"\n",
		"unknown built-in":   "logo = \"migado\"\n",
		"a file, not folder": fmt.Sprintf("logo = %q\n", file),
		"incomplete package": fmt.Sprintf("logo = %q\n", incomplete),
		"icon too large":     fmt.Sprintf("logo = %q\n", big),
	} {
		t.Run(name, func(t *testing.T) {
			_, err := brandingOptions(t, section)
			var cerr ConfigError
			require.ErrorAs(t, err, &cerr)
			assert.Contains(t, cerr.Location, "branding.")
		})
	}
}
