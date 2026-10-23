package alpscaldav

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"path"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-webdav/caldav"
)

// withoutHomeSet stands in front of the CalDAV server as one whose principal
// names an empty calendar home set, and records where each MKCALENDAR goes.
// An empty home set is the endpoint itself, so the calendars are listed
// there.
func withoutHomeSet(mu *sync.Mutex, targets *[]string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch {
			case r.Method == "MKCALENDAR":
				mu.Lock()
				*targets = append(*targets, r.URL.Path)
				mu.Unlock()
				w.WriteHeader(http.StatusCreated)
			case r.Method == "PROPFIND" && r.URL.Path == "/ada/":
				rec := httptest.NewRecorder()
				next.ServeHTTP(rec, r)
				for k, v := range rec.Header() {
					if k != "Content-Length" {
						w.Header()[k] = v
					}
				}
				w.WriteHeader(rec.Code)
				w.Write(bytes.ReplaceAll(rec.Body.Bytes(), []byte(">"+testHome+"<"), []byte("><")))
			case r.Method == "PROPFIND" && r.URL.Path == "/" && r.Header.Get("Depth") == "1":
				r.URL.Path = testHome
				next.ServeHTTP(w, r)
			default:
				next.ServeHTTP(w, r)
			}
		})
	}
}

// Without a home set the create route places a new calendar beside the
// first one listed, in the collection that holds it. It took path.Dir of
// the calendar's path, and a collection's path ends in a slash, so that was
// the calendar itself: the new calendar was asked for inside it.
func TestNewCalendarBesideTheOthersWithoutAHomeSet(t *testing.T) {
	for name, first := range map[string]string{
		"listed with a trailing slash": testCalendar,
		"listed without one":           strings.TrimSuffix(testCalendar, "/"),
	} {
		t.Run(name, func(t *testing.T) {
			var mu sync.Mutex
			var targets []string
			h := startHarness(t, harnessOptions{wrap: withoutHomeSet(&mu, &targets)})
			h.dav.calendars = []caldav.Calendar{{Path: first, Name: "Work", SupportedComponentSet: []string{"VEVENT", "VTODO"}}}

			r := h.do("POST", "/calendar/calendars", map[string]any{"name": "Holidays"})
			h.expect(r, http.StatusOK)
			var created struct{ Path string }
			h.decode(r, &created)

			mu.Lock()
			defer mu.Unlock()
			if len(targets) != 1 {
				t.Fatalf("%d MKCALENDAR requests, want 1: %q", len(targets), targets)
			}
			if parent := path.Dir(strings.TrimSuffix(targets[0], "/")) + "/"; parent != testHome {
				t.Fatalf("the calendar was asked for at %s, in %s, not beside %s in %s", targets[0], parent, first, testHome)
			}
			if created.Path != targets[0] {
				t.Fatalf("the create answered %q, but the calendar was asked for at %q", created.Path, targets[0])
			}
		})
	}
}
