package alpsbase

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sync/atomic"
	"testing"

	"github.com/migadu/alps"
	_ "github.com/migadu/alps/plugins/gpg"
	"github.com/migadu/alps/provider"
)

type storeFailureProvider struct {
	provider.MailProvider
	armed           *atomic.Bool
	readKey, putKey string
	corrupt         bool
	freshOnly       bool
	err             error
}

func (p storeFailureProvider) GetStore() (provider.Store, error) {
	store, err := p.MailProvider.GetStore()
	if err != nil {
		return nil, err
	}
	return storeFailureStore{Store: store, armed: p.armed, readKey: p.readKey, putKey: p.putKey, corrupt: p.corrupt, freshOnly: p.freshOnly, err: p.err}, nil
}

type storeFailureStore struct {
	provider.Store
	armed           *atomic.Bool
	readKey, putKey string
	corrupt         bool
	freshOnly       bool
	err             error
}

func (s storeFailureStore) Get(key string, out interface{}) error {
	if !s.freshOnly && s.armed.Load() && key == s.readKey {
		if s.corrupt {
			return &json.SyntaxError{}
		}
		return s.err
	}
	return s.Store.Get(key, out)
}
func (s storeFailureStore) GetFresh(key string, out interface{}) error {
	if s.armed.Load() && key == s.readKey {
		if s.corrupt {
			return &json.SyntaxError{}
		}
		return s.err
	}
	return provider.GetFresh(s.Store, key, out)
}
func (s storeFailureStore) Put(key string, value interface{}) error {
	if s.armed.Load() && key == s.putKey {
		return s.err
	}
	return s.Store.Put(key, value)
}

func TestHTTP_StoreCallersPreserveSessionErrorClassification(t *testing.T) {
	for _, failure := range []struct {
		name   string
		err    error
		status int
	}{
		{"auth", provider.AuthError{Cause: errors.New("credentials revoked")}, http.StatusUnauthorized},
		{"outage", errors.Join(alps.ErrMailProviderUnavailable, errors.New("backend offline")), http.StatusServiceUnavailable},
	} {
		for _, op := range []struct {
			name, method, path, readKey, putKey string
			corrupt                             bool
			body                                interface{}
		}{
			{name: "read keys", method: "GET", path: "/gpg/keys", readKey: "gpg_keys"},
			{name: "check existing keys", method: "POST", path: "/gpg/keys", readKey: "gpg_keys", body: map[string]string{"public_key": "public", "encrypted_private_key": "private"}},
			{name: "save keys", method: "POST", path: "/gpg/keys?replace=1", putKey: "gpg_keys", body: map[string]string{"public_key": "public", "encrypted_private_key": "private"}},
			{name: "delete keys", method: "DELETE", path: "/gpg/keys", putKey: "gpg_keys"},
			{name: "read settings", method: "GET", path: "/settings", readKey: settingsKey},
			{name: "cleanup unreadable settings", method: "GET", path: "/settings", readKey: settingsKey, putKey: settingsKey, corrupt: true},
			{name: "save settings", method: "PUT", path: "/settings", putKey: settingsKey, body: map[string]string{"signature": "Ada"}},
		} {
			t.Run(failure.name+"/"+op.name, func(t *testing.T) {
				armed := &atomic.Bool{}
				s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
					return storeFailureProvider{MailProvider: p, armed: armed, readKey: op.readKey, putKey: op.putKey, corrupt: op.corrupt, err: failure.err}
				})
				s.expect(s.signInKeeping(true), http.StatusOK)
				armed.Store(true)
				r := s.do(op.method, op.path, op.body)
				s.expect(r, failure.status)
				if failure.status == http.StatusServiceUnavailable {
					var data struct{ Error string }
					r.json(t, &data)
					if data.Error != "mail_server_unavailable" {
						t.Fatalf("outage response: %s", r.body)
					}
				}
				address, _ := url.Parse(s.url)
				hasLogin := false
				for _, c := range s.client.Jar.Cookies(address) {
					if c.Name == "alps_login_token" && c.Value != "" {
						hasLogin = true
					}
				}
				if hasLogin != (failure.status == http.StatusServiceUnavailable) {
					t.Errorf("login token retained=%v after %s", hasLogin, failure.name)
				}
				if failure.status == http.StatusUnauthorized {
					for _, c := range s.client.Jar.Cookies(address) {
						if c.Name == "alps_session" && c.Value != "" {
							t.Error("auth failure left session cookie")
						}
					}
				}
			})
		}
	}
}

func TestHTTP_SenderSettingsPreserveSessionErrorsBeforeSMTP(t *testing.T) {
	for _, failure := range []struct {
		name   string
		err    error
		status int
	}{
		{"auth", provider.AuthError{Cause: errors.New("credentials revoked")}, http.StatusUnauthorized},
		{"outage", errors.Join(alps.ErrMailProviderUnavailable, errors.New("backend offline")), http.StatusServiceUnavailable},
	} {
		for _, freshOnly := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s/fresh=%v", failure.name, freshOnly), func(t *testing.T) {
				smtp, rec := listenRecorder(t)
				armed := &atomic.Bool{}
				s := newTestServerWrapping(t, smtp, alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
					return storeFailureProvider{MailProvider: p, armed: armed, readKey: settingsKey, freshOnly: freshOnly, err: failure.err}
				})
				s.expect(s.signInKeeping(true), http.StatusOK)
				armed.Store(true)
				r := s.do("POST", "/messages", url.Values{"from": {"identity@work.example"}, "to": {"charles@remote.test"}, "subject": {"No send"}, "text": {"Hello"}})
				s.expect(r, failure.status)
				rec.mu.Lock()
				defer rec.mu.Unlock()
				if rec.from != "" || rec.data != "" {
					t.Fatal("settings failure reached SMTP")
				}
			})
		}
	}
}
