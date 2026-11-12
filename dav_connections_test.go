package alps

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"

	"bytes"
	"compress/gzip"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/internal/netguard"
	"io"
	"time"
)

func davDiscoveryServer(t *testing.T, username, password string) *httptest.Server {
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
	return server
}

func personalDAVURL(server *httptest.Server) string {
	return strings.Replace(server.URL, "http://", "http+insecure://", 1) + "/dav/"
}

func davSession(t *testing.T, store *rawStore, key *fernet.Key) *Session {
	t.Helper()
	connects := 0
	s := newStoreSession(&connectionStore{account: store, copies: map[string]*string{}}, &connects)
	s.manager.loginKey = key
	// The test DAV servers listen on loopback over plain HTTP.
	s.manager.davAllowPrivate = true
	// Most of these tests change the store behind the session's back, as
	// another session would, and look at once.
	s.manager.davFreshFor = -1
	t.Cleanup(func() { s.Close() })
	return s
}

func davTestKey(t *testing.T) *fernet.Key {
	t.Helper()
	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	return &key
}

func TestDAVConnectionCredentialsAreEncryptedAndSeparateFromSettings(t *testing.T) {
	dav := davDiscoveryServer(t, "radicale-user", "dav-secret")
	store := &rawStore{entries: map[string]string{}}
	s := davSession(t, store, davTestKey(t))
	initial, err := s.DAVConnectionSettings("caldav", "https://default.example/dav/")
	if err != nil || !initial.Configured || initial.PersonalConfigured {
		t.Fatalf("administrator default is not a saved personal connection: %+v, %v", initial, err)
	}
	input := DAVConnectionInput{Server: personalDAVURL(dav), Username: "radicale-user", Password: "dav-secret"}
	settings, err := s.SaveDAVConnection(context.Background(), "caldav", "https://default.example/dav/", input)
	if err != nil {
		t.Fatal(err)
	}
	if !settings.PasswordConfigured || settings.UseMailCredentials || !settings.Configured || !settings.PersonalConfigured {
		t.Fatalf("public settings: %+v", settings)
	}
	key, _ := davStoreKey("caldav")
	stored := store.entries[key]
	if strings.Contains(stored, "dav-secret") || !strings.Contains(stored, "password_enc") {
		t.Fatalf("credential was not encrypted: %s", stored)
	}
	connection, err := s.ResolveDAVConnection("caldav", "https://default.example/dav/")
	if err != nil || connection.Username != input.Username || connection.Password != input.Password || connection.Server != input.Server {
		t.Fatalf("resolved %+v, %v", connection, err)
	}
	for _, public := range []any{settings, connection} {
		data, err := json.Marshal(public)
		if err != nil {
			t.Fatal(err)
		}
		if strings.Contains(string(data), "dav-secret") || strings.Contains(string(data), "password_enc") || strings.Contains(string(data), connection.CacheKey) {
			t.Fatalf("public payload exposed a secret: %s", data)
		}
	}
	card, err := s.ResolveDAVConnection("carddav", "https://contacts.example/")
	if err != nil || card.Username != s.Username() || card.Password != s.Password() || card.Server != "https://contacts.example/" {
		t.Fatalf("CardDAV inherited CalDAV settings: %+v, %v", card, err)
	}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", DAVConnectionInput{Server: input.Server, Username: input.Username}); err != nil {
		t.Fatalf("same identity could not preserve the password: %v", err)
	}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", DAVConnectionInput{Server: input.Server, Username: "someone-else"}); !errors.Is(err, ErrDAVPasswordRequired) {
		t.Fatalf("changed user reused a password: %v", err)
	}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", DAVConnectionInput{Server: input.Server + "another/", Username: input.Username}); !errors.Is(err, ErrDAVPasswordRequired) {
		t.Fatalf("changed endpoint reused a password: %v", err)
	}
	deleted, err := s.DeleteDAVConnection("caldav", "https://default.example/")
	if err != nil || !deleted.Configured || deleted.PersonalConfigured {
		t.Fatalf("reset should keep only the administrator default: %+v, %v", deleted, err)
	}
	reset, err := s.ResolveDAVConnection("caldav", "https://default.example/")
	if err != nil || reset.Password != s.Password() || reset.Server != "https://default.example/" {
		t.Fatalf("reset did not restore administrator defaults: %+v, %v", reset, err)
	}
}

