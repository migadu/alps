// Commands whose answer alps already has.
//
// A session has one IMAP connection, and every request waits its turn on it,
// so a command sent only to learn what an earlier answer said holds up
// whatever comes next.
package imap

import (
	"io"
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

// rawMessage is an outgoing message as AppendMessage takes one.
type rawMessage string

func (m rawMessage) WriteTo(w io.Writer) (int64, error) {
	n, err := io.WriteString(w, string(m))
	return int64(n), err
}

// The server's APPENDUID names the message an append stored, and an append
// to the selected folder is announced with EXISTS; nothing needs asking after.
func TestAnAppendToTheSelectedFolderSendsNoNOOP(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}}}
	p := memIMAP(t, s)
	if err := p.CreateMailbox("Drafts"); err != nil {
		t.Fatal(err)
	}
	if err := p.ensureMailboxSelected("Drafts"); err != nil {
		t.Fatal(err)
	}

	before := len(s.traffic.String())
	_, uid, _, err := p.AppendMessage("", rawMessage(conversation("Draft", "draft@example.test", "")), provider.MailboxTypeDrafts)
	if err != nil {
		t.Fatal(err)
	}
	sent := s.traffic.String()[before:]

	if uid != IMAPUID(1) {
		t.Errorf("the append answered UID %v, want 1", uid)
	}
	if n := len(noopCommands.FindAllString(sent, -1)); n != 0 {
		t.Errorf("the append sent %d NOOP, want none:\n%s", n, sent)
	}
}

// listCommands matches a LIST the client sent, not the server's answers.
var listCommands = regexp.MustCompile(`(?m)^[^*\s]\S* LIST `)

func appendDraft(t *testing.T, p *IMAPProvider, subject string) string {
	t.Helper()
	mbox, _, _, err := p.AppendMessage("", rawMessage(conversation(subject, subject+"@example.test", "")), provider.MailboxTypeDrafts)
	if err != nil {
		t.Fatal(err)
	}
	return mbox.Name
}

// Which folder is Drafts does not change from one save to the next, and an
// autosave runs seconds after typing stops, so the folder is looked up once.
func TestDraftSavesLookUpDraftsOnce(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}}}
	p := memIMAP(t, s)
	if err := p.CreateMailbox("Drafts"); err != nil {
		t.Fatal(err)
	}

	before := len(s.traffic.String())
	for _, subject := range []string{"first", "second", "third"} {
		if got := appendDraft(t, p, subject); got != "Drafts" {
			t.Fatalf("saved %s to %q, want Drafts", subject, got)
		}
	}
	if n := len(listCommands.FindAllString(s.traffic.String()[before:], -1)); n != 1 {
		t.Errorf("three draft saves sent %d LIST, want 1", n)
	}

	// A folder created, renamed or deleted here may be the one remembered.
	if err := p.RenameMailbox("Drafts", "Draft"); err != nil {
		t.Fatal(err)
	}
	if got := appendDraft(t, p, "fourth"); got != "Draft" {
		t.Errorf("after the rename, saved to %q, want Draft", got)
	}
}

// Another client may rename the folder too. The append that finds it gone
// looks the folder up again rather than failing the save.
func TestADraftsFolderRenamedElsewhereIsLookedUpAgain(t *testing.T) {
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}}}
	p := memIMAP(t, s)
	if err := p.CreateMailbox("Drafts"); err != nil {
		t.Fatal(err)
	}
	appendDraft(t, p, "first")

	if err := p.client.Rename("Drafts", "Draft", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if got := appendDraft(t, p, "second"); got != "Draft" {
		t.Errorf("saved to %q, want the folder under its new name", got)
	}
}
