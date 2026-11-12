package gpg

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/fernet/fernet-go"

	"github.com/migadu/alps"
	_ "github.com/migadu/alps/plugins/base" // sign-in
	"github.com/migadu/alps/provider/maildir"
)

const (
	testUser     = "ada@example.com"
	testPassword = "correct horse"
)

// account is a client signed in to alps over a maildir account, sending what
// the settings page sends.
type account struct {
	t      *testing.T
	client *http.Client
	url    string
}

func signedIn(t *testing.T) *account {
	t.Helper()
	base := t.TempDir()
	passwd := filepath.Join(base, "passwd")
	if err := os.WriteFile(passwd, []byte(testUser+":{PLAIN}"+testPassword+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	store := maildir.NewProvider(filepath.Join(base, "ada"), testUser)
	if err := store.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	popt, err := (&maildir.Config{Path: filepath.Join(base, "%u"), AuthPasswdFile: passwd}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	srv, err := alps.New(alps.NewLogger(), &alps.Options{
		Provider: popt,
		SMTP:     alps.SMTPOptions{Server: "smtp://127.0.0.1:1"},
		LoginKey: &key,
	})
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() {
		ts.Close()
		srv.Close()
	})

	jar, _ := cookiejar.New(nil)
	a := &account{t: t, client: &http.Client{Jar: jar}, url: ts.URL}
	if status, body := a.do(http.MethodPost, "/session", map[string]string{"username": testUser, "password": testPassword}); status != http.StatusOK {
		t.Fatalf("sign-in: status %d: %s", status, body)
	}
	return a
}

func (a *account) do(method, path string, body any) (int, []byte) {
	a.t.Helper()
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			a.t.Fatal(err)
		}
		reader = bytes.NewReader(data)
	}
	req, err := http.NewRequest(method, a.url+path, reader)
	if err != nil {
		a.t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if method != http.MethodGet {
		req.Header.Set("Origin", a.url)
	}
	res, err := a.client.Do(req)
	if err != nil {
		a.t.Fatal(err)
	}
	defer res.Body.Close()
	data, _ := io.ReadAll(res.Body)
	return res.StatusCode, data
}

// stored answers the keyring as the settings page reads it.
func (a *account) stored() Keyring {
	a.t.Helper()
	status, body := a.do(http.MethodGet, "/gpg/keys", nil)
	if status != http.StatusOK {
		a.t.Fatalf("reading the keyring: status %d: %s", status, body)
	}
	var k Keyring
	if err := json.Unmarshal(body, &k); err != nil {
		a.t.Fatalf("decoding %q: %v", body, err)
	}
	return k
}

func (a *account) save(path string, k Keyring, want int) {
	a.t.Helper()
	if status, body := a.do(http.MethodPost, path, k); status != want {
		a.t.Fatalf("POST %s: status %d, want %d: %s", path, status, want, body)
	}
}

// A keypair saved is kept until a request says it is to be replaced. The
// settings page offers to generate or import a keypair when it shows none,
// and the private key it stores may be the only copy there is: a save made
// from a page that showed no keypair, while the server held one, must keep
// the one stored.
func TestPostKeysKeepsTheStoredKeypair(t *testing.T) {
	a := signedIn(t)
	first := Keyring{PublicKey: "first public", EncryptedPrivateKey: "first private"}
	second := Keyring{PublicKey: "second public", EncryptedPrivateKey: "second private"}

	// Nothing stored yet: the first keypair is saved.
	a.save("/gpg/keys", first, http.StatusOK)
	if got := a.stored(); got != first {
		t.Fatalf("stored %+v, want %+v", got, first)
	}

	// Another save that does not say it replaces one is refused, and the
	// stored keypair is the one read back.
	a.save("/gpg/keys", second, http.StatusConflict)
	if got := a.stored(); got != first {
		t.Fatalf("after a save that did not ask to replace it, stored %+v, want %+v", got, first)
	}

	// A save that says so replaces it.
	a.save("/gpg/keys?replace=1", second, http.StatusOK)
	if got := a.stored(); got != second {
		t.Fatalf("after a replacing save, stored %+v, want %+v", got, second)
	}

	// Once the keypair is purged, a new one is saved as the first was.
	if status, body := a.do(http.MethodDelete, "/gpg/keys", nil); status != http.StatusOK {
		t.Fatalf("purge: status %d: %s", status, body)
	}
	if got := a.stored(); got != (Keyring{}) {
		t.Fatalf("after the purge, stored %+v, want none", got)
	}
	a.save("/gpg/keys", first, http.StatusOK)
	if got := a.stored(); got != first {
		t.Fatalf("after the purge and a save, stored %+v, want %+v", got, first)
	}
}
