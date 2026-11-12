package alpscaldav

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"path"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
)

// movedHome is where the calendar home set is once the server has moved it.
const movedHome = "/ada/moved/"

// homeSetMoves stands in front of the CalDAV server as one that, once moved
// is set, keeps the user's calendars under movedHome: the principal names it
// as the calendar home set, and the old home answers 404, as it does when an
// account is provisioned again or another server takes over the same URL. It
// takes every MKCALENDAR, and records where each goes.
func homeSetMoves(moved *atomic.Bool, mu *sync.Mutex, targets *[]string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == "MKCALENDAR" {
				mu.Lock()
				*targets = append(*targets, r.URL.Path)
				mu.Unlock()
				w.WriteHeader(http.StatusCreated)
				return
			}
			if !moved.Load() {
				next.ServeHTTP(w, r)
				return
			}
			switch {
			case strings.HasPrefix(r.URL.Path, testHome):
				http.NotFound(w, r)
				return
			case strings.HasPrefix(r.URL.Path, movedHome):
				r.URL.Path = testHome + strings.TrimPrefix(r.URL.Path, movedHome)
			}
			rec := httptest.NewRecorder()
			next.ServeHTTP(rec, r)
			for k, v := range rec.Header() {
				if k != "Content-Length" {
					w.Header()[k] = v
				}
			}
			w.WriteHeader(rec.Code)
			w.Write(bytes.ReplaceAll(rec.Body.Bytes(), []byte(testHome), []byte(movedHome)))
		})
	}
}

// Alps keeps each resolved connection's calendar home set once it has looked it up. When
// the server moved it, listing the calendars from the old one failed, and the
// old one was kept: every calendar request for that login failed until alps
// restarted. A home set that fails to list is dropped, so the next request
// looks it up again, and lists and creates calendars in the new one.
func TestAMovedCalendarHomeIsLookedUpAgain(t *testing.T) {
	var moved atomic.Bool
	var mu sync.Mutex
	var targets []string
	h := startHarness(t, harnessOptions{wrap: homeSetMoves(&moved, &mu, &targets)})
	h.expect(h.do("PUT", "/settings/dav/caldav", map[string]any{"username": "independent-dav-user", "password": "independent-secret"}), http.StatusOK)
	h.expect(h.do("GET", "/calendar/calendars", nil), http.StatusOK)

	moved.Store(true)
	// The request that finds the old home gone may still fail with it.
	h.do("GET", "/calendar/calendars", nil)

	r := h.do("GET", "/calendar/calendars", nil)
	h.expect(r, http.StatusOK)
	var listed struct{ Calendars []CalendarData }
	h.decode(r, &listed)
	if want := movedHome + "work/"; len(listed.Calendars) != 1 || listed.Calendars[0].Path != want {
		t.Fatalf("listed %+v, want the one calendar at %s", listed.Calendars, want)
	}

	h.expect(h.do("POST", "/calendar/calendars", map[string]any{"name": "Holidays"}), http.StatusOK)
	mu.Lock()
	defer mu.Unlock()
	if len(targets) != 1 {
		t.Fatalf("%d MKCALENDAR requests, want 1: %q", len(targets), targets)
	}
	if parent := path.Dir(strings.TrimSuffix(targets[0], "/")) + "/"; parent != movedHome {
		t.Errorf("the calendar was asked for at %s, in %s, not in the new home set %s", targets[0], parent, movedHome)
	}
}

// A request whose listing failed drops the home set it listed from, and only
// that one: another request may already have looked up the new one, and that
// one stays.
func TestOnlyTheCalendarHomeThatFailedIsForgotten(t *testing.T) {
	const connectionKey = "resolved-connection-key"
	p := &plugin{homeSetCache: map[string]homeSetEntry{connectionKey: {path: movedHome}, "another-connection": {path: testHome}}}
	p.forgetHomeSet(connectionKey, testHome)
	if got, ok := p.homeSetCache[connectionKey]; !ok || got.path != movedHome {
		t.Errorf("the new home set was dropped for a failure of the old one: cached %q, %v", got.path, ok)
	}
	p.forgetHomeSet(connectionKey, movedHome)
	if got, ok := p.homeSetCache[connectionKey]; ok {
		t.Errorf("the home set that failed is still cached: %q", got.path)
	}
}
