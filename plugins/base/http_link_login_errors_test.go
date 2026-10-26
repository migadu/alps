package alpsbase

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// A target sign-in can fail before a password is checked, or linking can
// fail reading the primary account's metadata after the target signed in.
// Neither is a refusal of the target credentials.
type linkErrorOptions struct {
	provider.Options
	mode *atomic.Int32
}

func (o linkErrorOptions) CreateFactory(timeout time.Duration, debug bool) provider.AuthenticatedProviderFactory {
	connect := o.Options.CreateFactory(timeout, debug)
	return func(username, password string) (provider.MailProvider, error) {
		if username == linkTarget {
			switch o.mode.Load() {
			case 1:
				return nil, errors.New("mail server connection refused")
			case 2:
				return nil, fmt.Errorf("LOGIN unavailable: %w", &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeUnavailable, Text: "auth service unavailable"})
			case 3:
				return nil, &provider.LimitError{Cause: &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeLimit, Text: "maximum connections reached"}}
			}
		}
		p, err := connect(username, password)
		if err != nil {
			return nil, err
		}
		return linkErrorProvider{p, o.mode, username == testUser}, nil
	}
}

type linkErrorProvider struct {
	provider.MailProvider
	mode    *atomic.Int32
	primary bool
}

func (p linkErrorProvider) GetStore() (provider.Store, error) {
	s, err := p.MailProvider.GetStore()
	if err != nil {
		return nil, err
	}
	return linkErrorStore{s, p.mode, p.primary}, nil
}

type linkErrorStore struct {
	provider.Store
	mode    *atomic.Int32
	primary bool
}

func (s linkErrorStore) readError(key string) error {
	if !s.primary || key != "linked_accounts" {
		return nil
	}
	switch s.mode.Load() {
	case 4:
		return errors.New("primary account metadata unavailable")
	case 5:
		// A primary-session reconnect can refuse its stored credentials. That
		// says nothing about the password just checked for the linked target.
		return provider.AuthError{Cause: errors.New("primary account authentication failed")}
	}
	return nil
}
func (s linkErrorStore) Get(key string, out interface{}) error {
	if err := s.readError(key); err != nil {
		return err
	}
	return s.Store.Get(key, out)
}
func (s linkErrorStore) GetFresh(key string, out interface{}) error {
	if err := s.readError(key); err != nil {
		return err
	}
	return provider.GetFresh(s.Store, key, out)
}

func linkErrorsServer(t *testing.T, minute, failures int) (*testServer, *atomic.Int32) {
	t.Helper()
	mode := &atomic.Int32{}
	s, _ := newLimitedServer(t, func(o *alps.Options) {
		o.Provider = linkErrorOptions{o.Provider, mode}
		o.RateLimitConfig.IPRequestsPerMinute = minute
		o.RateLimitConfig.UsernameFailsPerQuarter = failures
	})
	addLinkTarget(t, s)
	s.login()
	return s, mode
}

func TestHTTP_LinkingBackendErrorsDoNotLockTheTarget(t *testing.T) {
	for mode, name := range []string{"connection", "unavailable", "limit", "metadata", "primary-auth"} {
		t.Run(name, func(t *testing.T) {
			s, fail := linkErrorsServer(t, 100, 3)
			fail.Store(int32(mode + 1))
			for i := 0; i < 3; i++ {
				r := s.link(linkTargetPassword)
				s.expect(r, http.StatusBadRequest)
				if strings.Contains(string(r.body), "Please check your credentials") {
					t.Errorf("backend error blamed the target password: %s", r.body)
				}
			}
			fail.Store(0)
			s.expect(s.link(linkTargetPassword), http.StatusOK)
		})
	}
}

func TestHTTP_LinkingBackendErrorsPreserveThePriorFailureRun(t *testing.T) {
	for _, resetGuard := range []bool{false, true} {
		t.Run(fmt.Sprintf("guard-reset=%v", resetGuard), func(t *testing.T) {
			s, fail := linkErrorsServer(t, 100, 4)
			s.expect(s.link("wrong"), http.StatusBadRequest)
			fail.Store(1)
			s.expect(s.link(linkTargetPassword), http.StatusBadRequest)
			fail.Store(0)
			n := 2
			if resetGuard {
				n = 3
			}
			for i := 0; i < n; i++ {
				s.expect(s.link("wrong"), http.StatusBadRequest)
			}
			want := http.StatusOK // three true failures remain below the limit
			if resetGuard {
				want = http.StatusTooManyRequests // four true failures still lock
			}
			s.expect(s.link(linkTargetPassword), want)
		})
	}
}

func TestHTTP_LinkingBackendErrorsStillConsumeTheIPBurst(t *testing.T) {
	s, fail := linkErrorsServer(t, 3, 100)
	fail.Store(1)
	// The authenticated session's login was the first attempt for this IP.
	for i := 0; i < 2; i++ {
		s.expect(s.link(linkTargetPassword), http.StatusBadRequest)
	}
	fail.Store(0)
	r := s.link(linkTargetPassword)
	s.expect(r, http.StatusTooManyRequests)
	if !strings.Contains(string(r.body), "wait a minute") || r.header.Get("Retry-After") == "" {
		t.Errorf("expected burst refusal and Retry-After: %s, %v", r.body, r.header)
	}
}

func TestHTTP_AlreadyLinkedStillProvesThePasswordAndClearsFailures(t *testing.T) {
	s, _ := linkErrorsServer(t, 100, 4)
	s.expect(s.link(linkTargetPassword), http.StatusOK)
	s.expect(s.link("wrong"), http.StatusBadRequest)
	s.expect(s.link(linkTargetPassword), http.StatusBadRequest) // already linked, but password proved
	for i := 0; i < 3; i++ {
		s.expect(s.link("wrong"), http.StatusBadRequest)
	}
	r := s.link(linkTargetPassword)
	s.expect(r, http.StatusBadRequest)
	if !strings.Contains(string(r.body), "already linked") {
		t.Errorf("expected the authenticated duplicate, not a lockout: %s", r.body)
	}
}
