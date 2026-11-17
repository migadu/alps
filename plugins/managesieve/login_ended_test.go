package managesieve

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"reflect"
	"strings"
	"sync/atomic"
	"testing"
)

// endedLoginSieve is a ManageSieve server that closes its first session right
// after answering AUTHENTICATE with OK, and says nothing more. sora does that
// to every login in flight on a node when it ends any account's sessions, as
// its credential-change poll does after an account is deleted (#982). Later
// sessions hold one active script.
func endedLoginSieve(t *testing.T, script string) (addr string, sessions *atomic.Int32) {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	sessions = new(atomic.Int32)
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			first := sessions.Add(1) == 1
			go func() {
				defer conn.Close()
				r, w := bufio.NewReader(conn), bufio.NewWriter(conn)
				fmt.Fprint(w, "\"IMPLEMENTATION\" \"fake\"\r\n\"SASL\" \"PLAIN\"\r\n\"SIEVE\" \"fileinto vacation\"\r\nOK\r\n")
				w.Flush()
				for {
					line, err := r.ReadString('\n')
					if err != nil {
						return
					}
					switch strings.ToUpper(strings.Fields(line)[0]) {
					case "AUTHENTICATE":
						fmt.Fprint(w, "OK\r\n")
						w.Flush()
						if first {
							return
						}
					case "LISTSCRIPTS":
						fmt.Fprint(w, "\"main\" ACTIVE\r\nOK\r\n")
					case "GETSCRIPT":
						fmt.Fprintf(w, "{%d}\r\n%s\r\nOK\r\n", len(script), script)
					case "LOGOUT":
						fmt.Fprint(w, "OK\r\n")
						w.Flush()
						return
					default:
						fmt.Fprint(w, "OK\r\n")
					}
					w.Flush()
				}
			}()
		}
	}()
	return ln.Addr().String(), sessions
}

// A login the server ends at once is not the answer to the request: the
// request signs in again and is answered from the second session, with the
// extensions the server advertised.
func TestGetScriptSurvivesALoginTheServerEnds(t *testing.T) {
	const script = "require \"fileinto\";\nfileinto \"Archive\";\n"
	addr, sessions := endedLoginSieve(t, script)
	client, url := signedIn(t, addr)

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
		Content    string   `json:"content"`
		Extensions []string `json:"extensions"`
	}
	if err := json.Unmarshal(raw, &got); err != nil {
		t.Fatalf("decoding %q: %v", raw, err)
	}
	if got.Content != script {
		t.Errorf("content = %q, want %q", got.Content, script)
	}
	if want := []string{"fileinto", "vacation"}; !reflect.DeepEqual(got.Extensions, want) {
		t.Errorf("extensions = %q, want %q", got.Extensions, want)
	}
	if n := sessions.Load(); n != 2 {
		t.Errorf("sessions = %d, want 2", n)
	}
}
