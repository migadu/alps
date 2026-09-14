package alpscaldav

import (
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-ical"
	"github.com/migadu/alps/internal/itip"
)

func taskBody(title string, assignees ...Person) map[string]any {
	m := map[string]any{"title": title, "calendarPath": testCalendar}
	if assignees != nil {
		m["attendees"] = assignees
	}
	return m
}

// A task Grace assigned to Ada.
const assigned = `BEGIN:VCALENDAR
PRODID:-//test//EN
VERSION:2.0
METHOD:REQUEST
BEGIN:VTODO
UID:report@example.org
DTSTAMP:20260914T101500Z
SEQUENCE:0
SUMMARY:Write the report
DUE;VALUE=DATE:20260920
ORGANIZER;CN=Grace Hopper:mailto:grace@example.org
ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:ada@example.com
END:VTODO
END:VCALENDAR
`

func (h *harness) postTask(url string, body any) TaskData {
	h.t.Helper()
	r := h.do("POST", url, body)
	h.expect(r, http.StatusOK)
	var task TaskData
	h.decode(r, &task)
	return task
}

func TestAssigningATaskSendsItToTheAssignee(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	grace := Person{Email: "grace@example.org"}
	task := h.postTask("/calendar/tasks", taskBody("Write the report", grace))
	if task.Role != "organizer" || len(task.Attendees) != 1 || task.Attendees[0].Email != "grace@example.org" || !task.Sent {
		t.Fatalf("task %+v", task)
	}
	sent := mails.messages()
	if len(sent) != 1 || recipients(sent[0]) != "grace@example.org" {
		t.Fatalf("sent %d", len(sent))
	}
	method, cal, _ := calendarPart(t, sent[0])
	if method != "REQUEST" || itip.Master(cal).Name != ical.CompToDo {
		t.Fatalf("%s %s", method, itip.Master(cal).Name)
	}

	edit := taskBody("Write the annual report", grace)
	edit["etag"] = task.ETag
	task = h.postTask("/calendar/tasks/"+pathParam(task.Path)+"/edit", edit)
	if len(mails.messages()) != 2 || itip.Sequence(itip.Master(h.dav.get(t, task.Path).Data)) != 1 {
		t.Fatalf("sent %d", len(mails.messages()))
	}
	quiet := taskBody("Write the report, briefly", grace)
	quiet["notify"] = false
	if task = h.postTask("/calendar/tasks/"+pathParam(task.Path)+"/edit", quiet); task.Sent || len(mails.messages()) != 2 {
		t.Fatalf("told when asked not to: %d", len(mails.messages()))
	}

	// The organizer's own tick is their own record.
	h.postTask("/calendar/tasks/"+pathParam(task.Path)+"/complete", map[string]bool{"done": true})
	if len(mails.messages()) != 2 {
		t.Fatalf("a tick mailed the assignee: %d", len(mails.messages()))
	}

	r := h.do("GET", "/calendar/tasks", nil)
	h.expect(r, http.StatusOK)
	var listing struct {
		Tasks      []TaskData
		Scheduling string
	}
	h.decode(r, &listing)
	if listing.Scheduling != "email" || len(listing.Tasks) != 1 || listing.Tasks[0].Role != "organizer" {
		t.Fatalf("listing %+v", listing)
	}

	h.expect(h.do("DELETE", "/calendar/tasks/"+pathParam(task.Path), nil), http.StatusOK)
	sent = mails.messages()
	if method, _, to := func() (string, *ical.Calendar, string) {
		m, c, _ := calendarPart(t, sent[len(sent)-1])
		return m, c, recipients(sent[len(sent)-1])
	}(); len(sent) != 3 || method != "CANCEL" || to != "grace@example.org" {
		t.Fatalf("deleting: %d sent, %s to %s", len(sent), method, to)
	}
}

func TestAssigneeTickIsTheirAnswer(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	objectPath := testCalendar + "report.ics"
	h.dav.save(objectPath, itip.Stored(parseICS(t, assigned)))

	r := h.do("GET", "/calendar/tasks", nil)
	var listing struct{ Tasks []TaskData }
	h.decode(r, &listing)
	if got := listing.Tasks[0]; got.Role != "attendee" || got.Answer != "needs-action" || got.Organizer == nil || got.Organizer.Name != "Grace Hopper" {
		t.Fatalf("listed %+v", got)
	}

	replyStatus := func(n int) string {
		t.Helper()
		sent := mails.messages()
		if len(sent) != n {
			t.Fatalf("%d sent, want %d", len(sent), n)
		}
		method, reply, _ := calendarPart(t, sent[n-1])
		if method != "REPLY" || recipients(sent[n-1]) != "grace@example.org" {
			t.Fatalf("%s to %s", method, recipients(sent[n-1]))
		}
		return itip.Attendees(itip.Master(reply))[0].Status
	}

	task := h.postTask("/calendar/tasks/"+pathParam(objectPath)+"/complete", map[string]any{"done": true, "lang": "de"})
	if task.Status != taskCompleted || task.Answer != "completed" || !task.Sent {
		t.Fatalf("task %+v", task)
	}
	if got := replyStatus(1); got != itip.Completed {
		t.Fatalf("replied %s", got)
	}

	h.postTask("/calendar/tasks/"+pathParam(objectPath)+"/complete", map[string]any{"done": false})
	if got := replyStatus(2); got != itip.Accepted {
		t.Fatalf("reopened, replied %s", got)
	}

	// Finished in the editor, as with a tick.
	edit := taskBody("Write the report")
	edit["status"] = taskCompleted
	h.postTask("/calendar/tasks/"+pathParam(objectPath)+"/edit", edit)
	if got := replyStatus(3); got != itip.Completed {
		t.Fatalf("edited, replied %s", got)
	}
	// A save that finishes nothing is not an answer.
	edit["description"] = "Draft attached"
	h.postTask("/calendar/tasks/"+pathParam(objectPath)+"/edit", edit)
	replyStatus(3)
}

