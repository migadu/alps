package imap

import (
	"reflect"
	"testing"

	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

func appendTo(t *testing.T, c *imapclient.Client, mailbox, m string) {
	t.Helper()
	cmd := c.Append(mailbox, int64(len(m)), nil)
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

func TestAuthVerdictsReadsEachMessageOnce(t *testing.T) {
	s := &memServer{}
	p := memIMAP(t, s,
		brandMessage("passed", passedResults),
		brandMessage("forged", forgedResults),
		"From: Ada <ada@remote.test>\r\nSubject: plain\r\n\r\nHello\r\n",
	)
	ids := []provider.MessageID{IMAPUID(1), IMAPUID(2), IMAPUID(3), IMAPUID(99)}
	want := map[string]provider.AuthVerdict{
		"1": {BimiPotential: true},
		"2": {BimiFailed: true},
		"3": {},
	}

	scopes := map[string]bool{}
	for round, wantReads := range []int{3, 0} {
		before := len(s.traffic.String())
		got, scope, err := p.AuthVerdicts("INBOX", ids)
		if err != nil {
			t.Fatal(err)
		}
		scopes[scope] = true
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("round %d: verdicts %+v, want %+v", round+1, got, want)
		}
		if reads := len(headerReads.FindAllString(s.traffic.String()[before:], -1)); reads != wantReads {
			t.Fatalf("round %d: %d Authentication-Results reads, want %d", round+1, reads, wantReads)
		}
	}
	if len(scopes) != 1 || scopes[""] {
		t.Fatalf("scopes %v; want one non-empty scope for both rounds", scopes)
	}
}

// A UID names a different message once a mailbox's UIDVALIDITY changes, so a
// cached verdict must not answer for it.
func TestAuthVerdictsStartOverWhenUIDValidityChanges(t *testing.T) {
	p := memIMAP(t, &memServer{})
	c := p.client
	create := func() {
		t.Helper()
		if err := c.Create("Archive", nil).Wait(); err != nil {
			t.Fatal(err)
		}
	}
	uid1 := []provider.MessageID{IMAPUID(1)}

	create()
	appendTo(t, c, "Archive", brandMessage("passed", passedResults))
	got, before, err := p.AuthVerdicts("Archive", uid1)
	if err != nil || !got["1"].BimiPotential {
		t.Fatalf("verdicts %+v, err %v; want UID 1 passed", got, err)
	}

	if _, err := c.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := c.Delete("Archive").Wait(); err != nil {
		t.Fatal(err)
	}
	create()
	appendTo(t, c, "Archive", brandMessage("forged", forgedResults))
	got, after, err := p.AuthVerdicts("Archive", uid1)
	if err != nil {
		t.Fatal(err)
	}
	if after == before {
		t.Fatalf("scope %q both before and after the mailbox was recreated", after)
	}
	if got["1"].BimiPotential || !got["1"].BimiFailed {
		t.Fatalf("UID 1 of the recreated mailbox answered %+v, the verdict of the deleted mailbox's UID 1", got["1"])
	}
}
