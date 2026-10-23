package alpsbase

import (
	"net/http"
	"regexp"
	"testing"
)

// A conversation the session holds is kept under its folder's name and its
// messages' UIDs, and those UIDs name other messages once the folder has been
// deleted and made again elsewhere: UIDVALIDITY moves. The session can learn
// the new UIDVALIDITY with the folder list, which reads every folder's counts
// again without looking at what it holds of each. The conversation was then
// still served as it was read, and the reader showed the old folder's message
// beside the new one's body.
func TestHTTP_AConversationOfAFolderMadeAgainIsReadAfresh(t *testing.T) {
	for _, server := range countingServers {
		t.Run(server.name, func(t *testing.T) {
			s, _, elsewhere := newIMAPAccountServer(t, server.caps)
			c := elsewhere()
			if err := c.Create("Work", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			deliverElsewhere(t, c, "Work", letter("Old plans"))
			s.login()
			page := s.checkForNewMail("Work")
			if got := subjectsOf(page); got != "Old plans" {
				t.Fatalf("Work shows %q", got)
			}
			old := page.Messages[0].UID
			if got := threadOf(t, s, "Work", old).Messages; len(got) != 1 || got[0].Envelope.Subject != "Old plans" {
				t.Fatalf("the conversation of Old plans is %+v", got)
			}
			// Away from Work, as the user is while another client replaces it.
			s.checkForNewMail("INBOX")

			remakeElsewhere(t, c, "Work", letter("New plans"))
			// The Inbox opened with a refresh, as the mail page does when it
			// is shown again, reads the folder list and every folder's counts.
			s.expect(s.do("GET", "/mailboxes/INBOX?page=0&refresh=1", nil), http.StatusOK)

			got := threadOf(t, s, "Work", old).Messages
			if len(got) != 1 || got[0].Envelope.Subject != "New plans" {
				t.Errorf("after Work was made again elsewhere, the conversation of UID %s is %+v, want New plans", old, got)
			}
		})
	}
}

// fetchesSent matches a FETCH alps sends.
var fetchesSent = regexp.MustCompile(`(?m)^[^*\s]\S* (UID )?FETCH `)

// Under the UIDVALIDITY it was read at, the conversation is served from the
// session, beside the status and the page held of its folder.
func TestHTTP_AConversationOfAnUnchangedFolderIsServedFromTheSession(t *testing.T) {
	for _, server := range countingServers {
		t.Run(server.name, func(t *testing.T) {
			s, wire, elsewhere := newIMAPAccountServer(t, server.caps)
			c := elsewhere()
			if err := c.Create("Work", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			deliverElsewhere(t, c, "Work", letter("Plans"))
			s.login()
			uid := s.checkForNewMail("Work").Messages[0].UID
			threadOf(t, s, "Work", uid)
			s.checkForNewMail("Work")

			before := len(wire.String())
			if got := threadOf(t, s, "Work", uid).Messages; len(got) != 1 || got[0].Envelope.Subject != "Plans" {
				t.Fatalf("the conversation is %+v", got)
			}
			if fetchesSent.MatchString(wire.String()[before:]) {
				t.Errorf("the conversation of a folder that did not change was read again:\n%s", wire.String()[before:])
			}
		})
	}
}
