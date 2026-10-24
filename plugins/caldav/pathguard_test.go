package alpscaldav

import (
	"errors"
	"net/http"
	"testing"

	"github.com/emersion/go-webdav/caldav"
	"github.com/migadu/alps"
)

func cals() []caldav.Calendar {
	return []caldav.Calendar{
		{Path: "/dav/calendars/user/default/"},
		{Path: "/dav/calendars/user/work/"},
	}
}

func TestRequireCalendarPath(t *testing.T) {
	for _, in := range []string{
		"/dav/calendars/user/default/",
		"/dav/calendars/user/default",
		"dav/calendars/user/work",
	} {
		if _, err := requireCalendarPath(in, cals()); err != nil {
			t.Errorf("%q should be accepted: %v", in, err)
		}
	}

	for _, in := range []string{
		"",
		// An object inside a calendar is not a calendar.
		"/dav/calendars/user/default/event.ics",
		// Another collection entirely — the old code would have deleted it.
		"/dav/addressbooks/user/default/",
		// A sibling sharing the prefix string.
		"/dav/calendars/user/default-backup/",
		// Climbing out and back.
		"/dav/calendars/user/work/../../../addressbooks/user/default/",
	} {
		if _, err := requireCalendarPath(in, cals()); err == nil {
			t.Errorf("%q should be refused", in)
		}
	}

	if _, err := requireCalendarPath("/dav/calendars/user/default/", nil); err == nil {
		t.Error("unresolved calendars should refuse, not allow")
	}
}

// An account with no calendar is refused every path, as one that is not the
// user's, not as an internal error: 403, which the page reads as a refusal.
func TestWithNoCalendarEveryPathIsRefused(t *testing.T) {
	for _, calendars := range [][]caldav.Calendar{nil, {}} {
		_, err := requireCalendarPath("/dav/calendars/user/default/", calendars)
		var refused *alps.HTTPError
		if !errors.As(err, &refused) || refused.Code != http.StatusForbidden {
			t.Errorf("a calendar path with %d calendars listed: %v, want 403", len(calendars), err)
		}
		_, err = requireCalendarObjectPath("/dav/calendars/user/default/event.ics", calendars)
		if !errors.As(err, &refused) || refused.Code != http.StatusForbidden {
			t.Errorf("an object path with %d calendars listed: %v, want 403", len(calendars), err)
		}
	}
}

func TestRequireCalendarObjectPath(t *testing.T) {
	for _, in := range []string{
		"/dav/calendars/user/default/event.ics",
		"/dav/calendars/user/work/a/b.ics",
	} {
		if _, err := requireCalendarObjectPath(in, cals()); err != nil {
			t.Errorf("%q should be accepted: %v", in, err)
		}
	}

	for _, in := range []string{
		"",
		// The calendar itself: a DELETE of it removes every event in it.
		"/dav/calendars/user/default/",
		"/dav/calendars/user/default",
		// Outside every calendar: another collection, a sibling sharing the
		// prefix string, and a path that climbs out and back.
		"/dav/addressbooks/user/default/abc.vcf",
		"/dav/calendars/user/default-backup/event.ics",
		"/dav/calendars/user/default/../../addressbooks/user/default/abc.vcf",
	} {
		if _, err := requireCalendarObjectPath(in, cals()); err == nil {
			t.Errorf("%q should be refused", in)
		}
	}
}
