package alpscaldav

import (
	"net/http"
	"strconv"
	"strings"
	"testing"
)

// deletesAnswered stands in front of the CalDAV server and answers every
// DELETE with *status, when it is set.
func deletesAnswered(status *int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == http.MethodDelete && *status != 0 {
				w.WriteHeader(*status)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// The routes that delete, and what each deletes. The calendar is one the
// server still lists: a calendar it no longer lists is refused by
// requireCalendarPath before any DELETE is sent.
var deleteRoutes = map[string]string{
	"event":    "/calendar/events/" + pathParam(testCalendar+"standup.ics"),
	"task":     "/calendar/tasks/" + pathParam(testCalendar+"chores.ics"),
	"calendar": "/calendar/calendars/" + pathParam(testCalendar),
}

// An event or a task already gone, deleted from another device or by a second
// click, is what a delete asks for. The CalDAV server's 404 used to come back
// as 500, so the page said the delete had failed. So it did for a calendar
// deleted elsewhere between being listed and being deleted.
func TestDeletingWhatIsAlreadyGoneSucceeds(t *testing.T) {
	status := http.StatusNotFound
	h := startHarness(t, harnessOptions{wrap: deletesAnswered(&status)})
	for what, route := range deleteRoutes {
		if r := h.do("DELETE", route, nil); r.status != http.StatusOK {
			t.Errorf("deleting the %s already gone: status %d: %s", what, r.status, r.body)
		}
	}
}

// A delete the server refuses keeps the server's reason: a read-only calendar
// or a version conflict is not an outage. Any other failure is still an
// internal error.
func TestDeleteRefusalsKeepTheirStatus(t *testing.T) {
	var status int
	h := startHarness(t, harnessOptions{wrap: deletesAnswered(&status)})
	for refused, want := range map[int]int{
		http.StatusForbidden:           http.StatusForbidden,
		http.StatusConflict:            http.StatusConflict,
		http.StatusPreconditionFailed:  http.StatusPreconditionFailed,
		http.StatusInternalServerError: http.StatusInternalServerError,
	} {
		status = refused
		for what, route := range deleteRoutes {
			if r := h.do("DELETE", route, nil); r.status != want {
				t.Errorf("deleting the %s refused with %s: status %d, want %d: %s", what, strconv.Itoa(refused), r.status, want, r.body)
			}
		}
	}
}

// Applying an organizer's cancellation deletes the user's copy, and a refusal
// of that delete keeps its status as any other delete does.
func TestCancellationRefusedKeepsItsStatus(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	front := &davFront{}
	var status int
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: func(next http.Handler) http.Handler {
		return deletesAnswered(&status)(front.wrap(next))
	}})
	uid := h.deliver("grace@example.org", "Invitation", request)
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"}), http.StatusOK)
	cancel := h.deliver("grace@example.org", "Cancelled", strings.Replace(withMethod(request, "CANCEL"), "SEQUENCE:0", "SEQUENCE:1", 1))

	status = http.StatusForbidden
	h.expect(h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: cancel}), http.StatusForbidden)
	if copies := h.copies(); len(copies) != 1 {
		t.Fatalf("calendar %v", copies)
	}
}
