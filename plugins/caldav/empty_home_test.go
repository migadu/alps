package alpscaldav

import (
	"encoding/json"
	"net/http"
	"path"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-webdav/caldav"
)

// mkcalendarsRecorded stands in front of the CalDAV server as one that takes
// every MKCALENDAR, and records where each goes.
func mkcalendarsRecorded(mu *sync.Mutex, targets *[]string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == "MKCALENDAR" {
				mu.Lock()
				*targets = append(*targets, r.URL.Path)
				mu.Unlock()
				w.WriteHeader(http.StatusCreated)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// A calendar home with no calendar in it is where an account starts on many
// servers, and where it is left once its last calendar is deleted. The home
// set was found, and then the listing was refused as "no calendars found":
// the calendar list, its events and its tasks answered 500, and so did the
// create, before it sent a thing, so the account could not make its first
// calendar.
func TestAnEmptyCalendarHomeIsListedEmpty(t *testing.T) {
	h := newHarness(t)
	h.dav.calendars = []caldav.Calendar{}

	r := h.do("GET", "/calendar/calendars", nil)
	h.expect(r, http.StatusOK)
	var listed struct {
		Calendars json.RawMessage `json:"calendars"`
	}
	h.decode(r, &listed)
	// An empty list, not null: the page filters what it is given.
	if string(listed.Calendars) != "[]" {
		t.Errorf("calendars listed as %s, want []", listed.Calendars)
	}

	h.expect(h.do("GET", "/calendar/events?start=2026-09-01T00:00:00Z&end=2026-10-01T00:00:00Z", nil), http.StatusOK)
	h.expect(h.do("GET", "/calendar/tasks", nil), http.StatusOK)
}

func TestTheFirstCalendarIsMadeInAnEmptyHome(t *testing.T) {
	var mu sync.Mutex
	var targets []string
	h := startHarness(t, harnessOptions{wrap: mkcalendarsRecorded(&mu, &targets)})
	h.dav.calendars = []caldav.Calendar{}

	r := h.do("POST", "/calendar/calendars", map[string]any{"name": "First"})
	h.expect(r, http.StatusOK)
	var created struct{ Path string }
	h.decode(r, &created)

	mu.Lock()
	defer mu.Unlock()
	if len(targets) != 1 {
		t.Fatalf("%d MKCALENDAR requests, want 1: %q", len(targets), targets)
	}
	if parent := path.Dir(strings.TrimSuffix(targets[0], "/")) + "/"; parent != testHome {
		t.Errorf("the calendar was asked for at %s, in %s, not in the home set %s", targets[0], parent, testHome)
	}
	if created.Path != targets[0] {
		t.Errorf("the create answered %q, but the calendar was asked for at %q", created.Path, targets[0])
	}
}

// deletesCounted stands in front of the CalDAV server as one that takes every
// DELETE and PROPPATCH, and counts them.
func deletesCounted(mu *sync.Mutex, sent *int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodDelete || r.Method == "PROPPATCH" {
				mu.Lock()
				*sent++
				mu.Unlock()
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// With no calendar listed, no path is one of the user's calendars, or inside
// one, and a delete or a rename is refused as for any path that is not: 403,
// with nothing sent. The guards answered 500, "calendars not resolved", for an
// account that simply has no calendar, and logged it as an internal error.
func TestWithNoCalendarAPathIsRefusedAsNotTheUsers(t *testing.T) {
	var mu sync.Mutex
	var sent int
	h := startHarness(t, harnessOptions{wrap: deletesCounted(&mu, &sent)})
	h.dav.calendars = []caldav.Calendar{}

	for what, route := range deleteRoutes {
		if r := h.do("DELETE", route, nil); r.status != http.StatusForbidden {
			t.Errorf("deleting the %s with no calendar listed: status %d, want 403: %s", what, r.status, r.body)
		}
	}
	if r := h.do("PATCH", "/calendar/calendars/"+pathParam(testCalendar), map[string]string{"name": "Projects"}); r.status != http.StatusForbidden {
		t.Errorf("renaming a calendar with none listed: status %d, want 403: %s", r.status, r.body)
	}
	mu.Lock()
	defer mu.Unlock()
	if sent != 0 {
		t.Errorf("%d DELETE or PROPPATCH requests sent with no calendar listed", sent)
	}
}

// A principal may name an empty calendar home set. The calendars are then
// listed at the endpoint itself, where go-webdav resolves the empty href, and
// a new calendar went beside the first one listed. With none listed, the
// create gave up with "failed to determine calendar home set", so such an
// account could not make its first calendar. It goes where the calendars are
// listed.
func TestTheFirstCalendarIsMadeWhereAnEmptyHomeSetIsListed(t *testing.T) {
	var mu sync.Mutex
	var targets []string
	h := startHarness(t, harnessOptions{wrap: withoutHomeSet(&mu, &targets)})
	h.dav.calendars = []caldav.Calendar{}

	r := h.do("POST", "/calendar/calendars", map[string]any{"name": "First"})
	h.expect(r, http.StatusOK)
	var created struct{ Path string }
	h.decode(r, &created)

	mu.Lock()
	defer mu.Unlock()
	if len(targets) != 1 {
		t.Fatalf("%d MKCALENDAR requests, want 1: %q", len(targets), targets)
	}
	if parent := path.Dir(strings.TrimSuffix(targets[0], "/")); parent != "/" {
		t.Errorf("the calendar was asked for at %s, in %s, not at the endpoint, where the calendars are listed", targets[0], parent)
	}
	if created.Path != targets[0] {
		t.Errorf("the create answered %q, but the calendar was asked for at %q", created.Path, targets[0])
	}
}
