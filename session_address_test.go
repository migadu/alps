package alps

import (
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// domainResolver completes a bare login with one domain, as the multi
// provider does with its default_domain.
type domainResolver struct {
	domain string
	asked  []string
}

func (r *domainResolver) AddressOf(username string) string {
	r.asked = append(r.asked, username)
	if r.domain == "" {
		return ""
	}
	return username + "@" + r.domain
}

// The user's address is worked out once, at sign-in. A login that is an
// address is the address, whatever the provider would say; a bare login is
// completed by the provider when it can be, and is the login otherwise.
func TestSessionManager_AddressOfTheLogin(t *testing.T) {
	mockProvider := &provider.MockProvider{}
	mockStore := &provider.MockStore{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(mockStore, nil)
	mockStore.On("Get", mock.Anything, mock.Anything).Return(provider.ErrNoStoreEntry)
	connect := func(string, string) (provider.MailProvider, error) { return mockProvider, nil }

	for _, c := range []struct {
		name     string
		resolver *domainResolver
		login    string
		want     string
	}{
		{"an address", &domainResolver{domain: "example.com"}, "ada@example.org", "ada@example.org"},
		{"a bare login the provider completes", &domainResolver{domain: "example.com"}, "jdoe", "jdoe@example.com"},
		{"a bare login the provider cannot complete", &domainResolver{}, "jdoe", "jdoe"},
		{"a bare login and a provider that does not complete", nil, "jdoe", "jdoe"},
	} {
		t.Run(c.name, func(t *testing.T) {
			sm := newSessionManager(connect, nil, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
			defer sm.Close()
			if c.resolver != nil {
				sm.addresses = c.resolver
			}
			s, err := sm.Put(c.login, "pass")
			if err != nil {
				t.Fatal(err)
			}
			defer s.Close()
			assert.Equal(t, c.login, s.Username())
			assert.Equal(t, c.want, s.Address())
			if c.resolver != nil && c.login == "ada@example.org" {
				assert.Empty(t, c.resolver.asked, "an address is not the provider's to change")
			}
		})
	}
}
