package managesieve

import (
	"bufio"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"
)

// newTestClient returns an MSClient whose reader is fed by srvLines and a
// cleanup func. The connection's writes are drained so sendCommand doesn't block.
func newTestClient(t *testing.T, srvResponse string) (*MSClient, func()) {
	t.Helper()
	client, server := net.Pipe()

	go func() {
		// Drain anything the client writes (commands).
		buf := make([]byte, 1024)
		for {
			server.SetReadDeadline(time.Now().Add(time.Second))
			if _, err := server.Read(buf); err != nil {
				return
			}
		}
	}()
	go func() {
		server.Write([]byte(srvResponse))
	}()

	c := &MSClient{
		conn:         client,
		r:            bufio.NewReader(client),
		capabilities: make(map[string]string),
	}
	return c, func() { client.Close(); server.Close() }
}

func TestListScripts(t *testing.T) {
	resp := "\"catchall\" ACTIVE\r\n\"vacation\"\r\nOK \"Listscripts completed.\"\r\n"
	c, cleanup := newTestClient(t, resp)
	defer cleanup()

	scripts, err := c.ListScripts()
	if err != nil {
		t.Fatalf("ListScripts: %v", err)
	}
	if len(scripts) != 2 {
		t.Fatalf("expected 2 scripts, got %d: %+v", len(scripts), scripts)
	}
	if scripts[0].Name != "catchall" || !scripts[0].Active {
		t.Errorf("expected catchall ACTIVE, got %+v", scripts[0])
	}
	if scripts[1].Name != "vacation" || scripts[1].Active {
		t.Errorf("expected vacation inactive, got %+v", scripts[1])
	}
}

// recordingClient is newTestClient for a test that needs to see the command:
// it returns what the client wrote, once srvResponse has been read.
func recordingClient(t *testing.T, srvResponse string) (*MSClient, <-chan string) {
	t.Helper()
	client, server := net.Pipe()
	t.Cleanup(func() { client.Close(); server.Close() })

	sent := make(chan string, 1)
	go func() {
		line, _ := bufio.NewReader(server).ReadString('\n')
		sent <- line
		server.Write([]byte(srvResponse))
	}()

	return &MSClient{
		conn:         client,
		r:            bufio.NewReader(client),
		capabilities: make(map[string]string),
	}, sent
}

func TestDeleteScript(t *testing.T) {
	c, sent := recordingClient(t, "OK \"Deletescript completed.\"\r\n")

	if err := c.DeleteScript("vacation"); err != nil {
		t.Fatalf("DeleteScript: %v", err)
	}
	if got := <-sent; got != "DELETESCRIPT \"vacation\"\r\n" {
		t.Errorf("sent %q", got)
	}
}

func TestDeleteScriptActiveIsRefused(t *testing.T) {
	c, _ := recordingClient(t, "NO (ACTIVE) \"You may not delete an active script\"\r\n")

	if err := c.DeleteScript("catchall"); err == nil {
		t.Fatal("expected the server's refusal to be returned")
	}
}

func TestListScriptsEmpty(t *testing.T) {
	c, cleanup := newTestClient(t, "OK \"Listscripts completed.\"\r\n")
	defer cleanup()

	scripts, err := c.ListScripts()
	if err != nil {
		t.Fatalf("ListScripts: %v", err)
	}
	if len(scripts) != 0 {
		t.Fatalf("expected 0 scripts, got %+v", scripts)
	}
}

// withoutPanic runs read, and fails the test rather than the whole run when
// it panics.
func withoutPanic(t *testing.T, read func() error) error {
	t.Helper()
	var err error
	func() {
		defer func() {
			if p := recover(); p != nil {
				t.Fatalf("panicked: %v", p)
			}
		}()
		err = read()
	}()
	return err
}

// A literal's size is the server's word, and the client reads that many bytes
// into memory: a size that is no size, or more than a script alps could save
// back, is refused instead. A negative size or one past what Go can allocate
// panicked, and any other was allocated whole before a byte arrived.
func TestGetScriptRefusesALiteralSizeItCannotRead(t *testing.T) {
	for _, header := range []string{"{-1}", "{9223372036854775807}", "{+5}", "{}", "{5", "{5+}x"} {
		c, cleanup := newTestClient(t, header+"\r\nhello\r\nOK\r\n")
		err := withoutPanic(t, func() error {
			_, err := c.GetScript("alps-filters")
			return err
		})
		cleanup()
		if err == nil {
			t.Errorf("%s: read as a script", header)
		}
	}

	big := maxScriptBytes + 1
	c, cleanup := newTestClient(t, fmt.Sprintf("{%d}\r\n%s\r\nOK\r\n", big, strings.Repeat("#", big)))
	defer cleanup()
	if _, err := c.GetScript("alps-filters"); err == nil {
		t.Errorf("a literal of %d bytes was read", big)
	}

	// The bound is on the script, not only on each literal: literals that fit
	// one by one are not gathered past it.
	half := maxScriptBytes/2 + 1
	part := fmt.Sprintf("{%d}\r\n%s\r\n", half, strings.Repeat("#", half))
	c, cleanup = newTestClient(t, part+part+"OK\r\n")
	defer cleanup()
	if _, err := c.GetScript("alps-filters"); err == nil {
		t.Errorf("two literals of %d bytes were read as one script", half)
	}
}

// A literal that fits is read as it was sent, in either form of its header.
func TestGetScriptReadsALiteral(t *testing.T) {
	for _, header := range []string{"{12}", "{12+}"} {
		c, cleanup := newTestClient(t, header+"\r\nkeep;\r\nstop;\r\nOK\r\n")
		got, err := c.GetScript("alps-filters")
		cleanup()
		if err != nil || got != "keep;\r\nstop;" {
			t.Errorf("%s: read %q, %v", header, got, err)
		}
	}
}

// A literal in a list of strings, as in a capability or a script name, takes
// the same checks. A header without its closing brace panicked, for a slice
// that ended before it began.
func TestALiteralInAResponseIsChecked(t *testing.T) {
	for _, header := range []string{"{5", "{-1}", "{9223372036854775807}"} {
		c, cleanup := newTestClient(t, "\"IMPLEMENTATION\" "+header+"\r\nhello\r\nOK\r\n")
		err := withoutPanic(t, c.readResponse)
		cleanup()
		if err == nil {
			t.Errorf("%s: read as a capability", header)
		}
	}

	c, cleanup := newTestClient(t, "\"IMPLEMENTATION\" {5}\r\nhello\r\n\"SIEVE\" \"fileinto\"\r\nOK\r\n")
	defer cleanup()
	if err := c.readResponse(); err != nil {
		t.Fatal(err)
	}
	if c.capabilities["IMPLEMENTATION"] != "hello" || c.capabilities["SIEVE"] != "fileinto" {
		t.Errorf("read %v", c.capabilities)
	}
}
