package alps

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"strings"
	"testing"
)

func TestDAVCredentialOwnerIsCanonicalAndCaseInsensitive(t *testing.T) {
	store := &rawStore{entries: map[string]string{}}
	key := davTestKey(t)
	first, second := davSession(t, store, key), davSession(t, store, key)
	first.username = "Ada@Example.COM"
	second.username = "ada@example.com"
	encrypted, err := first.encryptDAVPassword("caldav", "https://dav.example/", "CaseSensitiveDAVUser", "secret")
	if err != nil {
		t.Fatal(err)
	}
	plaintext, err := first.DecryptPassword(encrypted)
	if err != nil {
		t.Fatal(err)
	}
	var payload davCredentialPayload
	if err := json.Unmarshal([]byte(plaintext), &payload); err != nil {
		t.Fatal(err)
	}
	if payload.Owner != "ada@example.com" {
		t.Errorf("credential owner=%q, want canonical mail account", payload.Owner)
	}
	if got, err := second.decryptDAVPassword("caldav", "https://dav.example/", "CaseSensitiveDAVUser", encrypted); err != nil || got != "secret" {
		t.Errorf("case-varied owner could not decrypt: %q, %v", got, err)
	}
	// Previously saved payloads retain their original casing and still belong to this account.
	payload.Owner = "ADA@EXAMPLE.COM"
	data, _ := json.Marshal(payload)
	legacy, err := first.EncryptPassword(string(data))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := second.decryptDAVPassword("caldav", "https://dav.example/", "CaseSensitiveDAVUser", legacy); err != nil {
		t.Errorf("legacy mixed-case owner rejected: %v", err)
	}
}
func TestDAVConnectionCacheIdentityIgnoresMailOwnerCasing(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "secret")
	store := &rawStore{entries: map[string]string{}}
	key := davTestKey(t)
	first, second := davSession(t, store, key), davSession(t, store, key)
	first.username = "Ada@Example.COM"
	second.username = "ada@example.com"
	if _, err := first.SaveDAVConnection(context.Background(), "caldav", dav.URL, DAVConnectionInput{Username: "dav-user", Password: "secret"}); err != nil {
		t.Fatal(err)
	}
	before, err := first.ResolveDAVConnection("caldav", dav.URL)
	if err != nil {
		t.Fatal(err)
	}
	after, err := second.ResolveDAVConnection("caldav", dav.URL)
	if err != nil {
		t.Fatalf("case-varied mail login lost credentials: %v", err)
	}
	if before.CacheKey != after.CacheKey {
		t.Errorf("same connection has different cache keys: %q vs %q", before.CacheKey, after.CacheKey)
	}
}
func TestDAVSettingsReportOnlyReusableSavedPasswords(t *testing.T) {
	for _, change := range []string{"login key rotation", "administrator endpoint"} {
		t.Run(change, func(t *testing.T) {
			dav := davDiscoveryServer(t, "dav-user", "secret")
			s := davSession(t, &rawStore{entries: map[string]string{}}, davTestKey(t))
			input := DAVConnectionInput{Username: "dav-user", Password: "secret"}
			if _, err := s.SaveDAVConnection(context.Background(), "caldav", dav.URL, input); err != nil {
				t.Fatal(err)
			}
			fallback := dav.URL
			if change == "login key rotation" {
				s.manager.loginKey = davTestKey(t)
			} else {
				fallback = "https://new-default.example/dav/"
			}
			settings, err := s.DAVConnectionSettings("caldav", fallback)
			if err != nil {
				t.Fatal(err)
			}
			if settings.PasswordConfigured {
				t.Error("unusable password reported configured")
			}
			input.Password = ""
			if _, err := s.SaveDAVConnection(context.Background(), "caldav", fallback, input); !errors.Is(err, ErrDAVPasswordRequired) {
				t.Errorf("blank password should require re-entry: %v", err)
			}
		})
	}
}
func TestSameDAVOriginNormalizesDefaultPorts(t *testing.T) {
	for _, tc := range []struct {
		a, b string
		want bool
	}{
		{"https://dav.example:443/dav/", "https://DAV.example/calendars/", true},
		{"http://dav.example:80/dav/", "http://dav.example/contacts/", true},
		{"https://dav.example:8443/", "https://dav.example/", false},
		{"https://dav.example:80/", "https://dav.example/", false},
		{"http://dav.example:443/", "https://dav.example/", false},
		{"https://dav.example/", "https://other.example:443/", false},
	} {
		t.Run(strings.ReplaceAll(tc.a+"-"+tc.b, "/", "_"), func(t *testing.T) {
			a, _ := url.Parse(tc.a)
			b, _ := url.Parse(tc.b)
			if got := sameDAVOrigin(a, b); got != tc.want {
				t.Errorf("sameDAVOrigin(%s,%s)=%v,want%v", a, b, got, tc.want)
			}
			if got := sameDAVOrigin(b, a); got != tc.want {
				t.Errorf("reverse origin match=%v,want%v", got, tc.want)
			}
		})
	}
}
