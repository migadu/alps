package alpsbase

import (
	"errors"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"io"
	"net/http"
	"net/url"
	"sync/atomic"
	"testing"
)

type failingFilingProvider struct {
	provider.MailProvider
	sent, draft bool
}

func (p failingFilingProvider) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, kind provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	if kind == provider.MailboxTypeSent && p.sent {
		return nil, nil, 0, errors.New("Sent over quota")
	}
	return p.MailProvider.AppendMessage(mailbox, msg, kind)
}
func (p failingFilingProvider) DeleteMessages(mailbox string, ids []provider.MessageID) error {
	if mailbox == "Drafts" && p.draft {
		return errors.New("draft removal refused")
	}
	return p.MailProvider.DeleteMessages(mailbox, ids)
}

func TestHTTP_DeliveredMessageReturnsWarningsForFilingFailures(t *testing.T) {
	for _, tc := range []struct {
		sent, draft bool
		warning     string
	}{{true, false, "not_filed_in_sent"}, {false, true, "draft_not_removed"}, {true, true, "not_filed_in_sent_and_draft_not_removed"}} {
		t.Run(tc.warning, func(t *testing.T) {
			smtp, rec := listenRecorder(t)
			s := newTestServerWrapping(t, smtp, alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
				return failingFilingProvider{p, tc.sent, tc.draft}
			})
			s.login()
			form := url.Values{"to": {"charles@remote.test"}, "subject": {"delivered"}, "text": {"hello"}, "save_as_draft": {"1"}}
			r := s.do("POST", "/messages", form)
			s.expect(r, http.StatusOK)
			var draft struct {
				DraftUID     string `json:"draft_uid"`
				DraftMailbox string `json:"draft_mailbox"`
			}
			r.json(t, &draft)
			if draft.DraftUID == "" {
				t.Fatal("no draft uid")
			}
			form.Del("save_as_draft")
			form.Set("draft_uid", draft.DraftUID)
			form.Set("draft_mailbox", draft.DraftMailbox)
			r = s.do("POST", "/messages", form)
			s.expect(r, http.StatusOK)
			var answer struct {
				OK      bool   `json:"ok"`
				Warning string `json:"warning"`
			}
			r.json(t, &answer)
			if !answer.OK || answer.Warning != tc.warning {
				t.Errorf("sent answer: %s", r.body)
			}
			rec.mu.Lock()
			data := rec.data
			rec.mu.Unlock()
			if data == "" {
				t.Error("message was not delivered")
			}
			if got := len(s.mailbox("Drafts").Messages); !tc.draft && got != 0 {
				t.Errorf("sent draft remains: %d", got)
			}
		})
	}
}

// A post-delivery connection loss prevents both the append and any reconnect.
// A message composed without a saved draft must still report only the Sent loss.
type disconnectedSentProvider struct {
	provider.MailProvider
	down *atomic.Bool
}

func (p disconnectedSentProvider) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, kind provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	if kind == provider.MailboxTypeSent {
		p.down.Store(true)
		return nil, nil, 0, io.EOF
	}
	return p.MailProvider.AppendMessage(mailbox, msg, kind)
}
func TestHTTP_DeliveredWithoutDraftReportsOnlySentFilingFailure(t *testing.T) {
	smtp, rec := listenRecorder(t)
	var down atomic.Bool
	s := newTestServerWithOptionsWrapping(t, smtp, alps.NewLogger(), func(o *alps.Options) { o.Provider = downOptions{Options: o.Provider, down: &down} }, func(p provider.MailProvider) provider.MailProvider { return disconnectedSentProvider{p, &down} })
	s.login()
	r := s.do("POST", "/messages", url.Values{"to": {"charles@remote.test"}, "subject": {"no saved draft"}, "text": {"hello"}})
	s.expect(r, http.StatusOK)
	var answer struct {
		OK      bool   `json:"ok"`
		Warning string `json:"warning"`
	}
	r.json(t, &answer)
	if !answer.OK || answer.Warning != "not_filed_in_sent" {
		t.Errorf("warning invents a draft: %s", r.body)
	}
	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()
	if data == "" {
		t.Fatal("message was not delivered")
	}
}
