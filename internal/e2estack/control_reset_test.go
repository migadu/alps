package main

import (
	"bufio"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

// fencedSieve is a ManageSieve server whose first session is closed right
// after a successful login, with nothing said: what sora does to a login that
// was in flight when it ended any account's sessions (#982). Later sessions
// hold no scripts and answer every command OK.
func fencedSieve(t *testing.T) (addr string, sessions *atomic.Int32) {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	sessions = new(atomic.Int32)
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			n := sessions.Add(1)
			go func(conn net.Conn, first bool) {
				defer conn.Close()
				r := bufio.NewReader(conn)
				conn.Write([]byte("\"IMPLEMENTATION\" \"fake\"\r\n\"SASL\" \"PLAIN\"\r\nOK\r\n"))
				for {
					line, err := r.ReadString('\n')
					if err != nil {
						return
					}
					conn.Write([]byte("OK\r\n"))
					if first && strings.HasPrefix(line, "AUTHENTICATE") {
						return
					}
				}
			}(conn, n == 1)
		}
	}()
	return ln.Addr().String(), sessions
}

func TestResetSieveSurvivesALoginEndedByTheServer(t *testing.T) {
	addr, sessions := fencedSieve(t)
	c := &control{sieveAddr: addr}
	srv := httptest.NewServer(c.handler())
	defer srv.Close()

	resp, err := http.Post(srv.URL+"/reset/sieve", "application/json",
		strings.NewReader(`{"username":"ada@example.test","password":"secret"}`))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		body := new(strings.Builder)
		bufio.NewReader(resp.Body).WriteTo(body)
		t.Fatalf("reset: %d %s", resp.StatusCode, body)
	}
	if got := sessions.Load(); got != 2 {
		t.Errorf("sessions = %d, want 2: the dropped one and the retry", got)
	}
}
