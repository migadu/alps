package imap

import (
	"regexp"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// sortsSent matches a SORT the client sent, by message number or by UID.
var sortsSent = regexp.MustCompile(`(?m)^\S+ (UID )?SORT \(`)

// flatInbox is a folder listed without threading, as on a server that cannot
// thread, in date order.
func flatInbox(t *testing.T) (*memServer, *IMAPProvider) {
	t.Helper()
	s := &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}, imap.CapSort: {}}}
	p := memIMAP(t, s,
		datedMessage("Engines", "Mon, 01 Sep 2026 08:00:00 +0000"),
		datedMessage("Re: Engines", "Tue, 02 Sep 2026 08:00:00 +0000"),
		datedMessage("Looms", "Wed, 03 Sep 2026 08:00:00 +0000"),
		datedMessage("Tables", "Thu, 04 Sep 2026 08:00:00 +0000"),
	)
	return s, p
}

func firstSubjects(t *testing.T, p *IMAPProvider, pages ...int) string {
	t.Helper()
	var subjects []string
	for _, page := range pages {
		rows, info, err := p.SearchMessages("INBOX", "", "desc", page, 1)
		if err != nil {
			t.Fatal(err)
		}
		if info.Threaded || len(rows) != 1 {
			t.Fatalf("page %d: %d rows, threaded %v", page, len(rows), info.Threaded)
		}
		subjects = append(subjects, rows[0].Envelope.Subject)
	}
	return strings.Join(subjects, ", ")
}

// A folder listed flat in date order is sorted once for as long as it holds
// the same messages. SORT is answered over the whole folder, so its cost is
// the folder's size and not the page's, and it was sent again for every page
// and every listing after a cached page was dropped.
func TestAFlatDateListingSortsTheFolderOnce(t *testing.T) {
	s, p := flatInbox(t)

	before := len(s.traffic.String())
	if got := firstSubjects(t, p, 0, 1, 2, 0); got != "Tables, Looms, Re: Engines, Tables" {
		t.Errorf("pages read %q, want newest first", got)
	}
	if n := len(sortsSent.FindAllString(s.traffic.String()[before:], -1)); n != 1 {
		t.Errorf("%d SORT commands for four pages of a folder that did not change, want 1", n)
	}
}

// A message that arrives is sorted in with the others; a flag change sorts
// nothing again.
func TestAFlatDateListingSortsAgainOnlyForOtherMessages(t *testing.T) {
	s, p := flatInbox(t)
	other := elsewhere(t, s)
	firstSubjects(t, p, 0)

	before := len(s.traffic.String())
	if err := p.SetMessagesFlags("INBOX", []provider.MessageID{IMAPUID(4)}, provider.FlagOperation{
		Op: provider.FlagOpAdd, Flags: []provider.Flag{provider.Flag(imap.FlagFlagged)},
	}); err != nil {
		t.Fatal(err)
	}
	firstSubjects(t, p, 0)
	if n := len(sortsSent.FindAllString(s.traffic.String()[before:], -1)); n != 0 {
		t.Errorf("%d SORT commands after a flag change, want none", n)
	}

	appendTo(t, other, "INBOX", datedMessage("Chairs", "Fri, 05 Sep 2026 08:00:00 +0000"))
	before = len(s.traffic.String())
	if got := firstSubjects(t, p, 0, 1); got != "Chairs, Tables" {
		t.Errorf("after new mail the first pages read %q, want Chairs, Tables", got)
	}
	if n := len(sortsSent.FindAllString(s.traffic.String()[before:], -1)); n != 1 {
		t.Errorf("%d SORT commands after new mail, want 1", n)
	}
}

// A folder whose SORT is refused is listed by number, asking for news once.
func TestARefusedFlatSortListsByNumberAskingForNewsOnce(t *testing.T) {
	s := &memServer{
		caps:    imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapSort: {}},
		sortErr: &imap.Error{Type: imap.StatusResponseTypeNo, Code: "LIMIT", Text: "slow down"},
	}
	p := memIMAP(t, s, datedMessage("Engines", "Mon, 01 Sep 2026 08:00:00 +0000"))
	if _, _, err := p.SearchMessages("INBOX", "", "desc", 0, 1); err != nil {
		t.Fatal(err)
	}
	before := len(s.traffic.String())
	rows, _, err := p.SearchMessages("INBOX", "", "desc", 0, 1)
	if err != nil || len(rows) != 1 {
		t.Fatalf("%d rows, %v", len(rows), err)
	}
	if n := len(noopCommands.FindAllString(s.traffic.String()[before:], -1)); n != 1 {
		t.Errorf("%d NOOPs for one page, want 1", n)
	}
}
