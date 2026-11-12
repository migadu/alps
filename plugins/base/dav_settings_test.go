package alpsbase

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// The base package's HTTP tests load just the base plugin. These two route-free
// test plugins provide the DAV capabilities without importing the DAV packages
// (whose test binaries also import base).
func init() {
	alps.RegisterPluginLoader(func(server *alps.Server) ([]alps.Plugin, error) {
		var plugins []alps.Plugin
		for _, name := range []string{"caldav", "carddav"} {
			if server.Options.Plugins[name].Options["dav_settings_test"] == true {
				p := alps.GoPlugin{Name: name}
				plugins = append(plugins, p.Plugin())
			}
		}
		return plugins, nil
	})
}

func newDAVSettingsServer(t *testing.T, adjust func(*alps.Options)) *testServer {
	t.Helper()
	return newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(options *alps.Options) {
		options.Plugins = map[string]alps.PluginConfig{
			"caldav":  {Enabled: true, Options: map[string]interface{}{"dav_settings_test": true}},
			"carddav": {Enabled: true, Options: map[string]interface{}{"dav_settings_test": true}},
		}
		// The personal endpoints in these tests are loopback HTTP servers.
		options.DAVAllowPrivateServers = true
		options.DAVConnectionFreshFor = -1
		if adjust != nil {
			adjust(options)
		}
	})
}

func settingsDiscoveryServer(t *testing.T, username, password string) string {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, p, ok := r.BasicAuth()
		if !ok || u != username || p != password {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(http.StatusMultiStatus)
		fmt.Fprintf(w, `<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:A="urn:ietf:params:xml:ns:carddav"><D:response><D:href>%s</D:href><D:propstat><D:prop><D:current-user-principal><D:href>/principal/</D:href></D:current-user-principal><C:calendar-home-set><D:href>/calendars/</D:href></C:calendar-home-set><A:addressbook-home-set><D:href>/addressbooks/</D:href></A:addressbook-home-set></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>`, r.URL.Path)
	}))
	t.Cleanup(server.Close)
	return strings.Replace(server.URL, "http://", "http+insecure://", 1) + "/dav/"
}

func TestHTTP_DAVPersonalConnectionsActivateAndResetEachService(t *testing.T) {
	dav := settingsDiscoveryServer(t, "radicale-user", "DAV-only-secret")
	s := newDAVSettingsServer(t, nil)
	s.expect(s.do(http.MethodGet, "/settings/dav/caldav", nil), http.StatusUnauthorized)
	s.login()
	active := func() []string {
		t.Helper()
		var payload struct{ EnabledPlugins, ActivePlugins []string }
		r := s.do(http.MethodGet, "/session", nil)
		s.expect(r, http.StatusOK)
		r.json(t, &payload)
		if !slices.Contains(payload.EnabledPlugins, "caldav") || !slices.Contains(payload.EnabledPlugins, "carddav") {
			t.Fatalf("DAV capability missing: %+v", payload)
		}
		return payload.ActivePlugins
	}
	if plugins := active(); slices.Contains(plugins, "caldav") || slices.Contains(plugins, "carddav") {
		t.Fatalf("unconfigured DAV already active: %v", plugins)
	}
	var settings alps.DAVSettings
	r := s.do(http.MethodGet, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &settings)
	if settings.Configured || settings.PersonalConfigured || !settings.UseMailCredentials || !settings.CanSave {
		t.Fatalf("initial settings: %+v", settings)
	}
	input := map[string]any{"server": dav, "use_mail_credentials": false, "username": "radicale-user", "password": "DAV-only-secret"}
	for _, service := range []string{"caldav", "carddav"} {
		r = s.do(http.MethodPut, "/settings/dav/"+service, input)
		s.expect(r, http.StatusOK)
		r.json(t, &settings)
		if !settings.Configured || !settings.PersonalConfigured || !settings.PasswordConfigured || settings.UseMailCredentials {
			t.Fatalf("saved settings: %+v", settings)
		}
		if strings.Contains(string(r.body), "DAV-only-secret") || strings.Contains(string(r.body), "password_enc") {
			t.Fatalf("save exposed a secret: %s", r.body)
		}
	}
	if plugins := active(); !slices.Contains(plugins, "caldav") || !slices.Contains(plugins, "carddav") {
		t.Fatalf("configured DAV missing: %v", plugins)
	}
	stored, err := os.ReadFile(filepath.Join(s.dir, "alps_store.json"))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(stored), "DAV-only-secret") || !strings.Contains(string(stored), "password_enc") {
		t.Fatalf("storage not encrypted: %s", stored)
	}
	input["password"] = "wrong"
	r = s.do(http.MethodPut, "/settings/dav/caldav", input)
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "dav_auth_failed") {
		t.Fatalf("incorrect error: %s", r.body)
	}
	r = s.do(http.MethodGet, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &settings)
	if !settings.PersonalConfigured {
		t.Fatal("failed replacement removed the saved personal connection")
	}
	s.expect(s.do(http.MethodGet, "/session", nil), http.StatusOK)
	r = s.do(http.MethodDelete, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &settings)
	if settings.PersonalConfigured {
		t.Fatal("reset still advertises a personal connection")
	}
	if plugins := active(); slices.Contains(plugins, "caldav") || !slices.Contains(plugins, "carddav") {
		t.Fatalf("reset affected another service: %v", plugins)
	}
	s.expect(s.do(http.MethodGet, "/settings/dav/smtp", nil), http.StatusNotFound)
}

