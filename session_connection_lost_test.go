package alps

import (
	"context"
	"testing"

	"github.com/migadu/alps/provider"
)

// inboxStatus reads INBOX's status, a command that selects no mailbox, so
// that the first command after a connection is dropped is not a SELECT.
func inboxStatus(p provider.MailProvider) error {
	_, err := p.(interface {
		GetMailboxStatus(string) (*provider.MailboxStatus, error)
	}).GetMailboxStatus("INBOX")
	return err
}

// A session tells a connection the mail server dropped by the connection, not
// by the error of the command that found it gone. Sent once the connection has
// gone, a command fails with the client's own unexpected EOF, which a command's
// error ("failed to get mailbox status: unexpected EOF") carries only as text.
// The session took that for a refusal and kept the connection, and every
// request after failed the same way on it.
func TestDoMail_AConnectionTheServerDroppedIsOpenedAgain(t *testing.T) {
	ln := serveVerdictMail(t, &verdictTraffic{})
	_, s := signInTo(t, ln)
	if err := s.DoMail(inboxStatus); err != nil {
		t.Fatal(err)
	}

	ln.drop(0)
	for i := 0; i < 2; i++ {
		if err := s.DoMail(inboxStatus); err != nil {
			t.Fatalf("request %d after the mail server dropped the connection: %v", i+1, err)
		}
	}
	if n := ln.accepted(); n != 2 {
		t.Errorf("%d connections to the mail server; want another for the one it dropped", n)
	}
}

// Likewise the background connection: background work that finds it gone runs
// on the session's own connection, and the next opens another.
func TestDoBackgroundMail_AConnectionTheServerDroppedIsOpenedAgain(t *testing.T) {
	ln := serveVerdictMail(t, &verdictTraffic{})
	sm, s := signInTo(t, ln)
	sm.backgroundConnections = true
	background := func() error { return s.DoBackgroundMail(context.Background(), inboxStatus) }
	if err := background(); err != nil {
		t.Fatal(err)
	}
	if n := ln.accepted(); n != 2 {
		t.Fatalf("%d connections to the mail server; want the session's own and a background one", n)
	}

	ln.drop(1)
	for i := 0; i < 2; i++ {
		if err := background(); err != nil {
			t.Fatalf("background work %d after the mail server dropped its connection: %v", i+1, err)
		}
	}
	if n := ln.accepted(); n != 3 {
		t.Errorf("%d connections to the mail server; want another background one for the one it dropped", n)
	}
}
