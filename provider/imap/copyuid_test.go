package imap

import (
	"testing"

	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
)

// COPYUID pairs the messages in copying order, which need not be ascending:
// "COPYUID 7 4,1:3 101:102,110:111" files 4 as 101 and 1 as 102.
func TestCopiedUIDsKeepCopyingOrder(t *testing.T) {
	var m imap.UIDMapping
	m.Add(4, 101)
	m.Add(1, 102)
	m.Add(2, 110)
	m.Add(3, 111)

	got := copiedUIDs(m, 4)
	want := map[provider.MessageID]provider.MessageID{
		IMAPUID(4): IMAPUID(101),
		IMAPUID(1): IMAPUID(102),
		IMAPUID(2): IMAPUID(110),
		IMAPUID(3): IMAPUID(111),
	}
	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	for src, dst := range want {
		if got[src] != dst {
			t.Errorf("%v filed as %v, want %v", src, got[src], dst)
		}
	}
}

// A mapping that pairs more messages than were asked for names none of them.
func TestCopiedUIDsLongerThanAsked(t *testing.T) {
	m := imap.UIDMapping{{
		Source: imap.UIDRange{Start: 1, Stop: ^imap.UID(0)},
		Dest:   imap.UIDRange{Start: 1, Stop: ^imap.UID(0)},
	}}
	if got := copiedUIDs(m, 2); len(got) != 0 {
		t.Fatalf("got %d pairs, want none", len(got))
	}
}
