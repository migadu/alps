package alpsbase

import (
	"errors"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"net/http"
	"net/url"
	"sync/atomic"
	"testing"
)

type unavailableKeyProvider struct {
	provider.MailProvider
	down *atomic.Bool
}

func (p unavailableKeyProvider) GetStore() (provider.Store, error) {
	s, err := p.MailProvider.GetStore()
	return unavailableKeyStore{s, p.down}, err
}

type unavailableKeyStore struct {
	provider.Store
	down *atomic.Bool
}

func (s unavailableKeyStore) GetFresh(key string, out interface{}) error {
	if key == "webauthn" && s.down.Load() {
		return errors.New("key backend unavailable")
	}
	return provider.GetFresh(s.Store, key, out)
}
func (s unavailableKeyStore) Get(key string, out interface{}) error {
	if key == "webauthn" && s.down.Load() {
		return errors.New("key backend unavailable")
	}
	return s.Store.Get(key, out)
}

func TestHTTP_KeySettingsReadFailuresAreUnavailable(t *testing.T) {
	for _, tc := range []struct {
		method, path string
		body         interface{}
	}{
		{"GET", "/settings/2fa", nil},
		{"POST", "/settings/2fa/begin", nil},
		{"POST", "/settings/2fa/finish", map[string]string{}},
		{"POST", "/settings/2fa/trust-linked-accounts", map[string]interface{}{"trust": false}},
	} {
		t.Run(tc.path, func(t *testing.T) {
			down := &atomic.Bool{}
			s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider { return unavailableKeyProvider{p, down} })
			s.withWebAuthn()
			s.login()
			down.Store(true)
			r := s.do(tc.method, tc.path, tc.body)
			s.expect(r, http.StatusServiceUnavailable)
			if got := refusal(t, r); got != "keys_unavailable" {
				t.Fatalf("error=%q want keys_unavailable", got)
			}
			down.Store(false)
			s.mailbox("INBOX")
		})
	}
}

func TestHTTP_KeySettingsWriteFailuresAreUnavailable(t *testing.T) {
	for _, operation := range []string{"registration", "trust"} {
		t.Run(operation, func(t *testing.T) {
			s, gate := recoveryRaceServer(t)
			var r response
			if operation == "registration" {
				begin, challenge := s.beginEnrolment()
				s.expect(begin, http.StatusOK)
				gate.failWrite.Store(true)
				r = s.finishEnrolment(newSoftKey(t), challenge, "laptop")
			} else {
				s.enrolKey(newSoftKey(t), "laptop")
				gate.failWrite.Store(true)
				r = s.do("POST", "/settings/2fa/trust-linked-accounts", map[string]bool{"trust": false})
			}
			s.expect(r, http.StatusServiceUnavailable)
			if got := refusal(t, r); got != "keys_unavailable" {
				t.Fatalf("code=%q", got)
			}
		})
	}
}

func TestHTTP_KeySettingsAuthFailuresSignOut(t *testing.T) {
	for _, path := range []string{"/settings/2fa", "/settings/2fa/begin"} {
		t.Run(path, func(t *testing.T) {
			armed := &atomic.Bool{}
			s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
				return storeFailureProvider{MailProvider: p, armed: armed, readKey: "webauthn", err: provider.AuthError{Cause: errors.New("credentials revoked")}}
			})
			s.withWebAuthn()
			s.expect(s.signInKeeping(true), http.StatusOK)
			armed.Store(true)
			method := "GET"
			if path != "/settings/2fa" {
				method = "POST"
			}
			r := s.do(method, path, nil)
			s.expect(r, http.StatusUnauthorized)
			address, _ := url.Parse(s.url)
			for _, cookie := range s.client.Jar.Cookies(address) {
				if (cookie.Name == "alps_session" || cookie.Name == "alps_login_token") && cookie.Value != "" {
					t.Errorf("auth failure retained %s cookie", cookie.Name)
				}
			}
		})
	}
}
