package managesieve

import (
	"bufio"
	"errors"
	"io"
	"net"
	"strings"
	"testing"
)

// Every response is read a line at a time, and a line was read whole, however
// long, before anything looked at it: a server that sent no line break went on
// filling alps's memory. A line now ends by maxLineBytes, or the connection
// does, as a client out of step with its server has nothing more to read.
func TestReadLineRefusesALineWithoutEnd(t *testing.T) {
	client, server := net.Pipe()
	t.Cleanup(func() { client.Close(); server.Close() })
	c := &MSClient{conn: client, r: bufio.NewReader(client), capabilities: make(map[string]string)}

	const endless = 4 * maxLineBytes
	sent := make(chan int, 1)
	go func() {
		chunk := []byte(strings.Repeat("x", 64<<10))
		total := 0
		for total < endless {
			n, err := server.Write(chunk)
			total += n
			if err != nil {
				break
			}
		}
		sent <- total
		server.Close()
	}()

	if _, err := c.readLine(); err == nil {
		t.Error("a line without a line break was read as a line")
	}
	if total := <-sent; total >= endless {
		t.Errorf("the client read all %d bytes of a line without end; want it to stop past %d", total, maxLineBytes)
	}
	if _, err := client.Read(make([]byte, 1)); !errors.Is(err, io.ErrClosedPipe) {
		t.Errorf("the connection was left open after the line was refused: %v", err)
	}
}

// A line up to the bound is read as it was sent.
func TestReadLineReadsALongLine(t *testing.T) {
	long := strings.Repeat("x", maxLineBytes-2)
	c, cleanup := newTestClient(t, long+"\r\n")
	defer cleanup()

	if got, err := c.readLine(); err != nil || got != long {
		t.Errorf("read %d bytes, %v; want the %d sent", len(got), err, len(long))
	}
}
