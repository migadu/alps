package alpsbase

import (
	"github.com/migadu/go-imap"
	"net/http"
	"net/url"
	"testing"
)

func TestHTTP_EmptySearchValuesCannotExpandBulkActions(t *testing.T) {
	for _, op := range []struct {
		name, method, path string
		extra              map[string]any
	}{
		{"listing", "GET", "/mailboxes/INBOX?query=" + url.QueryEscape(`subject:""`), nil},
		{"move", "PUT", "/mailboxes/INBOX/messages/move", map[string]any{"to": "Archive"}},
		{"copy", "PUT", "/mailboxes/INBOX/messages/copy", map[string]any{"to": "Archive"}},
		{"delete", "DELETE", "/mailboxes/INBOX/messages", nil},
		{"flags", "PUT", "/mailboxes/INBOX/messages/flag", map[string]any{"flags": []string{`\Flagged`}, "action": "add"}},
	} {
		t.Run(op.name, func(t *testing.T) {
			s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}}, nil, "From: alice@example.com\r\nSubject: invoice\r\n\r\nbody\r\n")
			s.login()
			s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Archive"}}), http.StatusOK)
			var body any
			if op.method != "GET" {
				data := map[string]any{"all": true, "query": `from:""`}
				for k, v := range op.extra {
					data[k] = v
				}
				body = data
			}
			response := s.do(op.method, op.path, body)
			s.expect(response, http.StatusBadRequest)
			var answer struct {
				Error string `json:"error"`
			}
			response.json(t, &answer)
			if answer.Error != "Search terms require a value." {
				t.Errorf("unclear refusal: %s", response.body)
			}
			if got := len(s.mailbox("INBOX").Messages); got != 1 {
				t.Errorf("invalid query changed the mailbox: %d messages", got)
			}
			for _, message := range s.mailbox("INBOX").Messages {
				if contains(message.Flags, `\Flagged`) {
					t.Error("invalid query changed message flags")
				}
			}
			if got := len(s.mailbox("Archive").Messages); got != 0 {
				t.Errorf("invalid query filed %d messages", got)
			}
		})
	}
}
