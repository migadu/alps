package imap

import (
	"context"
	"net"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/migadu/alps/provider"
)

// memIMAP serves an in-memory IMAP account holding messages in INBOX and
// returns a provider logged in to it.
func memIMAP(t *testing.T, messages ...string) *IMAPProvider {
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
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}},
		InsecureAuth: true,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })

	client, err := imapclient.DialInsecure(ln.Addr().String(), nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { client.Close() })
	if err := client.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	for _, m := range messages {
		cmd := client.Append("INBOX", int64(len(m)), nil)
		if _, err := cmd.Write([]byte(m)); err != nil {
			t.Fatal(err)
		}
		if err := cmd.Close(); err != nil {
			t.Fatal(err)
		}
		if _, err := cmd.Wait(); err != nil {
			t.Fatal(err)
		}
	}
	return NewIMAPProvider(client, false)
}

// The list and search fetches asked for no Authentication-Results, so a
// listed row never carried a verdict and the list could not tell a message
// that passed DMARC from one that did not.
func TestListedRowsCarryTheReceiversVerdict(t *testing.T) {
	p := memIMAP(t,
		"Authentication-Results: mx.test; dmarc=pass header.from=brand.test\r\nFrom: Brand <news@brand.test>\r\nSubject: passed\r\n\r\nHello\r\n",
		"Authentication-Results: mx.test; dmarc=fail header.from=brand.test\r\nAuthentication-Results: brand.test; dmarc=pass header.from=brand.test\r\nFrom: Brand <news@brand.test>\r\nSubject: forged\r\n\r\nHello\r\n",
	)

	listed, _, err := p.ListMessages("INBOX", "", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	searched, _, err := p.SearchMessages("INBOX", "", "", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	for how, msgs := range map[string][]provider.Message{"listed": listed, "searched": searched} {
		potential := map[string]bool{}
		for _, m := range msgs {
			if m.Envelope != nil {
				potential[m.Envelope.Subject] = m.BimiPotential
			}
		}
		if len(potential) != 2 || !potential["passed"] || potential["forged"] {
			t.Errorf("%s: DMARC pass by subject %v, want passed=true forged=false", how, potential)
		}
	}
}
