package imap

import (
	"regexp"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
)

// sortCommands and envelopeFetches match the commands alps sends, not the
// server's completions; fetch items are not written in a fixed order, and only
// the sort's envelope fetch asks for INTERNALDATE.
var (
	sortCommands    = regexp.MustCompile(`(?m)^\S+ UID SORT \(`)
	envelopeFetches = regexp.MustCompile(`(?m)^\S+ UID FETCH [^\r\n]*INTERNALDATE`)
)

func datedMessage(subject, date string) string {
	return "From: Brand <news@brand.test>\r\nSubject: " + subject + "\r\nDate: " + date + "\r\n\r\nHello\r\n"
}

// Threads are listed by their latest message's date. A server with SORT orders
// them; without it alps fetches an envelope per thread and sorts them itself,
// which took most of a second for a large inbox.
func TestThreadedListSortsByDate(t *testing.T) {
	messages := []string{ // UIDs 1-3 arrive in this order; their dates do not
		datedMessage("oldest", "Mon, 01 Sep 2026 08:00:00 +0000"),
		datedMessage("newest", "Fri, 05 Sep 2026 08:00:00 +0000"),
		datedMessage("middle", "Wed, 03 Sep 2026 08:00:00 +0000"),
	}
	threads := []imap.ThreadData{{Chain: []uint32{1}}, {Chain: []uint32{2}}, {Chain: []uint32{3}}}
	threadCap := imap.Cap("THREAD=REFERENCES")

	servers := []struct {
		name       string
		caps       imap.CapSet
		serverSort bool
	}{
		{"with SORT", imap.CapSet{imap.CapIMAP4rev1: {}, threadCap: {}, imap.CapSort: {}}, true},
		{"without SORT", imap.CapSet{imap.CapIMAP4rev1: {}, threadCap: {}}, false},
	}
	for _, srv := range servers {
		t.Run(srv.name, func(t *testing.T) {
			s := &memServer{caps: srv.caps, threads: threads}
			p := memIMAP(t, s, messages...)
			orders := []struct {
				sortOrder string
				want      string
			}{
				{"desc", "newest middle oldest"},
				{"asc", "oldest middle newest"},
			}
			for round, o := range orders {
				before := len(s.traffic.String())
				rows, _, err := p.ListMessages("INBOX", o.sortOrder, 0, 50)
				if err != nil {
					t.Fatal(err)
				}
				var subjects []string
				for _, r := range rows {
					subjects = append(subjects, r.Envelope.Subject)
				}
				if got := strings.Join(subjects, " "); got != o.want {
					t.Errorf("%s: %q, want %q", o.sortOrder, got, o.want)
				}

				traffic := s.traffic.String()[before:]
				sorts := len(sortCommands.FindAllString(traffic, -1))
				envelopes := len(envelopeFetches.FindAllString(traffic, -1))
				if srv.serverSort && (sorts != 1 || envelopes != 0) {
					t.Errorf("%s: %d SORT commands and %d envelope fetches; want the server to sort", o.sortOrder, sorts, envelopes)
				}
				// Without SORT the first listing fetches envelopes; the second
				// sorts from the dates it cached.
				if !srv.serverSort && (sorts != 0 || (round == 0 && envelopes != 1)) {
					t.Errorf("%s: %d SORT commands and %d envelope fetches; want alps to sort from envelopes", o.sortOrder, sorts, envelopes)
				}
			}
		})
	}
}
