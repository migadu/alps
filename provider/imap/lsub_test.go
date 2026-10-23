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

// When the subscriptions cannot be read, every folder counts as subscribed,
// as before, and the folder list is not failed for it: LSUB refused, a server
// that never answers it, an answer that cannot be read, and a server that
// takes no second connection.
func TestListingKeepsEveryFolderSubscribedWhenLsubFails(t *testing.T) {
	for name, tc := range map[string]struct {
		srv  *scriptedIMAP
		gone bool
	}{
		"refused":    {srv: &scriptedIMAP{caps: "IMAP4rev1", refuseLsub: true}},
		"unanswered": {srv: &scriptedIMAP{caps: "IMAP4rev1", hangLsub: true}},
		"unreadable": {srv: &scriptedIMAP{caps: "IMAP4rev1", lsub: []string{`* LSUB garbage`}}},
		"gone":       {srv: &scriptedIMAP{caps: "IMAP4rev1"}, gone: true},
	} {
		t.Run(name, func(t *testing.T) {
			p, ln := scriptedProviderAt(t, tc.srv, 500*time.Millisecond)
			if tc.gone {
				ln.Close()
			}
			started := time.Now()
			got := subscriptions(t, p)
			if took := time.Since(started); took > 3*time.Second {
				t.Errorf("the folder list took %v", took)
			}
			if want := map[string]bool{"INBOX": true, "Work": true}; !reflect.DeepEqual(got, want) {
				t.Errorf("subscriptions %v, want %v", got, want)
			}
		})
	}
}

// The subscriptions are read on a connection of the session's own, and kept:
// a second listing does not sign in again.
func TestSubscriptionsAreNotReadForEveryListing(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1"}
	p := scriptedProvider(t, srv)
	subscriptions(t, p)
	subscriptions(t, p)
	// The session's connection, and one to read the subscriptions.
	if got := srv.connections(); got != 2 {
		t.Errorf("%d connections, want the session's and one for LSUB", got)
	}
	if got := srv.lsubCommands(); len(got) != 1 {
		t.Errorf("LSUB sent %d times, want once", len(got))
	}
}

// The second sign-in sends the session's password as the first did, a
// password outside ASCII included, which goes as a literal.
func TestSubscriptionsAreReadWithAPasswordOutsideASCII(t *testing.T) {
	s := &memServer{password: "pässwört \"quoted\""}
	other := memIMAP(t, s)
	if err := other.client.Create("Archive", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := other.SubscribeMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}

	got := subscriptions(t, signedInWith(t, s.addr, 5*time.Second, s.password))
	if want := map[string]bool{"INBOX": true, "Archive": false}; !reflect.DeepEqual(got, want) {
		t.Errorf("subscriptions %v, want %v", got, want)
	}
}

// What alps subscribes or unsubscribes itself shows in the next listing at
// once, without signing in again; another client's change shows once the
// subscriptions read are older than subscriptionsTTL.
func TestSubscriptionsChangedHereShowAtOnce(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1"} // LSUB names INBOX alone
	p := scriptedProvider(t, srv)
	if got := subscriptions(t, p); got["Work"] || !got["INBOX"] {
		t.Fatalf("subscriptions %v, want INBOX alone", got)
	}

	if err := p.SubscribeMailbox("Work"); err != nil {
		t.Fatal(err)
	}
	if err := p.UnsubscribeMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	if got := subscriptions(t, p); !got["Work"] || got["INBOX"] {
		t.Errorf("after subscribing Work and unsubscribing INBOX here, subscriptions %v", got)
	}
	if got := srv.connections(); got != 2 {
		t.Errorf("%d connections, want no sign-in for what alps changed itself", got)
	}

	// Read again once what was read has aged: the server's word stands.
	p.cacheLock.Lock()
	p.subscribedAt = time.Now().Add(-subscriptionsTTL)
	p.cacheLock.Unlock()
	if got := subscriptions(t, p); got["Work"] || !got["INBOX"] {
		t.Errorf("read again, subscriptions %v, want INBOX alone, as LSUB says", got)
	}
	if got := srv.connections(); got != 3 {
		t.Errorf("%d connections, want one more to read the subscriptions again", got)
	}
}

// decodeMailboxName reads a name as the client library reads LIST's, and
// refuses what it refuses.
func TestDecodeMailboxName(t *testing.T) {
	for in, want := range map[string]string{
		"inbox":              "INBOX",
		"INBOX/Sent":         "INBOX/Sent",
		"Entw&APw-rfe":       "Entwürfe",
		"A&-B":               "A&B",
		"&ZeVnLIqe-":         "日本語",
		"&2D3eAA-":           "😀",
		"Raw UTF-8 Entwürfe": "Raw UTF-8 Entwürfe",
	} {
		if got, err := decodeMailboxName(in); err != nil || got != want {
			t.Errorf("decodeMailboxName(%q) = %q, %v; want %q", in, got, err, want)
		}
	}
	for _, in := range []string{
		"&APw",       // no end to the shift
		"&APw-&APw-", // two shifts with nothing between
		"&AGE-",      // "a", which stands for itself
		"&2D0-",      // half a surrogate pair
		"tab\there",  // a control character
		"&AP=-",      // padding
		"\xff",       // not UTF-8
	} {
		if got, err := decodeMailboxName(in); err == nil {
			t.Errorf("decodeMailboxName(%q) = %q, want an error", in, got)
		}
	}
}
