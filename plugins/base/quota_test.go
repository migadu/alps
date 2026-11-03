// How much of its storage an account's mail takes: GET /quota.
//
// A mail server may keep no quotas, or keep quotas none of which limits
// storage, and neither is a failure: the answer says so, for the page to
// show nothing. A refusal from the server is answered as the folder verbs
// answer theirs, a status and a word for it, without the server's own words.
package alpsbase

import (
	"errors"
	"net/http"
	"reflect"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// quotaProvider is a connection to a mail server that keeps quotas, or does
// not (has), and answers quota, or err, for the account's storage.
type quotaProvider struct {
	provider.MailProvider
	has   bool
	quota *provider.StorageQuota
	err   error
}

func (p quotaProvider) HasQuotas() (bool, error) { return p.has, nil }

func (p quotaProvider) StorageQuota() (*provider.StorageQuota, error) { return p.quota, p.err }

// quotaServer is a test server whose connections are made quotaProviders by
// wrap, signed in.
func quotaServer(t *testing.T, wrap func(provider.MailProvider) provider.MailProvider) *testServer {
	t.Helper()
	var s *testServer
	if wrap == nil {
		s = newTestServer(t)
	} else {
		s = newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), wrap)
	}
	s.login()
	return s
}

// readQuota asks GET /quota and decodes what it answered, expecting status.
func (s *testServer) readQuota(status int) (map[string]any, response) {
	s.t.Helper()
	r := s.do("GET", "/quota", nil)
	s.expect(r, status)
	var body map[string]any
	r.json(s.t, &body)
	return body, r
}

func TestHTTP_QuotaAnswersTheStorageInBytes(t *testing.T) {
	quota := &provider.StorageQuota{Used: 3 << 30, Limit: 10 << 30}
	s := quotaServer(t, func(p provider.MailProvider) provider.MailProvider {
		return quotaProvider{MailProvider: p, has: true, quota: quota}
	})
	got, _ := s.readQuota(http.StatusOK)
	want := map[string]any{"supported": true, "used": float64(3 << 30), "limit": float64(10 << 30)}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("answered %v, want %v", got, want)
	}
}

// A provider that cannot read quotas at all (the maildir one), and a mail
// server that keeps none (no QUOTA), are each answered as unsupported, with
// no figures.
func TestHTTP_QuotaWithoutQuotasIsUnsupported(t *testing.T) {
	for name, wrap := range map[string]func(provider.MailProvider) provider.MailProvider{
		"provider without quotas": nil,
		"server without QUOTA": func(p provider.MailProvider) provider.MailProvider {
			return quotaProvider{MailProvider: p, has: false, err: errors.New("StorageQuota asked of a server without QUOTA")}
		},
	} {
		t.Run(name, func(t *testing.T) {
			got, _ := quotaServer(t, wrap).readQuota(http.StatusOK)
			if want := map[string]any{"supported": false}; !reflect.DeepEqual(got, want) {
				t.Errorf("answered %v, want %v", got, want)
			}
		})
	}
}

// Quotas none of which limits storage leave the mailbox without a limit to
// show: the answer has no figures, and is no error.
func TestHTTP_QuotaWithoutAStorageLimitHasNoFigures(t *testing.T) {
	s := quotaServer(t, func(p provider.MailProvider) provider.MailProvider {
		return quotaProvider{MailProvider: p, has: true}
	})
	got, _ := s.readQuota(http.StatusOK)
	if want := map[string]any{"supported": true}; !reflect.DeepEqual(got, want) {
		t.Errorf("answered %v, want %v", got, want)
	}
}

// The server's NO is answered with a status and a word for it, and its own
// text, which describes the server, stays in the log.
func TestHTTP_QuotaRefusedByTheServer(t *testing.T) {
	refusal := &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeNoPerm, Text: "quota backend db7 is read-only"}
	s := quotaServer(t, func(p provider.MailProvider) provider.MailProvider {
		return quotaProvider{MailProvider: p, has: true, err: refusal}
	})
	got, r := s.readQuota(http.StatusForbidden)
	if want := map[string]any{"error": "forbidden"}; !reflect.DeepEqual(got, want) {
		t.Errorf("answered %v, want %v", got, want)
	}
	if strings.Contains(string(r.body), "db7") {
		t.Errorf("the answer repeats the server's own words: %s", r.body)
	}
}

// A failure that is not the server's answer is the server's handler's to
// answer: a generic error, with nothing of what failed in it.
func TestHTTP_QuotaThatCouldNotBeRead(t *testing.T) {
	s := quotaServer(t, func(p provider.MailProvider) provider.MailProvider {
		return quotaProvider{MailProvider: p, has: true, err: errors.New("quota socket /run/q.sock gone")}
	})
	_, r := s.readQuota(http.StatusInternalServerError)
	if strings.Contains(string(r.body), "q.sock") {
		t.Errorf("the answer repeats what failed: %s", r.body)
	}
}
