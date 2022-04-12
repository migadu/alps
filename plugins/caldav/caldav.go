package alpscaldav

import (
	"fmt"
	"net/http"
	"net/url"

	"git.sr.ht/~migadu/alps"
	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav/caldav"
)

var errNoCalendar = fmt.Errorf("caldav: no calendar found")

type authRoundTripper struct {
	upstream http.RoundTripper
	session  *alps.Session
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	rt.session.SetHTTPBasicAuth(req)
	return rt.upstream.RoundTrip(req)
}

func newClient(u *url.URL, session *alps.Session) (*caldav.Client, error) {
	rt := authRoundTripper{
		upstream: http.DefaultTransport,
		session:  session,
	}
	c, err := caldav.NewClient(&http.Client{Transport: &rt}, u.String())
	if err != nil {
		return nil, fmt.Errorf("failed to create CalDAV client: %v", err)
	}

	return c, nil
}

func getCalendarsByCompType(u *url.URL, session *alps.Session, comp string) (*caldav.Client, []caldav.Calendar, error) {
	c, err := newClient(u, session)
	if err != nil {
		return nil, nil, err
	}

	principal, err := c.FindCurrentUserPrincipal()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query CalDAV principal: %v", err)
	}

	calendarHomeSet, err := c.FindCalendarHomeSet(principal)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query CalDAV calendar home set: %v", err)
	}

	calendars, err := c.FindCalendars(calendarHomeSet)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to find calendars: %v", err)
	}

	var cals []caldav.Calendar
	for _, cal := range calendars {
		supportedComps := cal.SupportedComponentSet
		if len(supportedComps) == 0 || supportedComps[0] == comp {
			cals = append(cals, cal)
		}
	}
	if len(cals) == 0 {
		return nil, nil, errNoCalendar
	}

	return c, cals, nil
}

func getCalendar(u *url.URL, session *alps.Session) (*caldav.Client, *caldav.Calendar, error) {
	c, calendars, err := getCalendarsByCompType(u, session, ical.CompEvent)
	if err != nil {
		return nil, nil, err
	}
	return c, &calendars[0], err
}

type CalendarObject struct {
	*caldav.CalendarObject
}

func newCalendarObjectList(cos []caldav.CalendarObject) []CalendarObject {
	l := make([]CalendarObject, len(cos))
	for i := range cos {
		l[i] = CalendarObject{&cos[i]}
	}
	return l
}

func (ao CalendarObject) URL() string {
	return "/calendar/" + url.PathEscape(ao.Path)
}
