package alpsbase

import (
	"errors"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"net/http"
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
