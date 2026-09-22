// A THREAD that dies with the connection is not a server declining to group.
//
// The distinction matters because the two want opposite handling: a refusal
// should cost the reader the grouping and nothing else, while a broken
// connection should be reported, since the flat listing that would follow it
// runs down the same dead socket and fails again with a worse error.
//
// The in-memory server cannot express this — whatever a session returns
// reaches the client as a tagged NO — so the failure is injected underneath
// it, by a proxy that cuts the connection the moment THREAD crosses the wire.
package imap

import (
	"bytes"
	"context"
	"io"
	"net"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
)

// severingProxy forwards an IMAP session until it sees needle from the client,
// then drops both halves without a reply.
func severingProxy(t *testing.T, backend string, needle []byte) net.Listener {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })

	go func() {
		down, err := ln.Accept()
		if err != nil {
			return
		}
		up, err := net.Dial("tcp", backend)
		if err != nil {
			down.Close()
			return
		}
		defer down.Close()
		defer up.Close()

		go io.Copy(down, up)

		buf := make([]byte, 4096)
		for {
			n, err := down.Read(buf)
			if n > 0 {
				if bytes.Contains(bytes.ToUpper(buf[:n]), needle) {
					return // cut mid-command, no tagged response
				}
				if _, werr := up.Write(buf[:n]); werr != nil {
					return
				}
			}
			if err != nil {
				return
			}
		}
	}()
	return ln
}

func threadSeveringProvider(t *testing.T) *IMAPProvider {
	t.Helper()
	user := imapmemserver.NewUser("ada", "pass")
	if err := user.Create(context.Background(), "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	mem := imapmemserver.New()
	mem.AddUser(user)

	srv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}},
		InsecureAuth: true,
	})
	backend, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(backend)
	t.Cleanup(func() { srv.Close() })

	proxy := severingProxy(t, backend.Addr().String(), []byte("UID THREAD"))

	client, err := imapclient.DialInsecure(proxy.Addr().String(), nil)
	if err != nil {
		t.Fatal(err)
	}
	if err := client.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { client.Close() })

	return NewIMAPProvider(client, false)
}

func TestAThreadFailureThatIsNotARefusalIsNotSwallowed(t *testing.T) {
	p := threadSeveringProvider(t)

	_, _, err := p.ListMessages("INBOX", "asc", 0, 50)
	if err == nil {
		t.Fatal("a severed connection was reported as a successful flat listing")
	}
	// Whatever the wording, it must not be the server's refusal wording: the
	// reader is being told the connection failed, not that grouping is off.
	if strings.Contains(strings.ToUpper(err.Error()), "[LIMIT]") {
		t.Errorf("a transport failure was reported as a THREAD refusal: %v", err)
	}
	if refusedByServer(err) {
		t.Errorf("a severed connection was classified as a server refusal: %v", err)
	}
}