func TestDAVFailedValidationDoesNotReplaceSavedConnection(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "good")
	store := &rawStore{entries: map[string]string{}}
	s := davSession(t, store, davTestKey(t))
	input := DAVConnectionInput{Server: personalDAVURL(dav), Username: "dav-user", Password: "good"}
	input.Password = "incorrect"
	if _, err := s.SaveDAVConnection(context.Background(), "carddav", "", input); !errors.Is(err, ErrDAVValidationFailed) {
		t.Fatalf("bad initial password: %v", err)
	}
	settings, err := s.DAVConnectionSettings("carddav", "https://default.example/")
	if err != nil || !settings.Configured || settings.PersonalConfigured {
		t.Fatalf("failed initial save created a personal connection: %+v, %v", settings, err)
	}
	input.Password = "good"
	if _, err := s.SaveDAVConnection(context.Background(), "carddav", "", input); err != nil {
		t.Fatal(err)
	}
	key, _ := davStoreKey("carddav")
	before := store.entries[key]
	input.Password = "incorrect"
	if _, err := s.SaveDAVConnection(context.Background(), "carddav", "", input); !errors.Is(err, ErrDAVValidationFailed) {
		t.Fatalf("bad password: %v", err)
	}
	if store.entries[key] != before {
		t.Fatal("failed validation overwrote the saved connection")
	}
	settings, err = s.DAVConnectionSettings("carddav", "")
	if err != nil || !settings.PersonalConfigured {
		t.Fatalf("failed replacement lost the saved personal connection: %+v, %v", settings, err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	input.Password = "good"
	if _, err := s.SaveDAVConnection(ctx, "carddav", "", input); !errors.Is(err, ErrDAVUnreachable) {
		t.Fatalf("canceled validation: %v", err)
	}
	if store.entries[key] != before {
		t.Fatal("canceled validation overwrote the saved connection")
	}
}

func TestDAVSavedCredentialsFailClosedAndCanBeReplacedAfterKeyRotation(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "secret")
	store := &rawStore{entries: map[string]string{}}
	s := davSession(t, store, nil)
	input := DAVConnectionInput{Server: personalDAVURL(dav), Username: "dav-user", Password: "secret"}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); !errors.Is(err, ErrLoginKeyRequired) {
		t.Fatalf("missing key: %v", err)
	}
	s.manager.loginKey = davTestKey(t)
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); err != nil {
		t.Fatal(err)
	}
	s.manager.loginKey = davTestKey(t)
	if _, err := s.ResolveDAVConnection("caldav", "https://default.example/"); err == nil {
		t.Fatal("key rotation fell back to mail credentials")
	}
	input.Password = ""
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); err == nil {
		t.Fatal("reused an unreadable saved secret")
	}
	input.Password = "secret"
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); err != nil {
		t.Fatalf("fresh password could not repair key rotation: %v", err)
	}
	key, _ := davStoreKey("caldav")
	store.entries[key] = `{"version":1,"use_mail_credentials":false}`
	if _, err := s.ResolveDAVConnection("caldav", "https://default.example/"); err == nil {
		t.Fatal("corrupt custom credentials fell back to mail authentication")
	}
	if _, err := s.DeleteDAVConnection("caldav", ""); err != nil {
		t.Fatalf("could not reset corrupt record: %v", err)
	}
}

func TestDAVConnectionsRefreshAcrossSessionsAndBindPasswordsToDefaults(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "secret")
	store := &rawStore{entries: map[string]string{}}
	key := davTestKey(t)
	first, second := davSession(t, store, key), davSession(t, store, key)
	before, err := second.ResolveDAVConnection("caldav", dav.URL+"/dav/")
	if err != nil {
		t.Fatal(err)
	}
	input := DAVConnectionInput{Username: "dav-user", Password: "secret"}
	if _, err := first.SaveDAVConnection(context.Background(), "caldav", dav.URL+"/dav/", input); err != nil {
		t.Fatal(err)
	}
	after, err := second.ResolveDAVConnection("caldav", dav.URL+"/dav/")
	if err != nil || after.Password != "secret" || before.CacheKey == after.CacheKey {
		t.Fatalf("other session retained old credentials: %+v, %v", after, err)
	}
	if _, err := second.ResolveDAVConnection("caldav", "https://new-default.example/"); err == nil {
		t.Fatal("sent existing credentials to a changed default endpoint")
	}
	input.Password = ""
	if _, err := first.SaveDAVConnection(context.Background(), "caldav", "https://new-default.example/", input); !errors.Is(err, ErrDAVPasswordRequired) {
		t.Fatalf("changed default reused saved secret: %v", err)
	}
	if _, err := first.DeleteDAVConnection("caldav", dav.URL); err != nil {
		t.Fatal(err)
	}
	reset, err := second.ResolveDAVConnection("caldav", dav.URL)
	if err != nil || reset.Password != second.Password() {
		t.Fatalf("other session did not see reset: %+v, %v", reset, err)
	}
}

