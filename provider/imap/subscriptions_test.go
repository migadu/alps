package imap

import (
	"testing"

	"github.com/emersion/go-imap/v2"
)

// listsSubscriptions is a server whose LIST can report subscriptions: the
// RETURN (SUBSCRIBED) option is LIST-EXTENDED, and alps asks for it only where
// the server offers that.
var listsSubscriptions = imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapListExtended: {}}

// subscribedIn reports the listing's word on whether `name` is subscribed, and
// whether it lists `name` at all.
func subscribedIn(t *testing.T, p *IMAPProvider, name string) (subscribed, listed bool) {
	t.Helper()
	mailboxes, err := p.ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	for _, mb := range mailboxes {
		if mb.Name == name {
			return mb.Subscribed, true
		}
	}
	return false, false
}

// The in-memory server, like many real ones, does not subscribe a mailbox on
// CREATE. A folder made in alps was then missing from every client that shows
// subscribed folders only.
func TestCreateMailboxSubscribesToIt(t *testing.T) {
	p := memIMAP(t, &memServer{caps: listsSubscriptions})
	if err := p.CreateMailbox("Work"); err != nil {
		t.Fatal(err)
	}
	subscribed, listed := subscribedIn(t, p, "Work")
	if !listed || !subscribed {
		t.Fatalf("Work listed %v, subscribed %v; want a subscribed folder", listed, subscribed)
	}
}

// The folder exists whatever SUBSCRIBE answers, so a refusal must not be
// reported as a create that failed.
func TestCreateMailboxSurvivesARefusedSubscribe(t *testing.T) {
	p := memIMAP(t, &memServer{refuseSubscribe: true})
	if err := p.CreateMailbox("Work"); err != nil {
		t.Fatalf("the create was reported as failed: %v", err)
	}
	if _, listed := subscribedIn(t, p, "Work"); !listed {
		t.Fatal("Work was not created")
	}
}

// A create the server refuses is still an error, and nothing is subscribed.
func TestCreateMailboxReportsARefusedCreate(t *testing.T) {
	p := memIMAP(t, &memServer{})
	if err := p.CreateMailbox("Work"); err != nil {
		t.Fatal(err)
	}
	if err := p.CreateMailbox("Work"); err == nil {
		t.Fatal("creating Work twice was reported as done")
	}
}

// What the sidebar groups by: the listing says which folders are subscribed.
func TestListMailboxesReportsSubscriptions(t *testing.T) {
	p := memIMAP(t, &memServer{caps: listsSubscriptions})
	if err := p.CreateMailbox("Old"); err != nil {
		t.Fatal(err)
	}
	if err := p.UnsubscribeMailbox("Old"); err != nil {
		t.Fatal(err)
	}
	if subscribed, _ := subscribedIn(t, p, "Old"); subscribed {
		t.Fatal("Old is listed as subscribed after UNSUBSCRIBE")
	}
}
