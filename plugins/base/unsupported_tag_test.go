package alpsbase

import (
	"net/http"
	"testing"
)

func TestHTTP_MaildirTagRefusalIsBadRequest(t *testing.T) {
	s := newTestServer(t)
	s.login()
	uid := uidOfSubject(t, s, "Engines")
	response := s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{"uids": []string{uid}, "flags": []string{"$label1"}, "action": "add"})
	s.expect(response, http.StatusBadRequest)
}
