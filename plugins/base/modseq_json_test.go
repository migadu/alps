package alpsbase

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync/atomic"
	"testing"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type decimalModseqProvider struct {
	provider.MailProvider
	value *atomic.Uint64
}

func (p decimalModseqProvider) GetMailboxStatus(name string) (*provider.MailboxStatus, error) {
	s, err := p.MailProvider.GetMailboxStatus(name)
	if err == nil {
		s.HighestModSeq = p.value.Load()
	}
	return s, err
}
func (p decimalModseqProvider) ListMailboxes() ([]provider.Mailbox, error) {
	boxes, err := p.MailProvider.ListMailboxes()
	for i := range boxes {
		boxes[i].HighestModSeq = p.value.Load()
	}
	return boxes, err
}

// RFC7162 permits 63-bit values. Preserve all decimal digits before JSON is
// parsed by a JavaScript client, in both status and listing representations.
func TestHTTP_ChangeNumbersAreExactDecimalStrings(t *testing.T) {
	for _, n := range []uint64{7, 9007199254740992, 9007199254740993, 9223372036854775807} {
		t.Run(strconv.FormatUint(n, 10), func(t *testing.T) {
			value := &atomic.Uint64{}
			s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
				return decimalModseqProvider{p, value}
			})
			s.login()
			value.Store(n)
			check := func(raw json.RawMessage) {
				t.Helper()
				var got string
				if err := json.Unmarshal(raw, &got); err != nil || got != strconv.FormatUint(n, 10) {
					t.Errorf("MODSEQ JSON %s, decoded %q (%v), want exact decimal string", raw, got, err)
				}
			}
			r := s.do("GET", "/mailboxes/INBOX/status", nil)
			s.expect(r, http.StatusOK)
			var status map[string]json.RawMessage
			r.json(t, &status)
			check(status["highestmodseq"])
			r = s.do("GET", "/mailboxes/INBOX?page=0", nil)
			s.expect(r, http.StatusOK)
			var page struct {
				Mailbox struct {
					HighestModSeq json.RawMessage
					NumMessages   int
				}
				Inbox     struct{ HighestModSeq json.RawMessage }
				Mailboxes []struct {
					Status struct{ HighestModSeq json.RawMessage }
				}
			}
			r.json(t, &page)
			check(page.Mailbox.HighestModSeq)
			check(page.Inbox.HighestModSeq)
			if page.Mailbox.NumMessages != 2 {
				t.Errorf("other status fields changed: %+v", page.Mailbox)
			}
			for _, box := range page.Mailboxes {
				check(box.Status.HighestModSeq)
			}
		})
	}
}
