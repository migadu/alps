package alpscaldav

import (
	"github.com/migadu/go-webdav/caldav"
	"net/http"
	"testing"
)

func TestEventsReportCalendarsThatCouldNotBeRead(t *testing.T) {
	bad := testHome + "unavailable/"
	h := startHarness(t, harnessOptions{wrap: func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == "REPORT" && r.URL.Path == bad {
				w.WriteHeader(http.StatusServiceUnavailable)
				return
			}
			next.ServeHTTP(w, r)
		})
	}})
	h.dav.calendars = []caldav.Calendar{{Path: testCalendar, Name: "Work"}, {Path: bad, Name: "Unavailable"}}
	h.dav.save(testCalendar+"meeting.ics", eventCalendar("meeting", "Readable event"))
	r := h.do("GET", "/calendar/events?start=2026-01-01T00:00:00Z&end=2027-01-01T00:00:00Z", nil)
	h.expect(r, http.StatusOK)
	var body struct {
		Events          []EventData
		FailedCalendars int
	}
	h.decode(r, &body)
	if body.FailedCalendars != 1 {
		t.Fatalf("failedCalendars=%d, want 1: %s", body.FailedCalendars, r.body)
	}
	if len(body.Events) != 1 || body.Events[0].Summary != "Readable event" {
		t.Fatalf("readable events lost: %+v", body.Events)
	}
}
