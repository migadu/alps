// Commands whose answer alps already has.
//
// A session has one IMAP connection, and every request waits its turn on it,
// so a command sent only to learn what an earlier answer said holds up
// whatever comes next.
package imap

import (
	"regexp"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// searchCommands matches a UID SEARCH the client sent.
var searchCommands = regexp.MustCompile(`(?m)^\S+ UID SEARCH `)

// MOVE is atomic (RFC 6851), and its COPYUID names the messages that moved,
// so they need not be searched for in the folder they left.
func TestAMoveTheServerAccountedForIsNotSearchedFor(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapMove: {}, imap.CapUIDPlus: {}}}
	p := memIMAP(t, s,
		conversation("Engines", "one@remote.test", ""),
		conversation("Looms", "two@remote.test", ""),
	)
	if err := p.CreateMailbox("Archive"); err != nil {
		t.Fatal(err)
	}

	before := len(s.traffic.String())
	moved, err := p.MoveMessages("INBOX", "Archive", []provider.MessageID{IMAPUID(1)})
	if err != nil {
		t.Fatal(err)
	}
	sent := s.traffic.String()[before:]

	if got := moved[IMAPUID(1)]; got != IMAPUID(1) {
		t.Errorf("UID 1 moved to %v, want UID 1 in Archive", got)
	}
	if got := inboxUIDs(t, p); got != "2" {
		t.Errorf("INBOX holds %q after the move, want 2", got)
	}
	if n := len(searchCommands.FindAllString(sent, -1)); n != 0 {
		t.Errorf("the move sent %d UID SEARCH, want none:\n%s", n, sent)
	}
}
