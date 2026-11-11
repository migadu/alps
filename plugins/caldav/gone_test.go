package alpscaldav

import (
	"net/http"
	"testing"
)

// An event or a task deleted from another device is not there to write. Each
// of these reads it first, and answered the CalDAV server's 404 as 500, so
// the page said the save had failed for something that is simply gone.
func TestWritingWhatIsGoneIsNotFound(t *testing.T) {
	event := "/calendar/events/" + pathParam(testCalendar+"standup.ics")
	task := "/calendar/tasks/" + pathParam(testCalendar+"chores.ics")
	for what, req := range map[string]struct {
		route string
		body  any
	}{
		"event edited":   {event + "/edit", EventData{Summary: "Standup"}},
		"event answered": {event + "/respond", map[string]string{"status": "accepted"}},
		"task edited":    {task + "/edit", TaskInput{Title: "Chores"}},
		"task completed": {task + "/complete", map[string]bool{"done": true}},
		"task answered":  {task + "/respond", map[string]string{"status": "accepted"}},
	} {
		t.Run(what, func(t *testing.T) {
			h := newHarness(t)
			h.expect(h.do("POST", req.route, req.body), http.StatusNotFound)
		})
	}
}
