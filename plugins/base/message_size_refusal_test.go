package alpsbase

import (
	"context"
	"github.com/emersion/go-smtp"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
	"io"
	"net"
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

type refusesSMTPData struct{}

func (refusesSMTPData) NewSession(*smtp.Conn) (smtp.Session, error) {
	return &sizeRefusalSMTPSession{smtpSession{b: &smtpRecorder{}}}, nil
}

type sizeRefusalSMTPSession struct{ smtpSession }

func (*sizeRefusalSMTPSession) Data(context.Context, io.Reader) error {
	return &smtp.SMTPError{Code: 552, EnhancedCode: smtp.EnhancedCode{5, 3, 4}, Message: "private-host message file too big"}
}

func TestHTTP_SMTP552RefusalHasStablePrivate413(t *testing.T) {
	smtpServer := smtp.NewServer(refusesSMTPData{})
	smtpServer.Domain = "localhost"
	smtpServer.AllowInsecureAuth = true
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go smtpServer.Serve(listener)
	t.Cleanup(func() { smtpServer.Close() })
	server := newTestServerWithSMTP(t, "smtp+insecure://"+listener.Addr().String())
	server.login()
	response := server.do(http.MethodPost, "/messages", url.Values{"to": {"b@example.test"}, "text": {"small message refused by policy"}})
	server.expect(response, http.StatusRequestEntityTooLarge)
	if !strings.Contains(string(response.body), "message_too_large") || strings.Contains(string(response.body), "private-host") {
		t.Fatalf("size refusal leaked details: %s", response.body)
	}
}

func TestHTTP_SentCopyLimitRefusesBeforeSMTPDelivery(t *testing.T) {
	address, recorder := listenRecorder(t)
	server := newTestServerWrapping(t, address, alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider { return limitedMailStore{p, 1024} })
	server.login()
	response := server.do(http.MethodPost, "/messages", url.Values{"to": {"b@example.test"}, "text": {strings.Repeat("oversize body ", 1000)}})
	server.expect(response, http.StatusRequestEntityTooLarge)
	recorder.mu.Lock()
	defer recorder.mu.Unlock()
	if recorder.data != "" {
		t.Fatal("delivered a message that could not fit its Sent copy")
	}
}
