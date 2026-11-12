package alpscarddav

import (
	"bufio"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type wireLoggingOptions struct{}

func (wireLoggingOptions) Type() string { return "wire-logging-test" }
func (wireLoggingOptions) CreateFactory(time.Duration, bool) provider.AuthenticatedProviderFactory {
	return nil
}

func TestDAVWireLogsUseConfiguredLoggerAndRotation(t *testing.T) {
	logPath := filepath.Join(t.TempDir(), "alps.log")
	logger := alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath, Format: "json", Level: "debug"})
	srv, err := alps.New(logger, &alps.Options{Provider: wireLoggingOptions{}, SMTP: alps.SMTPOptions{Server: "smtps://smtp.example.test"}, EnabledPlugins: []string{"not-loaded"}})
	if err != nil {
		t.Fatal(err)
	}
	defer srv.Close()
	endpoint := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("Set-Cookie", "response-secret")
		w.Write([]byte("wire-response"))
	}))
	defer endpoint.Close()
	endpointURL, _ := url.Parse(endpoint.URL)
	p := &plugin{srv: srv, debug: true, url: endpointURL}
	connection, err := p.connection(context.Background(), nil)
	if err != nil {
		t.Fatal(err)
	}
	client := connection.client
	send := func(marker string) {
		t.Helper()
		req, _ := http.NewRequest("GET", endpoint.URL+"/"+marker, nil)
		req.Header.Set("Cookie", "request-secret")
		req.SetBasicAuth("wire-user", "wire-password")
		resp, err := client.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
	}
	assertTrace := func(path, marker string) {
		t.Helper()
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		if !strings.Contains(string(data), marker) || !strings.Contains(string(data), "wire-response") {
			t.Errorf("missing request/response traces in configured log: %s", data)
		}
		if strings.Contains(string(data), "request-secret") || strings.Contains(string(data), "response-secret") || strings.Contains(string(data), "Basic ") {
			t.Errorf("credentials leaked: %s", data)
		}
		scanner := bufio.NewScanner(strings.NewReader(string(data)))
		for scanner.Scan() {
			var row map[string]interface{}
			if err := json.Unmarshal(scanner.Bytes(), &row); err != nil {
				t.Errorf("trace bypassed JSON formatting: %q", scanner.Text())
			}
		}
	}
	send("before-rotation")
	assertTrace(logPath, "before-rotation")
	if err := os.Rename(logPath, logPath+".old"); err != nil {
		t.Fatal(err)
	}
	if ok, err := logger.Reopen(); err != nil || !ok {
		t.Fatalf("reopen: %v %v", ok, err)
	}
	send("after-rotation")
	assertTrace(logPath, "after-rotation")
	old, _ := os.ReadFile(logPath + ".old")
	if strings.Contains(string(old), "after-rotation") {
		t.Error("trace retained old file destination")
	}
}
