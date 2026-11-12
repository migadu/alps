package alpscarddav

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

func TestEmptyAddressBookHomeIsListedEmptyAndWritesConflict(t *testing.T) {
	h := newHarness(t)
	h.dav.empty = true
	r := h.do("GET", "/contacts", nil)
	h.expect(r, http.StatusOK)
	var data struct{ Contacts []ContactData }
	h.decode(r, &data)
	if data.Contacts == nil || len(data.Contacts) != 0 {
		t.Fatalf("contacts not an empty array: %s", r.body)
	}
	r = h.do("POST", "/contacts/create", map[string]string{"name": "Ada", "email": "ada@example.com"})
	h.expect(r, http.StatusConflict)
	var refusal struct{ Error string }
	h.decode(r, &refusal)
	if refusal.Error != "no_address_book" {
		t.Fatalf("refusal: %s", r.body)
	}
}
func TestUnconfiguredCardDAVHasAStableStatus(t *testing.T) {
	p := &plugin{}
	_, _, err := p.clientWithAddressBook(context.Background(), nil)
	var status *alps.HTTPError
	if !errors.As(err, &status) || status.Code != http.StatusConflict || status.Message != "carddav_not_configured" {
		t.Fatalf("unconfigured: %v", err)
	}
}

func TestExpectedAddressBookStatesDoNotLogRequestErrors(t *testing.T) {
	for _, state := range []string{"no_address_book", "carddav_not_configured"} {
		t.Run(state, func(t *testing.T) {
			logPath := filepath.Join(t.TempDir(), "server.log")
			logger := alps.NewLoggerWithOptions(alps.LoggerOptions{Output: logPath})
			h := newHarnessConfigured(t, nil, logger, func(opts *alps.Options) {
				if state == "carddav_not_configured" {
					opts.Plugins["carddav"] = alps.PluginConfig{Enabled: true}
				}
			})
			h.dav.empty = true
			r := h.do("POST", "/contacts/create", map[string]string{"name": "Ada", "email": "ada@example.com"})
			h.expect(r, http.StatusConflict)
			var data struct{ Error string }
			h.decode(r, &data)
			if data.Error != state {
				t.Fatalf("state=%q want %q", data.Error, state)
			}
			logs, err := os.ReadFile(logPath)
			if err != nil {
				t.Fatal(err)
			}
			if strings.Contains(string(logs), "Request error") {
				t.Fatalf("expected state logged as request error: %s", logs)
			}
		})
	}
}
