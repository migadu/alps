package alpscaldav

import (
	"context"
	"errors"
	"github.com/migadu/alps"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUnconfiguredCalDAVHasAStableStatus(t *testing.T) {
	p := &plugin{}
	_, _, err := p.clientWithCalendars(context.Background(), nil)
	var status *alps.HTTPError
	if !errors.As(err, &status) || status.Code != http.StatusConflict || status.Message != "caldav_not_configured" {
		t.Fatalf("unconfigured: %v", err)
	}
}

func TestUnconfiguredCalDAVDoesNotLogRequestErrors(t *testing.T) {
	logPath := filepath.Join(t.TempDir(), "server.log")
	h := startHarness(t, harnessOptions{noDefault: true, logger: alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath})})
	for _, path := range []string{"/calendar/calendars", "/calendar/tasks"} {
		r := h.do("GET", path, nil)
		h.expect(r, http.StatusConflict)
		var data struct{ Error string }
		h.decode(r, &data)
		if data.Error != "caldav_not_configured" {
			t.Fatalf("state=%q", data.Error)
		}
	}
	logs, err := os.ReadFile(logPath)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(logs), "Request error") {
		t.Fatalf("expected state logged as request error: %s", logs)
	}
}
