package alpscaldav

import (
	"testing"

	"github.com/emersion/go-webdav/caldav"
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
		// The calendar itself: RemoveAll here deletes every event in it.
		"/dav/calendars/user/default/",
		"/dav/calendars/user/default",
		"/dav/addressbooks/user/default/abc.vcf",
		"/dav/calendars/user/default-backup/event.ics",
		"/dav/calendars/user/default/../../addressbooks/user/default/abc.vcf",
	} {
		if _, err := requireCalendarObjectPath(in, cals()); err == nil {
			t.Errorf("%q should be refused", in)
		}
	}
}