func TestRepeatingAssignedTaskMovingOnIsNoAnswer(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	objectPath := testCalendar + "report.ics"
	h.dav.save(objectPath, itip.Stored(parseICS(t, strings.Replace(assigned, "DUE;VALUE=DATE:20260920", "DUE;VALUE=DATE:20260920\nRRULE:FREQ=WEEKLY", 1))))
	task := h.postTask("/calendar/tasks/"+pathParam(objectPath)+"/complete", map[string]bool{"done": true})
	if task.Status == taskCompleted || task.Answer != "needs-action" || len(mails.messages()) != 0 {
		t.Fatalf("task %+v, sent %d", task, len(mails.messages()))
	}
}

func TestAssigneeTickOnAServerThatSchedules(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	front := &davFront{autoSchedule: true}
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: front.wrap})
	objectPath := testCalendar + "report.ics"
	h.dav.save(objectPath, itip.Stored(parseICS(t, assigned)))
	h.postTask("/calendar/tasks/"+pathParam(objectPath)+"/complete", map[string]bool{"done": true})
	if statusOf(t, h.dav.get(t, objectPath).Data, "ada@example.com") != itip.Completed || len(mails.messages()) != 0 {
		t.Fatalf("sent %d", len(mails.messages()))
	}
	r := h.do("GET", "/calendar/tasks", nil)
	h.expect(r, http.StatusOK)
	var listing struct{ Scheduling string }
	h.decode(r, &listing)
	if listing.Scheduling != "server" {
		t.Fatalf("the task listing says scheduling is %q", listing.Scheduling)
	}
}

func TestTaskFinishedWhenEveryAssigneeHasFinishedIt(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	mine := strings.Replace(strings.Replace(assigned, "ORGANIZER;CN=Grace Hopper:mailto:grace@example.org", "ORGANIZER:mailto:ada@example.com", 1),
		"mailto:ada@example.com\nEND:VTODO", "mailto:grace@example.org\nEND:VTODO", 1)
	// Listed among the attendees too, as some clients list an organizer: her
	// own answer is not an assignee's.
	mine = strings.Replace(mine, "END:VTODO", "ATTENDEE;PARTSTAT=ACCEPTED:mailto:ada@example.com\nEND:VTODO", 1)
	both := strings.Replace(strings.Replace(mine, "report@example.org", "slides@example.org", 1),
		"END:VTODO", "ATTENDEE;PARTSTAT=NEEDS-ACTION:mailto:charles@example.com\nEND:VTODO", 1)
	h.dav.save(testCalendar+"report.ics", itip.Stored(parseICS(t, mine)))
	h.dav.save(testCalendar+"slides.ics", itip.Stored(parseICS(t, both)))

	for name, ics := range map[string]string{"Report done": mine, "Slides done": both} {
		answer := strings.Replace(withMethod(ics, "REPLY"), "PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:grace@example.org", "PARTSTAT=COMPLETED:mailto:grace@example.org", 1)
		uid := h.deliver("grace@example.org", name, answer)
		if view := h.invitation(uid); view.State != invReply || view.Kind != "task" {
			t.Fatalf("%s: %+v", name, view)
		}
		h.expect(h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: uid}), http.StatusOK)
	}

	if got := taskStatus(itip.Master(h.dav.get(t, testCalendar+"report.ics").Data)); got != taskCompleted {
		t.Fatalf("Grace finished the report she alone had, and it is %s", got)
	}
	slides := h.dav.get(t, testCalendar+"slides.ics").Data
	if got := taskStatus(itip.Master(slides)); got == taskCompleted || statusOf(t, slides, "grace@example.org") != itip.Completed {
		t.Fatalf("the slides are %s while Charles has not finished", got)
	}
}

// As the editor sends it when told whether to tell: a new assignment goes
// out when told to, and not when told not to.
func TestAssigningATaskAsTold(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	told := taskBody("Write the report", Person{Email: "grace@example.org"})
	told["notify"] = true
	if task := h.postTask("/calendar/tasks", told); !task.Sent || len(mails.messages()) != 1 {
		t.Fatalf("told to tell: sent %v, %d messages", task.Sent, len(mails.messages()))
	}
	quiet := taskBody("Write the slides", Person{Email: "grace@example.org"})
	quiet["notify"] = false
	if task := h.postTask("/calendar/tasks", quiet); task.Sent || len(mails.messages()) != 1 {
		t.Fatalf("told not to: sent %v, %d messages", task.Sent, len(mails.messages()))
	}
}
