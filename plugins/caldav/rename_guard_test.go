package alpscaldav

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-webdav/caldav"
)

// renamesRecorded stands in front of the CalDAV server, records the path of
// every PROPPATCH, and answers it as a server that took the new name. Without
// it go-webdav answers 501, which no rename gets past.
func renamesRecorded(mu *sync.Mutex, paths *[]string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != "PROPPATCH" {
				next.ServeHTTP(w, r)
				return
			}
			mu.Lock()
			*paths = append(*paths, r.URL.Path)
			mu.Unlock()
			w.Header().Set("Content-Type", "application/xml; charset=utf-8")
			w.WriteHeader(http.StatusMultiStatus)
			fmt.Fprintf(w, `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:"><D:response><D:href>%s</D:href><D:propstat><D:prop><D:displayname/></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>`, r.URL.Path)
		})
	}
}

// The rename route sets the display name of whatever its path names, so it
// takes only a path that is one of the user's calendars, as the delete route
// beside it does. It took any: the principal, the home set, an event, a
// collection the server does not list as a calendar.
func TestRenameTakesOnlyTheUsersCalendars(t *testing.T) {
	var mu sync.Mutex
	var renamed []string
	h := startHarness(t, harnessOptions{wrap: renamesRecorded(&mu, &renamed)})
	for what, p := range map[string]string{
		"the principal":              "/ada/",
		"the home set":               testHome,
		"an event":                   testCalendar + "standup.ics",
		"a collection not listed":    "/ada/calendars/shared/",
		"a path inside a calendar":   testCalendar + "inner/",
		"another account's calendar": "/grace/calendars/work/",
	} {
		r := h.do("PATCH", "/calendar/calendars/"+pathParam(p), map[string]string{"name": "Renamed"})
		if r.status != http.StatusForbidden {
			t.Errorf("renaming %s, %s: status %d, want 403: %s", what, p, r.status, r.body)
		}
	}
	mu.Lock()
	sent := append([]string(nil), renamed...)
	mu.Unlock()
	if len(sent) != 0 {
		t.Fatalf("a PROPPATCH was sent for paths that are no calendar of the user's: %q", sent)
	}

	// A calendar the server lists is renamed, named with its trailing slash
	// or without.
	for _, p := range []string{testCalendar, strings.TrimSuffix(testCalendar, "/")} {
		h.expect(h.do("PATCH", "/calendar/calendars/"+pathParam(p), map[string]string{"name": "Projects"}), http.StatusOK)
	}
	mu.Lock()
	sent = append([]string(nil), renamed...)
	mu.Unlock()
	if strings.Join(sent, " ") != testCalendar+" "+testCalendar {
		t.Fatalf("PROPPATCH sent to %q, want %s twice", sent, testCalendar)
	}
}

// With no calendar listed there is nothing the path could be, so the rename
// is refused before anything is sent, as a delete is.
func TestRenameWithNoCalendarListedSendsNothing(t *testing.T) {
	var mu sync.Mutex
	var renamed []string
	h := startHarness(t, harnessOptions{wrap: renamesRecorded(&mu, &renamed)})
	h.dav.calendars = []caldav.Calendar{}

	if r := h.do("PATCH", "/calendar/calendars/"+pathParam(testCalendar), map[string]string{"name": "Projects"}); r.status == http.StatusOK {
		t.Fatalf("renamed with no calendar listed: %s", r.body)
	}
	mu.Lock()
	defer mu.Unlock()
	if len(renamed) != 0 {
		t.Fatalf("a PROPPATCH was sent with no calendar listed: %q", renamed)
	}
}
