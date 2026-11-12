package alpscarddav

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/maildir"
	"github.com/migadu/go-webdav/carddav"
)

// authenticatedDAV records the protocol methods after enforcing credentials.
// Startup's unauthenticated OPTIONS probe is separate from actual DAV traffic.
type authenticatedDAV struct {
	mu                 sync.Mutex
	username, password string
	methods            map[string]int
	discoveries        int
}

func (a *authenticatedDAV) reset(username, password string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.username, a.password = username, password
	a.methods = make(map[string]int)
	a.discoveries = 0
}

func (a *authenticatedDAV) wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions && r.Header.Get("Authorization") == "" {
			next.ServeHTTP(w, r)
			return
		}
		username, password, _ := r.BasicAuth()
		body, _ := io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewReader(body))
		a.mu.Lock()
		accepted := username == a.username && password == a.password
		if accepted {
			a.methods[r.Method]++
			if bytes.Contains(body, []byte("current-user-principal")) {
				a.discoveries++
			}
		}
		a.mu.Unlock()
		if !accepted {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func connectionSession(t *testing.T, h *harness) *alps.Session {
	t.Helper()
	session, err := h.srv.Sessions.Put(testUser, testPassword)
	if err != nil {
		t.Fatal(err)
	}
	return session
}

func saveConnection(t *testing.T, session *alps.Session, fallback, server, username, password string) {
	t.Helper()
	_, err := session.SaveDAVConnection(context.Background(), provider.ServiceCardDAV, fallback, alps.DAVConnectionInput{
		Server: server, Username: username, Password: password,
	})
	if err != nil {
		t.Fatal(err)
	}
}

func TestDAVConnectionUsesMailCredentialsByDefault(t *testing.T) {
	auth := &authenticatedDAV{}
	auth.reset(testUser, testPassword)
	h := newHarnessWrapping(t, auth.wrap)
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
	auth.mu.Lock()
	defer auth.mu.Unlock()
	if auth.discoveries == 0 || auth.methods["REPORT"] == 0 {
		t.Fatalf("missing authenticated discovery/list requests: %+v", auth.methods)
	}
}

func TestPersonalDAVCredentialsCoverLibraryAndRawRequests(t *testing.T) {
	auth := &authenticatedDAV{}
	auth.reset("dav-ada", "dav password")
	h := newHarnessWrapping(t, auth.wrap)
	saveConnection(t, connectionSession(t, h), h.davURL, "", "dav-ada", "dav password")
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
	r := h.do("POST", "/contacts/create", map[string]any{"name": "Grace", "allow_duplicate": true})
	h.expect(r, http.StatusOK)
	var created struct{ Path string }
	h.decode(r, &created)
	h.expect(h.do("DELETE", "/contacts/"+pathParam(created.Path), nil), http.StatusOK)
	auth.mu.Lock()
	defer auth.mu.Unlock()
	for _, method := range []string{"PROPFIND", "REPORT", "PUT", "DELETE"} {
		if auth.methods[method] == 0 {
			t.Errorf("no authenticated %s request", method)
		}
	}
}

func TestPersonalDAVEndpointWorksWithoutAnAdministratorDefault(t *testing.T) {
	auth := &authenticatedDAV{}
	auth.reset("dav-ada", "dav password")
	h := startConnectionHarness(t, auth.wrap, true)
	saveConnection(t, connectionSession(t, h), "", "http+insecure://"+strings.TrimPrefix(h.davURL, "http://"), "dav-ada", "dav password")
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
}

func TestChangedDAVCredentialsAndServerRediscoverTheHome(t *testing.T) {
	auth := &authenticatedDAV{}
	auth.reset("dav-ada", "first password")
	h := newHarnessWrapping(t, auth.wrap)
	session := connectionSession(t, h)
	saveConnection(t, session, h.davURL, "", "dav-ada", "first password")
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)

	auth.reset("different-principal", "new password")
	saveConnection(t, session, h.davURL, "", "different-principal", "new password")
	auth.reset("different-principal", "new password") // exclude save-time validation
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
	auth.mu.Lock()
	discoveries := auth.discoveries
	auth.mu.Unlock()
	if discoveries == 0 {
		t.Fatal("credentials changed, but cached home set skipped principal discovery")
	}

	otherAuth := &authenticatedDAV{}
	otherAuth.reset("third-principal", "third password")
	other := httptest.NewServer(otherAuth.wrap(&carddav.Handler{Backend: h.dav}))
	defer other.Close()
	server := "http+insecure://" + strings.TrimPrefix(other.URL, "http://")
	saveConnection(t, session, h.davURL, server, "third-principal", "third password")
	otherAuth.reset("third-principal", "third password")
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
	otherAuth.mu.Lock()
	defer otherAuth.mu.Unlock()
	if otherAuth.discoveries == 0 {
		t.Fatal("server changed, but cached home set skipped principal discovery")
	}
}

