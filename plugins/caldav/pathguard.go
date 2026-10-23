package alpscaldav

import (
	"net/http"
	"path"
	"strings"

	"github.com/emersion/go-webdav/caldav"
	"github.com/migadu/alps"
)

func normalizeDAVPath(raw string) string {
	return path.Clean("/" + strings.TrimPrefix(raw, "/"))
}

// requireCalendarPath checks that a client-supplied path names one of the
// user's OWN calendars, and returns it normalized.
//
// `DELETE /calendar/calendars/{path}` hands its argument to a DELETE, which
// removes a resource and everything under it. The only guard was a string test
// for a name ending in "default" — which is the name-based reasoning this review
// has corrected three times elsewhere, and it does nothing at all about a path
// pointing somewhere other than a calendar.
func requireCalendarPath(raw string, calendars []caldav.Calendar) (string, error) {
	if raw == "" {
		return "", alps.NewHTTPError(http.StatusBadRequest, "missing calendar path")
	}
	// With no calendar listed, no path is one of them. That is refused as
	// any other path that is not, and not as an internal error: an account
	// with no calendar is a state the server can be in.
	if len(calendars) == 0 {
		return "", alps.NewHTTPError(http.StatusForbidden, "path is not one of your calendars")
	}

	cleaned := normalizeDAVPath(raw)
	for _, cal := range calendars {
		if normalizeDAVPath(cal.Path) == cleaned {
			return cleaned, nil
		}
	}
	return "", alps.NewHTTPError(http.StatusForbidden, "path is not one of your calendars")
}

// requireCalendarObjectPath checks that a path names an object INSIDE one of the
// user's calendars.
//
// Same reasoning as carddav's requireObjectPath: the "delete one event" route
// also reached a DELETE, so an unconstrained path turned it into "delete the
// whole calendar". The collection itself is rejected — deleting a calendar is
// what the route above is for, and it has its own rules.
func requireCalendarObjectPath(raw string, calendars []caldav.Calendar) (string, error) {
	if raw == "" {
		return "", alps.NewHTTPError(http.StatusBadRequest, "missing object path")
	}
	// As in requireCalendarPath: with no calendar, every path is outside them.
	if len(calendars) == 0 {
		return "", alps.NewHTTPError(http.StatusForbidden, "path is outside your calendars")
	}

	cleaned := normalizeDAVPath(raw)
	for _, cal := range calendars {
		base := normalizeDAVPath(cal.Path) + "/"
		// `cleaned+"/" == base` is the collection itself; strictly inside only.
		if strings.HasPrefix(cleaned+"/", base) && cleaned+"/" != base {
			return cleaned, nil
		}
	}
	return "", alps.NewHTTPError(http.StatusForbidden, "path is outside your calendars")
}
