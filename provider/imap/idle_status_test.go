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

// A STATUS after news is part of ending IDLE: a half-open server must not
// hold the background connection beyond its response timeout, and losing it
// must be reported. A tagged refusal only leaves the conservative snapshot.
func TestIdle_StatusAfterNewsIsBoundedAndKeepsRefusals(t *testing.T) {
	for _, reply := range []string{"silent", "disconnect", "NO", "BAD"} {
		t.Run(reply, func(t *testing.T) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			sawStatus := make(chan struct{})
			go func() {
				c, err := listener.Accept()
				if err != nil {
					return
				}
				defer c.Close()
				send := func(line string) { fmt.Fprintf(c, "%s\r\n", line) }
				send("* OK [CAPABILITY IMAP4rev1 IDLE] ready")
				r := bufio.NewScanner(c)
				idleTag := ""
				for r.Scan() {
					line := r.Text()
					if line == "DONE" {
						send(idleTag + " OK done")
						continue
					}
					fields := strings.Fields(line)
					if len(fields) < 2 {
						continue
					}
					tag := fields[0]
					switch strings.ToUpper(fields[1]) {
					case "LOGIN":
						send(tag + " OK [CAPABILITY IMAP4rev1 IDLE] logged in")
					case "CAPABILITY":
						send("* CAPABILITY IMAP4rev1 IDLE")
						send(tag + " OK done")
					case "SELECT":
						send("* 0 EXISTS")
						send("* OK [UIDVALIDITY 1] selected")
						send("* OK [UIDNEXT 1] selected")
						send(tag + " OK selected")
					case "IDLE":
						idleTag = tag
						send("+ idling")
						send("* 1 EXISTS")
					case "STATUS":
						close(sawStatus)
						switch reply {
						case "disconnect":
							return
						case "NO", "BAD":
							send(tag + " " + reply + " cannot provide status")
						}
					default:
						send(tag + " OK done")
					}
				}
			}()
			opts, err := (&Config{Server: "imap+insecure://" + listener.Addr().String()}).ToOptions()
			if err != nil {
				t.Fatal(err)
			}
			mp, err := opts.CreateFactory(100*time.Millisecond, false)("ada", "pass")
			if err != nil {
				t.Fatal(err)
			}
			p := mp.(*IMAPProvider)
			defer p.client.Close()
			stop := make(chan struct{})
			done := make(chan error, 1)
			go func() { done <- p.Idle("INBOX", stop, func() { close(stop) }) }()
			select {
			case <-sawStatus:
			case <-time.After(time.Second):
				t.Fatal("the post-IDLE STATUS was not sent")
			}
			select {
			case err = <-done:
			case <-time.After(500 * time.Millisecond):
				t.Error("STATUS exceeded the connection's 100ms response timeout")
				p.client.Close()
				err = <-done
			}
			if reply == "silent" || reply == "disconnect" {
				if !errors.Is(err, net.ErrClosed) {
					t.Fatalf("failed STATUS ended IDLE with %v, want a lost-connection error", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("a tagged STATUS refusal ended IDLE with %v", err)
			}
			if p.idled.uidNext != 1 {
				t.Errorf("a tagged refusal recorded UIDNEXT %v, want the conservative selected value1", p.idled.uidNext)
			}
			if err := p.client.Noop().Wait(); err != nil {
				t.Errorf("the connection cannot be used after a STATUS refusal: %v", err)
			}
		})
	}
}
