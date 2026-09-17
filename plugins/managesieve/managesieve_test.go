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