func TestHTTP_DAVSettingsWithoutKeyAllowMailCredentialsAndRejectCustomSecrets(t *testing.T) {
	dav := settingsDiscoveryServer(t, testUser, testPassword)
	s := newDAVSettingsServer(t, func(options *alps.Options) { options.LoginKey = nil })
	s.login()
	var settings alps.DAVSettings
	r := s.do(http.MethodGet, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &settings)
	if settings.CanSave || settings.PersonalConfigured {
		t.Fatal("custom password saving offered without an encryption key")
	}
	r = s.do(http.MethodPut, "/settings/dav/caldav", map[string]any{"server": dav, "username": "custom", "password": "secret"})
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "dav_login_key_required") {
		t.Fatalf("missing key error: %s", r.body)
	}
	r = s.do(http.MethodGet, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &settings)
	if settings.PersonalConfigured {
		t.Fatal("failed initial save created a personal connection")
	}
	r = s.do(http.MethodPut, "/settings/dav/caldav", map[string]any{"server": dav, "use_mail_credentials": true, "mail_password": testPassword})
	s.expect(r, http.StatusOK)
	r.json(t, &settings)
	if !settings.UseMailCredentials || settings.PasswordConfigured || !settings.Configured || !settings.PersonalConfigured {
		t.Fatalf("mail credentials override: %+v", settings)
	}
}

func TestHTTP_DAVCorruptRecordDoesNotBreakMailAndCanBeReset(t *testing.T) {
	s := newDAVSettingsServer(t, nil)
	s.login()
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put("dav.connection.caldav", "broken"); err != nil {
		t.Fatal(err)
	}
	r := s.do(http.MethodGet, "/session", nil)
	s.expect(r, http.StatusOK)
	var payload struct{ ActivePlugins []string }
	r.json(t, &payload)
	if slices.Contains(payload.ActivePlugins, "caldav") {
		t.Fatal("corrupt service is active")
	}
	r = s.do(http.MethodGet, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusBadGateway)
	var unavailable map[string]any
	r.json(t, &unavailable)
	if unavailable["error"] != "dav_unavailable" || unavailable["personal_configured"] != true {
		t.Fatalf("corrupt saved record did not offer targeted recovery: %s", r.body)
	}
	s.expect(s.do(http.MethodDelete, "/settings/dav/caldav", nil), http.StatusOK)
	s.expect(s.do(http.MethodGet, "/settings/dav/caldav", nil), http.StatusOK)
}

type davReadErrorProvider struct {
	provider.MailProvider
	cause error
}

func (p davReadErrorProvider) GetStore() (provider.Store, error) {
	store, err := p.MailProvider.GetStore()
	if err != nil {
		return nil, err
	}
	return davReadErrorStore{Store: store, cause: p.cause}, nil
}

type davReadErrorStore struct {
	provider.Store
	cause error
}

func (s davReadErrorStore) Get(key string, out interface{}) error {
	if strings.HasPrefix(key, "dav.connection.") {
		return s.cause
	}
	return s.Store.Get(key, out)
}

func (s davReadErrorStore) GetFresh(key string, out interface{}) error {
	if strings.HasPrefix(key, "dav.connection.") {
		return s.cause
	}
	return provider.GetFresh(s.Store, key, out)
}

func TestHTTP_DAVStorageAndNetworkFailuresDoNotAdvertisePersonalConnections(t *testing.T) {
	for _, cause := range []error{
		errors.New("metadata temporarily unavailable"),
		&net.OpError{Op: "read", Net: "tcp", Err: errors.New("connection reset")},
	} {
		t.Run(cause.Error(), func(t *testing.T) {
			s := newDAVSettingsServer(t, func(options *alps.Options) {
				options.Provider = wrappedOptions{Options: options.Provider, wrap: func(p provider.MailProvider) provider.MailProvider {
					return davReadErrorProvider{MailProvider: p, cause: cause}
				}}
			})
			s.login()
			r := s.do(http.MethodGet, "/settings/dav/caldav", nil)
			s.expect(r, http.StatusBadGateway)
			var unavailable map[string]any
			r.json(t, &unavailable)
			if unavailable["error"] != "dav_unavailable" {
				t.Fatalf("unexpected error: %s", r.body)
			}
			if _, exists := unavailable["personal_configured"]; exists {
				t.Fatalf("unreadable store falsely advertises a saved connection: %s", r.body)
			}
		})
	}
}

