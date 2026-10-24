package alps

import (
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/stretchr/testify/assert"
)

// Once an account enrols a key, every one of its sessions must give it before
// it goes on, unless it already has: the one that enrolled it, or one that
// signed in with an earlier key. Other accounts' sessions are untouched.
func TestSessionManager_RequireSecondFactor(t *testing.T) {
	mockProvider := &provider.MockProvider{}
	mockProvider.On("Close").Return(nil)
	mockProvider.On("GetStore").Return(&rawStore{entries: map[string]string{}}, nil)
	mockProvider.On("HasThreadCapability").Return(false).Maybe()
	sm := newSessionManager(
		func(string, string) (provider.MailProvider, error) { return mockProvider, nil },
		nil, &NilLogger{}, time.Minute, false, nil, time.Hour, 24*time.Hour, 0, 0, 0, 0, 0,
	)
	open := func(username string) *Session {
		s, err := sm.Put(username, "pass")
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(s.Close)
		assert.False(t, s.Requires2FA())
		return s
	}
	enrolling, before, otherCase, verified := open("ada@example.com"), open("ada@example.com"), open("Ada@Example.com"), open("ada@example.com")
	bob := open("bob@example.com")
	enrolling.SetAuthenticated2FA(true)
	verified.SetAuthenticated2FA(true)

	sm.RequireSecondFactor("ada@example.com")

	for name, s := range map[string]*Session{"opened before the key": before, "signed in as Ada@Example.com": otherCase} {
		assert.True(t, s.Requires2FA() && !s.IsAuthenticated2FA(), "%s: not asked for the key", name)
	}
	for name, s := range map[string]*Session{"that enrolled the key": enrolling, "that gave a key before": verified} {
		assert.True(t, s.IsAuthenticated2FA(), "%s: asked for the key again", name)
	}
	assert.False(t, bob.Requires2FA(), "another account's session was asked for the key")
}
