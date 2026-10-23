package managesieve

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-sasl"
)

// commandSent runs send against a server that reads one command as RFC 5804
// frames it, a literal's octets included, answers OK, and hands back the
// command as it was written.
func commandSent(t *testing.T, send func(c *MSClient)) string {
	t.Helper()
	client, server := net.Pipe()
	t.Cleanup(func() { client.Close(); server.Close() })

	got := make(chan string, 1)
	go func() {
		r := bufio.NewReader(server)
		var command strings.Builder
		for {
			server.SetReadDeadline(time.Now().Add(2 * time.Second))
			line, err := r.ReadString('\n')
			command.WriteString(line)
			i := strings.LastIndex(line, "{")
			if err != nil || i < 0 || !strings.HasSuffix(line, "+}\r\n") {
				break
			}
			var size int
			if _, err := fmt.Sscanf(line[i:], "{%d+}", &size); err != nil {
				break
			}
			literal := make([]byte, size)
			io.ReadFull(r, literal)
			command.Write(literal)
		}
		got <- command.String()
		server.Write([]byte("OK\r\n"))
	}()

	send(&MSClient{conn: client, r: bufio.NewReader(client), capabilities: make(map[string]string)})
	return <-got
}

// A script's name goes to the server as a ManageSieve string (RFC 5804 §4).
// It was written with Go's %q, which escapes far more than a quote and a
// backslash: a tab as \t, a rune Go does not count as printable, such as the
// joiner inside an emoji family, as ‍, a byte that is not UTF-8 as \xe9.
// A server reads the character after a backslash as it is, so the script was
// asked for, written or switched on under another name. A name a quoted
// string cannot hold at all, with a line break in it or not UTF-8, goes as a
// literal.
func TestCommandsNameAScriptAsTheServerReadsIt(t *testing.T) {
	names := []struct{ name, wire string }{
		{`Kept "by hand" \ here`, `"Kept \"by hand\" \\ here"`},
		{"Family 👨‍👩‍👧", "\"Family 👨‍👩‍👧\""},
		{"Tab\there", "\"Tab\there\""},
		{"line\nbreak", "{10+}\r\nline\nbreak"},
		{"ends\r\n", "{6+}\r\nends\r\n"},
		{"caf\xe9", "{4+}\r\ncaf\xe9"},
	}
	commands := []struct {
		verb string
		send func(c *MSClient, name string)
		tail string
	}{
		{"GETSCRIPT", func(c *MSClient, name string) { c.GetScript(name) }, "\r\n"},
		{"SETACTIVE", func(c *MSClient, name string) { c.SetActive(name) }, "\r\n"},
		{"DELETESCRIPT", func(c *MSClient, name string) { c.DeleteScript(name) }, "\r\n"},
		{"PUTSCRIPT", func(c *MSClient, name string) { c.PutScript(name, "keep;") }, " {5+}\r\nkeep;\r\n"},
	}
	for _, command := range commands {
		for _, n := range names {
			t.Run(fmt.Sprintf("%s %q", command.verb, n.name), func(t *testing.T) {
				got := commandSent(t, func(c *MSClient) { command.send(c, n.name) })
				if want := command.verb + " " + n.wire + command.tail; got != want {
					t.Errorf("sent %q, want %q", got, want)
				}
			})
		}
	}
}

// Switching every script off names none, as an empty string.
func TestSetActiveWithNoNameSendsAnEmptyString(t *testing.T) {
	got := commandSent(t, func(c *MSClient) { c.SetActive("") })
	if want := "SETACTIVE \"\"\r\n"; got != want {
		t.Errorf("sent %q, want %q", got, want)
	}
}

// The sign-in's arguments are strings too: the mechanism, and the initial
// response in base64. Neither holds a character that needs more than quotes.
func TestAuthenticateSendsItsArgumentsAsStrings(t *testing.T) {
	got := commandSent(t, func(c *MSClient) {
		c.Authenticate(sasl.NewPlainClient("", "ada@example.com", "pass"))
	})
	if want := "AUTHENTICATE \"PLAIN\" \"AGFkYUBleGFtcGxlLmNvbQBwYXNz\"\r\n"; got != want {
		t.Errorf("sent %q, want %q", got, want)
	}
}
