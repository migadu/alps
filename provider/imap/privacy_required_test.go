package imap

import (
	"context"
	"errors"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
	"github.com/migadu/go-imap/imapserver"
)

type privacyRequiredLogin struct{ imapserver.Session }

func (privacyRequiredLogin) Login(context.Context, string, string) error {
	return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodePrivacyRequired, Text: "Cleartext authentication disallowed"}
}

func TestLoginDisabledDoesNotSendCredentials(t *testing.T) {
	s := &scriptedIMAP{caps: "IMAP4rev1 LOGINDISABLED"}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	go func() {
		if conn, err := ln.Accept(); err == nil {
			s.serve(conn)
		}
	}()
	opts, err := (&Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	p, err := opts.CreateFactory(time.Second, false)("ada", "pass")
	if p != nil {
		p.Close()
	}
	if err == nil || !strings.Contains(err.Error(), "LOGINDISABLED") || s.received("LOGIN") {
		t.Fatalf("sent LOGIN despite LOGINDISABLED or lost failure: %v, LOGIN=%v", err, s.received("LOGIN"))
	}
}

func TestPrivacyRequiredIsAServiceFailure(t *testing.T) {
	addr := serveLogin(t, func(s imapserver.Session) imapserver.Session { return privacyRequiredLogin{s} })
	opts, err := (&Config{Server: "imap+insecure://" + addr}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	p, err := opts.CreateFactory(time.Second, false)("ada", "pass")
	if p != nil {
		p.Close()
	}
	var auth provider.AuthError
	if err == nil || errors.As(err, &auth) || !strings.Contains(err.Error(), "PRIVACYREQUIRED") {
		t.Fatalf("privacy refusal classified as credentials or lost context: %v", err)
	}
}
