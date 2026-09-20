package alpsbase

import (
	"net/http"
	"net/url"
	"slices"
	"testing"
)

// The folder list has a route of its own, so that the verbs which change WHICH
// folders exist can re-read it without also paging through a folder's mail.
//
// Two things have to hold for the frontend to stop re-listing messages after a
// create or a rename (see `messageSync.syncLabels`): the answer carries the
// folders and nothing else, and it is the tree as of the verb that just ran —
// the mailbox verbs drop the cached list, so a read straight after one cannot
// be served the tree from before it.
func TestHTTP_MailboxListIsServedOnItsOwn(t *testing.T) {
	s := newTestServer(t)
	s.login()

	names := func() []string {
		t.Helper()
		r := s.do("GET", "/mailboxes", nil)
		s.expect(r, http.StatusOK)
		var got mailboxPage
		r.json(t, &got)
		if len(got.Messages) != 0 {
			t.Fatalf("the folder list carried %d messages", len(got.Messages))
		}
		out := make([]string, 0, len(got.Mailboxes))
		for _, mb := range got.Mailboxes {
			out = append(out, mb.Mailbox)
		}
		slices.Sort(out)
		return out
	}

	if got := names(); !slices.Equal(got, []string{"Archive", "INBOX", "Trash"}) {
		t.Fatalf("folders %v", got)
	}

	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Work"}}), http.StatusOK)
	if got := names(); !slices.Equal(got, []string{"Archive", "INBOX", "Trash", "Work"}) {
		t.Fatalf("after a create, folders %v", got)
	}

	s.expect(s.do("PUT", "/mailboxes/Work/rename", map[string]string{"new_name": "Jobs"}), http.StatusOK)
	if got := names(); !slices.Equal(got, []string{"Archive", "INBOX", "Jobs", "Trash"}) {
		t.Fatalf("after a rename, folders %v", got)
	}

	s.expect(s.do("DELETE", "/mailboxes/Jobs", nil), http.StatusOK)
	if got := names(); !slices.Equal(got, []string{"Archive", "INBOX", "Trash"}) {
		t.Fatalf("after a delete, folders %v", got)
	}
}

// Without a session it is a mailbox read like any other, not a way to learn
// which folders an account has.
func TestHTTP_MailboxListNeedsASession(t *testing.T) {
	s := newTestServer(t)

	r := s.do("GET", "/mailboxes", nil)
	if r.status == http.StatusOK {
		t.Fatalf("the folder list was served to nobody: %s", r.body)
	}
}
