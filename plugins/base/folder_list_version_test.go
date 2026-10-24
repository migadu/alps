package alpsbase

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"testing"
)

// Every listing carried the whole folder list, and nearly always it was the
// list the browser already held. A listing carries a version of the list now,
// and leaves the list out when the browser sends back the version it holds and
// the list is still that one.
func TestHTTP_ListingLeavesOutTheFolderListTheBrowserHolds(t *testing.T) {
	s := newTestServer(t)
	s.login()
	type answer struct {
		Mailboxes        []struct{ Mailbox string }
		MailboxesVersion string
		Messages         []json.RawMessage
	}
	get := func(path string) (answer, map[string]json.RawMessage) {
		t.Helper()
		r := s.do("GET", path, nil)
		s.expect(r, http.StatusOK)
		var a answer
		r.json(t, &a)
		var fields map[string]json.RawMessage
		r.json(t, &fields)
		return a, fields
	}

	first, _ := get("/mailboxes/INBOX?page=0")
	if first.MailboxesVersion == "" || len(first.Mailboxes) == 0 {
		t.Fatalf("the first listing carries %d folders at version %q", len(first.Mailboxes), first.MailboxesVersion)
	}
	held := "&mailboxes=" + url.QueryEscape(first.MailboxesVersion)

	again, fields := get("/mailboxes/INBOX?page=0" + held)
	if _, ok := fields["Mailboxes"]; ok {
		t.Error("a listing sent the folder list the browser holds")
	}
	if again.MailboxesVersion != first.MailboxesVersion {
		t.Errorf("the version went from %q to %q with the list unchanged", first.MailboxesVersion, again.MailboxesVersion)
	}
	if len(again.Messages) != len(first.Messages) {
		t.Errorf("%d messages, then %d", len(first.Messages), len(again.Messages))
	}

	// The folder list alone carries the same version for the same list.
	list, _ := get("/mailboxes")
	if list.MailboxesVersion != first.MailboxesVersion {
		t.Errorf("the folder list alone is at %q, the listing at %q", list.MailboxesVersion, first.MailboxesVersion)
	}

	// A list that changed since is sent, at its new version.
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Receipts"}}), http.StatusOK)
	changed, _ := get("/mailboxes/INBOX?page=0" + held)
	var names []string
	for _, m := range changed.Mailboxes {
		names = append(names, m.Mailbox)
	}
	if !contains(names, "Receipts") {
		t.Fatalf("after a new folder the listing sent the folders %v", names)
	}
	if changed.MailboxesVersion == first.MailboxesVersion || changed.MailboxesVersion == "" {
		t.Errorf("a changed list kept the version %q", changed.MailboxesVersion)
	}

	// And so is the list for a version the server never sent.
	other, _ := get("/mailboxes/INBOX?page=0&mailboxes=no-such-version")
	if len(other.Mailboxes) == 0 {
		t.Error("a listing left out the folder list for a version it does not know")
	}
}

// The active marker belongs to the request, not to the held folder data.
// Going to another folder must reuse the same unchanged folder list.
func TestHTTP_FolderListVersionIgnoresTheFolderBeingOpened(t *testing.T) {
	s := newTestServer(t)
	s.login()
	get := func(path string) map[string]json.RawMessage {
		t.Helper()
		r := s.do("GET", path, nil)
		s.expect(r, http.StatusOK)
		var fields map[string]json.RawMessage
		r.json(t, &fields)
		return fields
	}
	first := get("/mailboxes/INBOX?page=0")
	var version string
	if err := json.Unmarshal(first["MailboxesVersion"], &version); err != nil || version == "" {
		t.Fatalf("initial folder version: %q (%v)", version, err)
	}
	for _, path := range []string{"/mailboxes", "/mailboxes/Archive?page=0&mailboxes=" + url.QueryEscape(version)} {
		fields := get(path)
		var got string
		if err := json.Unmarshal(fields["MailboxesVersion"], &got); err != nil || got != version {
			t.Errorf("%s version %q (%v), want unchanged %q", path, got, err, version)
		}
		if strings.Contains(path, "Archive") {
			if _, sent := fields["Mailboxes"]; sent {
				t.Error("navigation resent an unchanged folder list")
			}
		}
	}
}
