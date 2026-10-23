package alpsbase

import (
	"context"
	"net/http"
	"net/url"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
)

// searchesRefused is a mail server whose every SEARCH is refused with err:
// Sora, once the account's search budget is used up, answers
// NO [LIMIT] search rate limit exceeded (RFC 5530 [LIMIT]).
type searchesRefused struct {
	imapserver.Session
	err error
}

func (s searchesRefused) Search(context.Context, imapserver.NumKind, *imap.SearchCriteria, *imap.SearchOptions) (*imap.SearchData, error) {
	return nil, s.err
}

const limitedText = "search rate limit exceeded: 10 searches per 1m0s, please wait 42s before trying again"

// A search the server refuses for its rate limit is answered as one: 429,
// with how long the server said to wait, so the page can say the server asked
// to slow down instead of that the folder could not be loaded. It was a 500,
// "An internal error occurred". A listing without a query lists the folder
// unsorted then (#177), and is not refused at all.
func TestHTTP_ASearchRefusedForTheRateLimitIsSaidSo(t *testing.T) {
	limited := &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeLimit, Text: limitedText}
	s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
		return searchesRefused{inner, limited}
	})
	s.login()

	r := s.do("GET", "/mailboxes/INBOX?query="+url.QueryEscape("invoice"), nil)
	s.expect(r, http.StatusTooManyRequests)
	if got := r.header.Get("Retry-After"); got != "42" {
		t.Errorf("Retry-After %q, want the 42 seconds the server named", got)
	}
	var answer struct {
		Error      string `json:"error"`
		RetryAfter int    `json:"retry_after"`
	}
	r.json(t, &answer)
	if answer.Error != "search_rate_limited" || answer.RetryAfter != 42 {
		t.Errorf("answered %s, want search_rate_limited after 42 seconds", r.body)
	}

	// Without a query the folder is still listed.
	s.expect(s.do("GET", "/mailboxes/INBOX", nil), http.StatusOK)
}

// A refusal that says nothing of when to try again has no Retry-After, and
// one for another reason is still a failure.
func TestHTTP_ASearchRefusedOtherwiseIsNotARateLimit(t *testing.T) {
	for name, tc := range map[string]struct {
		err    *imap.Error
		status int
	}{
		"limited, without a time":    {&imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeLimit, Text: "too many searches"}, http.StatusTooManyRequests},
		"refused for another reason": {&imap.Error{Type: imap.StatusResponseTypeNo, Text: "search failed"}, http.StatusInternalServerError},
	} {
		t.Run(name, func(t *testing.T) {
			s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
				return searchesRefused{inner, tc.err}
			})
			s.login()
			r := s.do("GET", "/mailboxes/INBOX?query=invoice", nil)
			s.expect(r, tc.status)
			if got := r.header.Get("Retry-After"); got != "" {
				t.Errorf("Retry-After %q, want none", got)
			}
		})
	}
}