func TestDAVPersonalEndpointsRequireExplicitTransportAndNoURLCredentials(t *testing.T) {
	for _, allowInsecure := range []bool{false, true} {
		for _, raw := range []string{"http://dav.example/", "dav.example", "ftp://dav.example/", "https:///dav", "https://user:pass@dav.example/", "https://dav.example/?token=secret", "https://dav.example/#fragment"} {
			if _, err := parsePersonalDAVURL("caldav", raw, allowInsecure); err == nil {
				t.Errorf("accepted %q (insecure allowed: %v)", raw, allowInsecure)
			}
		}
		for _, raw := range []string{"https://dav.example/", "caldavs://dav.example/"} {
			if _, err := parsePersonalDAVURL("caldav", raw, allowInsecure); err != nil {
				t.Errorf("refused %q: %v", raw, err)
			}
		}
	}
	for _, raw := range []string{"http+insecure://dav.example/", "caldav+insecure://dav.example/"} {
		if _, err := parsePersonalDAVURL("caldav", raw, false); !errors.Is(err, ErrDAVInvalidServer) {
			t.Errorf("accepted %q without the administrator's opt-in: %v", raw, err)
		}
		if _, err := parsePersonalDAVURL("caldav", raw, true); err != nil {
			t.Errorf("refused %q with the opt-in: %v", raw, err)
		}
	}
}

// Without the administrator's opt-in a mail account must not be able to point
// alps at its own network: personal endpoints are HTTPS only and are refused
// at dial time when they resolve to a non-public address. The administrator's
// own default stays reachable wherever it is.
func TestDAVPersonalEndpointsCannotReachPrivateAddressesByDefault(t *testing.T) {
	var contacted atomic.Int32
	internal := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { contacted.Add(1) }))
	defer internal.Close()
	dav := davDiscoveryServer(t, "dav-user", "secret")
	store := &rawStore{entries: map[string]string{}}
	s := davSession(t, store, davTestKey(t))

	// A connection saved while private servers were allowed.
	insecure := DAVConnectionInput{Server: personalDAVURL(dav), Username: "dav-user", Password: "secret"}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", insecure); err != nil {
		t.Fatal(err)
	}
	s.manager.davAllowPrivate = false
	if resolved, err := s.ResolveDAVConnection("caldav", ""); err == nil {
		t.Fatalf("a saved plain-HTTP personal endpoint still resolved: %+v", resolved.Server)
	}
	if _, err := s.DeleteDAVConnection("caldav", ""); err != nil {
		t.Fatal(err)
	}

	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", insecure); !errors.Is(err, ErrDAVInvalidServer) {
		t.Fatalf("plain-HTTP personal endpoint: %v", err)
	}
	for _, auth := range []DAVConnectionInput{
		{Server: internal.URL + "/dav/", UseMailCredentials: true, MailPassword: "p"},
		{Server: internal.URL + "/dav/", Username: "dav-user", Password: "secret"},
	} {
		if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", auth); !errors.Is(err, ErrDAVUnreachable) {
			t.Fatalf("loopback personal endpoint: %v", err)
		}
	}
	// A record written around the settings API is held to the same rule.
	key, _ := davStoreKey("caldav")
	if err := store.Put(key, davConnectionRecord{Version: 1, Server: internal.URL + "/dav/", UseMailCredentials: true}); err != nil {
		t.Fatal(err)
	}
	resolved, err := s.ResolveDAVConnection("caldav", "")
	if err != nil {
		t.Fatal(err)
	}
	client, err := DAVHTTPClient(resolved)
	if err != nil {
		t.Fatal(err)
	}
	if response, err := client.Get(internal.URL + "/dav/"); !errors.Is(err, netguard.ErrBlockedAddress) {
		if err == nil {
			response.Body.Close()
		}
		t.Fatalf("forged loopback endpoint: %v", err)
	}
	if contacted.Load() != 0 {
		t.Fatal("a private address was contacted for a personal endpoint")
	}
	if _, err := s.DeleteDAVConnection("caldav", ""); err != nil {
		t.Fatal(err)
	}

	// The administrator's default is not the user's choice: separate
	// credentials for it work on a private address without the opt-in.
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", dav.URL+"/dav/", DAVConnectionInput{Username: "dav-user", Password: "secret"}); err != nil {
		t.Fatalf("administrator default on a private address: %v", err)
	}
	if resolved, err := s.ResolveDAVConnection("caldav", dav.URL+"/dav/"); err != nil || resolved.restricted {
		t.Fatalf("administrator default was restricted: %+v, %v", resolved.restricted, err)
	}
}

