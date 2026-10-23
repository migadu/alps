package main

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const brandingBase = "[smtp]\nserver = \"smtps://smtp.example.com:465\"\n[provider.imap]\nserver = \"imaps://imap.example.com:993\"\n"

func brandingOptions(t *testing.T, section string) error {
	t.Helper()
	cfg, err := LoadConfigString(brandingBase + "[branding]\n" + section)
	require.NoError(t, err)
	_, err = cfg.ToOptions()
	return err
}

// Without [branding], alps looks as it ships.
func TestBrandingDefaultsToNone(t *testing.T) {
	cfg, err := LoadConfigString(brandingBase)
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	assert.Empty(t, opts.Branding.DefaultTheme)
	assert.Empty(t, opts.Branding.LoginLogoBuiltin)
	assert.Empty(t, opts.Branding.LoginLogo)
}

// The Migadu theme brings its own logo, unless login_logo names another; a
// logo is picked by name in any theme.
func TestBrandingBuiltinLogo(t *testing.T) {
	file := filepath.Join(t.TempDir(), "logo.svg")
	require.NoError(t, os.WriteFile(file, []byte("<svg/>"), 0o644))

	for _, c := range []struct {
		name, section, builtin string
		file                   bool
	}{
		{"the theme's own", "default_theme = \"migadu\"\n", "migadu", false},
		{"by name", "login_logo = \"Migadu\"\n", "migadu", false},
		{"the edelweiss in the Migadu theme", "default_theme = \"migadu\"\nlogin_logo = \"alps\"\n", "", false},
		{"a file in the Migadu theme", fmt.Sprintf("default_theme = \"migadu\"\nlogin_logo = %q\n", file), "", true},
		{"none for a theme without one", "default_theme = \"nord\"\n", "", false},
	} {
		t.Run(c.name, func(t *testing.T) {
			cfg, err := LoadConfigString(brandingBase + "[branding]\n" + c.section)
			require.NoError(t, err)
			opts, err := cfg.ToOptions()
			require.NoError(t, err)
			assert.Equal(t, c.builtin, opts.Branding.LoginLogoBuiltin)
			assert.Equal(t, c.file, opts.Branding.LoginLogo != nil)
		})
	}
}

func TestBrandingReadsThemeAndLogo(t *testing.T) {
	logo := filepath.Join(t.TempDir(), "logo.SVG")
	require.NoError(t, os.WriteFile(logo, []byte("<svg/>"), 0o644))

	cfg, err := LoadConfigString(brandingBase + fmt.Sprintf("[branding]\ndefault_theme = \" Migadu \"\nlogin_logo = %q\n", logo))
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	assert.Equal(t, "migadu", opts.Branding.DefaultTheme)
	require.NotNil(t, opts.Branding.LoginLogo)
	assert.Equal(t, []byte("<svg/>"), opts.Branding.LoginLogo.Data)
	assert.Equal(t, "image/svg+xml", opts.Branding.LoginLogo.Type)
	assert.Nil(t, opts.Branding.LoginLogoDark)
}

func TestBrandingReadsDarkLogo(t *testing.T) {
	dir := t.TempDir()
	light, dark := filepath.Join(dir, "light.png"), filepath.Join(dir, "dark.webp")
	require.NoError(t, os.WriteFile(light, []byte("light"), 0o644))
	require.NoError(t, os.WriteFile(dark, []byte("dark"), 0o644))

	cfg, err := LoadConfigString(brandingBase + fmt.Sprintf("[branding]\nlogin_logo = %q\nlogin_logo_dark = %q\n", light, dark))
	require.NoError(t, err)
	opts, err := cfg.ToOptions()
	require.NoError(t, err)
	require.NotNil(t, opts.Branding.LoginLogoDark)
	assert.Equal(t, "image/png", opts.Branding.LoginLogo.Type)
	assert.Equal(t, "image/webp", opts.Branding.LoginLogoDark.Type)
	assert.Equal(t, []byte("dark"), opts.Branding.LoginLogoDark.Data)
}

// A mistake in [branding] stops alps at start-up, where it is seen, instead of
// leaving the sign-in page quietly unbranded.
func TestBrandingRefusesMistakes(t *testing.T) {
	dir := t.TempDir()
	big := filepath.Join(dir, "big.png")
	require.NoError(t, os.WriteFile(big, make([]byte, maxLogoBytes+1), 0o644))

	for name, section := range map[string]string{
		"unknown theme":    "default_theme = \"migado\"\n",
		"missing logo":     fmt.Sprintf("login_logo = %q\n", filepath.Join(dir, "none.svg")),
		"not an image":     fmt.Sprintf("login_logo = %q\n", filepath.Join(dir, "logo.gif")),
		"logo too large":   fmt.Sprintf("login_logo = %q\n", big),
		"unknown built-in": "login_logo = \"migado\"\n",
		// A built-in logo already follows the theme into the dark modes.
		"dark with built-in": fmt.Sprintf("login_logo = \"migadu\"\nlogin_logo_dark = %q\n", big),
		// A dark logo alone would leave the light modes with the edelweiss.
		"dark logo alone": fmt.Sprintf("login_logo_dark = %q\n", big),
	} {
		t.Run(name, func(t *testing.T) {
			var cerr ConfigError
			require.ErrorAs(t, brandingOptions(t, section), &cerr)
			assert.Contains(t, cerr.Location, "branding.")
		})
	}
}
