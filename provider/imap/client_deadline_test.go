package imap

import (
	"bufio"
	"errors"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"
)

func TestAnsweredWithinAClientDeadlineIsAnUnansweredCommand(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	sawNOOP := make(chan struct{})
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()
		fmt.Fprint(conn, "* OK [CAPABILITY IMAP4rev1] ready\r\n")
		scanner := bufio.NewScanner(conn)
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) < 2 {
				continue
			}
			if strings.EqualFold(fields[1], "NOOP") {
				close(sawNOOP)
				continue
			}
			fmt.Fprintf(conn, "%s OK done\r\n", fields[0])
		}
	}()
	client, err := Connect(listener.Addr().String(), false, true, 50*time.Millisecond, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	if err := client.WaitGreeting(); err != nil {
		t.Fatal(err)
	}
	p := NewIMAPProvider(client, false)
	// Force the client's read deadline to win, well before the outer timer.
	p.responseTimeout = 2 * time.Second
	err = p.answeredWithin("NOOP", func() error { return client.Noop().Wait() })
	select {
	case <-sawNOOP:
	default:
		t.Fatal("NOOP was never sent")
	}
	if !errors.Is(err, errUnanswered) || !errors.Is(err, net.ErrClosed) {
		t.Errorf("client deadline returned %v; want unanswered and lost connection", err)
	}
	select {
	case <-client.Closed():
	default:
		t.Error("client remained open after its read deadline")
	}
}
