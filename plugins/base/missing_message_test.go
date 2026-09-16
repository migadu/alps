package alpsbase

import (
	"encoding/json"
	"net/http"
	"testing"
)

// A message can go between the listing and the click: another client deletes
// it, or sending a draft removes the draft the reader still has open. Asking
// for it then is not a server fault. The answer is a 404 that says so, and it
// describes nothing of the backend.
func TestHTTP_AMessageThatIsGoneIsNotFound(t *testing.T) {
	s := newTestServer(t)
	s.login()
	gone := s.mailbox("INBOX").Messages[0].UID
	s.expect(s.do("DELETE", "/mailboxes/INBOX/messages", map[string]any{"uids": []string{gone}}), http.StatusOK)

	for _, path := range []string{
		"/mailboxes/INBOX/messages/" + gone,
		"/mailboxes/INBOX/messages/" + gone + "/raw?part=1",
		"/mailboxes/INBOX/messages/" + gone + "/thread",
		"/mailboxes/INBOX/messages/1700000000.never-delivered",
	} {
		r := s.do("GET", path, nil)
		if r.status != http.StatusNotFound {
			t.Errorf("GET %s: status %d, want 404: %s", path, r.status, r.body)
			continue
		}
		var body struct{ Error string }
		if err := json.Unmarshal(r.body, &body); err != nil || body.Error != "Message not found" {
			t.Errorf("GET %s: body %s, want the error %q", path, r.body, "Message not found")
		}
	}
}
