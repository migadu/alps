package alpscaldav

import (
	"net/http"
	"testing"

	"github.com/migadu/go-webdav/caldav"
)

// A calendar's colour is a property of the calendar on its server
// (calendar-color, in Apple's namespace), set there by whichever client the
// user picked it in, and every client that reads it draws the calendar the
// same. It was read from the server and then left out of the listing, so the
// page drew each calendar in a colour of its own making.
func TestACalendarIsListedWithTheColourItsServerHolds(t *testing.T) {
	h := newHarness(t)
	h.dav.calendars = []caldav.Calendar{
		{Path: testHome + "work/", Name: "Work", Color: "#16A34A", SupportedComponentSet: []string{"VEVENT", "VTODO"}},
		// As Apple's clients write it, with the opacity after the colour.
		{Path: testHome + "home/", Name: "Home", Color: "#FF2968FF", SupportedComponentSet: []string{"VEVENT", "VTODO"}},
		{Path: testHome + "short/", Name: "Short", Color: "#f0a", SupportedComponentSet: []string{"VEVENT", "VTODO"}},
		{Path: testHome + "plain/", Name: "Plain", SupportedComponentSet: []string{"VEVENT", "VTODO"}},
		// The page writes the colour into a stylesheet: only a colour is passed on.
		{Path: testHome + "odd/", Name: "Odd", Color: "red; background: url(//example.org/)", SupportedComponentSet: []string{"VEVENT", "VTODO"}},
	}
	want := map[string]string{"Work": "#16a34a", "Home": "#ff2968", "Short": "#ff00aa", "Plain": "", "Odd": ""}

	for _, route := range []string{"/calendar/calendars", "/calendar/tasks"} {
		r := h.do("GET", route, nil)
		h.expect(r, http.StatusOK)
		var listed struct {
			Calendars []struct {
				Name  string `json:"name"`
				Color string `json:"color"`
			} `json:"calendars"`
		}
		h.decode(r, &listed)
		if len(listed.Calendars) != len(want) {
			t.Fatalf("%s lists %d calendars, want %d", route, len(listed.Calendars), len(want))
		}
		for _, calendar := range listed.Calendars {
			if calendar.Color != want[calendar.Name] {
				t.Errorf("%s lists %s with the colour %q, want %q", route, calendar.Name, calendar.Color, want[calendar.Name])
			}
		}
	}
}
