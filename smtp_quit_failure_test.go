package alps

import (
	"bufio"
	"errors"
	"io"
	"net"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-smtp"
)

func smtpRefusalSession(t *testing.T, failure string, quietQuit bool) (*Session, <-chan []string) {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	done := make(chan []string, 1)
	go func() {
		conn, err := ln.Accept()
		if err != nil {
			done <- nil
			return
		}
		defer conn.Close()
		conn.SetDeadline(time.Now().Add(5 * time.Second))
		io.WriteString(conn, "220 fixture ESMTP\r\n")
		reader := bufio.NewReader(conn)
		var commands []string
		defer func() { done <- commands }()
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				return
			}
			verb, _, _ := strings.Cut(strings.TrimSpace(line), " ")
			commands = append(commands, verb)
			if verb == "QUIT" {
				if quietQuit {
					continue
				}
				io.WriteString(conn, "221 bye\r\n")
				return
			}
			if verb == failure {
				io.WriteString(conn, "550 fixture refusal\r\n")
				continue
			}
			switch verb {
			case "EHLO":
				io.WriteString(conn, "250-fixture\r\n250 AUTH PLAIN\r\n")
			case "AUTH":
				io.WriteString(conn, "235 authenticated\r\n")
			default:
				io.WriteString(conn, "250 accepted\r\n")
			}
		}
	}()
	dial := func(string) (*smtp.Client, error) {
		c, err := smtp.Dial(ln.Addr().String())
		if c != nil {
			c.CommandTimeout = 5 * time.Second
		}
		return c, err
	}
	sm := newSessionManager(nil, dial, &NilLogger{}, 0, false, nil, 30*time.Minute, time.Hour, 0, 0, 0, 0, 0)
	return &Session{manager: sm, username: "ada", password: "pass"}, done
}

func TestSMTPRefusalsStillSendQuit(t *testing.T) {
	for _, failure := range []string{"AUTH", "MAIL", "RCPT", "DATA", "callback"} {
		t.Run(failure, func(t *testing.T) {
			s, done := smtpRefusalSession(t, failure, false)
			cause := errors.New("operation failed")
			err := s.doSMTP(func(c *smtp.Client) error {
				if failure == "callback" {
					return cause
				}
				if err := c.Mail("ada@example.test", nil); err != nil {
					return err
				}
				if err := c.Rcpt("bob@example.test", nil); err != nil {
					return err
				}
				_, err := c.Data()
				return err
			})
			if err == nil {
				t.Fatal("refused operation succeeded")
			}
			if failure == "callback" && !errors.Is(err, cause) {
				t.Errorf("operation error changed: %v", err)
			}
			if commands := <-done; !slices.Contains(commands, "QUIT") {
				t.Errorf("refusal dropped connection without QUIT: %q", commands)
			}
		})
	}
}

func TestSMTPQuitCleanupIsBoundedAndPreservesError(t *testing.T) {
	s, done := smtpRefusalSession(t, "", true)
	cause := errors.New("operation failed")
	start := time.Now()
	err := s.doSMTP(func(*smtp.Client) error { return cause })
	if !errors.Is(err, cause) {
		t.Errorf("cleanup changed original error: %v", err)
	}
	if elapsed := time.Since(start); elapsed > 2*time.Second {
		t.Errorf("QUIT cleanup took %v, want at most 2s", elapsed)
	}
	if commands := <-done; !slices.Contains(commands, "QUIT") {
		t.Errorf("cleanup skipped QUIT: %q", commands)
	}
}
