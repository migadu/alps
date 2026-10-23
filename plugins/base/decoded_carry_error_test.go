package alpsbase

import (
	"net/http"
	"net/url"
	"strings"
	"testing"
)

func TestHTTP_UnknownCharsetDoesNotHideUndecodableCarriedFile(t *testing.T) {
	for _, backend := range []string{"maildir", "imap"} {
		t.Run(backend, func(t *testing.T) {
			raw := strings.Replace(unknownCharsetFileMessage, "Content-Disposition: attachment; filename=ledger.txt\r\n", "Content-Disposition: attachment; filename=ledger.txt\r\nContent-Transfer-Encoding: x-unknown\r\n", 1)
			var s *testServer
			var uid string
			if backend == "maildir" {
				s = newTestServer(t)
				if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(raw), 0); err != nil {
					t.Fatal(err)
				}
				s.login()
				for _, m := range s.mailbox("INBOX").Messages {
					if m.Envelope.Subject == "Ledger" {
						uid = m.UID
					}
				}
			} else {
				s, _ = newRecordedIMAPTestServer(t, raw)
				s.login()
				uid = s.mailbox("INBOX").Messages[0].UID
			}
			if uid == "" {
				t.Fatal("missing source message")
			}
			s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
			r := s.do("POST", "/messages", url.Values{"to": {"mary@remote.test"}, "subject": {"Fwd: Ledger"}, "text": {"See file"}, "prev_attachments": {"2"}, "source_mailbox": {"INBOX"}, "source_uid": {uid}, "save_as_draft": {"1"}})
			if r.status == http.StatusOK {
				t.Errorf("accepted a carried file whose transfer encoding cannot be decoded: %s", r.body)
			}
			if got := s.mailbox("Drafts").Total; got != 0 {
				t.Errorf("stored %d draft(s) with undecoded attachment content", got)
			}
		})
	}
}
