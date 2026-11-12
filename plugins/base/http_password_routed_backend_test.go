package alpsbase

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/maildir"
	_ "github.com/migadu/alps/provider/multi"
)

func TestHTTP_PasswordBackendCanComeOnlyFromTheDomainRoute(t *testing.T) {
	var passwdFile atomic.Value
	var requests atomic.Int32
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		var payload map[string]string
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if payload["username"] != testUser || payload["new_password"] != "routed new password" {
			http.Error(w, "wrong routed payload", http.StatusBadRequest)
			return
		}
		if err := os.WriteFile(passwdFile.Load().(string), []byte(testUser+":{PLAIN}"+payload["new_password"]+"\n"), 0600); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) {
		original := o.Provider.(*maildir.Options)
		passwdFile.Store(original.AuthPasswdFile)
		data := fmt.Sprintf(`[domains."example.com"]
type = "maildir"
path = %q
auth_passwd_file = %q
password = {endpoint = %q, payload_mapping = {username = "username", new_password = "new_password"}}
`, original.Path, original.AuthPasswdFile, backend.URL)
		var raw toml.Primitive
		meta, err := toml.Decode(data, &raw)
		if err != nil {
			t.Fatal(err)
		}
		config, err := provider.LoadConfig("multi", &meta, &raw)
		if err != nil {
			t.Fatal(err)
		}
		options, err := config.ToOptions()
		if err != nil {
			t.Fatal(err)
		}
		o.Provider = options
		o.Plugins = map[string]alps.PluginConfig{"password": {Enabled: true}}
	})
	s.login()
	var info struct {
		EnabledPlugins        []string
		PasswordChangeEnabled bool
	}
	r := s.do("GET", "/session", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &info)
	if !contains(info.EnabledPlugins, "password") || !info.PasswordChangeEnabled {
		t.Fatalf("domain-routed password backend was hidden: %+v", info)
	}
	s.expectCode(s.changePassword("routed new password"), http.StatusOK, "password_changed")
	if requests.Load() != 1 {
		t.Errorf("routed backend got %d requests, want 1", requests.Load())
	}
	if !s.signsIn("routed new password") {
		t.Error("domain-routed backend did not change the actual account password")
	}
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusOK)
}
