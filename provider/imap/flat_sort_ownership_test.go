package imap

import (
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
)

// A count alone cannot identify a folder's messages. Another client can flag
// the old last message, expunge an earlier one and append its replacement;
// the new last message then occupies that same sequence number.
func TestFlatDateOrderAfterSameCountReplacementElsewhere(t *testing.T) {
	s, p := flatInbox(t)
	other := elsewhere(t, s)
	firstSubjects(t, p, 0)
	flagUID(t, other, 4, imap.FlagFlagged)
	deleteUID(t, other, 2)
	appendTo(t, other, "INBOX", datedMessage("Chairs", "Fri, 05 Sep 2026 08:00:00 +0000"))

	before := len(s.traffic.String())
	if got := firstSubjects(t, p, 0, 1); got != "Chairs, Tables" {
		t.Fatalf("same-count replacement listed %q, want Chairs, Tables", got)
	}
	if n := len(sortsSent.FindAllString(s.traffic.String()[before:], -1)); n != 1 {
		t.Errorf("%d SORTs after replacing one message, want 1", n)
	}
}

// Mailbox names are exact, including colons, and a recreated folder can reuse
// every UID while holding different dates. Its UIDVALIDITY owns the order.
func TestFlatDateOrderBelongsToExactFolderAndUIDValidity(t *testing.T) {
	s, p := flatInbox(t)
	other := elsewhere(t, s)
	for _, name := range []string{"Work", "Work:7"} {
		if err := other.Create(name, nil).Wait(); err != nil {
			t.Fatal(err)
		}
	}
	fill := func(name string, dates []string) {
		t.Helper()
		for _, date := range dates {
			appendTo(t, other, name, datedMessage(name+date, date))
		}
	}
	oldest := "Mon, 01 Sep 2026 08:00:00 +0000"
	middle := "Wed, 03 Sep 2026 08:00:00 +0000"
	newest := "Fri, 05 Sep 2026 08:00:00 +0000"
	fill("Work", []string{oldest, newest, middle})
	fill("Work:7", []string{newest, middle, oldest})
	list := func(name string) string {
		t.Helper()
		rows, _, err := p.SearchMessages(name, "", "desc", 0, 50)
		if err != nil {
			t.Fatal(err)
		}
		var ids []string
		for _, row := range rows {
			if row.Mailbox != name {
				t.Fatalf("%s row belongs to %s", name, row.Mailbox)
			}
			ids = append(ids, row.ID.String())
		}
		return strings.Join(ids, ",")
	}
	if got := list("Work"); got != "2,3,1" {
		t.Fatalf("Work order %q, want 2,3,1", got)
	}
	if got := list("Work:7"); got != "1,2,3" {
		t.Fatalf("Work:7 order %q, want 1,2,3", got)
	}
	if err := other.Delete("Work").Wait(); err != nil {
		t.Fatal(err)
	}
	if err := other.Create("Work", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	fill("Work", []string{middle, oldest, newest})
	if got := list("Work"); got != "3,1,2" {
		t.Fatalf("recreated Work order %q, want 3,1,2", got)
	}
	if got := list("Work:7"); got != "1,2,3" {
		t.Fatalf("unchanged sibling order %q, want 1,2,3", got)
	}
}

func TestRefusedFlatSearchUsesTheInitialNewsCheck(t *testing.T) {
	s := &memServer{searchErr: &imap.Error{Type: imap.StatusResponseTypeNo, Code: "LIMIT", Text: "slow down"}}
	p := memIMAP(t, s, datedMessage("Engines", "Mon, 01 Sep 2026 08:00:00 +0000"))
	before := len(s.traffic.String())
	rows, info, err := p.SearchMessages("INBOX", "", "desc", 0, 1)
	if err != nil || len(rows) != 1 || info.Total != 1 {
		t.Fatalf("refused search: %d rows, %+v, %v", len(rows), info, err)
	}
	if n := len(noopCommands.FindAllString(s.traffic.String()[before:], -1)); n != 1 {
		t.Errorf("%d NOOPs for a refused SEARCH page, want 1", n)
	}
}
