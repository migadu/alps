package alpsbase

import (
	"net/http"
	"testing"
)

// A move or a copy of a message that is gone answers 404, as a read of it
// does. The routes wrapped the provider's failure in a way that dropped its
// kind, so the not-found the provider gave was answered as a server failure,
// 500.
func TestHTTP_MovingOrCopyingAMessageThatIsGoneIsNotFound(t *testing.T) {
	for _, verb := range []string{"move", "copy"} {
		t.Run(verb, func(t *testing.T) {
			s := newTestServer(t)
			s.login()
			r := s.do("PUT", "/mailboxes/INBOX/messages/"+verb, map[string]any{"uids": []string{"1700000000.never-delivered"}, "to": "Archive"})
			if r.status != http.StatusNotFound {
				t.Errorf("the %s answered %d: %s", verb, r.status, r.body)
			}
		})
	}
}
