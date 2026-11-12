package main

import (
	"context"
	"errors"
	"github.com/migadu/alps"
	"net"
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

func TestShutdownHTTPServersDrainsBothListeners(t *testing.T) {
	release := make(chan struct{})
	defer func() {
		select {
		case <-release:
		default:
			close(release)
		}
	}()
	started := make(chan struct{}, 2)
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started <- struct{}{}
		<-release
		w.WriteHeader(http.StatusNoContent)
	})
	var servers []*http.Server
	var listeners []net.Listener
	var serving []chan error
	requests := make(chan error, 2)
	for range 2 {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		server := newACMEHTTPServer(listener.Addr().String(), handler, &alps.Options{}, alps.NewLogger())
		defer server.Close()
		done := make(chan error, 1)
		go func() { done <- server.Serve(listener) }()
		go func() {
			resp, err := http.Get("http://" + listener.Addr().String())
			if err == nil {
				resp.Body.Close()
				if resp.StatusCode != http.StatusNoContent {
					err = errors.New("unexpected response")
				}
			}
			requests <- err
		}()
		servers = append(servers, server)
		listeners = append(listeners, listener)
		serving = append(serving, done)
	}
	for range servers {
		select {
		case <-started:
		case <-time.After(time.Second):
			t.Fatal("handler did not start")
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	done := make(chan error, 1)
	go func() { done <- shutdownHTTPServers(ctx, append(servers, nil)...) }()
	for i := range servers {
		select {
		case err := <-serving[i]:
			if !errors.Is(err, http.ErrServerClosed) {
				t.Fatalf("Serve: %v", err)
			}
		case <-time.After(time.Second):
			t.Fatal("listener not closed during drain")
		}
		conn, err := net.DialTimeout("tcp", listeners[i].Addr().String(), time.Second)
		if err == nil {
			conn.Close()
			t.Fatal("listener still accepts during drain")
		}
	}
	select {
	case err := <-done:
		t.Fatalf("shutdown did not wait for active handlers: %v", err)
	default:
	}
	close(release)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	for range servers {
		if err := <-requests; err != nil {
			t.Fatal(err)
		}
	}
}

func TestShutdownHTTPServersClosesActiveConnectionAtDeadline(t *testing.T) {
	started, finished := make(chan struct{}), make(chan struct{})
	server := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { close(started); <-r.Context().Done(); close(finished) })}
	defer server.Close()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go server.Serve(listener)
	requestDone := make(chan struct{})
	go func() {
		defer close(requestDone)
		resp, err := http.Get("http://" + listener.Addr().String())
		if err == nil {
			resp.Body.Close()
		}
	}()
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("handler did not start")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	if err := shutdownHTTPServers(ctx, server); !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("shutdown: %v", err)
	}
	select {
	case <-finished:
	case <-time.After(time.Second):
		t.Fatal("active request remains after shutdown deadline")
	}
	<-requestDone
}
