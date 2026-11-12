package alpsbase

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type lateSentDraftDeletion struct {
	armed                       atomic.Bool
	entered, release, committed chan struct{}
}

type lateSentDraftDeleteProvider struct {
	provider.MailProvider
	state *lateSentDraftDeletion
}

func (p lateSentDraftDeleteProvider) DeleteMessages(mailbox string, ids []provider.MessageID) error {
	if mailbox == "Drafts" && p.state.armed.Swap(false) {
		close(p.state.entered)
		<-p.state.release
		defer close(p.state.committed)
	}
	return p.MailProvider.DeleteMessages(mailbox, ids)
}

// FinishMail may return after an abandoned request while its callback still
// runs. A draft read in that interval must be forgotten when deletion commits.
func TestHTTP_LateSentDraftDeletionForgetsRecachedParts(t *testing.T) {
	smtpServer, _ := listenRecorder(t)
	state := &lateSentDraftDeletion{entered: make(chan struct{}), release: make(chan struct{}), committed: make(chan struct{})}
	s := newTestServerWrapping(t, smtpServer, alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
		return lateSentDraftDeleteProvider{p, state}
	})
	s.login()
	saved, draft := saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"sent draft text"}, "save_as_draft": {"1"}})
	s.expect(saved, http.StatusOK)
	part := "/mailboxes/" + url.PathEscape(draft.Mailbox) + "/messages/" + url.PathEscape(draft.UID) + "/raw?part=1"
	s.expect(s.do("GET", part, nil), http.StatusOK)
	state.armed.Store(true)

	cancelSend := make(chan context.CancelFunc, 1)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/messages" {
			ctx, cancel := context.WithCancel(r.Context())
			defer cancel()
			cancelSend <- cancel
			r = r.WithContext(ctx)
		}
		s.server.ServeHTTP(w, r)
	}))
	defer server.Close()
	released := false
	defer func() {
		if !released {
			close(state.release)
		}
	}()
	s.url = server.URL
	form := url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"sent draft text"}, "draft_uid": {draft.UID}, "draft_mailbox": {draft.Mailbox}}
	req, err := http.NewRequest(http.MethodPost, s.url+"/messages", strings.NewReader(form.Encode()))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	done := make(chan response, 1)
	go func() {
		r, err := s.client.Do(req)
		if err != nil {
			done <- response{body: []byte(err.Error())}
			return
		}
		defer r.Body.Close()
		body, _ := io.ReadAll(r.Body)
		done <- response{status: r.StatusCode, body: body}
	}()
	select {
	case <-state.entered:
	case <-time.After(2 * time.Second):
		t.Fatal("draft deletion not entered")
	}
	(<-cancelSend)()
	select {
	case r := <-done:
		s.expect(r, http.StatusOK)
		if !strings.Contains(string(r.body), "draft_not_removed") {
			t.Fatalf("missing delivered-message warning: %s", r.body)
		}
	case <-time.After(12 * time.Second):
		t.Fatal("canceled handler did not return while deletion was pending")
	}
	// This new connection reads and caches the still-present draft after the
	// canceled handler has cleared the cache, but before the old write commits.
	s.expect(s.do("GET", part, nil), http.StatusOK)
	close(state.release)
	released = true
	select {
	case <-state.committed:
	case <-time.After(2 * time.Second):
		t.Fatal("late deletion did not commit")
	}
	id, err := s.store.ParseMessageID(draft.UID)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.store.GetMessageMetadata(draft.Mailbox, id); err == nil {
		t.Fatal("draft was not physically removed")
	}
	for deadline := time.Now().Add(time.Second); time.Now().Before(deadline); {
		if r := s.do("GET", part, nil); r.status != http.StatusOK {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("the removed draft remains readable from a body cached before late deletion committed")
}
