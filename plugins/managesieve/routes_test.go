package managesieve

import (
	"bufio"
	"bytes"
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
	"strconv"
	"strings"
	"sync"
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

// sieveAccount is a scripted ManageSieve server that holds several scripts, at
// most one of them active, as RFC 5804 has it. It knows LISTSCRIPTS,
// GETSCRIPT, PUTSCRIPT and SETACTIVE, and a test reads afterwards what it
// holds.
type sieveAccount struct {
	mu      sync.Mutex
	names   []string // in the order they were first stored
	scripts map[string]string
	active  string
}

// store keeps a script as another client would upload it, switched off.
func (a *sieveAccount) store(name, content string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.put(name, content)
}

// put is PUTSCRIPT, with a.mu held.
func (a *sieveAccount) put(name, content string) {
	if a.scripts == nil {
		a.scripts = make(map[string]string)
	}
	if _, ok := a.scripts[name]; !ok {
		a.names = append(a.names, name)
	}
	a.scripts[name] = content
}

// held answers what the account holds: each script's content, and the name
// of the active one.
func (a *sieveAccount) held() (map[string]string, string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	scripts := make(map[string]string, len(a.scripts))
	for name, content := range a.scripts {
		scripts[name] = content
	}
	return scripts, a.active
}

// listen starts the server and returns its address.
func (a *sieveAccount) listen(t *testing.T) string {
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
			go a.serve(conn)
		}
	}()
	return ln.Addr().String()
}

func (a *sieveAccount) serve(conn net.Conn) {
	defer conn.Close()
	r, w := bufio.NewReader(conn), bufio.NewWriter(conn)
	fmt.Fprint(w, "\"IMPLEMENTATION\" \"fake\"\r\n\"SASL\" \"PLAIN\"\r\n\"SIEVE\" \"fileinto\"\r\nOK \"ready\"\r\n")
	w.Flush()
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			return
		}
		command, args, _ := strings.Cut(strings.TrimRight(line, "\r\n"), " ")
		name := ""
		if quoted, err := strconv.QuotedPrefix(args); err == nil {
			name, _ = strconv.Unquote(quoted)
		}
		a.mu.Lock()
		switch strings.ToUpper(command) {
		case "AUTHENTICATE":
			fmt.Fprint(w, "OK \"signed in\"\r\n")
		case "LISTSCRIPTS":
			for _, n := range a.names {
				if n == a.active {
					fmt.Fprintf(w, "%q ACTIVE\r\n", n)
				} else {
					fmt.Fprintf(w, "%q\r\n", n)
				}
			}
			fmt.Fprint(w, "OK\r\n")
		case "GETSCRIPT":
			if content, ok := a.scripts[name]; ok {
				fmt.Fprintf(w, "{%d}\r\n%s\r\nOK\r\n", len(content), content)
			} else {
				fmt.Fprint(w, "NO (NONEXISTENT) \"no such script\"\r\n")
			}
		case "PUTSCRIPT":
			var size int
			fmt.Sscanf(args[strings.LastIndex(args, "{"):], "{%d+}", &size)
			content := make([]byte, size)
			io.ReadFull(r, content)
			r.ReadString('\n') // the line break that ends the command
			a.put(name, string(content))
			fmt.Fprint(w, "OK\r\n")
		case "SETACTIVE":
			if _, ok := a.scripts[name]; ok || name == "" {
				a.active = name
				fmt.Fprint(w, "OK\r\n")
			} else {
				fmt.Fprint(w, "NO (NONEXISTENT) \"no such script\"\r\n")
			}
		case "LOGOUT":
			fmt.Fprint(w, "OK\r\n")
			w.Flush()
			a.mu.Unlock()
			return
		default:
			fmt.Fprint(w, "NO \"not scripted\"\r\n")
		}
		a.mu.Unlock()
		w.Flush()
	}
}

// saveFilters saves content as the Filters page does.
func saveFilters(t *testing.T, client *http.Client, url, content string) {
	t.Helper()
	body, _ := json.Marshal(ScriptPayload{Content: content})
	req, _ := http.NewRequest(http.MethodPut, url+"/managesieve/script", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", url)
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(res.Body)
		t.Fatalf("saving %q: status %d: %s", content, res.StatusCode, raw)
	}
}

const (
	invoiceRule = "require \"fileinto\";\nif header :contains \"Subject\" \"invoice\" {\n\tfileinto \"Archive\";\n}\n"
	receiptRule = "require \"fileinto\";\nif header :contains \"Subject\" \"receipt\" {\n\tfileinto \"Archive\";\n}\n"
)

// Filters switched off from another client, or by an administrator, leave
// alps-filters stored with nothing active. The page shows no rules then, as it
// reads only the active script, and a rule added there was saved over
// alps-filters: the switched-off rules were replaced by it, unseen. They are
// kept now, still switched off, and the rules saved go into a script of their
// own, which is the one switched on.
func TestSaveKeepsSwitchedOffFiltersItDidNotShow(t *testing.T) {
	account := &sieveAccount{}
	account.store(defaultScriptName, invoiceRule)
	client, url := signedIn(t, account.listen(t))

	saveFilters(t, client, url, receiptRule)

	scripts, active := account.held()
	if got := scripts[defaultScriptName]; got != invoiceRule {
		t.Errorf("%s holds %q after the save, want the switched-off rules it held: %q", defaultScriptName, got, invoiceRule)
	}
	if active == "" || active == defaultScriptName || scripts[active] != receiptRule {
		t.Errorf("the active script is %q, holding %q; want another script, holding the rules saved", active, scripts[active])
	}
}

// Removing every rule switches the script off and empties it, so that what
// is left is not taken for rules switched off elsewhere: rules saved after
// that go back into the same script, not into a new one each time.
func TestSaveAfterRemovingEveryRuleReusesTheScript(t *testing.T) {
	account := &sieveAccount{}
	client, url := signedIn(t, account.listen(t))

	saveFilters(t, client, url, invoiceRule)
	saveFilters(t, client, url, "")
	scripts, active := account.held()
	if active != "" || scripts[defaultScriptName] != "" {
		t.Errorf("with every rule removed, %q is active and %s holds %q; want nothing active, and nothing in it", active, defaultScriptName, scripts[defaultScriptName])
	}

	saveFilters(t, client, url, receiptRule)
	scripts, active = account.held()
	if len(scripts) != 1 || active != defaultScriptName || scripts[active] != receiptRule {
		t.Errorf("after rules were saved again, the account holds %q with %q active; want only %s, active, holding them", scripts, active, defaultScriptName)
	}
}