func TestDAVSavedCredentialsFollowTheMailAccountWhateverItsCase(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "secret")
	s := davSession(t, &rawStore{entries: map[string]string{}}, davTestKey(t))
	s.username = "Ada@Example.com"
	input := DAVConnectionInput{Server: personalDAVURL(dav), Username: "dav-user", Password: "secret"}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); err != nil {
		t.Fatal(err)
	}
	saved, err := s.ResolveDAVConnection("caldav", "")
	if err != nil {
		t.Fatal(err)
	}
	s.username = "ada@example.com"
	resolved, err := s.ResolveDAVConnection("caldav", "")
	if err != nil || resolved.Password != "secret" {
		t.Fatalf("another spelling of the login lost the saved password: %v", err)
	}
	if resolved.CacheKey != saved.CacheKey {
		t.Fatal("another spelling of the login changed the cache key")
	}
	if settings, err := s.DAVConnectionSettings("caldav", ""); err != nil || !settings.PasswordConfigured {
		t.Fatalf("settings: %+v, %v", settings, err)
	}
	input.Password = ""
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); err != nil {
		t.Fatalf("blank password did not keep the saved one: %v", err)
	}
}

// The page says "Password configured. Leave blank to keep it." only while
// that is true: after a key rotation, or once the administrator's default
// moved, it has to ask again, and a blank save says why it failed.
func TestDAVSettingsReportOnlyAUsableSavedPassword(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "secret")
	s := davSession(t, &rawStore{entries: map[string]string{}}, davTestKey(t))
	defaultServer := dav.URL + "/dav/"
	input := DAVConnectionInput{Username: "dav-user", Password: "secret"}
	if settings, err := s.SaveDAVConnection(context.Background(), "caldav", defaultServer, input); err != nil || !settings.PasswordConfigured {
		t.Fatalf("save: %+v, %v", settings, err)
	}
	input.Password = ""

	moved := davDiscoveryServer(t, "dav-user", "secret")
	if settings, err := s.DAVConnectionSettings("caldav", moved.URL+"/dav/"); err != nil || settings.PasswordConfigured || !settings.PersonalConfigured {
		t.Fatalf("after the default moved: %+v, %v", settings, err)
	}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", moved.URL+"/dav/", input); !errors.Is(err, ErrDAVPasswordRequired) {
		t.Fatalf("blank save after the default moved: %v", err)
	}

	s.manager.loginKey = davTestKey(t)
	if settings, err := s.DAVConnectionSettings("caldav", defaultServer); err != nil || settings.PasswordConfigured || !settings.PersonalConfigured || settings.Username != "dav-user" {
		t.Fatalf("after key rotation: %+v, %v", settings, err)
	}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", defaultServer, input); !errors.Is(err, ErrDAVPasswordRequired) {
		t.Fatalf("blank save after key rotation: %v", err)
	}
	input.Password = "secret"
	if settings, err := s.SaveDAVConnection(context.Background(), "caldav", defaultServer, input); err != nil || !settings.PasswordConfigured {
		t.Fatalf("re-entered password: %+v, %v", settings, err)
	}
}

func TestDAVOriginTreatsDefaultPortsAsImplicit(t *testing.T) {
	parse := func(raw string) *url.URL {
		u, err := url.Parse(raw)
		if err != nil {
			t.Fatal(err)
		}
		return u
	}
	for _, pair := range [][2]string{
		{"https://dav.example.com:443/dav/", "https://dav.example.com/principals/"},
		{"https://dav.example.com/dav/", "https://DAV.example.com:443/"},
		{"http://dav.example.com:80/", "http://dav.example.com/"},
		{"https://[2001:db8::1]:443/", "https://[2001:db8::1]/"},
	} {
		if !sameDAVOrigin(parse(pair[0]), parse(pair[1])) || !sameDAVOrigin(parse(pair[1]), parse(pair[0])) {
			t.Errorf("%s and %s are one origin", pair[0], pair[1])
		}
	}
	for _, pair := range [][2]string{
		{"https://dav.example.com/", "http://dav.example.com/"},
		{"https://dav.example.com/", "http://dav.example.com:443/"},
		{"https://dav.example.com/", "https://dav.example.com:8443/"},
		{"https://dav.example.com:80/", "http://dav.example.com:80/"},
		{"https://dav.example.com/", "https://dav.example.com.evil.example/"},
		{"https://dav.example.com:443/", "https://dav.example.com:4430/"},
	} {
		if sameDAVOrigin(parse(pair[0]), parse(pair[1])) || sameDAVOrigin(parse(pair[1]), parse(pair[0])) {
			t.Errorf("%s and %s are different origins", pair[0], pair[1])
		}
	}
}

