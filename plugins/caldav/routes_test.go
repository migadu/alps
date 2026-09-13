package alpscaldav

import (
	"net/url"
	"testing"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav/caldav"
)

func TestResolveDAVPath(t *testing.T) {
	cases := []struct {
		name     string
		basePath string
		href     string
		want     string
	}{
		{"root base, absolute href", "/", "/dav/calendars/u/c/", "/dav/calendars/u/c/"},
		{"non-root base does not double-prefix", "/dav/", "/dav/calendars/u/c/", "/dav/calendars/u/c/"},
		// path.Join cleans the trailing slash; the handler re-adds it afterward.
		{"relative href joins onto base", "/dav/", "sub/c/", "/dav/sub/c"},
		{"full URL href uses its path", "/dav/", "https://dav.example.com/dav/calendars/u/c/", "/dav/calendars/u/c/"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			base := &url.URL{Scheme: "https", Host: "dav.example.com", Path: tc.basePath}
			if got := resolveDAVPath(base, tc.href); got != tc.want {
				t.Errorf("resolveDAVPath(%q, %q) = %q, want %q", tc.basePath, tc.href, got, tc.want)
			}
		})
	}
}

func TestXMLEscape(t *testing.T) {
	cases := map[string]string{
		"Me & You":                  "Me &amp; You",
		"<script>alert(1)</script>": "&lt;script&gt;alert(1)&lt;/script&gt;",
		"plain":                     "plain",
		`a"b`:                       "a&#34;b",
	}
	for in, want := range cases {
		if got := xmlEscape(in); got != want {
			t.Errorf("xmlEscape(%q) = %q, want %q", in, got, want)
		}
	}
}

func calendarObjectOf(event *ical.Event) *caldav.CalendarObject {
	cal := ical.NewCalendar()
	cal.Children = append(cal.Children, event.Component)
	return &caldav.CalendarObject{Data: cal}
}

// All-day events are written as DATE values and reported with an explicit
// allDay, rather than stored as UTC-midnight DATE-TIMEs for the client to
// recognise by their suffix.
func TestAllDayEvents(t *testing.T) {
	day := time.Date(2024, 9, 8, 0, 0, 0, 0, time.UTC)
	next := day.AddDate(0, 0, 1)

	t.Run("written as dates and read back as all-day", func(t *testing.T) {
		event := ical.NewEvent()
		setEventTimes(event, day, next, true)

		start := event.Props.Get(ical.PropDateTimeStart)
		if start.Value != "20240908" || start.ValueType() != ical.ValueDate {
			t.Fatalf("DTSTART = %q (%s), want the DATE 20240908", start.Value, start.ValueType())
		}
		if end := event.Props.Get(ical.PropDateTimeEnd); end.Value != "20240909" {
			t.Fatalf("DTEND = %q, want the exclusive DATE 20240909", end.Value)
		}

		data, err := extractEventData(calendarObjectOf(event))
		if err != nil {
			t.Fatal(err)
		}
		if !data.AllDay || data.Start != "2024-09-08T00:00:00Z" || data.End != "2024-09-09T00:00:00Z" {
			t.Fatalf("got allDay=%v %s..%s", data.AllDay, data.Start, data.End)
		}
	})

	t.Run("switching back to timed drops the DATE type", func(t *testing.T) {
		event := ical.NewEvent()
		setEventTimes(event, day, next, true)
		setEventTimes(event, day.Add(10*time.Hour), day.Add(11*time.Hour), false)

		if start := event.Props.Get(ical.PropDateTimeStart); start.Value != "20240908T100000Z" || start.ValueType() == ical.ValueDate {
			t.Fatalf("DTSTART = %q (%s), want a UTC DATE-TIME", start.Value, start.ValueType())
		}
		data, err := extractEventData(calendarObjectOf(event))
		if err != nil {
			t.Fatal(err)
		}
		if data.AllDay {
			t.Fatal("a 10:00-11:00 event was reported as all-day")
		}
	})

	t.Run("a date with no DTEND lasts one day", func(t *testing.T) {
		event := ical.NewEvent()
		event.Props.SetDate(ical.PropDateTimeStart, day)

		data, err := extractEventData(calendarObjectOf(event))
		if err != nil {
			t.Fatal(err)
		}
		if !data.AllDay || data.End != "2024-09-09T00:00:00Z" {
			t.Fatalf("got allDay=%v end=%s", data.AllDay, data.End)
		}
	})

	t.Run("events already stored as UTC-midnight date-times stay all-day", func(t *testing.T) {
		event := ical.NewEvent()
		event.Props.SetDateTime(ical.PropDateTimeStart, day)
		event.Props.SetDateTime(ical.PropDateTimeEnd, next)

		data, err := extractEventData(calendarObjectOf(event))
		if err != nil {
			t.Fatal(err)
		}
		if !data.AllDay {
			t.Fatal("an event alps wrote before this change is no longer all-day")
		}
	})

	t.Run("a timed event at local midnight is not all-day", func(t *testing.T) {
		berlin, err := time.LoadLocation("Europe/Berlin")
		if err != nil {
			t.Skip("no tzdata:", err)
		}
		event := ical.NewEvent()
		event.Props.SetDateTime(ical.PropDateTimeStart, time.Date(2024, 9, 8, 0, 0, 0, 0, berlin))
		event.Props.SetDateTime(ical.PropDateTimeEnd, time.Date(2024, 9, 9, 0, 0, 0, 0, berlin))

		data, err := extractEventData(calendarObjectOf(event))
		if err != nil {
			t.Fatal(err)
		}
		if data.AllDay {
			t.Fatal("a TZID midnight-to-midnight event was reported as all-day")
		}
	})
}
