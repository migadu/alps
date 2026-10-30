package imap

import (
	"reflect"
	"testing"
	"time"
)

// subscriptions is the listing's word on each folder.
func subscriptions(t *testing.T, p *IMAPProvider) map[string]bool {
	t.Helper()
	mailboxes, err := p.ListMailboxes()
	if err != nil {
		t.Fatalf("the folder list failed: %v", err)
	}
	out := make(map[string]bool, len(mailboxes))
	for _, mb := range mailboxes {
		out[mb.Name] = mb.Subscribed
	}
	return out
}

// On an IMAP4rev1 server without LIST-EXTENDED, which is all the in-memory
// server advertises by default, the folders LSUB lists are subscribed and
// the others are not. Every folder counted as subscribed, so a folder
// unsubscribed in alps, or in another client, was listed as subscribed again:
// it never went under More, and its menu kept offering Unsubscribe.
func TestListMailboxesReadsSubscriptionsWithLsub(t *testing.T) {
	s := &memServer{}
	other := memIMAP(t, s)
	for _, name := range []string{"Work", "Archive"} {
		if err := other.client.Create(name, nil).Wait(); err != nil {
			t.Fatal(err)
		}
	}
	for _, name := range []string{"INBOX", "Work", "Archive"} {
		if err := other.SubscribeMailbox(name); err != nil {
			t.Fatal(err)
		}
	}
	if err := other.UnsubscribeMailbox("Archive"); err != nil {
		t.Fatal(err)
	}

	got := subscriptions(t, signedIn(t, s.addr, 5*time.Second))
	want := map[string]bool{"INBOX": true, "Work": true, "Archive": false}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("subscriptions %v, want %v", got, want)
	}
}

// LSUB answers in the forms LIST does: a name may be an atom, a quoted string
// with escapes or a literal, the delimiter may be NIL, a name outside ASCII
// is in modified UTF-7, and INBOX in any case is INBOX. Each is read as the
// LIST of the same folder is.
func TestLsubAnswersAreReadWhateverTheirForm(t *testing.T) {
	srv := &scriptedIMAP{
		caps: "IMAP4rev1",
		list: []string{
			`* LIST () "/" INBOX`,
			`* LIST () "/" Work`,
			`* LIST () "/" Archive`,
			`* LIST () NIL Flat`,
			`* LIST () "/" "Say \"hi\""`,
			`* LIST () "/" "Back\\slash"`,
			`* LIST () "/" Entw&APw-rfe`,
			`* LIST () "/" "Spaced name"`,
		},
		lsub: []string{
			`* LSUB () "/" inbox`,
			"* LSUB (\\HasNoChildren) \"/\" {4}\r\nWork",
			`* LSUB () NIL Flat`,
			`* LSUB () "/" "Say \"hi\""`,
			"* LSUB () \"/\" {10}\r\nBack\\slash",
			`* LSUB () "/" Entw&APw-rfe`,
			`* LSUB (\Noselect) "/" "Spaced name"`,
		},
	}
	got := subscriptions(t, scriptedProvider(t, srv))
	want := map[string]bool{
		"INBOX":       true,
		"Work":        true,
		"Archive":     false,
		"Flat":        true,
		`Say "hi"`:    true,
		`Back\slash`:  true,
		"Entwürfe":    true,
		"Spaced name": true,
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("subscriptions %v, want %v", got, want)
	}
}

// When the server refuses LSUB, every folder counts as subscribed, as before,
// and the folder list is not failed for it.
func TestListingKeepsEveryFolderSubscribedWhenLsubIsRefused(t *testing.T) {
	p := scriptedProvider(t, &scriptedIMAP{caps: "IMAP4rev1", refuseLsub: true})
	if got, want := subscriptions(t, p), map[string]bool{"INBOX": true, "Work": true}; !reflect.DeepEqual(got, want) {
		t.Errorf("subscriptions %v, want %v", got, want)
	}
}

// The subscriptions are read on the session's connection, with every
// listing: no second sign-in.
func TestSubscriptionsAreReadOnTheSessionsConnection(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1"}
	p := scriptedProvider(t, srv)
	subscriptions(t, p)
	subscriptions(t, p)
	if got := srv.connections(); got != 1 {
		t.Errorf("%d connections, want the session's alone", got)
	}
	if got := srv.lsubCommands(); len(got) != 2 {
		t.Errorf("LSUB sent %d times, want once per listing", len(got))
	}
}

// A subscription changed here or in another client shows in the next
// listing.
func TestSubscriptionsChangedAnywhereShowInTheNextListing(t *testing.T) {
	s := &memServer{}
	other := memIMAP(t, s)
	if err := other.client.Create("Work", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := other.SubscribeMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	p := signedIn(t, s.addr, 5*time.Second)
	if got := subscriptions(t, p); got["Work"] || !got["INBOX"] {
		t.Fatalf("subscriptions %v, want INBOX alone", got)
	}

	if err := p.SubscribeMailbox("Work"); err != nil {
		t.Fatal(err)
	}
	if got := subscriptions(t, p); !got["Work"] || !got["INBOX"] {
		t.Errorf("after subscribing Work here, subscriptions %v", got)
	}
	if err := other.UnsubscribeMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	if got := subscriptions(t, p); !got["Work"] || got["INBOX"] {
		t.Errorf("after another client unsubscribed INBOX, subscriptions %v", got)
	}
}
