package alpsbase

import (
	"net/http"
	"regexp"
	"testing"

	"github.com/migadu/alps"
)

// inboxStatusCommands matches a STATUS alps sends for INBOX.
var inboxStatusCommands = regexp.MustCompile(`(?m)^[^*\s]\S* STATUS "?INBOX"? `)

// The check for new mail reads its folders together, and so went past the
// NOOP that an unchanged selected folder is asked with: the Inbox on screen,
// selected by its listing, was asked with STATUS at every check. Without a
// background connection the check runs on the connection the listing used.
func TestHTTP_AnUnchangedSelectedFolderIsCheckedWithoutStatus(t *testing.T) {
	s, wire, elsewhere := newIMAPAccountServerWith(t, condStoreServer, func(o *alps.Options) {
		o.CondStore = true
		o.DisableBackgroundConnection = true
	}, letter("Engines"))
	s.login()
	s.checkForNewMail("INBOX")
	if err := elsewhere().Create("Work", nil).Wait(); err != nil {
		t.Fatal(err)
	}

	for _, path := range []string{"/mailboxes/INBOX/status", "/mailboxes/INBOX/status?with=Work"} {
		s.expect(s.do("GET", path, nil), http.StatusOK)
		before := len(wire.String())
		s.expect(s.do("GET", path, nil), http.StatusOK)
		sent := wire.String()[before:]
		if inboxStatusCommands.MatchString(sent) {
			t.Errorf("GET %s asked the Inbox, selected and unchanged, with STATUS:\n%s", path, sent)
		}
		if !changedFlagFetches.MatchString(sent) {
			t.Errorf("GET %s did not ask what changed in the Inbox since its status was read:\n%s", path, sent)
		}
	}
}
