package alpsbase

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
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

// scriptRegex removes script from a fetched BIMI logo. It is the layer under
// the sandboxing CSP and nosniff the avatar is served with, not the only one.
//
// A script element can be self-closing (`<script href="…"/>`) or left
// unclosed, and an attribute may have whitespace around its `=`; the earlier
// pattern matched only `<script>…</script>` and `on…="…"` written tight, so
// `onload = "…"` and a self-closing script passed through untouched.
var scriptRegex = regexp.MustCompile(`(?i)<script\b[^>]*/>|<script\b[\s\S]*?</script\s*>|<script\b[^>]*>|\bon[a-z]+\s*=\s*"[^"]*"|\bon[a-z]+\s*=\s*'[^']*'|\bon[a-z]+\s*=\s*[^\s>"']+|javascript\s*:`)

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

// bimiUnavailable answers a lookup or fetch that got no answer: the same 404 the
// avatar already falls back from, but not cacheable, so the browser asks again
// instead of keeping a day of "no logo" from one timeout.
func bimiUnavailable(ctx *alps.Context, msg string) error {
	ctx.Response.Header().Set("Cache-Control", "no-store")
	return bimiNotFound(ctx, msg)
}

// lookupTXT and fetchBIMILogo are the network, as variables so a test can
// stand in for DNS and the logo host.
var (
	lookupTXT = net.LookupTXT

	// The l= URL comes from the queried domain's DNS record, i.e. attacker
	// influenced: fetch through the egress-safe client so it cannot be pointed
	// at internal/metadata addresses (SSRF).
	fetchBIMILogo = func(url string) (*http.Response, error) {
		return newSafeHTTPClient(5 * time.Second).Get(url)
	}
)

// txtRecords looks up name's TXT records. No such name is an answer, and comes
// back as no records; any other failure is not, and comes back as an error.
func txtRecords(name string) ([]string, error) {
	txts, err := lookupTXT(name)
	var dnsErr *net.DNSError
	if err != nil && errors.As(err, &dnsErr) && dnsErr.IsNotFound {
		return nil, nil
	}
	return txts, err
}

// dmarcPolicy returns the p= tag of the first DMARC record among txts,
// lower-cased, or "" when there is none.
func dmarcPolicy(txts []string) string {
	for _, txt := range txts {
		record := strings.TrimSpace(txt)
		if !strings.HasPrefix(record, "v=DMARC1;") && !strings.HasPrefix(record, "v=DMARC1 ") {
			continue
		}
		for _, tag := range strings.Split(record, ";") {
			name, value, ok := strings.Cut(tag, "=")
			if ok && strings.TrimSpace(name) == "p" {
				return strings.ToLower(strings.TrimSpace(value))
			}
		}
	}
	return ""
}

// bimiRetryAfter is how long a lookup or fetch that got no answer is left
// before the next request tries again. Short, because the failure says nothing
// about the domain; not zero, so a resolver outage is not a lookup per avatar.
const bimiRetryAfter = 5 * time.Minute

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
		ctx.Response.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox")
		ctx.Response.Header().Set("X-Content-Type-Options", "nosniff")
		return ctx.Stream(http.StatusOK, "image/svg+xml", bytes.NewReader(data))
	}

	retryFile := filepath.Join(cacheDir, hash+".retry")
	if info, err := os.Stat(retryFile); err == nil && time.Since(info.ModTime()) < bimiRetryAfter {
		return bimiUnavailable(ctx, "BIMI avatar unavailable (retry later)")
	}

	// Only an answer goes in the negative cache, which cleanup keeps for a
	// week: no enforcing DMARC policy, no such name, no record, a record
	// without an https logo, a refused address, a 4xx from the logo host. A timeout, a resolver or network
	// failure, or a 5xx is not an answer, and was cached as one, so a single
	// blip hid a sender's logo for up to seven days.
	notFound := func() error {
		os.Remove(retryFile)
		os.WriteFile(negCacheFile, []byte(""), 0644)
		return bimiNotFound(ctx, "BIMI avatar not found")
	}
	retryLater := func(msg string) error {
		os.WriteFile(retryFile, []byte(""), 0644)
		return bimiUnavailable(ctx, msg)
	}

	// BIMI requires the sender domain to enforce DMARC. Under p=none, mail
	// that fails DMARC in the domain's name is still delivered, and a domain
	// that allows that gets no logo. There is no organizational-domain
	// fallback: mail from news.brand.example gets a logo only if that exact
	// name publishes a policy, which fails toward no logo.
	dmarcTXT, err := txtRecords("_dmarc." + domain)
	if err != nil {
		return retryLater("DMARC lookup failed")
	}
	if policy := dmarcPolicy(dmarcTXT); policy != "quarantine" && policy != "reject" {
		return notFound()
	}

	txts, err := txtRecords(fmt.Sprintf("%s._bimi.%s", selector, domain))
	if err != nil {
		return retryLater("BIMI lookup failed")
	}
	var bimiURL string
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

	if bimiURL == "" || !strings.HasPrefix(bimiURL, "https://") {
		return notFound()
	}

	resp, err := fetchBIMILogo(bimiURL)
	if err != nil {
		if errors.Is(err, errBlockedAddress) {
			return notFound()
		}
		return retryLater("BIMI logo fetch failed")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		switch {
		case resp.StatusCode >= 500, resp.StatusCode == http.StatusTooManyRequests, resp.StatusCode == http.StatusRequestTimeout:
			return retryLater("BIMI logo host unavailable")
		}
		return notFound()
	}

	const maxBIMISize = 1 * 1024 * 1024 // 1 MiB cap
	body, err := io.ReadAll(io.LimitReader(resp.Body, maxBIMISize))
	if err != nil {
		return retryLater("BIMI logo fetch failed")
	}
	os.Remove(retryFile)

	sanitized := sanitizeSVG(body)
	os.WriteFile(cacheFile, sanitized, 0644)

	ctx.Response.Header().Set("Content-Type", "image/svg+xml")
	ctx.Response.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox")
	ctx.Response.Header().Set("X-Content-Type-Options", "nosniff")
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
