package imap

import (
	"fmt"
	"net"
	"testing"
	"time"
)

func TestConnectUsesConfiguredResponseTimeout(t *testing.T) {
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
		fmt.Fprint(conn, "* OK [CAPABILITY IMAP4rev1] ready\r\n")
	}()
	client, err := Connect(listener.Addr().String(), false, true, 100*time.Millisecond, false, nil)
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	conn := <-accepted
	defer conn.Close()
	done := make(chan error, 1)
	go func() { done <- client.Login("alice", "secret").Wait() }()
	select {
	case err := <-done:
		if err == nil {
			t.Fatal("silent server accepted LOGIN")
		}
	case <-time.After(time.Second):
		t.Fatal("LOGIN ignored the configured 100ms response timeout")
	}
}
