package koushincaldav

import (
	"fmt"
	"net/http"
	"net/url"

	"git.sr.ht/~emersion/koushin"
	"github.com/emersion/go-webdav/caldav"
)

var errNoCalendar = fmt.Errorf("caldav: no calendar found")

type authRoundTripper struct {
	upstream http.RoundTripper
	session  *koushin.Session
}

func (rt *authRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	rt.session.SetHTTPBasicAuth(req)
	return rt.upstream.RoundTrip(req)
}

func newClient(u *url.URL, session *koushin.Session) (*caldav.Client, error) {
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

func getCalendar(u *url.URL, session *koushin.Session) (*caldav.Client, *caldav.Calendar, error) {
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
	if len(calendars) == 0 {
		return nil, nil, errNoCalendar
	}
	return c, &calendars[0], nil
}
