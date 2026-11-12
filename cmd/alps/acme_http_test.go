package main

import (
	"github.com/migadu/alps"
	"net/http"
	"testing"
	"time"
)

func TestACMEHTTPServerHasBoundedTimeouts(t *testing.T) {
	for _, tc := range []struct {
		name              string
		options           alps.Options
		read, write, idle time.Duration
	}{
		{name: "defaults", read: 10 * time.Second, write: 60 * time.Second, idle: 120 * time.Second},
		{name: "configured", options: alps.Options{ReadTimeout: 3 * time.Second, WriteTimeout: 4 * time.Second, IdleTimeout: 5 * time.Second}, read: 3 * time.Second, write: 4 * time.Second, idle: 5 * time.Second},
	} {
		t.Run(tc.name, func(t *testing.T) {
			handler := http.HandlerFunc(func(http.ResponseWriter, *http.Request) {})
			server := newACMEHTTPServer("127.0.0.1:0", handler, &tc.options, alps.NewLogger())
			if server.ReadHeaderTimeout != tc.read || server.ReadTimeout != tc.read || server.WriteTimeout != tc.write || server.IdleTimeout != tc.idle {
				t.Fatalf("ACME timeouts header=%v read=%v write=%v idle=%v", server.ReadHeaderTimeout, server.ReadTimeout, server.WriteTimeout, server.IdleTimeout)
			}
		})
	}
}
