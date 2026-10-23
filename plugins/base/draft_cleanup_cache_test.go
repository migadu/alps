package alpsbase

import (
	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"net/http"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
)

type committedDraftDeleteFailure struct {
	provider.MailProvider
	armed *atomic.Bool
}

func (p committedDraftDeleteFailure) DeleteMessages(mailbox string, ids []provider.MessageID) error {
	err := p.MailProvider.DeleteMessages(mailbox, ids)
	if err == nil && p.armed.Swap(false) {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Text: "deletion committed before refusal"}
	}
	return err
}
func TestHTTP_DraftCleanupFailureForgetsRemovedParts(t *testing.T) {
	for _, send := range []bool{false, true} {
		name := "save"
		if send {
			name = "send"
		}
		t.Run(name, func(t *testing.T) {
			smtpServer, _ := listenRecorder(t)
			armed := &atomic.Bool{}
			s := newTestServerWrapping(t, smtpServer, alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider { return committedDraftDeleteFailure{p, armed} })
			s.login()
			r, first := saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"first version"}, "save_as_draft": {"1"}})
			s.expect(r, http.StatusOK)
			part := "/mailboxes/" + url.PathEscape(first.Mailbox) + "/messages/" + url.PathEscape(first.UID) + "/raw?part=1"
			warmed := s.do("GET", part, nil)
			s.expect(warmed, http.StatusOK)
			if !strings.Contains(string(warmed.body), "first version") {
				t.Fatalf("unexpected old part %q", warmed.body)
			}
			armed.Store(true)
			form := url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"second version"}, "draft_uid": {first.UID}, "draft_mailbox": {first.Mailbox}}
			if !send {
				form.Set("save_as_draft", "1")
			}
			failed := s.do("POST", "/messages", form)
			if failed.status == http.StatusOK {
				t.Fatal("cleanup refusal unexpectedly succeeded")
			}
			oldID, err := s.store.ParseMessageID(first.UID)
			if err != nil {
				t.Fatal(err)
			}
			if _, err = s.store.GetMessageMetadata(first.Mailbox, oldID); err == nil {
				t.Fatal("old draft was not deleted")
			}
			stale := s.do("GET", part, nil)
			if stale.status == http.StatusOK {
				t.Fatalf("removed draft still opens from cached body: status%d %q", stale.status, stale.body)
			}
		})
	}
}