// Two mail accounts may deliberately use the same DAV login. They still own
// independent settings and discovery state; editing one cannot configure the other.
func TestDAVConnectionAndDiscoveryBelongToTheMailAccount(t *testing.T) {
	auth := &authenticatedDAV{}
	auth.reset("shared-dav", "dav password")
	h := newHarnessWrapping(t, auth.wrap)
	saveConnection(t, connectionSession(t, h), h.davURL, "", "shared-dav", "dav password")
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)

	otherUser := "grace@example.com"
	file, err := os.OpenFile(h.passwd, os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		t.Fatal(err)
	}
	_, err = file.WriteString(otherUser + ":{PLAIN}" + testPassword + "\n")
	if err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}
	if err := maildir.NewProvider(filepath.Join(filepath.Dir(h.passwd), "grace"), otherUser).CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	otherSession, err := h.srv.Sessions.Put(otherUser, testPassword)
	if err != nil {
		t.Fatal(err)
	}
	settings, err := otherSession.DAVConnectionSettings(provider.ServiceCardDAV, h.davURL)
	if err != nil {
		t.Fatal(err)
	}
	if !settings.UseMailCredentials || settings.PasswordConfigured {
		t.Fatalf("another account inherited DAV credentials: %+v", settings)
	}
	saveConnection(t, otherSession, h.davURL, "", "shared-dav", "dav password")
	jar, _ := cookiejar.New(nil)
	other := *h
	other.client = &http.Client{Jar: jar}
	other.expect(other.do("POST", "/session", map[string]string{"username": otherUser, "password": testPassword}), http.StatusOK)
	auth.reset("shared-dav", "dav password")
	other.expect(other.do("GET", "/contacts", nil), http.StatusOK)
	auth.mu.Lock()
	defer auth.mu.Unlock()
	if auth.discoveries == 0 {
		t.Fatal("second mail account reused the first account's discovery cache")
	}
}

// Changing settings in another browser while an edit is reading its object
// must not send the later PUT to a different principal or server.
func TestDAVRequestKeepsItsConnectionWhileSettingsChange(t *testing.T) {
	auth := &authenticatedDAV{}
	auth.reset("first-dav", "first password")
	reading, release := make(chan struct{}), make(chan struct{})
	var releaseOnce sync.Once
	unblock := func() { releaseOnce.Do(func() { close(release) }) }
	defer unblock()
	var once sync.Once
	wrap := func(next http.Handler) http.Handler {
		return auth.wrap(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodGet && strings.HasSuffix(r.URL.Path, ".vcf") {
				once.Do(func() { close(reading); <-release })
			}
			next.ServeHTTP(w, r)
		}))
	}
	h := newHarnessWrapping(t, wrap)
	session := connectionSession(t, h)
	saveConnection(t, session, h.davURL, "", "first-dav", "first password")
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("555-0100"))
	edited := make(chan response, 1)
	go func() {
		edited <- h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", map[string]any{"name": "Updated"})
	}()
	select {
	case <-reading:
	case <-time.After(5 * time.Second):
		unblock()
		t.Fatal("edit never read its DAV object")
	}

	otherAuth := &authenticatedDAV{}
	otherAuth.reset("second-dav", "second password")
	other := httptest.NewServer(otherAuth.wrap(&carddav.Handler{Backend: h.dav}))
	defer other.Close()
	server := "http+insecure://" + strings.TrimPrefix(other.URL, "http://")
	saveConnection(t, session, h.davURL, server, "second-dav", "second password")
	unblock()
	select {
	case result := <-edited:
		h.expect(result, http.StatusOK)
	case <-time.After(5 * time.Second):
		t.Fatal("edit never completed")
	}
	auth.mu.Lock()
	firstWrites := auth.methods[http.MethodPut]
	auth.mu.Unlock()
	otherAuth.mu.Lock()
	otherWrites := otherAuth.methods[http.MethodPut]
	otherAuth.mu.Unlock()
	if firstWrites != 1 || otherWrites != 0 {
		t.Fatalf("in-flight edit wrote %d objects to its original server and %d to the replacement", firstWrites, otherWrites)
	}
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
}
