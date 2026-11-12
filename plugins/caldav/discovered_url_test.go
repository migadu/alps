package alpscaldav

import (
	"context"
	"errors"
	"github.com/migadu/alps"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOnlyBareHostsReachCalDAVDiscovery(t *testing.T) {
	old := discoverCalDAVURL
	t.Cleanup(func() { discoverCalDAVURL = old })
	calls := 0
	discoverCalDAVURL = func(context.Context, string) (string, error) {
		calls++
		return "", errors.New("discovery should not run")
	}
	for _, raw := range []string{"dav.example.com/caldav", "/caldav", "https:/dav.example.com", "https:dav.example.com", "//dav.example.com:8443", "//dav.example.com?query"} {
		srv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"caldav": {Enabled: true, Server: raw}}}}
		if _, err := newPlugin(srv); err == nil {
			t.Errorf("accepted non-bare discovery target %q", raw)
		}
	}
	if calls != 0 {
		t.Errorf("discovery called %d times for non-bare hosts", calls)
	}
}
func TestDiscoveredCalDAVURLsPassTheEndpointValidator(t *testing.T) {
	old := discoverCalDAVURL
	t.Cleanup(func() { discoverCalDAVURL = old })
	for _, raw := range []string{"https:/dav.example.com", "https:dav.example.com", "https:///dav", "dav.example.com/caldav", "ftp://dav.example.com"} {
		t.Run(raw, func(t *testing.T) {
			discoverCalDAVURL = func(context.Context, string) (string, error) { return raw, nil }
			srv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"caldav": {Enabled: true, Server: "dav.example.com"}}}}
			if pl, err := newPlugin(srv); err == nil {
				t.Errorf("accepted discovered URL %q: %v", raw, pl)
			}
		})
	}
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	defer target.Close()
	called := false
	discoverCalDAVURL = func(_ context.Context, host string) (string, error) {
		called = true
		if host != "dav.example.com" {
			t.Errorf("discovered %q", host)
		}
		return target.URL, nil
	}
	srv := &alps.Server{Options: &alps.Options{Plugins: map[string]alps.PluginConfig{"caldav": {Enabled: true, Server: "dav.example.com"}}}}
	if pl, err := newPlugin(srv); err != nil || pl == nil || !called {
		t.Fatalf("valid discovery: plugin=%v err=%v called=%v", pl, err, called)
	}
}
