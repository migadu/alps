package alpsbase

import (
	"net/http"
	"net/url"
	"testing"
)

// A draft saved again replaces the one saved before, by the UID the first
// save answered, as the composer sends it back. Over maildir the save answered
// no UID: the composer had nothing to name the draft by, and every save left
// one more copy of it in Drafts.
func TestHTTP_ADraftSavedAgainReplacesTheLastSave(t *testing.T) {
	s := newTestServer(t)
	s.login()

	type saved struct {
		UID     string `json:"draft_uid"`
		Mailbox string `json:"draft_mailbox"`
	}
	form := url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"first"}, "save_as_draft": {"1"}}
	r := s.do("POST", "/messages", form)
	s.expect(r, http.StatusOK)
	var first saved
	r.json(t, &first)
	if first.UID == "" {
		t.Error("the save named no draft")
	}

	form.Set("text", "second")
	form.Set("draft_uid", first.UID)
	form.Set("draft_mailbox", first.Mailbox)
	r = s.do("POST", "/messages", form)
	s.expect(r, http.StatusOK)
	var second saved
	r.json(t, &second)

	drafts := s.mailbox(first.Mailbox).Messages
	if len(drafts) != 1 || drafts[0].UID != second.UID {
		t.Errorf("%s holds %d drafts, want the second save, %q, alone", first.Mailbox, len(drafts), second.UID)
	}
}