func TestDAVClientNeverForwardsCredentialsToAnotherOrigin(t *testing.T) {
	var contacted atomic.Int32
	other := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { contacted.Add(1) }))
	defer other.Close()
	origin := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if username, password, _ := r.BasicAuth(); username != "u" || password != "secret" {
			t.Error("configured origin did not receive credentials")
		}
		http.Redirect(w, r, other.URL, http.StatusTemporaryRedirect)
	}))
	defer origin.Close()
	client, err := DAVHTTPClient(ResolvedDAVConnection{Server: origin.URL, Username: "u", Password: "secret", personal: true})
	if err != nil {
		t.Fatal(err)
	}
	if response, err := client.Get(origin.URL); err == nil {
		response.Body.Close()
		t.Fatal("cross-origin redirect was followed")
	}
	if response, err := client.Get(other.URL); err == nil {
		response.Body.Close()
		t.Fatal("cross-origin discovered URL was requested")
	}
	if contacted.Load() != 0 {
		t.Fatal("another origin was contacted")
	}
}

func TestDAVMailAuthenticationClearsCustomSecrets(t *testing.T) {
	custom := davDiscoveryServer(t, "dav-user", "custom-secret")
	mail := davDiscoveryServer(t, "u", "p")
	store := &rawStore{entries: map[string]string{}}
	s := davSession(t, store, davTestKey(t))
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", DAVConnectionInput{Server: personalDAVURL(custom), Username: "dav-user", Password: "custom-secret"}); err != nil {
		t.Fatal(err)
	}
	settings, err := s.SaveDAVConnection(context.Background(), "caldav", "", DAVConnectionInput{Server: personalDAVURL(mail), UseMailCredentials: true, MailPassword: "p", Username: "discard-me", Password: "discard-me-too"})
	if err != nil {
		t.Fatal(err)
	}
	if !settings.UseMailCredentials || settings.PasswordConfigured || settings.Username != "u" || !settings.PersonalConfigured {
		t.Fatalf("mail authentication: %+v", settings)
	}
	key, _ := davStoreKey("caldav")
	if strings.Contains(store.entries[key], "password_enc") || strings.Contains(store.entries[key], "discard-me") || strings.Contains(store.entries[key], "password_server") {
		t.Fatalf("custom secret survived: %s", store.entries[key])
	}
	connection, err := s.ResolveDAVConnection("caldav", "")
	if err != nil || connection.Password != "p" || connection.Username != "u" {
		t.Fatalf("resolved mail credentials: %+v, %v", connection, err)
	}
}

// The administrator's server with the mail login is what an account has
// without a record. Saving just that keeps none, so the page offers nothing to
// remove, and it replaces a personal connection saved before.
func TestDAVSavingTheDefaultWithMailAuthenticationKeepsNoRecord(t *testing.T) {
	dav := davDiscoveryServer(t, "u", "p")
	store := &rawStore{entries: map[string]string{}}
	s := davSession(t, store, davTestKey(t))
	settings, err := s.SaveDAVConnection(context.Background(), "caldav", dav.URL, DAVConnectionInput{UseMailCredentials: true})
	if err != nil || settings.Server != "" || !settings.Configured || settings.PersonalConfigured || !settings.UseMailCredentials {
		t.Fatalf("saved default connection: %+v, %v", settings, err)
	}
	if len(store.entries) != 0 {
		t.Fatalf("a record was kept for the default: %v", store.entries)
	}
	if settings, err = s.SaveDAVConnection(context.Background(), "caldav", dav.URL, DAVConnectionInput{Username: "u", Password: "p"}); err != nil || !settings.PersonalConfigured {
		t.Fatalf("separate credentials: %+v, %v", settings, err)
	}
	if settings, err = s.SaveDAVConnection(context.Background(), "caldav", dav.URL, DAVConnectionInput{UseMailCredentials: true}); err != nil || settings.PersonalConfigured || len(store.entries) != 0 {
		t.Fatalf("back to the default: %+v, %v, %v", settings, err, store.entries)
	}
	settings, err = s.DeleteDAVConnection("caldav", dav.URL)
	if err != nil || !settings.Configured || settings.PersonalConfigured {
		t.Fatalf("removing a saved override should retain the effective default: %+v, %v", settings, err)
	}
}

