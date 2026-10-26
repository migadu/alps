package imap

import (
	"bufio"
	"errors"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
)

func TestLoginBackendFailuresAreNotCredentialRefusals(t *testing.T) {
	for _, tc := range []struct{ name, greeting, answer string }{
		{"initial BYE", "* BYE service shutting down\r\n", ""},
		{"tagged BAD", "* OK [CAPABILITY IMAP4rev1] ready\r\n", "BAD temporary server protocol failure"},
		{"NO lowercase unavailable", "* OK [CAPABILITY IMAP4rev1] ready\r\n", "NO [unavailable] temporary authentication outage"},
		{"NO SERVERBUG", "* OK [CAPABILITY IMAP4rev1] ready\r\n", "NO [SERVERBUG] internal authentication service error"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			ln, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer ln.Close()
			go func() {
				c, err := ln.Accept()
				if err != nil {
					return
				}
				defer c.Close()
				fmt.Fprint(c, tc.greeting)
				if tc.answer == "" {
					return
				}
				scan := bufio.NewScanner(c)
				for scan.Scan() {
					line := scan.Text()
					fields := strings.Fields(line)
					if len(fields) < 2 {
						continue
					}
					if strings.EqualFold(fields[1], "LOGIN") {
						fmt.Fprintf(c, "%s %s\r\n", fields[0], tc.answer)
						return
					}
				}
			}()
			opts, err := (&Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
			if err != nil {
				t.Fatal(err)
			}
			p, err := opts.CreateFactory(time.Second, false)("ada", "correct")
			if p != nil {
				p.Close()
			}
			if err == nil {
				t.Fatal("unexpected successful login")
			}
			var ae provider.AuthError
			if errors.As(err, &ae) {
				t.Fatalf("backend refusal counted as credential failure: %T: %v", err, err)
			}
		})
	}
}
