package imap

import (
	"errors"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// A UID the server no longer holds, or never held, is answered with an empty
// FETCH rather than an error. The provider names that case, so the web layer
// can tell a message that is gone from a server that failed.
func TestAMessageThatIsGoneIsNotFound(t *testing.T) {
	servers := []struct {
		name   string
		server *memServer
	}{
		{"flat", &memServer{}},
		{"threaded", &memServer{
			caps:    imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}},
			threads: []imap.ThreadData{{Chain: []uint32{2}}},
		}},
	}
	for _, srv := range servers {
		t.Run(srv.name, func(t *testing.T) {
			p := memIMAP(t, srv.server, brandMessage("first", ""), brandMessage("second", ""))
			if err := p.DeleteMessages("INBOX", []provider.MessageID{IMAPUID(1)}); err != nil {
				t.Fatal(err)
			}
			for _, uid := range []IMAPUID{1, 99} {
				reads := []struct {
					how  string
					read func() error
				}{
					{"metadata", func() error { _, err := p.GetMessageMetadata("INBOX", uid); return err }},
					{"part", func() error { _, _, err := p.GetMessagePart("INBOX", uid, []int{1}); return err }},
					{"part with data", func() error { _, _, _, _, err := p.GetMessagePartWithData("INBOX", uid, []int{1}); return err }},
					{"raw part", func() error { _, _, _, err := p.GetMessagePartRaw("INBOX", uid, []int{1}, 0); return err }},
					{"thread", func() error { _, err := p.GetMessageThread("INBOX", uid); return err }},
				}
				for _, r := range reads {
					if err := r.read(); !errors.Is(err, provider.ErrMessageNotFound) {
						t.Errorf("UID %d, %s: err = %v, want ErrMessageNotFound", uid, r.how, err)
					}
				}
			}
			if _, err := p.GetMessageMetadata("INBOX", IMAPUID(2)); err != nil {
				t.Errorf("the message that is still there: %v", err)
			}
		})
	}
}
