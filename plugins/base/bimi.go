package alpsbase

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/migadu/alps"
)

var scriptRegex = regexp.MustCompile(`(?i)<script[\s\S]*?</script>|\bon[a-z]+="[^"]*"|\bon[a-z]+='[^']*'|\bon[a-z]+=[^\s>]+|javascript:`)

func sanitizeSVG(raw []byte) []byte {
	return scriptRegex.ReplaceAll(raw, []byte(""))
}

func bimiNotFound(ctx *alps.Context, msg string) error {
	if ctx.Server.Options.Debug {
		ctx.Logger().Debugf("Request error: code=404, message=%s", msg)
	}
	return ctx.JSON(http.StatusNotFound, map[string]interface{}{
		"error":  msg,
		"code":   404,
		"status": http.StatusText(404),
	})
}

func handleBIMIAvatar(ctx *alps.Context) error {
	ctx.Response.Header().Set("Cache-Control", "public, max-age=86400")

	domain := ctx.QueryParam("domain")
	if domain == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "domain is required")
	}

	selector := ctx.QueryParam("selector")
	if selector == "" {
		selector = "default"
	}

	domain = strings.ToLower(domain)
	selector = strings.ToLower(selector)

	cacheDir := filepath.Join(os.TempDir(), "alps-avatars")
	os.MkdirAll(cacheDir, 0755)

	hashBytes := sha256.Sum256([]byte(selector + ":" + domain))
	hash := hex.EncodeToString(hashBytes[:])
	cacheFile := filepath.Join(cacheDir, hash+".svg")
	negCacheFile := filepath.Join(cacheDir, hash+".neg")

	if _, err := os.Stat(negCacheFile); err == nil {
		return bimiNotFound(ctx, "BIMI avatar not found (negative cache)")
	}

	if data, err := os.ReadFile(cacheFile); err == nil {
		ctx.Response.Header().Set("Content-Type", "image/svg+xml")
		ctx.Response.Header().Set("Content-Security-Policy", "default-src 'none'")
		return ctx.Stream(http.StatusOK, "image/svg+xml", bytes.NewReader(data))
	}

	txts, err := net.LookupTXT(fmt.Sprintf("%s._bimi.%s", selector, domain))
	var bimiURL string
	if err == nil {
		for _, txt := range txts {
			if strings.HasPrefix(txt, "v=BIMI1;") {
				parts := strings.Split(txt, ";")
				for _, p := range parts {
					p = strings.TrimSpace(p)
					if strings.HasPrefix(p, "l=") {
						bimiURL = strings.TrimPrefix(p, "l=")
						break
					}
				}
				break
			}
		}
	}

	if bimiURL == "" || !strings.HasPrefix(bimiURL, "https://") {
		os.WriteFile(negCacheFile, []byte(""), 0644)
		return bimiNotFound(ctx, "BIMI avatar not found")
	}

	client := http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(bimiURL)
	if err != nil || resp.StatusCode != http.StatusOK {
		os.WriteFile(negCacheFile, []byte(""), 0644)
		return bimiNotFound(ctx, "BIMI avatar not found")
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		os.WriteFile(negCacheFile, []byte(""), 0644)
		return bimiNotFound(ctx, "BIMI avatar not found")
	}

	sanitized := sanitizeSVG(body)
	os.WriteFile(cacheFile, sanitized, 0644)

	ctx.Response.Header().Set("Content-Type", "image/svg+xml")
	ctx.Response.Header().Set("Content-Security-Policy", "default-src 'none'")
	return ctx.Stream(http.StatusOK, "image/svg+xml", bytes.NewReader(sanitized))
}

func cleanupBIMIAvatars() error {
	cacheDir := filepath.Join(os.TempDir(), "alps-avatars")
	entries, err := os.ReadDir(cacheDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	threshold := time.Now().Add(-7 * 24 * time.Hour) // 7 days
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		if info.ModTime().Before(threshold) {
			os.Remove(filepath.Join(cacheDir, entry.Name()))
		}
	}
	return nil
}
