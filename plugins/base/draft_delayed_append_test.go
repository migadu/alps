package alpsbase

import (
	"bytes"
	"io"
	"net/http"
	"net/url"
	"sync"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type delayedAppendState struct {
	mu      sync.Mutex
	armed   bool
	pending rawMessage
	kind    provider.MailboxType
}

type delayedAppendProvider struct {
	provider.MailProvider
	state *delayedAppendState
}

func (p delayedAppendProvider) AppendMessage(mailbox string, message provider.OutgoingMessageWriter, kind provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	p.state.mu.Lock()
	if p.state.armed {
		p.state.armed = false
		var buf bytes.Buffer
		_, err := message.WriteTo(&buf)
		p.state.pending, p.state.kind = rawMessage(buf.Bytes()), kind
		p.state.mu.Unlock()
		if err != nil {
			return nil, nil, 0, err
		}
		// The client connection is lost while the server-side transaction
		// remains in flight. It has not committed when the new search runs.
		return nil, nil, 0, io.ErrUnexpectedEOF
	}
	p.state.mu.Unlock()
	return p.MailProvider.AppendMessage(mailbox, message, kind)
}

func (p delayedAppendProvider) FindByReferences(mailbox string, ids []string) ([]provider.Message, error) {
	found, err := p.MailProvider.(provider.ReferenceFinder).FindByReferences(mailbox, ids)
	if err != nil {
		return nil, err
	}
	p.state.mu.Lock()
	pending, kind := p.state.pending, p.state.kind
	p.state.pending = nil
	p.state.mu.Unlock()
	if pending != nil {
		// The original transaction commits after the replay's search took
		// its snapshot, before that replay decides whether to APPEND again.
		if _, _, _, err := p.MailProvider.AppendMessage("", pending, kind); err != nil {
			return nil, err
		}
	}
	return found, nil
}

func TestHTTP_AnUnknownAppendCanCommitAfterItsVerificationSearch(t *testing.T) {
	for folder, kind := range map[string]provider.MailboxType{"Drafts": provider.MailboxTypeDrafts, "Sent": provider.MailboxTypeSent} {
		t.Run(folder, func(t *testing.T) {
			smtpServer, _ := listenRecorder(t)
			state := &delayedAppendState{}
			s := newTestServerWrapping(t, smtpServer, alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
				return delayedAppendProvider{p, state}
			})
			s.login()
			if err := s.store.CreateMailbox(folder); err != nil {
				t.Fatal(err)
			}
			if got := s.mailbox(folder).Total; got != 0 {
				t.Fatal("the target was not empty")
			}
			state.armed = true
			form := url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"first"}}
			if kind == provider.MailboxTypeDrafts {
				form.Set("save_as_draft", "1")
			}
			response := s.do("POST", "/messages", form)
			if response.status == http.StatusOK {
				t.Error("an unconfirmed append was reported as completed")
			}
			if got := s.mailbox(folder).Total; got != 1 {
				t.Errorf("%s has %d copies when the old APPEND commits after the replay search (status%d), want1", folder, got, response.status)
			}
		})
	}
}
