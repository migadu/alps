package imap

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps"
)

func TestIMAPWireLogsUseServerLogger(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	done := make(chan struct{})
	go func() {
		defer close(done)
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()
		conn.SetDeadline(time.Now().Add(3 * time.Second))
		fmt.Fprint(conn, "* OK [CAPABILITY IMAP4rev1] wire-ready\r\n")
		scanner := bufio.NewScanner(conn)
		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) < 2 {
				return
			}
			if fields[1] == "LOGOUT" {
				fmt.Fprintf(conn, "* BYE done\r\n%s OK logout\r\n", fields[0])
				return
			}
			if fields[1] == "CAPABILITY" {
				fmt.Fprint(conn, "* CAPABILITY IMAP4rev1\r\n")
			}
			fmt.Fprintf(conn, "%s OK accepted\r\n", fields[0])
		}
	}()
	cfg := &Config{Server: "imap+insecure://" + listener.Addr().String()}
	options, err := cfg.ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(t.TempDir(), "alps.log")
	logger := alps.NewLoggerWithOptions(alps.LoggerOptions{Output: path, Format: "json", Level: "debug"})
	server, err := alps.New(logger, &alps.Options{Provider: options, SMTP: alps.SMTPOptions{Server: "smtps://smtp.example.test"}, EnabledPlugins: []string{"not-loaded"}, Debug: true})
	if err != nil {
		t.Fatal(err)
	}
	defer server.Close()
	p, err := options.CreateFactory(time.Second, true)("wire-user", "secret123")
	if err != nil {
		t.Fatal(err)
	}
	if err := p.Close(); err != nil {
		t.Fatal(err)
	}
	<-done
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(data), "wire-ready") || !strings.Contains(string(data), "wire-user") {
		t.Errorf("IMAP traces missing from configured logger: %s", data)
	}
	if strings.Contains(string(data), "secret123") {
		t.Errorf("password leaked: %s", data)
	}
}