func TestDAVCorruptSavedRecordsAreDistinctFromStorageFailures(t *testing.T) {
	key, _ := davStoreKey("caldav")
	for name, record := range map[string]string{
		"invalid JSON":              `{broken`,
		"wrong record type":         `"not a record"`,
		"wrong field type":          `{"version":"one"}`,
		"unsupported version":       `{"version":2,"use_mail_credentials":true}`,
		"missing custom credential": `{"version":1,"use_mail_credentials":false,"username":"u"}`,
		"invalid endpoint":          `{"version":1,"use_mail_credentials":true,"server":"http://dav.example/"}`,
		"null record":               `null`,
	} {
		t.Run(name, func(t *testing.T) {
			s := davSession(t, &rawStore{entries: map[string]string{key: record}}, nil)
			if _, err := s.DAVConnectionSettings("caldav", ""); !errors.Is(err, ErrDAVCorruptSavedRecord) {
				t.Fatalf("corrupt saved record not identified: %v", err)
			}
		})
	}
	for _, cause := range []error{errors.New("store unavailable"), context.DeadlineExceeded, errors.New("invalid saved DAV connection")} {
		t.Run(cause.Error(), func(t *testing.T) {
			connects := 0
			s := newStoreSession(&rawStore{entries: map[string]string{}, down: cause}, &connects)
			t.Cleanup(func() { s.Close() })
			_, err := s.DAVConnectionSettings("caldav", "")
			if !errors.Is(err, cause) || errors.Is(err, ErrDAVCorruptSavedRecord) {
				t.Fatalf("storage failure treated as a saved corrupt record: %v", err)
			}
		})
	}
}

func TestDAVConnectionInputBoundsAndBasicAuthUsernames(t *testing.T) {
	s := davSession(t, &rawStore{entries: map[string]string{}}, davTestKey(t))
	for _, input := range []DAVConnectionInput{
		{Server: "https://" + strings.Repeat("s", 2048)},
		{Server: "https://dav.example/", Username: strings.Repeat("u", 1025), Password: "p"},
		{Server: "https://dav.example/", Username: "u", Password: strings.Repeat("p", 4097)},
		{Server: "https://dav.example/", Username: "user:other", Password: "p"},
	} {
		if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); !errors.Is(err, ErrDAVInvalidServer) && !errors.Is(err, ErrDAVCredentialsRequired) {
			t.Fatalf("invalid input was accepted or contacted the server: %v", err)
		}
	}
}

func TestDAVCredentialBindingCannotBeRewrittenOrTransplantedInMetadata(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "independent-secret")
	key := davTestKey(t)
	for _, attack := range []string{"endpoint", "username", "service", "mail account"} {
		t.Run(attack, func(t *testing.T) {
			store := &rawStore{entries: map[string]string{}}
			s := davSession(t, store, key)
			input := DAVConnectionInput{Server: personalDAVURL(dav), Username: "dav-user", Password: "independent-secret"}
			if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); err != nil {
				t.Fatal(err)
			}
			calKey, _ := davStoreKey("caldav")
			var record davConnectionRecord
			if err := store.Get(calKey, &record); err != nil {
				t.Fatal(err)
			}
			service, destinationKey := "caldav", calKey
			switch attack {
			case "endpoint":
				record.Server = "https://attacker.example/collect/"
				record.PasswordServer = record.Server
			case "username":
				record.Username = "another-dav-user"
			case "service":
				service = "carddav"
				destinationKey, _ = davStoreKey(service)
			case "mail account":
				s.username = "another-mail-account"
			}
			if err := store.Put(destinationKey, record); err != nil {
				t.Fatal(err)
			}
			if resolved, err := s.ResolveDAVConnection(service, ""); err == nil {
				t.Fatalf("metadata transplant yielded credentials: %+v", resolved)
			}
			// The settings save path must authenticate the same binding before
			// preserving a blank password; it cannot repair forged metadata by
			// re-encrypting the stolen ciphertext for its newly claimed identity.
			if _, err := s.SaveDAVConnection(context.Background(), service, "", DAVConnectionInput{Server: record.Server, Username: record.Username}); err == nil {
				t.Fatal("blank-password save accepted transplanted credentials")
			}
		})
	}
}

