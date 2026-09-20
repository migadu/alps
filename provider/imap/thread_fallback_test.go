// A refused THREAD must not cost the reader the folder.
//
// THREAD is the most expensive thing a listing asks for — it is answered over
// the WHOLE mailbox, so its cost is the mailbox's size — which makes it the
// first command a server throttles. Ours answers `NO [LIMIT] ... slow down`,
// and a webmail pools one IMAP connection across every page it serves, so a
// few clicks reach it. The grouping is what the server refused; the messages
// are still there, and a flat list is the whole folder without it.
package imap

import (
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// refusedThread is what a rate limiter answers a THREAD with.
func refusedThread() error {
	return &imap.Error{
		Type: imap.StatusResponseTypeNo,
		Code: imap.ResponseCodeLimit,
		Text: "THREAD rate limit exceeded; slow down",
	}
}

func subjects(msgs []provider.Message) []string {
	out := make([]string, 0, len(msgs))
	for _, m := range msgs {
		out = append(out, m.Envelope.Subject)
	}
	return out
}

func TestListMessagesFallsBackToAFlatListWhenThreadIsRefused(t *testing.T) {
	s := &memServer{
		caps:      imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}},
		threadErr: refusedThread(),
	}
	p := memIMAP(t, s,
		conversation("Engines", "one@remote.test", ""),
		conversation("Re: Engines", "two@remote.test", "one@remote.test"),
	)

	msgs, total, err := p.ListMessages("INBOX", "asc", 0, 50)
	if err != nil {
		t.Fatalf("a refused THREAD failed the listing: %v", err)
	}
	if total != 2 || len(msgs) != 2 {
		t.Fatalf("listed %d of %d, want both messages", len(msgs), total)
	}
	if got := strings.Join(subjects(msgs), ","); got != "Engines,Re: Engines" {
		t.Errorf("listed %q, want the folder in mailbox order", got)
	}
	// The grouping is what is missing, and only that: each row stands alone.
	for _, m := range msgs {
		if len(m.SubMessages) != 0 {
			t.Errorf("%q carries %d sub-messages; an unthreaded row has none", m.Envelope.Subject, len(m.SubMessages))
		}
	}
	// The fallback is a fallback: the server was asked to thread first.
	if !threadCommands.MatchString(s.traffic.String()) {
		t.Error("no THREAD was sent; the listing must try to group before it gives up")
	}
}

func TestSearchMessagesFallsBackToAFlatListWhenThreadIsRefused(t *testing.T) {
	s := &memServer{
		caps:      imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}},
		threadErr: refusedThread(),
	}
	p := memIMAP(t, s,
		conversation("Engines", "one@remote.test", ""),
		conversation("Re: Engines", "two@remote.test", "one@remote.test"),
		conversation("Off topic", "loose@remote.test", ""),
	)

	msgs, total, err := p.SearchMessages("INBOX", "Engines", "asc", 0, 50)
	if err != nil {
		t.Fatalf("a refused THREAD failed the search: %v", err)
	}
	if total != 2 || len(msgs) != 2 {
		t.Fatalf("found %d of %d, want the two matching messages", len(msgs), total)
	}
	if got := strings.Join(subjects(msgs), ","); !strings.Contains(got, "Engines") {
		t.Errorf("found %q, want the messages the query matched", got)
	}
}
