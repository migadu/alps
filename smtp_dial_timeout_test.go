package alps

import (
	"errors"
	"net"
	"testing"
	"time"
)

func TestSMTPTLSHandshakeUsesConfiguredTimeout(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	accepted := make(chan net.Conn, 1)
	go func() {
		conn, err := listener.Accept()
		if err == nil {
			accepted <- conn // Accept TCP, then leave the TLS handshake unanswered.
		}
	}()
	s := &Server{Options: &Options{SMTPTimeout: 100 * time.Millisecond}}
	s.smtp.host, s.smtp.tls = listener.Addr().String(), true
	done := make(chan error, 1)
	go func() {
		client, err := s.dialSMTP("alice")
		if client != nil {
			client.Close()
		}
		done <- err
	}()
	conn := <-accepted
	defer conn.Close()
	select {
	case err := <-done:
		var timeout net.Error
		if !errors.As(err, &timeout) || !timeout.Timeout() {
			t.Fatalf("silent TLS peer returned %v, want timeout", err)
		}
	case <-time.After(time.Second):
		conn.Close()
		<-done
		t.Fatal("TLS handshake ignored the configured 100ms SMTP timeout")
	}
}

// The pinned SMTP client reads the greeting lazily in Hello. Keep this
// safeguard so changing how plain connections are constructed cannot move the
// greeting ahead of applying the configured command timeout.
func TestSMTPPlainGreetingUsesConfiguredTimeout(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	accepted := make(chan net.Conn, 1)
	go func() {
		conn, err := listener.Accept()
		if err == nil {
			accepted <- conn
		}
	}()
	s := &Server{Options: &Options{SMTPTimeout: 100 * time.Millisecond}}
	s.smtp.host, s.smtp.insecure = listener.Addr().String(), true
	client, err := s.dialSMTP("alice")
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	conn := <-accepted
	defer conn.Close()
	done := make(chan error, 1)
	go func() { done <- client.Hello("localhost") }()
	select {
	case err := <-done:
		var timeout net.Error
		if !errors.As(err, &timeout) || !timeout.Timeout() {
			t.Fatalf("silent SMTP peer returned %v, want timeout", err)
		}
	case <-time.After(time.Second):
		conn.Close()
		<-done
		t.Fatal("SMTP greeting ignored the configured 100ms SMTP timeout")
	}
}
