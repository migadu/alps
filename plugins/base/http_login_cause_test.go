package alpsbase

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type refusedLoginOptions struct{ provider.Options }

func (o refusedLoginOptions) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return func(string, string) (provider.MailProvider, error) {
		return nil, provider.AuthError{Cause: errors.New(`no mail provider configured for domain "unrouted.test"`)}
	}
}

func TestHTTPLoginLogsRefusalCause(t *testing.T) {
	path := filepath.Join(t.TempDir(), "login.json")
	logger := alps.NewLoggerWithOptions(alps.LoggerOptions{Output: path, Format: "json", Level: "info"})
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", logger, func(o *alps.Options) { o.Provider = refusedLoginOptions{o.Provider} })
	resp := s.do("POST", "/session", map[string]string{"username": "ada@unrouted.test", "password": "private-password"})
	s.expect(resp, http.StatusUnauthorized)
	failed := logLines(t, path, "sign-in failed")
	if len(failed) != 1 || !strings.Contains(strings.TrimSpace(asString(failed[0]["error"])), "no mail provider configured") {
		t.Fatalf("refusal cause missing: %v", failed)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(data), "private-password") {
		t.Fatal("password reached login log")
	}
}

func asString(value any) string { text, _ := value.(string); return text }
