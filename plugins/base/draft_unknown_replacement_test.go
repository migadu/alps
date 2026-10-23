package alpsbase

import (
	"net/http"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type unnamedReplacementProvider struct {
	provider.MailProvider
	unnamed *atomic.Bool
}

func (p unnamedReplacementProvider) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, kind provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	mbox, uid, size, err := p.MailProvider.AppendMessage(mailbox, msg, kind)
	if err == nil && p.unnamed.Load() {
		return mbox, nil, size, nil
	}
	return mbox, uid, size, err
}

func TestHTTP_AnUnidentifiedReplacementKeepsTheOriginalDraft(t *testing.T) {
	unnamed := &atomic.Bool{}
	s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
		return unnamedReplacementProvider{p, unnamed}
	})
	s.login()
	r, first := saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"source to keep"}, "save_as_draft": {"1"}})
	s.expect(r, http.StatusOK)
	part := "/mailboxes/" + url.PathEscape(first.Mailbox) + "/messages/" + url.PathEscape(first.UID) + "/raw?part=1"
	s.expect(s.do("GET", part, nil), http.StatusOK)
	unnamed.Store(true)
	r = s.do("POST", "/messages", url.Values{
		"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"replacement"}, "save_as_draft": {"1"},
		"draft_uid": {first.UID}, "draft_mailbox": {first.Mailbox},
	})
	if r.status == http.StatusOK {
		t.Errorf("an unidentified replacement reported success: %s", r.body)
	}
	old := s.do("GET", part, nil)
	if old.status != http.StatusOK || !strings.Contains(string(old.body), "source to keep") {
		t.Errorf("the live composer's old source was removed: %d %q", old.status, old.body)
	}
}