func TestHTTP_DAVPublicDefaultsRedactEmbeddedSecretsAndDisabledServicesAreUnavailable(t *testing.T) {
	s := newDAVSettingsServer(t, func(options *alps.Options) {
		cfg := options.Plugins["caldav"]
		cfg.Server = "https://admin:embedded-secret@dav.example/path?token=query-secret#fragment-secret"
		options.Plugins["caldav"] = cfg
	})
	s.login()
	r := s.do(http.MethodGet, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusOK)
	for _, secret := range []string{"embedded-secret", "query-secret", "fragment-secret"} {
		if strings.Contains(string(r.body), secret) {
			t.Fatalf("public default exposed %s: %s", secret, r.body)
		}
	}
	var settings alps.DAVSettings
	r.json(t, &settings)
	if settings.DefaultServer != "https://dav.example/path" || !settings.Configured || settings.PersonalConfigured {
		t.Fatalf("redacted default: %q", settings.DefaultServer)
	}
	var public map[string]any
	r.json(t, &public)
	if value, exists := public["personal_configured"]; !exists || value != false {
		t.Fatalf("public settings omitted the unsaved personal state: %s", r.body)
	}
	disabled := newDAVSettingsServer(t, func(options *alps.Options) { options.EnabledPlugins = []string{"base"} })
	disabled.login()
	disabled.expect(disabled.do(http.MethodGet, "/settings/dav/caldav", nil), http.StatusNotFound)
}

// By default the settings API takes no personal endpoint a mail account could
// use to reach into the server's own network: plain HTTP is not a valid
// server, and an HTTPS URL at a private address fails like any unreachable one.
func TestHTTP_DAVPersonalServersArePublicHTTPSUnlessTheAdministratorOptsIn(t *testing.T) {
	var contacted atomic.Int32
	internal := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { contacted.Add(1) }))
	defer internal.Close()
	dav := settingsDiscoveryServer(t, testUser, testPassword)
	s := newDAVSettingsServer(t, func(options *alps.Options) { options.DAVAllowPrivateServers = false })
	s.login()
	r := s.do(http.MethodPut, "/settings/dav/caldav", map[string]any{"server": dav, "use_mail_credentials": true})
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "dav_invalid_server") {
		t.Fatalf("plain HTTP personal server: %s", r.body)
	}
	r = s.do(http.MethodPut, "/settings/dav/carddav", map[string]any{"server": internal.URL + "/dav/", "use_mail_credentials": true, "mail_password": testPassword})
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "dav_unreachable") {
		t.Fatalf("private HTTPS personal server: %s", r.body)
	}
	if contacted.Load() != 0 {
		t.Fatal("a private address was contacted")
	}
	var settings alps.DAVSettings
	r = s.do(http.MethodGet, "/settings/dav/caldav", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &settings)
	if settings.PersonalConfigured || settings.Configured {
		t.Fatalf("a refused server was saved: %+v", settings)
	}
}

// Sending the mail password to a server of the user's choosing takes that
// password, checked before anything is sent: a session someone else holds
// must not be able to have it delivered to a server of theirs.
func TestHTTP_DAVMailCredentialsForAPersonalServerTakeTheMailPassword(t *testing.T) {
	var mu sync.Mutex
	var seen []string
	collector := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		seen = append(seen, r.Header.Get("Authorization"))
		mu.Unlock()
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer collector.Close()
	server := strings.Replace(collector.URL, "http://", "http+insecure://", 1) + "/"
	s := newDAVSettingsServer(t, nil)
	s.login()
	r := s.do(http.MethodPut, "/settings/dav/caldav", map[string]any{"server": server, "use_mail_credentials": true})
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "dav_mail_password_required") {
		t.Fatalf("no mail password: %s", r.body)
	}
	r = s.do(http.MethodPut, "/settings/dav/caldav", map[string]any{"server": server, "use_mail_credentials": true, "mail_password": "a guess"})
	s.expect(r, http.StatusForbidden)
	if !strings.Contains(string(r.body), "dav_mail_password_incorrect") {
		t.Fatalf("wrong mail password: %s", r.body)
	}
	mu.Lock()
	if len(seen) != 0 {
		t.Fatalf("the server was contacted before the mail password was confirmed: %q", seen)
	}
	mu.Unlock()
	r = s.do(http.MethodPut, "/settings/dav/caldav", map[string]any{"server": server, "use_mail_credentials": true, "mail_password": testPassword})
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "dav_auth_failed") {
		t.Fatalf("confirmed save to a refusing server: %s", r.body)
	}
	mu.Lock()
	defer mu.Unlock()
	if len(seen) == 0 {
		t.Fatal("a confirmed save did not reach the server")
	}
}
