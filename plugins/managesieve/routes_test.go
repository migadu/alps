package managesieve

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"strings"
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

// fakeSieve is a scripted ManageSieve server. It greets with `sieve` as its
// SIEVE capability (no SIEVE line at all when it is empty), takes any PLAIN
// sign-in, and holds one script, active when `active` names it.
func fakeSieve(t *testing.T, sieve, active, content string) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			go func() {
				defer conn.Close()
				r, w := bufio.NewReader(conn), bufio.NewWriter(conn)
				fmt.Fprint(w, "\"IMPLEMENTATION\" \"fake\"\r\n\"SASL\" \"PLAIN\"\r\n")
				if sieve != "" {
					fmt.Fprintf(w, "\"SIEVE\" %q\r\n", sieve)
				}
				fmt.Fprint(w, "OK \"ready\"\r\n")
				w.Flush()
				for {
					line, err := r.ReadString('\n')
					if err != nil {
						return
					}
					switch strings.ToUpper(strings.Fields(line)[0]) {
					case "AUTHENTICATE":
						fmt.Fprint(w, "OK \"signed in\"\r\n")
					case "LISTSCRIPTS":
						if active != "" {
							fmt.Fprintf(w, "%q ACTIVE\r\n", active)
						}
						fmt.Fprint(w, "OK\r\n")
					case "GETSCRIPT":
						fmt.Fprintf(w, "{%d}\r\n%s\r\nOK\r\n", len(content), content)
					case "LOGOUT":
						fmt.Fprint(w, "OK\r\n")
						w.Flush()
						return
					default:
						fmt.Fprint(w, "NO \"not scripted\"\r\n")
					}
					w.Flush()
				}
			}()
		}
	}()
	return ln.Addr().String()
}

// signedIn runs alps with the managesieve plugin pointed at sieveAddr and
// returns a client signed in to it.
func signedIn(t *testing.T, sieveAddr string) (*http.Client, string) {
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
		Plugins: map[string]alps.PluginConfig{
			"managesieve": {Server: "managesieve+insecure://" + sieveAddr},
		},
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
	client := &http.Client{Jar: jar}
	body, _ := json.Marshal(map[string]string{"username": testUser, "password": testPassword})
	req, _ := http.NewRequest(http.MethodPost, ts.URL+"/session", strings.NewReader(string(body)))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", ts.URL)
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("sign-in: status %d", res.StatusCode)
	}
	return client, ts.URL
}

// The script read says which Sieve extensions the server runs, because the
// page decides from them what to offer: an auto-reply needs "vacation", and
// its dates need "date" and "relational". Asked of a server that advertises
// none, the answer is an empty list, not null.
func TestGetScriptNamesTheServersExtensions(t *testing.T) {
	const script = "require \"fileinto\";\nfileinto \"Archive\";\n"
	cases := []struct {
		name, sieve, active string
		content             string
		extensions          []string
	}{
		{"an active script", "fileinto vacation date relational", "catchall", script, []string{"fileinto", "vacation", "date", "relational"}},
		{"no active script", "fileinto vacation", "", "", []string{"fileinto", "vacation"}},
		{"no SIEVE capability", "", "catchall", script, []string{}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			client, url := signedIn(t, fakeSieve(t, tc.sieve, tc.active, tc.content))
			res, err := client.Get(url + "/managesieve/script")
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			raw, _ := io.ReadAll(res.Body)
			if res.StatusCode != http.StatusOK {
				t.Fatalf("status %d: %s", res.StatusCode, raw)
			}
			var got struct {
				Content    string    `json:"content"`
				Extensions *[]string `json:"extensions"`
			}
			if err := json.Unmarshal(raw, &got); err != nil {
				t.Fatalf("decoding %q: %v", raw, err)
			}
			if got.Content != tc.content {
				t.Errorf("content = %q, want %q", got.Content, tc.content)
			}
			if got.Extensions == nil {
				t.Fatalf("no extensions in %s", raw)
			}
			if !reflect.DeepEqual(*got.Extensions, tc.extensions) {
				t.Errorf("extensions = %q, want %q", *got.Extensions, tc.extensions)
			}
		})
	}
}
