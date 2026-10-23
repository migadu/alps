package alps

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"net/mail"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-smtp"
)

// listenSMTP serves an SMTP server that lets anyone in and answers every
// command with success, and returns the address to dial and a count of the
// connections it has accepted.
func listenSMTP(t *testing.T) (string, func() int) {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	var mu sync.Mutex
	conns := 0
	go func() {
		for {
			c, err := ln.Accept()
			if err != nil {
				return
			}
			mu.Lock()
			conns++
			mu.Unlock()
			go func() {
				defer c.Close()
				io.WriteString(c, "220 localhost ESMTP\r\n")
				r := bufio.NewReader(c)
				for {
					line, err := r.ReadString('\n')
					if err != nil {
						return
					}
					switch verb, _, _ := strings.Cut(strings.TrimSpace(line), " "); strings.ToUpper(verb) {
					case "AUTH":
						io.WriteString(c, "235 2.7.0 Authenticated\r\n")
					case "QUIT":
						io.WriteString(c, "221 2.0.0 Bye\r\n")
						return
					default:
						io.WriteString(c, "250 OK\r\n")
					}
				}
			}()
		}
	}()
	return ln.Addr().String(), func() int {
		mu.Lock()
		defer mu.Unlock()
		return conns
	}
}

// An SMTP operation that fails for a reason of its own, such as an address
// that does not parse, fails at once: a new connection would only fail it
// again. It used to be made three times, three seconds in all.
func TestDoSMTP_AFailureOfTheOperationsOwnIsNotTriedAgain(t *testing.T) {
	addr, conns := listenSMTP(t)
	dial := func(string) (*smtp.Client, error) { return smtp.Dial(addr) }
	sm := newSessionManager(nil, dial, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	s := &Session{manager: sm, closed: make(chan struct{}), username: "u", password: "p"}

	calls := 0
	err := s.DoSMTP(func(c *smtp.Client) error {
		calls++
		_, err := mail.ParseAddress("charles@")
		return fmt.Errorf("parsing address %q failed: %v", "charles@", err)
	})
	if err == nil || !strings.Contains(err.Error(), "charles@") {
		t.Errorf("got %v, want the operation's own failure", err)
	}
	if calls != 1 || conns() != 1 {
		t.Errorf("the operation ran %d times over %d connections, want once", calls, conns())
	}
}
