package alps

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/fernet/fernet-go"
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
	input := DAVConnectionInput{Server: personalDAVURL(dav), Username: "radicale-user", Password: "dav-secret"}
	settings, err := s.SaveDAVConnection(context.Background(), "caldav", "https://default.example/dav/", input)
	if err != nil {
		t.Fatal(err)
	}
	if !settings.PasswordConfigured || settings.UseMailCredentials || !settings.Configured {
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
	if _, err := s.DeleteDAVConnection("caldav", "https://default.example/"); err != nil {
		t.Fatal(err)
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
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	input.Password = "good"
	if _, err := s.SaveDAVConnection(ctx, "carddav", "", input); !errors.Is(err, ErrDAVValidationFailed) {
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
	for _, raw := range []string{"http://dav.example/", "dav.example", "ftp://dav.example/", "https:///dav", "https://user:pass@dav.example/", "https://dav.example/?token=secret", "https://dav.example/#fragment"} {
		if _, err := ParseDAVServerURL("caldav", raw); err == nil {
			t.Errorf("accepted %q", raw)
		}
	}
	for _, raw := range []string{"https://dav.example/", "caldavs://dav.example/", "http+insecure://dav.example/", "caldav+insecure://dav.example/"} {
		if _, err := ParseDAVServerURL("caldav", raw); err != nil {
			t.Errorf("refused %q: %v", raw, err)
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
	client, err := DAVHTTPClient(ResolvedDAVConnection{Server: origin.URL, Username: "u", Password: "secret"})
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
	settings, err := s.SaveDAVConnection(context.Background(), "caldav", "", DAVConnectionInput{Server: personalDAVURL(mail), UseMailCredentials: true, Username: "discard-me", Password: "discard-me-too"})
	if err != nil {
		t.Fatal(err)
	}
	if !settings.UseMailCredentials || settings.PasswordConfigured || settings.Username != "u" {
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
