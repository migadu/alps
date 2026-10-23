package alpsbase

import (
	"bufio"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"testing"
)

// hangUp, as a scripted reply, drops the connection without one.
const hangUp = "(hang up)"

// scriptedSMTP is an SMTP server whose replies the test chooses. reply is
// asked for each one, with the connection's number, from 1, and the command
// answered: "MAIL", "RCPT", "DATA", "." for the end of the message, "QUIT".
// It answers with the reply line, hangUp, or "" for the usual reply.
type scriptedSMTP struct {
	reply func(conn int, cmd string) string

	mu       sync.Mutex
	conns    int // connections accepted
	mails    int // MAIL commands: transactions begun
	messages int // messages received whole, up to the final "."
}

func listenScripted(t *testing.T, reply func(conn int, cmd string) string) (string, *scriptedSMTP) {
	t.Helper()
	s := &scriptedSMTP{reply: reply}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	go func() {
		for {
			c, err := ln.Accept()
			if err != nil {
				return
			}
			s.mu.Lock()
			s.conns++
			n := s.conns
			s.mu.Unlock()
			go s.serve(c, n)
		}
	}()
	return "smtp+insecure://" + ln.Addr().String(), s
}

func (s *scriptedSMTP) serve(c net.Conn, n int) {
	defer c.Close()
	r := bufio.NewReader(c)
	// answer sends the scripted reply to cmd, or usual, and reports whether
	// the connection is still open.
	answer := func(cmd, usual string) bool {
		line := s.reply(n, cmd)
		if line == "" {
			line = usual
		}
		if line == hangUp {
			return false
		}
		_, err := io.WriteString(c, line+"\r\n")
		return err == nil
	}
	if _, err := io.WriteString(c, "220 localhost ESMTP\r\n"); err != nil {
		return
	}
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			return
		}
		verb, _, _ := strings.Cut(strings.TrimSpace(line), " ")
		var open bool
		switch strings.ToUpper(verb) {
		case "EHLO":
			open = answer("EHLO", "250-localhost\r\n250 AUTH PLAIN")
		case "AUTH":
			open = answer("AUTH", "235 2.7.0 Authenticated")
		case "MAIL":
			s.mu.Lock()
			s.mails++
			s.mu.Unlock()
			open = answer("MAIL", "250 2.1.0 OK")
		case "RCPT":
			open = answer("RCPT", "250 2.1.5 OK")
		case "DATA":
			if open = answer("DATA", "354 Go ahead"); !open {
				break
			}
			for {
				line, err := r.ReadString('\n')
				if err != nil {
					return
				}
				if line == ".\r\n" {
					break
				}
			}
			s.mu.Lock()
			s.messages++
			s.mu.Unlock()
			open = answer(".", "250 2.0.0 Queued")
		case "QUIT":
			answer("QUIT", "221 2.0.0 Bye")
			return
		default:
			open = answer(verb, "250 OK")
		}
		if !open {
			return
		}
	}
}

func (s *scriptedSMTP) counts() (mails, messages int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.mails, s.messages
}

func sendForm() url.Values {
	return url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"See you."}}
}

// A recipient the server refuses for good is refused at once. Every failed
// send used to be made three times, a second and then two more apart, so the
// user waited three seconds to hear what the server had said at the first.
func TestHTTP_ARefusedRecipientIsAskedForOnce(t *testing.T) {
	addr, smtpServer := listenScripted(t, func(_ int, cmd string) string {
		if cmd == "RCPT" {
			return "550 5.1.1 No such user"
		}
		return ""
	})
	s := newTestServerWithSMTP(t, addr)
	s.login()

	r := s.do("POST", "/messages", sendForm())
	s.expect(r, http.StatusInternalServerError)
	if !strings.Contains(string(r.body), "550") {
		t.Errorf("the failure says %s", r.body)
	}
	if mails, _ := smtpServer.counts(); mails != 1 {
		t.Errorf("the send was made %d times, want once", mails)
	}
}

// A message the server has taken is sent: what the server does after that,
// here dropping the connection instead of answering QUIT, does not unsend
// it. The failed QUIT used to fail the send, which was then made again: the
// message went out three times, and the user was told it had not gone.
func TestHTTP_AMessageTheServerTookIsSentOnce(t *testing.T) {
	addr, smtpServer := listenScripted(t, func(_ int, cmd string) string {
		if cmd == "QUIT" {
			return hangUp
		}
		return ""
	})
	s := newTestServerWithSMTP(t, addr)
	s.login()

	r := s.do("POST", "/messages", sendForm())
	if _, messages := smtpServer.counts(); messages != 1 {
		t.Errorf("%d copies delivered, want 1", messages)
	}
	s.expect(r, http.StatusOK)
}

// Once the message has gone up to its final ".", a connection that fails
// before the server answers may have left the message with the server. It
// is not sent again, which could deliver it twice.
func TestHTTP_AMessageTheServerMayHaveIsNotSentAgain(t *testing.T) {
	addr, smtpServer := listenScripted(t, func(_ int, cmd string) string {
		if cmd == "." {
			return hangUp
		}
		return ""
	})
	s := newTestServerWithSMTP(t, addr)
	s.login()

	s.expect(s.do("POST", "/messages", sendForm()), http.StatusInternalServerError)
	if _, messages := smtpServer.counts(); messages != 1 {
		t.Errorf("%d copies delivered, want 1", messages)
	}
}

// What may pass is still tried again: a temporary refusal, and a connection
// lost before the message.
func TestHTTP_ASendThatMayPassIsMadeAgain(t *testing.T) {
	for name, first := range map[string]struct{ cmd, reply string }{
		"a temporary refusal": {"RCPT", "451 4.3.0 Try again later"},
		"a lost connection":   {"MAIL", hangUp},
	} {
		t.Run(name, func(t *testing.T) {
			addr, smtpServer := listenScripted(t, func(conn int, cmd string) string {
				if conn == 1 && cmd == first.cmd {
					return first.reply
				}
				return ""
			})
			s := newTestServerWithSMTP(t, addr)
			s.login()

			s.expect(s.do("POST", "/messages", sendForm()), http.StatusOK)
			if mails, messages := smtpServer.counts(); mails != 2 || messages != 1 {
				t.Errorf("%d attempts and %d copies delivered, want 2 and 1", mails, messages)
			}
		})
	}
}
