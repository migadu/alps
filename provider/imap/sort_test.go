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

// Without SORT, alps keeps the date of each conversation it sorted, by UID. A
// folder deleted and made again, here or in another mail program, numbers its
// messages from 1 again under a new UIDVALIDITY, and its conversations were
// put in the order of the old folder's dates.
func TestAFolderMadeAgainIsSortedByItsOwnDates(t *testing.T) {
	threads := []imap.ThreadData{{Chain: []uint32{1}}, {Chain: []uint32{2}}, {Chain: []uint32{3}}}
	caps := imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}}
	for _, where := range []string{"here", "elsewhere"} {
		t.Run("made again "+where, func(t *testing.T) {
			s := &memServer{caps: caps, threads: threads}
			p := memIMAP(t, s)
			other := elsewhere(t, s)
			fill := func(messages ...string) {
				t.Helper()
				for _, m := range messages {
					appendTo(t, other, "Work", m)
				}
			}
			list := func() string {
				t.Helper()
				rows, _, err := p.ListMessages("Work", "desc", 0, 50)
				if err != nil {
					t.Fatal(err)
				}
				var subjects []string
				for _, r := range rows {
					subjects = append(subjects, r.Envelope.Subject)
				}
				// Away from Work, so that it is selected again when listed.
				if _, _, err := p.ListMessages("INBOX", "desc", 0, 50); err != nil {
					t.Fatal(err)
				}
				return strings.Join(subjects, " ")
			}

			if err := p.CreateMailbox("Work"); err != nil {
				t.Fatal(err)
			}
			fill(datedMessage("oldest", "Mon, 01 Sep 2026 08:00:00 +0000"),
				datedMessage("newest", "Fri, 05 Sep 2026 08:00:00 +0000"),
				datedMessage("middle", "Wed, 03 Sep 2026 08:00:00 +0000"))
			if got := list(); got != "newest middle oldest" {
				t.Fatalf("Work is listed %q, want newest first", got)
			}

			if where == "here" {
				if err := p.DeleteMailbox("Work"); err != nil {
					t.Fatal(err)
				}
				if err := p.CreateMailbox("Work"); err != nil {
					t.Fatal(err)
				}
			} else {
				if err := other.Delete("Work").Wait(); err != nil {
					t.Fatal(err)
				}
				if err := other.Create("Work", nil).Wait(); err != nil {
					t.Fatal(err)
				}
			}
			fill(datedMessage("Middle", "Wed, 03 Sep 2026 08:00:00 +0000"),
				datedMessage("Oldest", "Mon, 01 Sep 2026 08:00:00 +0000"),
				datedMessage("Newest", "Fri, 05 Sep 2026 08:00:00 +0000"))
			if got := list(); got != "Newest Middle Oldest" {
				t.Errorf("Work made again is listed %q, want newest first by its own messages' dates", got)
			}
		})
	}
}
