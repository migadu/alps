package imap

import (
	"bufio"
	"context"
	"errors"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/migadu/alps/provider"
)

// unavailableLogin answers LOGIN as Dovecot does while its authentication
// backend is down.
type unavailableLogin struct {
	imapserver.Session
}

func (unavailableLogin) Login(ctx context.Context, username, password string) error {
	return &imap.Error{
		Type: imap.StatusResponseTypeNo,
		Code: imap.ResponseCodeUnavailable,
		Text: "Temporary authentication failure.",
	}
}

// limitedLogin answers LOGIN as Sora does once the account holds as many
// connections as it may: after the password checked out.
type limitedLogin struct {
	imapserver.Session
}

func (limitedLogin) Login(ctx context.Context, username, password string) error {
	return &imap.Error{
		Type: imap.StatusResponseTypeNo,
		Code: imap.ResponseCodeLimit,
		Text: "Maximum connections reached",
	}
}

func serveLogin(t *testing.T, wrap func(imapserver.Session) imapserver.Session) string {
	t.Helper()
	user := imapmemserver.NewUser("ada", "pass")
	if err := user.Create(context.Background(), "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	srv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return wrap(mem.NewSession()), nil, nil
		},
		Caps: imap.CapSet{imap.CapIMAP4rev1: {}}, InsecureAuth: true,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })
	return ln.Addr().String()
}

// dropAtLogin greets, and closes the connection once LOGIN arrives.
func dropAtLogin(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	go func() {
		for {
			c, err := ln.Accept()
			if err != nil {
				return
			}
			go func() {
				defer c.Close()
				c.Write([]byte("* OK [CAPABILITY IMAP4rev1] ready\r\n"))
				r := bufio.NewReader(c)
				for {
					line, err := r.ReadString('\n')
					if err != nil || strings.Contains(strings.ToUpper(line), " LOGIN ") {
						return
					}
				}
			}()
		}
	}()
	return ln.Addr().String()
}

// Only the server's answer to LOGIN refuses the credentials, and not when it
// says the server could not check them, or that the account holds as many
// connections as it may. The login form counts an AuthError
// against the account and the address it came from, and enough of them lock
// the account: a user who signed in again through an outage of the mail
// server's authentication backend locked themselves out.
func TestLoginOnlyRefusedCredentialsAreAuthErrors(t *testing.T) {
	keep := func(s imapserver.Session) imapserver.Session { return s }
	for _, tc := range []struct {
		name     string
		addr     func(t *testing.T) string
		password string
		refused  bool
		limited  bool
	}{
		{"wrong password", func(t *testing.T) string { return serveLogin(t, keep) }, "wrong", true, false},
		{"NO [UNAVAILABLE]", func(t *testing.T) string {
			return serveLogin(t, func(s imapserver.Session) imapserver.Session { return unavailableLogin{s} })
		}, "pass", false, false},
		{"NO [LIMIT]", func(t *testing.T) string {
			return serveLogin(t, func(s imapserver.Session) imapserver.Session { return limitedLogin{s} })
		}, "pass", false, true},
		{"connection lost during LOGIN", dropAtLogin, "pass", false, false},
		{"nothing listening", func(t *testing.T) string {
			ln, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			addr := ln.Addr().String()
			ln.Close()
			return addr
		}, "pass", false, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			opts, err := (&Config{Server: "imap+insecure://" + tc.addr(t)}).ToOptions()
			if err != nil {
				t.Fatal(err)
			}
			mp, err := opts.CreateFactory(2*time.Second, false)("ada", tc.password)
			if err == nil {
				mp.Close()
				t.Fatal("the sign-in succeeded")
			}
			var authErr provider.AuthError
			if refused := errors.As(err, &authErr); refused != tc.refused {
				t.Errorf("AuthError = %v, want %v: %v", refused, tc.refused, err)
			}
			var limitErr *provider.LimitError
			if limited := errors.As(err, &limitErr); limited != tc.limited {
				t.Errorf("LimitError = %v, want %v: %v", limited, tc.limited, err)
			}
		})
	}
}
