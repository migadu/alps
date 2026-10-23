// Deleting removes the messages it was asked to delete, and no others.
//
// A plain EXPUNGE removes every message in the folder that carries \Deleted.
// A client in a "mark as deleted" mode leaves messages flagged that way until
// the user expunges, and can still undelete them until then; an unrelated
// delete in alps must not make that decision for them.
package imap

import (
	"regexp"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// noopCommands matches a NOOP the client sent.
var noopCommands = regexp.MustCompile(`(?m)^\S+ NOOP\r?$`)

// flagDeletedElsewhere marks uid \Deleted and leaves it there, as another
// client in a mark-as-deleted mode does.
func flagDeletedElsewhere(t *testing.T, p *IMAPProvider, uid imap.UID) {
	t.Helper()
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Fatal(err)
	}
	if err := p.client.Store(imap.UIDSetNum(uid), &imap.StoreFlags{
		Op:     imap.StoreFlagsAdd,
		Silent: true,
		Flags:  []imap.Flag{imap.FlagDeleted},
	}, nil).Close(); err != nil {
		t.Fatal(err)
	}
}

func inboxUIDs(t *testing.T, p *IMAPProvider) string {
	t.Helper()
	data, err := p.client.UIDSearch(&imap.SearchCriteria{}, nil).Wait()
	if err != nil {
		t.Fatal(err)
	}
	var out []string
	for _, uid := range data.AllUIDs() {
		out = append(out, IMAPUID(uid).String())
	}
	return strings.Join(out, ",")
}

func TestDeletingLeavesMessagesAnotherClientMarkedDeleted(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}}}
	p := memIMAP(t, s,
		conversation("Delete me", "one@remote.test", ""),
		conversation("Marked elsewhere", "two@remote.test", ""),
		conversation("Kept", "three@remote.test", ""),
	)
	flagDeletedElsewhere(t, p, 2)

	before := len(s.traffic.String())
	if err := p.DeleteMessages("INBOX", []provider.MessageID{IMAPUID(1)}); err != nil {
		t.Fatal(err)
	}
	sent := s.traffic.String()[before:]

	if got := inboxUIDs(t, p); got != "2,3" {
		t.Errorf("INBOX holds %q after deleting UID 1, want 2,3: the message another client marked deleted was expunged too", got)
	}
	// The server's EXPUNGE responses already bring the client's view of the
	// folder up to date, so nothing has to ask again.
	if n := len(noopCommands.FindAllString(sent, -1)); n != 0 {
		t.Errorf("deleting sent %d NOOP, want none:\n%s", n, sent)
	}
}

// A server without UIDPLUS has only the plain EXPUNGE, and the delete still
// has to happen.
func TestDeletingWithoutUIDPlusStillDeletes(t *testing.T) {
	s := &memServer{}
	p := memIMAP(t, s,
		conversation("Delete me", "one@remote.test", ""),
		conversation("Kept", "two@remote.test", ""),
	)

	if err := p.DeleteMessages("INBOX", []provider.MessageID{IMAPUID(1)}); err != nil {
		t.Fatal(err)
	}
	if got := inboxUIDs(t, p); got != "2" {
		t.Errorf("INBOX holds %q after deleting UID 1, want 2", got)
	}
	if strings.Contains(s.traffic.String(), "UID EXPUNGE") {
		t.Error("UID EXPUNGE was sent to a server that does not advertise UIDPLUS")
	}
}
