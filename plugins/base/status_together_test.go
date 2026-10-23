package alpsbase

import (
	"net/http"
	"path/filepath"
	"testing"
)

// The poll asked for the Inbox's counts and then for the folder on screen's,
// a request each, and a tab that polls for others asked for each folder they
// show in turn. One request now asks for them all: the folder the path names,
// and every folder `with` names, each read and judged as its own request would.
func TestHTTP_OneStatusRequestReadsSeveralFolders(t *testing.T) {
	s := newTestServer(t)
	s.deliver("Archive", "Filed")
	s.login()
	before := s.statusPage("/mailboxes/Archive?page=0")
	if len(before.Messages) != 1 {
		t.Fatalf("Archive lists %+v", before.Messages)
	}

	s.rewriteSubject(filepath.Join(s.dir, ".Archive"), "Filed", "Rewritten")
	s.deliver("INBOX", "Arrival")
	s.deliver("Trash", "Elsewhere")

	r := s.do("GET", "/mailboxes/Archive/status?with=INBOX&with=Trash", nil)
	s.expect(r, http.StatusOK)
	var status struct {
		MailboxStatusResponse
		With map[string]MailboxStatusResponse `json:"with"`
	}
	r.json(t, &status)
	if status.Total != 1 || status.Unseen != 1 {
		t.Errorf("Archive is answered at %d messages, %d unseen; want 1 and 1", status.Total, status.Unseen)
	}
	inbox, ok := status.With["INBOX"]
	if !ok || inbox.Total != 3 || inbox.Unseen != 3 {
		t.Errorf("the INBOX is answered at %+v (%v); want 3 messages, 3 unseen", inbox, ok)
	}

	// As the two requests did: the INBOX's change is seen, and Archive, which
	// did not change, keeps its page.
	after := s.statusPage("/mailboxes/Archive?page=0")
	if len(after.Messages) != 1 || after.Messages[0].Envelope.Subject != "Filed" {
		t.Errorf("Archive was read again although nothing in it changed: %+v", after.Messages)
	}
	if after.Inbox.NumMessages != 3 || after.Inbox.NumUnseen != 3 {
		t.Errorf("the INBOX is answered at %d messages, %d unseen; want the 3 and 3 the check read", after.Inbox.NumMessages, after.Inbox.NumUnseen)
	}
	if total, unseen := after.counts("Trash"); total != 1 || unseen != 1 {
		t.Errorf("the sidebar counts Trash at %d, %d unseen, after new mail; want the 1 and 1 it holds", total, unseen)
	}
}
