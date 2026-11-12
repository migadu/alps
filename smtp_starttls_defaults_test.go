package alps

import (
	"bufio"
	"fmt"
	"io"
	"net"
	"strings"
	"testing"
	"time"
)

func TestSMTPStartTLSNegativeTimeoutKeepsClientDefaults(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()
		reader := bufio.NewReader(conn)
		fmt.Fprint(conn, "220 mail.example ESMTP\r\n")
		if line, err := reader.ReadString('\n'); err != nil || !strings.Contains(line, "EHLO") {
			return
		}
		fmt.Fprint(conn, "250-mail.example\r\n250 STARTTLS\r\n")
		if line, err := reader.ReadString('\n'); err != nil || !strings.Contains(line, "STARTTLS") {
			return
		}
		fmt.Fprint(conn, "220 ready\r\n")
	}()
	s := &Server{Options: &Options{SMTPTimeout: -time.Second}}
	s.smtp.host = listener.Addr().String()
	client, err := s.dialSMTP("alice")
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	if client.CommandTimeout <= 0 || client.SubmissionTimeout <= 0 {
		t.Fatalf("overrode client defaults with %v/%v", client.CommandTimeout, client.SubmissionTimeout)
	}
}

func TestSMTPStartTLSFailureReleasesSocket(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	closed := make(chan error, 1)
	go func() {
		conn, err := listener.Accept()
		if err != nil {
			closed <- err
			return
		}
		defer conn.Close()
		fmt.Fprint(conn, "554 unavailable\r\n")
		conn.SetReadDeadline(time.Now().Add(time.Second))
		var byte [1]byte
		_, err = conn.Read(byte[:])
		closed <- err
	}()
	s := &Server{Options: &Options{SMTPTimeout: 2 * time.Second}}
	s.smtp.host = listener.Addr().String()
	if client, err := s.dialSMTP("alice"); err == nil {
		client.Close()
		t.Fatal("greeting refusal succeeded")
	}
	if err := <-closed; err != io.EOF {
		t.Errorf("failed setup retained its socket: %v", err)
	}
}
