package imap

import (
	"regexp"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

// enablesSent matches an ENABLE the provider sends.
var enablesSent = regexp.MustCompile(`(?m)^[^*\s]\S* ENABLE [^\r\n]*`)

func condStoreCaps(more ...imap.Cap) imap.CapSet {
	caps := imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapEnable: {}, imap.CapCondStore: {}, imap.CapUIDPlus: {}}
	for _, c := range more {
		caps[c] = struct{}{}
	}
	return caps
}

// A server that lists CONDSTORE has it turned on, and the status of a mailbox
// then carries the number of its latest change.
func TestChangesAreTrackedWhereTheServerListsCondStore(t *testing.T) {
	s := &memServer{caps: condStoreCaps()}
	p := memIMAP(t, s, brandMessage("launch", ""))
	tracked, err := p.TrackChanges()
	if err != nil || !tracked {
		t.Fatalf("TrackChanges: %v, %v; want true", tracked, err)
	}
	if got := enablesSent.FindAllString(s.traffic.String(), -1); len(got) != 1 || !strings.HasSuffix(got[0], " ENABLE CONDSTORE") {
		t.Errorf("sent %q, want one ENABLE CONDSTORE", got)
	}
	status, err := p.GetMailboxStatus("INBOX")
	if err != nil {
		t.Fatal(err)
	}
	if status.HighestModSeq == 0 {
		t.Error("the status of INBOX carries no HIGHESTMODSEQ")
	}
}

// Only CONDSTORE is turned on where the server lists QRESYNC too: under
// QRESYNC the server tells of expunged messages with VANISHED, which the
// client does not count down the selected mailbox's messages for.
func TestQResyncIsNotEnabled(t *testing.T) {
	s := &memServer{caps: condStoreCaps(imap.CapQResync)}
	p := memIMAP(t, s)
	if tracked, err := p.TrackChanges(); err != nil || !tracked {
		t.Fatalf("TrackChanges: %v, %v; want true", tracked, err)
	}
	for _, sent := range enablesSent.FindAllString(s.traffic.String(), -1) {
		if strings.Contains(sent, "QRESYNC") {
			t.Errorf("sent %q", sent)
		}
	}
}

// A server that does not list CONDSTORE is not asked to number its changes,
// and its STATUS is not asked for HIGHESTMODSEQ, which it may refuse.
func TestChangesAreNotTrackedWhereTheServerDoesNotListCondStore(t *testing.T) {
	s := &memServer{}
	p := memIMAP(t, s)
	if tracked, err := p.TrackChanges(); err != nil || tracked {
		t.Errorf("TrackChanges: %v, %v; want false", tracked, err)
	}
	if _, err := p.GetMailboxStatus("INBOX"); err != nil {
		t.Fatal(err)
	}
	if sent := enablesSent.FindAllString(s.traffic.String(), -1); len(sent) != 0 {
		t.Errorf("sent %q", sent)
	}
	if strings.Contains(s.traffic.String(), "HIGHESTMODSEQ") {
		t.Errorf("the STATUS asked for HIGHESTMODSEQ:\n%s", s.traffic.String())
	}
}

// The server's own list is read. The go-imap client takes IMAP4rev2 to imply
// CONDSTORE, and RFC 9051 does not include it: a server that lists IMAP4rev2
// and not CONDSTORE is not sent ENABLE CONDSTORE. (The in-memory server
// lists CONDSTORE wherever it is configured with IMAP4rev2.)
func TestIMAP4rev2AloneIsNotTakenForCondStore(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev2 ENABLE IDLE"}
	p := scriptedProvider(t, srv)
	if tracked, err := p.TrackChanges(); err != nil || tracked {
		t.Errorf("TrackChanges: %v, %v; want false", tracked, err)
	}
	if srv.received("ENABLE") {
		t.Error("a server listing IMAP4rev2 and not CONDSTORE was sent ENABLE")
	}
}

// ChangedFlags answers the messages named whose flags changed since a change
// number, with their flags now, and no other.
func TestChangedFlagsAnswersTheMessagesChangedSince(t *testing.T) {
	s := &memServer{caps: condStoreCaps()}
	p := memIMAP(t, s, brandMessage("one", ""), brandMessage("two", ""), brandMessage("three", ""))
	if tracked, err := p.TrackChanges(); err != nil || !tracked {
		t.Fatalf("TrackChanges: %v, %v", tracked, err)
	}
	status, err := p.GetMailboxStatus("INBOX")
	if err != nil {
		t.Fatal(err)
	}

	other, err := imapclient.DialInsecure(s.addr, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { other.Close() })
	if err := other.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	if _, err := other.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := other.Store(imap.UIDSetNum(2), &imap.StoreFlags{Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{imap.FlagFlagged}}, nil).Close(); err != nil {
		t.Fatal(err)
	}

	changed, err := p.ChangedFlags("INBOX", []provider.MessageID{IMAPUID(1), IMAPUID(2), IMAPUID(3)}, status.HighestModSeq)
	if err != nil {
		t.Fatal(err)
	}
	if len(changed) != 1 || changed[0].ID != IMAPUID(2) || len(changed[0].Flags) != 1 || changed[0].Flags[0] != provider.Flag(imap.FlagFlagged) {
		t.Errorf("changed since %d: %+v, want UID 2 flagged", status.HighestModSeq, changed)
	}
}
