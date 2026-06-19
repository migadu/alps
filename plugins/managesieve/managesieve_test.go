package managesieve

import (
	"bufio"
	"net"
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
