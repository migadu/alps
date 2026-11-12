package alpsbase

import (
	"net/http"
	"testing"
)

func TestHTTP_MaildirInboxMutationsAreClientRefusals(t *testing.T) {
	for _, op := range []struct {
		method, path string
		body         any
	}{{"DELETE", "/mailboxes/INBOX", nil}, {"PUT", "/mailboxes/INBOX/rename", map[string]string{"new_name": "Other"}}} {
		s := newTestServer(t)
		s.login()
		response := s.do(op.method, op.path, op.body)
		s.expect(response, http.StatusBadRequest)
		var answer struct {
			Error string `json:"error"`
		}
		response.json(t, &answer)
		if answer.Error != "cannot" {
			t.Errorf("unexpected refusal: %s", response.body)
		}
		if len(s.mailbox("INBOX").Messages) != 2 {
			t.Error("INBOX contents changed")
		}
	}
}