func TestDAVMailPasswordConfirmsSendingItToAPersonalServer(t *testing.T) {
	var contacted atomic.Int32
	personal := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { contacted.Add(1) }))
	defer personal.Close()
	mail := davDiscoveryServer(t, "u", "p")
	s := davSession(t, &rawStore{entries: map[string]string{}}, davTestKey(t))
	input := DAVConnectionInput{Server: personalDAVURL(personal), UseMailCredentials: true}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); !errors.Is(err, ErrDAVMailPasswordRequired) {
		t.Fatalf("no mail password: %v", err)
	}
	input.MailPassword = "not p"
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); !errors.Is(err, ErrDAVMailPasswordIncorrect) {
		t.Fatalf("wrong mail password: %v", err)
	}
	if contacted.Load() != 0 {
		t.Fatal("the personal server was contacted before the mail password was confirmed")
	}

	// The administrator's server gets the mail password anyway, and separate
	// credentials send none: neither is confirmed.
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", mail.URL+"/dav/", DAVConnectionInput{UseMailCredentials: true}); err != nil {
		t.Fatalf("administrator default with mail credentials: %v", err)
	}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", DAVConnectionInput{Server: personalDAVURL(mail), Username: "u", Password: "p"}); err != nil {
		t.Fatalf("personal server with separate credentials: %v", err)
	}

	// Confirmed once for a server, saving the same connection again asks no
	// more; another server does.
	confirmed := DAVConnectionInput{Server: personalDAVURL(mail), UseMailCredentials: true, MailPassword: "p"}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", confirmed); err != nil {
		t.Fatal(err)
	}
	confirmed.MailPassword = ""
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", confirmed); err != nil {
		t.Fatalf("saving the confirmed connection again: %v", err)
	}
	other := davDiscoveryServer(t, "u", "p")
	confirmed.Server = personalDAVURL(other)
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", confirmed); !errors.Is(err, ErrDAVMailPasswordRequired) {
		t.Fatalf("another personal server: %v", err)
	}
}

// failingStore is a connection's store that fails while its account's is down.
type failingStore struct{ connectionStore }

func (s *failingStore) failure() error {
	s.account.mu.Lock()
	defer s.account.mu.Unlock()
	return s.account.down
}

func (s *failingStore) Get(key string, out interface{}) error {
	if err := s.failure(); err != nil {
		return err
	}
	return s.connectionStore.Get(key, out)
}

func (s *failingStore) GetFresh(key string, out interface{}) error {
	if err := s.failure(); err != nil {
		return err
	}
	return s.connectionStore.GetFresh(key, out)
}

func (s *failingStore) Put(key string, v interface{}) error {
	if err := s.failure(); err != nil {
		return err
	}
	return s.connectionStore.Put(key, v)
}

// DAV requests and the list of active plugins ask for the connection on every
// request. They answer from what the session last read, so they neither wait
// for the mail connection each time nor fail when it does.
func TestDAVConnectionIsKeptBetweenRequestsAndSurvivesAnUnreadableStore(t *testing.T) {
	dav := davDiscoveryServer(t, "dav-user", "secret")
	store := &rawStore{entries: map[string]string{}}
	connects := 0
	s := newStoreSession(&failingStore{connectionStore{account: store, copies: map[string]*string{}}}, &connects)
	t.Cleanup(func() { s.Close() })
	s.manager.loginKey = davTestKey(t)
	s.manager.davAllowPrivate = true
	s.manager.davFreshFor = time.Hour
	other := davSession(t, store, s.manager.loginKey)

	if !s.DAVConnectionConfigured("caldav", "https://default.example/") || s.DAVConnectionConfigured("caldav", "") {
		t.Fatal("without a saved connection the default decides")
	}
	// Another session saves a personal connection: this one still answers
	// from what it read, without asking the store.
	input := DAVConnectionInput{Server: personalDAVURL(dav), Username: "dav-user", Password: "secret"}
	if _, err := other.SaveDAVConnection(context.Background(), "caldav", "", input); err != nil {
		t.Fatal(err)
	}
	store.mu.Lock()
	store.down = errors.New("mail server away")
	store.mu.Unlock()
	if resolved, err := s.ResolveDAVConnection("caldav", "https://default.example/"); err != nil || resolved.Username != "u" {
		t.Fatalf("kept answer: %+v, %v", resolved.Username, err)
	}
	// The settings page reads the store, and says so when it cannot.
	if _, err := s.DAVConnectionSettings("caldav", ""); err == nil {
		t.Fatal("settings were answered from the kept copy")
	}
	store.mu.Lock()
	store.down = nil
	store.mu.Unlock()
	if settings, err := s.DAVConnectionSettings("caldav", ""); err != nil || !settings.PersonalConfigured {
		t.Fatalf("settings: %+v, %v", settings, err)
	}
	if resolved, err := s.ResolveDAVConnection("caldav", ""); err != nil || resolved.Username != "dav-user" {
		t.Fatalf("after the settings page read the store: %+v, %v", resolved.Username, err)
	}

	// Its own changes take effect at once.
	if _, err := s.DeleteDAVConnection("caldav", ""); err != nil {
		t.Fatal(err)
	}
	if s.DAVConnectionConfigured("caldav", "") {
		t.Fatal("a removed connection stayed configured")
	}
	if _, err := s.SaveDAVConnection(context.Background(), "caldav", "", input); err != nil {
		t.Fatal(err)
	}
	if resolved, err := s.ResolveDAVConnection("caldav", ""); err != nil || resolved.Username != "dav-user" {
		t.Fatalf("own save: %+v, %v", resolved.Username, err)
	}

	// Once the kept answer is old the store is asked again; while it cannot
	// be read the last answer stands.
	s.manager.davFreshFor = -1
	store.mu.Lock()
	store.down = errors.New("mail server away")
	store.mu.Unlock()
	if resolved, err := s.ResolveDAVConnection("caldav", ""); err != nil || resolved.Username != "dav-user" {
		t.Fatalf("unreadable store: %+v, %v", resolved.Username, err)
	}
	if !s.DAVConnectionConfigured("caldav", "") {
		t.Fatal("an unreadable store took the personal connection off the page")
	}

	// A session that never could read it has only the default to go by, and
	// never guesses at credentials.
	blind := newStoreSession(&rawStore{entries: map[string]string{}, down: errors.New("mail server away")}, &connects)
	t.Cleanup(func() { blind.Close() })
	if !blind.DAVConnectionConfigured("caldav", "https://default.example/") || blind.DAVConnectionConfigured("caldav", "") {
		t.Fatal("with the store unreadable the default decides whether the plugin shows")
	}
	if _, err := blind.ResolveDAVConnection("caldav", "https://default.example/"); err == nil {
		t.Fatal("a connection was resolved without knowing what the account saved")
	}
}

