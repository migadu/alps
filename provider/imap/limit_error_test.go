package imap

import (
	"errors"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

// Sora charges THREAD, SORT and SEARCH to one search budget per account, and
// once it is used up refuses each with NO [LIMIT] (RFC 5530), naming the wait.
// A search with a query has no answer then but the refusal, and it is a
// provider.LimitError with that wait, for the page to say so; a listing
// without one is listed by number, as #177 made it.
func TestASearchRefusedForTheRateLimitIsALimitError(t *testing.T) {
	limited := &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeLimit, Text: "search rate limit exceeded: 10 searches per 1m0s, please wait 1m5s before trying again"}
	s := &memServer{
		caps:      imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}, imap.CapSort: {}},
		threadErr: limited,
		sortErr:   limited,
	}
	p := memIMAP(t, s, conversation("Engines", "one@remote.test", ""))

	_, _, err := p.SearchMessages("INBOX", "Engines", "desc", 0, 50)
	var refused *provider.LimitError
	if !errors.As(err, &refused) {
		t.Fatalf("SearchMessages: %v, want a provider.LimitError", err)
	}
	if refused.RetryAfter != 65*time.Second {
		t.Errorf("RetryAfter %v, want the 1m5s the server named", refused.RetryAfter)
	}

	if _, _, err := p.SearchMessages("INBOX", "", "desc", 0, 50); err != nil {
		t.Errorf("the listing without a query failed: %v", err)
	}
}

func TestWaitNamedIn(t *testing.T) {
	for text, want := range map[string]time.Duration{
		"search rate limit exceeded: 10 searches per 1m0s, please wait 42s before trying again": 42 * time.Second,
		"please wait 1m5s":  65 * time.Second,
		"Please WAIT 1.5s":  1500 * time.Millisecond,
		"too many searches": 0,
		"wait a moment":     0,
	} {
		if got := waitNamedIn(text); got != want {
			t.Errorf("waitNamedIn(%q) = %v, want %v", text, got, want)
		}
	}
}
