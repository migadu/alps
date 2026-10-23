package alpsbase

import (
	"net/http"
	"net/url"
	"slices"
	"testing"
)

// The copy of a message the user sent, and a draft the user saved, are not
// unread mail: over maildir as over IMAP they are stored seen, and the draft
// as a draft. Over maildir both were stored with no flags, and Sent and
// Drafts counted every one of them unread.
func TestHTTP_SentAndSavedMessagesAreNotUnread(t *testing.T) {
	smtpServer, _ := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	form := url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"See you."}}
	s.expect(s.do("POST", "/messages", form), http.StatusOK)
	form.Set("subject", "More notes")
	form.Set("save_as_draft", "1")
	s.expect(s.do("POST", "/messages", form), http.StatusOK)

	for mailbox, want := range map[string][]string{"Sent": {`\Seen`}, "Drafts": {`\Draft`, `\Seen`}} {
		msgs := s.mailbox(mailbox).Messages
		if len(msgs) != 1 {
			t.Errorf("%s holds %d messages", mailbox, len(msgs))
			continue
		}
		flags := slices.Sorted(slices.Values(msgs[0].Flags))
		if !slices.Equal(flags, want) {
			t.Errorf("%s: the message has %q, want %q", mailbox, flags, want)
		}
	}
}