// The administrator's server is trusted as it was before users could choose
// one: a default that redirects elsewhere is followed, and one written with
// credentials or a query of its own still works.
func TestDAVAdministratorDefaultsFollowRedirectsAndMayCarryExtras(t *testing.T) {
	var got atomic.Value
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		username, password, _ := r.BasicAuth()
		got.Store(username + ":" + password + " " + r.URL.RequestURI())
	}))
	defer target.Close()
	front := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, target.URL+"/dav/", http.StatusPermanentRedirect)
	}))
	defer front.Close()
	s := davSession(t, &rawStore{entries: map[string]string{}}, nil)
	for _, fallback := range []string{front.URL + "/.well-known/caldav", strings.Replace(front.URL, "http://", "http://svc:token@", 1) + "/dav?tenant=1"} {
		resolved, err := s.ResolveDAVConnection("caldav", fallback)
		if err != nil {
			t.Fatal(err)
		}
		client, err := DAVHTTPClient(resolved)
		if err != nil {
			t.Fatalf("%s: %v", fallback, err)
		}
		if client.Timeout != 0 {
			t.Fatal("requests to the administrator's server were given a time limit of their own")
		}
		response, err := client.Get(fallback)
		if err != nil {
			t.Fatalf("%s: %v", fallback, err)
		}
		response.Body.Close()
		if got.Load() != "u:p /dav/" {
			t.Fatalf("%s reached the target as %v", fallback, got.Load())
		}
	}
}

func TestDAVPersonalServerResponsesAreBounded(t *testing.T) {
	var compressed bytes.Buffer
	zip := gzip.NewWriter(&compressed)
	chunk := make([]byte, 1<<20)
	for i := 0; i < davPersonalResponseLimit>>20+1; i++ {
		zip.Write(chunk)
	}
	zip.Close()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Encoding", "gzip")
		w.Write(compressed.Bytes())
	}))
	defer server.Close()
	for _, personal := range []bool{true, false} {
		client, err := DAVHTTPClient(ResolvedDAVConnection{Server: server.URL, personal: personal})
		if err != nil {
			t.Fatal(err)
		}
		response, err := client.Get(server.URL)
		if err != nil {
			t.Fatal(err)
		}
		n, err := io.Copy(io.Discard, response.Body)
		response.Body.Close()
		if personal && (err == nil || n > davPersonalResponseLimit) {
			t.Fatalf("read %d bytes of a personal server's response: %v", n, err)
		}
		if !personal && (err != nil || n <= davPersonalResponseLimit) {
			t.Fatalf("the administrator's server was cut off at %d bytes: %v", n, err)
		}
		if personal && client.Timeout == 0 {
			t.Fatal("requests to a personal server have no time limit")
		}
	}
}
