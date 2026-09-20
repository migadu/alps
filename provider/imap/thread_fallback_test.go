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
	"errors"
	"fmt"
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

	msgs, page, err := p.ListMessages("INBOX", "asc", 0, 50)
	if err != nil {
		t.Fatalf("a refused THREAD failed the listing: %v", err)
	}
	if page.Total != 2 || len(msgs) != 2 {
		t.Fatalf("listed %d of %d, want both messages", len(msgs), page.Total)
	}
	// Total counts messages here, not conversations, and the page has to say
	// so: a caller paging on the previous threaded count would be using an
	// offset that no longer means the same thing.
	if page.Threaded {
		t.Error("the page reports itself threaded, but THREAD was refused and it counts messages")
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

	msgs, page, err := p.SearchMessages("INBOX", "Engines", "asc", 0, 50)
	if err != nil {
		t.Fatalf("a refused THREAD failed the search: %v", err)
	}
	if page.Total != 2 || len(msgs) != 2 {
		t.Fatalf("found %d of %d, want the two matching messages", len(msgs), page.Total)
	}
	if page.Threaded {
		t.Error("the page reports itself threaded, but THREAD was refused and it counts messages")
	}
	if got := strings.Join(subjects(msgs), ","); !strings.Contains(got, "Engines") {
		t.Errorf("found %q, want the messages the query matched", got)
	}
}

// A page that IS threaded must say so, and must count conversations. The same
// folder answers a different Total on each side of the fallback, which is
// exactly why the flag travels with the number.
func TestAThreadedPageCountsConversationsAndSaysSo(t *testing.T) {
	s := &memServer{
		caps:    imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}},
		threads: []imap.ThreadData{{Chain: []uint32{1, 2}}}, // both messages, one conversation
	}
	p := memIMAP(t, s,
		conversation("Engines", "one@remote.test", ""),
		conversation("Re: Engines", "two@remote.test", "one@remote.test"),
	)

	msgs, page, err := p.ListMessages("INBOX", "asc", 0, 50)
	if err != nil {
		t.Fatalf("listing a threaded folder: %v", err)
	}
	if !page.Threaded {
		t.Error("the page grouped the folder but does not report itself threaded")
	}
	if page.Total != 1 || len(msgs) != 1 {
		t.Fatalf("listed %d rows of %d, want the one conversation", len(msgs), page.Total)
	}
	if len(msgs[0].SubMessages) != 1 {
		t.Errorf("the conversation carries %d earlier messages, want 1", len(msgs[0].SubMessages))
	}
}

// Only a refusal is answered with a flat listing. Anything else means the
// connection or the client gave out, and a fallback issuing more commands on
// the same connection would replace the real diagnosis with its own.
//
// This is tested on the classifier rather than end to end: a server-side
// failure reaches the client as a tagged NO or BAD whatever caused it, so the
// in-memory server cannot produce the transport failure this guards against.
func TestRefusedByServerTellsRefusalFromFailure(t *testing.T) {
	for _, tc := range []struct {
		name string
		err  error
		want bool
	}{
		{"tagged NO", &imap.Error{Type: imap.StatusResponseTypeNo, Text: "over quota"}, true},
		{"rate limited", refusedThread(), true},
		{"tagged BAD", &imap.Error{Type: imap.StatusResponseTypeBad, Text: "unknown command"}, true},
		// fetchThreadGroups wraps with %w so the cause survives to here.
		{"wrapped refusal", fmt.Errorf("UID THREAD failed: %w", refusedThread()), true},
		{"transport failure", errors.New("connection reset by peer"), false},
		{"wrapped transport failure", fmt.Errorf("UID THREAD failed: %w", errors.New("broken pipe")), false},
		{"nothing wrong", nil, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if got := refusedByServer(tc.err); got != tc.want {
				t.Errorf("refusedByServer(%v) = %v, want %v", tc.err, got, tc.want)
			}
		})
	}
}
