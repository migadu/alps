package managesieve

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"net"
	"reflect"
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

// A script goes up as a literal, and a line break after the literal ends the
// command (RFC 5804 §2.6). PutScript left that line break out whenever the
// script itself ended in one, an empty script included: the server, still
// waiting for the end of the command, did not answer, and the save failed
// when alps stopped waiting.
func TestPutScriptEndsTheCommandAfterTheScript(t *testing.T) {
	for _, content := range []string{"keep;\n", "keep;\r\n", ""} {
		client, server := net.Pipe()
		c := &MSClient{conn: client, r: bufio.NewReader(client), capabilities: make(map[string]string)}

		received := make(chan string, 1)
		go func() {
			r := bufio.NewReader(server)
			line, _ := r.ReadString('\n')
			var name string
			var size int
			fmt.Sscanf(line, "PUTSCRIPT %q {%d+}", &name, &size)
			script := make([]byte, size)
			io.ReadFull(r, script)
			server.SetReadDeadline(time.Now().Add(time.Second))
			end, _ := r.ReadString('\n')
			received <- string(script) + "|" + end
			server.Write([]byte("OK\r\n"))
		}()

		err := c.PutScript("alps-filters", content)
		got := <-received
		client.Close()
		server.Close()
		if err != nil {
			t.Errorf("%q: %v", content, err)
		}
		if want := content + "|\r\n"; got != want {
			t.Errorf("%q: the server read %q, want the script and then the line break that ends the command", content, got)
		}
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

// A script may come back as a quoted string rather than a literal (RFC 5804
// §4). In one, a quote and a backslash are escaped with a backslash, and the
// quotes around it are not part of it. GetScript left the escapes in and
// stripped every quote at either end, the script's own last quote included.
func TestGetScriptReadsAQuotedString(t *testing.T) {
	c, cleanup := newTestClient(t, `"keep; # \"a\\b\""`+"\r\nOK\r\n")
	defer cleanup()

	got, err := c.GetScript("alps-filters")
	if want := `keep; # "a\b"`; err != nil || got != want {
		t.Errorf("read %q, %v; want %q", got, err, want)
	}

	// A string that is not closed is not a script: saved back from the
	// page, it would replace the one stored.
	c, cleanup = newTestClient(t, `"keep; # \"a\"`+"\r\nOK\r\n")
	defer cleanup()
	if got, err := c.GetScript("alps-filters"); err == nil {
		t.Errorf("an unclosed string was read as the script %q", got)
	}
}

// Script names in LISTSCRIPTS are strings too, and a quote or a backslash in
// one is escaped. The name was cut at its first escaped quote, and the rest
// of the line read as further words, so the script could not be asked for
// by its name.
func TestListScriptsReadsEscapesInAName(t *testing.T) {
	c, cleanup := newTestClient(t, `"my \"own\" rules" ACTIVE`+"\r\n"+`"back\\slash"`+"\r\nOK\r\n")
	defer cleanup()

	scripts, err := c.ListScripts()
	if err != nil {
		t.Fatal(err)
	}
	want := []Script{{Name: `my "own" rules`, Active: true}, {Name: `back\slash`}}
	if !reflect.DeepEqual(scripts, want) {
		t.Errorf("listed %+v, want %+v", scripts, want)
	}
}

// A capability's value is a string as well, such as the server's own name
// under IMPLEMENTATION.
func TestACapabilityValueIsUnescaped(t *testing.T) {
	c, cleanup := newTestClient(t, `"IMPLEMENTATION" "Example \"Sieve\" 1.0"`+"\r\n"+`"SIEVE" "fileinto"`+"\r\nOK\r\n")
	defer cleanup()

	if err := c.readResponse(); err != nil {
		t.Fatal(err)
	}
	if got, want := c.capabilities["IMPLEMENTATION"], `Example "Sieve" 1.0`; got != want {
		t.Errorf("IMPLEMENTATION is %q, want %q", got, want)
	}
	if got := c.capabilities["SIEVE"]; got != "fileinto" {
		t.Errorf("SIEVE is %q, want fileinto", got)
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

// scriptedConn hands out its reads in turn: data, or an error for one read,
// as a read that timed out returns before the server's late answer arrives.
// Writes are taken and dropped.
type scriptedConn struct {
	net.Conn // nil: only the methods below are called
	reads    []any
}

func (s *scriptedConn) Read(p []byte) (int, error) {
	if len(s.reads) == 0 {
		return 0, io.EOF
	}
	switch r := s.reads[0].(type) {
	case error:
		s.reads = s.reads[1:]
		return 0, r
	default:
		data := r.(string)
		n := copy(p, data)
		if n == len(data) {
			s.reads = s.reads[1:]
		} else {
			s.reads[0] = data[n:]
		}
		return n, nil
	}
}

func (s *scriptedConn) Write(p []byte) (int, error)      { return len(p), nil }
func (s *scriptedConn) SetReadDeadline(time.Time) error  { return nil }
func (s *scriptedConn) SetWriteDeadline(time.Time) error { return nil }

// After a literal, the rest of its line is read, and a failure there was
// dropped: the line was taken for an empty one, and the response read on.
// A read that timed out, after which the server's answer came late, gave a
// listing or a capability read as complete, out of step with the server.
func TestAFailedReadAfterALiteralFailsTheResponse(t *testing.T) {
	timedOut := errors.New("i/o timeout")
	client := func(reads ...any) *MSClient {
		conn := &scriptedConn{reads: reads}
		return &MSClient{conn: conn, r: bufio.NewReader(conn), capabilities: make(map[string]string)}
	}

	c := client("{5}\r\nhello", timedOut, " ACTIVE\r\nOK\r\n")
	if scripts, err := c.ListScripts(); !errors.Is(err, timedOut) {
		t.Errorf("listed %+v, %v; want the failed read's error", scripts, err)
	}

	c = client("\"IMPLEMENTATION\" {5}\r\nhello", timedOut, "\r\nOK\r\n")
	if err := c.readResponse(); !errors.Is(err, timedOut) {
		t.Errorf("read capabilities %v, %v; want the failed read's error", c.capabilities, err)
	}
}
