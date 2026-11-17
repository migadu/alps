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
	"testing"
	"time"
)

// noopResponseSieve holds one active script, and gives NOOP the supplied
// response. It keeps the connection open even after BYE so the test can tell
// whether the client honours that terminal answer before asking for scripts.
func noopResponseSieve(t *testing.T, response, script string) string {
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
				conn.SetDeadline(time.Now().Add(10 * time.Second))
				r, w := bufio.NewReader(conn), bufio.NewWriter(conn)
				fmt.Fprint(w, "\"IMPLEMENTATION\" \"fake\"\r\n\"SASL\" \"PLAIN\"\r\n\"SIEVE\" \"fileinto vacation\"\r\nOK\r\n")
				w.Flush()
				for {
					line, err := r.ReadString('\n')
					if err != nil {
						return
					}
					fields := strings.Fields(line)
					if len(fields) == 0 {
						continue
					}
					switch strings.ToUpper(fields[0]) {
					case "AUTHENTICATE":
						fmt.Fprint(w, "OK\r\n")
					case "NOOP":
						fmt.Fprint(w, response)
					case "LISTSCRIPTS":
						fmt.Fprint(w, "\"main\" ACTIVE\r\nOK\r\n")
					case "GETSCRIPT":
						fmt.Fprintf(w, "{%d}\r\n%s\r\nOK\r\n", len(script), script)
					case "LOGOUT":
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

func TestGetScriptStopsAfterUnusableNoopResponse(t *testing.T) {
	for _, tc := range []struct {
		name, response string
	}{
		// The unread OK must never become LISTSCRIPTS' empty success.
		{"malformed status followed by OK", "OK (UNFINISHED\r\nOK\r\n"},
		{"terminal BYE", "BYE \"session ended\"\r\n"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			client, url := signedIn(t, noopResponseSieve(t, tc.response, "keep;\n"))
			res, err := client.Get(url + "/managesieve/script")
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			body, err := io.ReadAll(res.Body)
			if err != nil {
				t.Fatal(err)
			}
			if res.StatusCode != http.StatusInternalServerError {
				t.Fatalf("status %d: %s; want an unavailable response after an unusable NOOP answer", res.StatusCode, body)
			}
			var got struct {
				Error string `json:"error"`
			}
			if err := json.Unmarshal(body, &got); err != nil {
				t.Fatal(err)
			}
			if got.Error != "sieve_unavailable" {
				t.Errorf("error = %q, want sieve_unavailable", got.Error)
			}
		})
	}
}

func TestGetScriptAcceptsUnsupportedNoop(t *testing.T) {
	const script = "require \"fileinto\";\nfileinto \"Archive\";\n"
	client, url := signedIn(t, noopResponseSieve(t, "NO \"Unknown command\"\r\n", script))
	res, err := client.Get(url + "/managesieve/script")
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	if res.StatusCode != http.StatusOK {
		t.Fatalf("status %d: %s", res.StatusCode, body)
	}
	var got struct {
		Content    string   `json:"content"`
		Extensions []string `json:"extensions"`
	}
	if err := json.Unmarshal(body, &got); err != nil {
		t.Fatal(err)
	}
	if got.Content != script {
		t.Errorf("content = %q, want %q", got.Content, script)
	}
	if want := []string{"fileinto", "vacation"}; !reflect.DeepEqual(got.Extensions, want) {
		t.Errorf("extensions = %q, want %q", got.Extensions, want)
	}
}
