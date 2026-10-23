package alpsbase

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
)

// A folder list can forget an unsubscribed folder's status and validator.
// Conversations, which carry no validity of their own, must go with them:
// otherwise a later normal open can show the old folder's reused UID. An
// explicit refresh already drops the conversation and remains a control.
func TestHTTP_AConversationWithoutAValidityCheckIsReadAgain(t *testing.T) {
	for _, rawPart := range []bool{false, true} {
		for _, refresh := range []bool{false, true} {
			name := "conversation only"
			if rawPart {
				name = "conversation and part"
			}
			if refresh {
				name += "; explicit refresh"
			} else {
				name += "; normal open"
			}
			t.Run(name, func(t *testing.T) {
				ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapListExtended: {}}, testUser)
				if err := ps.users[testUser].Create(context.Background(), "Work", nil); err != nil {
					t.Fatal(err)
				}
				ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
				ps.deliver(testUser, "Work", strings.Replace(withPhoto("iVBORw0KGgpvbGQ="), "Subject: Photo", "Subject: Old photo", 1))
				ps.login()
				if rawPart {
					ps.expect(ps.do("GET", "/mailboxes/Work/messages/1/raw?part=2", nil), http.StatusOK)
				}
				if got := threadOf(t, ps.testServer, "Work", "1").Messages; len(got) != 1 || got[0].Envelope.Subject != "Old photo" {
					t.Fatalf("seed conversation=%+v", got)
				}
				ps.expect(ps.do("GET", "/mailboxes/INBOX?page=0&refresh=true", nil), http.StatusOK)
				ps.remakeWork("New message.")
				path := "/mailboxes/Work?page=0"
				if refresh {
					path += "&refresh=true"
				}
				ps.expect(ps.do("GET", path, nil), http.StatusOK)
				if got := threadOf(t, ps.testServer, "Work", "1").Messages; len(got) != 1 || got[0].Envelope.Subject != "Photo" {
					t.Fatalf("after Work open conversation=%+v; want recreated folder's Photo", got)
				}
			})
		}
	}
}
