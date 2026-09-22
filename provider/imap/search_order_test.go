package imap

import (
	"math/rand"
	"sort"
	"testing"
	"time"
)

// A cross-mailbox search is sorted afresh for every page. If tied dates could
// come out in different orders, two requests would cut the page boundary in
// different places and a reader paging through would see one message twice and
// another not at all. The order has to be total, not merely date-descending.
func TestCandidateOrderIsTotalAcrossTiedDates(t *testing.T) {
	same := time.Date(2026, 3, 1, 9, 0, 0, 0, time.UTC)
	later := same.Add(time.Hour)

	base := []searchCandidate{
		{mailbox: "INBOX", uid: 7, date: same},
		{mailbox: "INBOX", uid: 3, date: same},
		{mailbox: "Archive", uid: 9, date: same},
		{mailbox: "Archive", uid: 1, date: same},
		{mailbox: "INBOX", uid: 5, date: later},
	}

	for _, order := range []string{"asc", "desc"} {
		var want []string
		for shuffle := 0; shuffle < 50; shuffle++ {
			got := append([]searchCandidate(nil), base...)
			rand.Shuffle(len(got), func(i, j int) { got[i], got[j] = got[j], got[i] })
			sort.Slice(got, func(i, j int) bool { return candidateBefore(got[i], got[j], order) })

			var keys []string
			for _, c := range got {
				keys = append(keys, c.mailbox+":"+string(rune('0'+c.uid)))
			}
			if want == nil {
				want = keys
				continue
			}
			for i := range keys {
				if keys[i] != want[i] {
					t.Fatalf("%s: shuffle %d ordered %v, an earlier one ordered %v", order, shuffle, keys, want)
				}
			}
		}
	}
}

// The tie-break must not disturb the ordering it breaks ties within.
func TestCandidateOrderStillSortsByDate(t *testing.T) {
	early := searchCandidate{mailbox: "b", uid: 1, date: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)}
	late := searchCandidate{mailbox: "a", uid: 9, date: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)}

	if !candidateBefore(early, late, "asc") {
		t.Error("ascending put the later message first")
	}
	if !candidateBefore(late, early, "desc") {
		t.Error("descending put the earlier message first")
	}
	// Mailbox name would have ordered these the other way round; date wins.
	if candidateBefore(late, early, "asc") {
		t.Error("the tie-break overrode the date it was only meant to tie-break")
	}
}
