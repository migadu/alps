package alpsbase

import (
	"context"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"
)

type heldDraftAppendForCancellation struct {
	provider.MailProvider
	entered, release, returned chan struct{}
}

func (p heldDraftAppendForCancellation) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, kind provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	close(p.entered)
	<-p.release
	defer close(p.returned)
	return p.MailProvider.AppendMessage(mailbox, msg, kind)
}
func TestHTTP_CanceledDraftAppendKeepsStateInWorker(t *testing.T) {
	for n := 0; n < 20; n++ {
		entered, release, returned := make(chan struct{}), make(chan struct{}), make(chan struct{})
		s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
			return heldDraftAppendForCancellation{p, entered, release, returned}
		})
		s.login()
		form := url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"held draft"}, "save_as_draft": {"1"}}
		ctx, cancel := context.WithCancel(context.Background())
		req, err := http.NewRequestWithContext(ctx, "POST", s.url+"/messages", strings.NewReader(form.Encode()))
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		done := make(chan struct{})
		go func() {
			defer close(done)
			r, _ := s.client.Do(req)
			if r != nil {
				r.Body.Close()
			}
		}()
		select {
		case <-entered:
		case <-time.After(2 * time.Second):
			t.Fatal("APPEND not entered")
		}
		cancel()
		close(release)
		<-done
		select {
		case <-returned:
		case <-time.After(2 * time.Second):
			t.Fatal("APPEND not returned")
		}
		time.Sleep(5 * time.Millisecond)
	}
}
