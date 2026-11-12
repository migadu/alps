package alps

import (
	"bufio"
	"fmt"
	"net"
	"testing"
	"time"
)

func TestSMTPStartTLSSetupHonorsTimeout(t *testing.T) {
	for _, phase := range []string{"greeting", "EHLO", "STARTTLS"} {
		t.Run(phase, func(t *testing.T) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			accepted := make(chan net.Conn, 1)
			go func() {
				conn, err := listener.Accept()
				if err != nil {
					return
				}
				accepted <- conn
				if phase == "greeting" {
					return
				}
				fmt.Fprint(conn, "220 mail.example ESMTP\r\n")
				reader := bufio.NewReader(conn)
				reader.ReadString('\n')
				if phase == "EHLO" {
					return
				}
				fmt.Fprint(conn, "250-mail.example\r\n250 STARTTLS\r\n")
				reader.ReadString('\n')
				if phase == "STARTTLS" {
					return
				}
				fmt.Fprint(conn, "220 Ready for TLS\r\n")
			}()
			s := &Server{Options: &Options{SMTPTimeout: 100 * time.Millisecond}}
			s.smtp.host = listener.Addr().String()
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
				if err == nil {
					t.Fatal("silent server succeeded")
				}
			case <-time.After(time.Second):
				conn.Close()
				<-done
				t.Fatal("SMTP setup ignored the configured 100ms timeout")
			}
		})
	}
}
