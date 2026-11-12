package alpsbase

import (
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
	"net/http"
	"net/url"
	"strings"
	"testing"
)

type oversizedDraftProvider struct{ provider.MailProvider }

func (p oversizedDraftProvider) AppendMessage(string, provider.OutgoingMessageWriter, provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	return nil, nil, 0, &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeTooBig, Text: "private-host refuses APPEND, limit 26214400"}
}
func TestHTTP_DraftTooBigHasStablePrivate413(t *testing.T) {
	s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider { return oversizedDraftProvider{p} })
	s.login()
	r := s.do(http.MethodPost, "/messages", url.Values{"to": {"b@example.test"}, "subject": {"large"}, "text": {"body"}, "save_as_draft": {"1"}})
	s.expect(r, http.StatusRequestEntityTooLarge)
	if !strings.Contains(string(r.body), "message_too_large") || strings.Contains(string(r.body), "private-host") {
		t.Fatalf("oversize response: %s", r.body)
	}
}
func TestHTTP_SMTPTooBigHasStable413(t *testing.T) {
	s := newTestServerWithSMTP(t, listenLimitedSubmission(t, 1024))
	s.login()
	r := s.do(http.MethodPost, "/messages", url.Values{"to": {"b@example.test"}, "subject": {"large"}, "text": {strings.Repeat("large ", 1000)}})
	s.expect(r, http.StatusRequestEntityTooLarge)
	if !strings.Contains(string(r.body), "message_too_large") {
		t.Fatalf("oversize response: %s", r.body)
	}
}
