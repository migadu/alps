// A folder listed without a query must load while the server refuses searches.
//
// A server can ration searching per account: Sora charges SEARCH, UID SEARCH,
// SORT, THREAD and multi-mailbox ESEARCH to one budget and refuses all of them
// once it is spent. A listing with the date order asks for SORT, and for
// THREAD before it, so both are refused together. The folder's messages are
// still there, and a listing without a query is all of them, which needs no
// search to find.
package imap

import (
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
)

// searchLimited is what Sora answers any search with once the account has
// used up its searches for the minute.
func searchLimited() error {
	return &imap.Error{
		Type: imap.StatusResponseTypeNo,
		Text: "search rate limit exceeded: 10 searches in 1m0s, please wait 42s before trying again",
	}
}

// UIDs 1-3 arrive in this order; their dates do not.
var datedArrivals = []string{
	datedMessage("oldest", "Mon, 01 Sep 2026 08:00:00 +0000"),
	datedMessage("newest", "Fri, 05 Sep 2026 08:00:00 +0000"),
	datedMessage("middle", "Wed, 03 Sep 2026 08:00:00 +0000"),
}

func TestAListingWithoutAQueryLoadsWhenSearchesAreRefused(t *testing.T) {
	threadCap := imap.Cap("THREAD=REFERENCES")
	servers := []struct {
		name   string
		server *memServer
	}{
		{"THREAD and SORT refused", &memServer{
			caps:      imap.CapSet{imap.CapIMAP4rev1: {}, threadCap: {}, imap.CapSort: {}},
			threadErr: searchLimited(),
			sortErr:   searchLimited(),
		}},
		{"SORT refused", &memServer{
			caps:    imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapSort: {}},
			sortErr: searchLimited(),
		}},
		{"THREAD and SEARCH refused, no SORT", &memServer{
			caps:      imap.CapSet{imap.CapIMAP4rev1: {}, threadCap: {}},
			threadErr: searchLimited(),
			searchErr: searchLimited(),
		}},
	}
	for _, srv := range servers {
		t.Run(srv.name, func(t *testing.T) {
			p := memIMAP(t, srv.server, datedArrivals...)
			pages := []struct {
				sortOrder  string
				page, size int
				want       string
			}{
				// Listed by message number, the order mail arrived in, as
				// ListMessages lists a folder: the date order needs SORT.
				{"desc", 0, 2, "middle newest"},
				{"desc", 1, 2, "oldest"},
				{"asc", 0, 50, "oldest newest middle"},
			}
			for _, pg := range pages {
				msgs, info, err := p.SearchMessages("INBOX", "", pg.sortOrder, pg.page, pg.size)
				if err != nil {
					t.Fatalf("%s page %d: the folder failed to load: %v", pg.sortOrder, pg.page, err)
				}
				if got := strings.Join(subjects(msgs), " "); got != pg.want {
					t.Errorf("%s page %d: listed %q, want %q", pg.sortOrder, pg.page, got, pg.want)
				}
				if info.Total != 3 || info.Threaded {
					t.Errorf("%s page %d: Total %d, threaded %v; want the 3 messages, unthreaded", pg.sortOrder, pg.page, info.Total, info.Threaded)
				}
			}
		})
	}
}

// Only a refused SORT costs the date order. A server can refuse THREAD alone,
// for a folder too big to thread, and SORT still orders the flat listing.
func TestAFlatListingKeepsTheDateOrderWhileSortIsAnswered(t *testing.T) {
	s := &memServer{
		caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}, imap.CapSort: {}},
		threadErr: &imap.Error{
			Type: imap.StatusResponseTypeNo,
			Code: imap.ResponseCodeLimit,
			Text: "THREAD matches more than 50000 messages, narrow the search",
		},
	}
	p := memIMAP(t, s, datedArrivals...)

	msgs, info, err := p.SearchMessages("INBOX", "", "desc", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	if got := strings.Join(subjects(msgs), " "); got != "newest middle oldest" {
		t.Errorf("listed %q, want the date order SORT answers", got)
	}
	if info.Threaded {
		t.Error("the page reports itself threaded, but THREAD was refused")
	}
}

// A search is not answered with the whole folder. Without the server's search
// nothing says which messages match, and every message listed as a match
// would be a wrong answer.
func TestARefusedSearchWithAQueryFails(t *testing.T) {
	s := &memServer{
		caps:      imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}, imap.CapSort: {}},
		threadErr: searchLimited(),
		sortErr:   searchLimited(),
	}
	p := memIMAP(t, s, datedArrivals...)

	msgs, _, err := p.SearchMessages("INBOX", "newest", "desc", 0, 50)
	if err == nil {
		t.Fatalf("a refused search answered %q", strings.Join(subjects(msgs), " "))
	}
	if !strings.Contains(err.Error(), "search rate limit exceeded") {
		t.Errorf("the error does not carry the server's refusal: %v", err)
	}
}
