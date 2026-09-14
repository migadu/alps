package alpscaldav

import (
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav/caldav"
)

const (
	testReminders = "/ada/calendars/reminders/"
	testMeetings  = "/ada/calendars/meetings/"
)

func threeCalendars() []caldav.Calendar {
	return []caldav.Calendar{
		{Path: testCalendar, Name: "Work", SupportedComponentSet: []string{"VEVENT", "VTODO"}},
		{Path: testReminders, Name: "Reminders", SupportedComponentSet: []string{"VTODO"}},
		{Path: testMeetings, Name: "Meetings", SupportedComponentSet: []string{"VEVENT"}},
	}
}

// setProp adds a property as another client would have written it.
func setProp(name, value string, params ...string) func(*ical.Component) {
	return func(comp *ical.Component) {
		prop := ical.NewProp(name)
		prop.Value = value
		for i := 0; i+1 < len(params); i += 2 {
			prop.Params[params[i]] = []string{params[i+1]}
		}
		comp.Props[name] = append(comp.Props[name], *prop)
	}
}

func newTodo(uid string, props ...func(*ical.Component)) *ical.Component {
	todo := ical.NewComponent(ical.CompToDo)
	todo.Props.SetText(ical.PropUID, uid)
	todo.Props.SetDateTime(ical.PropDateTimeStamp, time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC))
	for _, set := range props {
		set(todo)
	}
	return todo
}

func calendarOf(components ...*ical.Component) *ical.Calendar {
	cal := ical.NewCalendar()
	cal.Props.SetText(ical.PropProductID, "-//phone//EN")
	cal.Props.SetText(ical.PropVersion, "2.0")
	cal.Children = append(cal.Children, components...)
	return cal
}

func valueIn(comp *ical.Component, name string) string {
	if prop := comp.Props.Get(name); prop != nil {
		return prop.Value
	}
	return ""
}

func storedTask(t *testing.T, h *harness, objectPath string) *ical.Component {
	t.Helper()
	todo := masterTask(h.dav.get(t, objectPath).Data)
	if todo == nil {
		t.Fatalf("%s holds no task", objectPath)
	}
	return todo
}

type taskListing struct {
	Tasks           []TaskData
	Calendars       []CalendarData
	FailedCalendars int
}

func (h *harness) listTasks(query string) taskListing {
	h.t.Helper()
	r := h.do("GET", "/calendar/tasks"+query, nil)
	h.expect(r, http.StatusOK)
	var listing taskListing
	h.decode(r, &listing)
	return listing
}

func titles(tasks []TaskData) string {
	var out []string
	for _, task := range tasks {
		out = append(out, task.Title)
	}
	return strings.Join(out, ", ")
}

func findTask(t *testing.T, tasks []TaskData, title string) TaskData {
	t.Helper()
	for _, task := range tasks {
		if task.Title == title {
			return task
		}
	}
	t.Fatalf("no task %q among %s", title, titles(tasks))
	return TaskData{}
}

func TestTaskListing(t *testing.T) {
	h := newHarness(t)
	h.dav.calendars = threeCalendars()
	h.dav.save(testCalendar+"milk.ics", calendarOf(newTodo("milk", setProp(ical.PropSummary, "Buy milk"))))
	h.dav.save(testCalendar+"report.ics", calendarOf(newTodo("report",
		setProp(ical.PropSummary, "Write report"),
		setProp(ical.PropDue, "20260915", "VALUE", "DATE"),
		setProp(ical.PropPriority, "1"),
		setProp(ical.PropStatus, "IN-PROCESS"),
	)))
	h.dav.save(testReminders+"old.ics", calendarOf(newTodo("old",
		setProp(ical.PropSummary, "Renew passport"),
		setProp(ical.PropCompleted, "20260102T100000Z"),
	)))
	h.dav.save(testReminders+"dropped.ics", calendarOf(newTodo("dropped",
		setProp(ical.PropSummary, "Learn the oboe"),
		setProp(ical.PropStatus, "CANCELLED"),
	)))
	h.dav.save(testCalendar+"standup.ics", eventCalendar("standup", "Standup"))

	all := h.listTasks("")
	if len(all.Tasks) != 4 {
		t.Fatalf("listed %s, want the four tasks and no event", titles(all.Tasks))
	}
	if len(all.Calendars) != 2 || all.Calendars[0].Path != testCalendar || all.Calendars[1].Path != testReminders {
		t.Fatalf("task lists %+v, want Work and Reminders", all.Calendars)
	}
	for _, queried := range h.dav.queried {
		if queried == testMeetings {
			t.Fatal("an events-only calendar was asked for tasks")
		}
	}

	report := findTask(t, all.Tasks, "Write report")
	if report.Due != "2026-09-15T00:00:00Z" || !report.AllDay || report.Priority != 1 || report.Status != taskInProcess ||
		report.CalendarPath != testCalendar || report.ETag == "" {
		t.Fatalf("report read as %+v", report)
	}
	if milk := findTask(t, all.Tasks, "Buy milk"); milk.Due != "" || milk.Status != taskNeedsAction {
		t.Fatalf("an undated task with no status read as %+v", milk)
	}
	if old := findTask(t, all.Tasks, "Renew passport"); old.Status != taskCompleted {
		t.Fatalf("a task with only a completion time read as %q", old.Status)
	}

	if active := h.listTasks("?scope=active"); titles(active.Tasks) != "Buy milk, Write report" {
		t.Fatalf("active: %s", titles(active.Tasks))
	}
	if closed := h.listTasks("?scope=closed"); titles(closed.Tasks) != "Learn the oboe, Renew passport" {
		t.Fatalf("closed: %s", titles(closed.Tasks))
	}
	h.expect(h.do("GET", "/calendar/tasks?scope=someday", nil), http.StatusBadRequest)
}

func TestTaskCreate(t *testing.T) {
	h := newHarness(t)
	h.dav.calendars = threeCalendars()

	r := h.do("POST", "/calendar/tasks", TaskInput{
		Title: "Pay rent", Due: "2026-10-01T00:00:00Z", AllDay: true, Priority: 5, CalendarPath: testReminders,
	})
	h.expect(r, http.StatusOK)
	var created TaskData
	h.decode(r, &created)
	if !strings.HasPrefix(created.Path, testReminders) || created.CalendarPath != testReminders || created.Status != taskNeedsAction {
		t.Fatalf("created %+v", created)
	}
	stored := h.dav.get(t, created.Path)
	todo := masterTask(stored.Data)
	due := todo.Props.Get(ical.PropDue)
	if created.ETag != stored.ETag || valueIn(todo, ical.PropSummary) != "Pay rent" ||
		due.Value != "20261001" || due.ValueType() != ical.ValueDate ||
		valueIn(todo, ical.PropPriority) != "5" || valueIn(todo, ical.PropStatus) != "NEEDS-ACTION" ||
		valueIn(todo, ical.PropUID) == "" || todo.Props.Get(ical.PropCreated) == nil {
		t.Fatalf("stored %+v as version %q, returned %q", todo.Props, stored.ETag, created.ETag)
	}

	// With no list named, the first that takes tasks.
	r = h.do("POST", "/calendar/tasks", TaskInput{Title: "Call the bank"})
	h.expect(r, http.StatusOK)
	h.decode(r, &created)
	if created.CalendarPath != testCalendar {
		t.Fatalf("landed in %q", created.CalendarPath)
	}

	h.expect(h.do("POST", "/calendar/tasks", TaskInput{Title: "Book a room", CalendarPath: testMeetings}), http.StatusBadRequest)
	h.expect(h.do("POST", "/calendar/tasks", TaskInput{Title: "  "}), http.StatusBadRequest)
	h.expect(h.do("POST", "/calendar/tasks", TaskInput{Title: "Water plants", RRule: "FREQ=WEEKLY"}), http.StatusBadRequest)
	h.expect(h.do("POST", "/calendar/tasks", TaskInput{Title: "Water plants", Priority: 10}), http.StatusBadRequest)
}

// The editor has fields for a handful of properties. Everything else another
// client put on the task survives an edit made here.
func TestTaskEditKeepsWhatTheEditorCannotShow(t *testing.T) {
	berlin, err := time.LoadLocation("Europe/Berlin")
	if err != nil {
		t.Skip("no tzdata:", err)
	}
	h := newHarness(t)
	objectPath := testCalendar + "report.ics"
	master := newTodo("report",
		setProp(ical.PropSummary, "Write report"),
		setProp(ical.PropDateTimeStart, "20260915T090000", "TZID", "Europe/Berlin"),
		setProp(ical.PropDue, "20260915T170000", "TZID", "Europe/Berlin"),
		setProp(ical.PropRecurrenceRule, "FREQ=WEEKLY"),
		setProp(ical.PropCategories, "Work"),
		setProp("X-APPLE-SORT-ORDER", "42"),
	)
	alarm := ical.NewComponent("VALARM")
	setProp("ACTION", "DISPLAY")(alarm)
	setProp("TRIGGER", "-PT15M")(alarm)
	setProp(ical.PropDescription, "Reminder")(alarm)
	master.Children = append(master.Children, alarm)
	override := newTodo("report",
		setProp(ical.PropSummary, "Write report (short week)"),
		setProp(ical.PropRecurrenceID, "20260922T090000", "TZID", "Europe/Berlin"),
	)
	// The override first: the task is the component without a RECURRENCE-ID,
	// wherever it sits.
	h.dav.save(objectPath, calendarOf(override, master))

	opened := findTask(t, h.listTasks("").Tasks, "Write report")
	if due, _ := time.Parse(time.RFC3339, opened.Due); !due.Equal(time.Date(2026, 9, 15, 17, 0, 0, 0, berlin)) {
		t.Fatalf("due read as %s", opened.Due)
	}

	edit := TaskInput{
		Title: "Write the report", Description: "Figures from finance", Due: opened.Due,
		Status: taskInProcess, Priority: 9, RRule: opened.RRule, ETag: opened.ETag,
	}
	r := h.do("POST", "/calendar/tasks/"+pathParam(objectPath)+"/edit", edit)
	h.expect(r, http.StatusOK)

	stored := h.dav.get(t, objectPath)
	todo := masterTask(stored.Data)
	due := todo.Props.Get(ical.PropDue)
	switch {
	case valueIn(todo, ical.PropSummary) != "Write the report" || valueIn(todo, ical.PropDescription) != "Figures from finance":
		t.Fatalf("fields not written: %+v", todo.Props)
	case due.Value != "20260915T170000" || due.Params.Get("TZID") != "Europe/Berlin":
		t.Fatalf("an unchanged due date was rewritten as %q %v", due.Value, due.Params)
	case valueIn(todo, "X-APPLE-SORT-ORDER") != "42" || valueIn(todo, ical.PropCategories) != "Work":
		t.Fatalf("other clients' properties lost: %+v", todo.Props)
	case len(todo.Children) != 1 || todo.Children[0].Name != "VALARM":
		t.Fatalf("the alarm was lost: %+v", todo.Children)
	case len(stored.Data.Children) != 2:
		t.Fatalf("the object holds %d components, want the task and its override", len(stored.Data.Children))
	}

	// The version the edit was opened at is gone now.
	h.expect(h.do("POST", "/calendar/tasks/"+pathParam(objectPath)+"/edit", edit), http.StatusPreconditionFailed)
}

func TestTaskCompleteRoute(t *testing.T) {
	h := newHarness(t)
	objectPath := testCalendar + "milk.ics"
	h.dav.save(objectPath, calendarOf(newTodo("milk", setProp(ical.PropSummary, "Buy milk"))))

	// Renamed on the phone between the tick's read and its write: the tick is
	// applied to the renamed task.
	once := sync.Once{}
	h.dav.beforePut = func() {
		once.Do(func() {
			h.dav.save(objectPath, calendarOf(newTodo("milk", setProp(ical.PropSummary, "Buy oat milk"))))
		})
	}
	r := h.do("POST", "/calendar/tasks/"+pathParam(objectPath)+"/complete", map[string]bool{"done": true})
	h.expect(r, http.StatusOK)
	var ticked TaskData
	h.decode(r, &ticked)

	todo := storedTask(t, h, objectPath)
	if valueIn(todo, ical.PropStatus) != "COMPLETED" || valueIn(todo, ical.PropSummary) != "Buy oat milk" || len(h.dav.ifMatch) != 2 {
		t.Fatalf("stored %+v after %d PUTs", todo.Props, len(h.dav.ifMatch))
	}
	if ticked.Status != taskCompleted || ticked.ETag != h.dav.get(t, objectPath).ETag || ticked.CalendarPath != testCalendar {
		t.Fatalf("answered %+v", ticked)
	}

	h.dav.beforePut = nil
	h.expect(h.do("POST", "/calendar/tasks/"+pathParam(objectPath)+"/complete", map[string]bool{"done": false}), http.StatusOK)
	if todo := storedTask(t, h, objectPath); valueIn(todo, ical.PropStatus) != "NEEDS-ACTION" || todo.Props.Get(ical.PropCompleted) != nil {
		t.Fatalf("reopened as %+v", todo.Props)
	}
}

func TestTaskRoutesStayInsideCalendars(t *testing.T) {
	h := newHarness(t)
	objectPath := testCalendar + "milk.ics"
	h.dav.save(objectPath, calendarOf(newTodo("milk", setProp(ical.PropSummary, "Buy milk"))))

	outside := "/ada/elsewhere/milk.ics"
	h.expect(h.do("POST", "/calendar/tasks/"+pathParam(outside)+"/edit", TaskInput{Title: "x"}), http.StatusForbidden)
	h.expect(h.do("POST", "/calendar/tasks/"+pathParam(outside)+"/complete", map[string]bool{"done": true}), http.StatusForbidden)
	h.expect(h.do("DELETE", "/calendar/tasks/"+pathParam(testCalendar), nil), http.StatusForbidden)

	h.expect(h.do("DELETE", "/calendar/tasks/"+pathParam(objectPath), nil), http.StatusOK)
	if len(h.listTasks("").Tasks) != 0 {
		t.Fatal("the deleted task is still listed")
	}
}

func TestCalendarsStateTheirComponents(t *testing.T) {
	h := newHarness(t)
	h.dav.calendars = []caldav.Calendar{threeCalendars()[1], threeCalendars()[2]}

	r := h.do("GET", "/calendar/calendars", nil)
	h.expect(r, http.StatusOK)
	var listing struct{ Calendars []CalendarData }
	h.decode(r, &listing)
	if len(listing.Calendars) != 2 || strings.Join(listing.Calendars[0].Components, ",") != "VTODO" {
		t.Fatalf("calendars %+v", listing.Calendars)
	}

	// An event with no calendar named goes to the first that takes events,
	// not to the task-only list listed before it.
	r = h.do("POST", "/calendar/events", EventData{Summary: "Standup", Start: "2026-09-14T09:00:00Z", End: "2026-09-14T10:00:00Z"})
	h.expect(r, http.StatusOK)
	var saved struct{ Path string }
	h.decode(r, &saved)
	if !strings.HasPrefix(saved.Path, testMeetings) {
		t.Fatalf("the event was created at %s", saved.Path)
	}

	h.dav.queried = nil
	h.expect(h.do("GET", "/calendar/events?start=2026-09-01T00:00:00Z&end=2026-10-01T00:00:00Z", nil), http.StatusOK)
	if strings.Join(h.dav.queried, ",") != testMeetings {
		t.Fatalf("events were looked for in %v", h.dav.queried)
	}
}

func TestApplyTask(t *testing.T) {
	now := time.Date(2026, 9, 14, 12, 0, 0, 0, time.UTC)
	apply := func(todo *ical.Component, in TaskInput) {
		t.Helper()
		due, err := in.parse()
		if err != nil {
			t.Fatal(err)
		}
		applyTask(todo, in, due, now)
	}

	t.Run("a changed due date is written in UTC and replaces a DURATION", func(t *testing.T) {
		todo := newTodo("x", setProp(ical.PropDateTimeStart, "20260914T090000Z"), setProp(ical.PropDuration, "PT1H"))
		apply(todo, TaskInput{Title: "x", Due: "2026-09-16T12:00:00Z"})
		if valueIn(todo, ical.PropDue) != "20260916T120000Z" || todo.Props.Get(ical.PropDuration) != nil {
			t.Fatalf("%+v", todo.Props)
		}
	})

	t.Run("a due date moved before the start drops the start", func(t *testing.T) {
		todo := newTodo("x", setProp(ical.PropDateTimeStart, "20260920T090000Z"))
		apply(todo, TaskInput{Title: "x", Due: "2026-09-18T09:00:00Z"})
		if todo.Props.Get(ical.PropDateTimeStart) != nil {
			t.Fatalf("DTSTART %q is after DUE", valueIn(todo, ical.PropDateTimeStart))
		}
	})

	t.Run("unless the task repeats, when the start moves to the due date", func(t *testing.T) {
		todo := newTodo("x", setProp(ical.PropDateTimeStart, "20260920T090000Z"))
		apply(todo, TaskInput{Title: "x", Due: "2026-09-18T09:00:00Z", RRule: "FREQ=WEEKLY"})
		if valueIn(todo, ical.PropDateTimeStart) != "20260918T090000Z" {
			t.Fatalf("DTSTART %q", valueIn(todo, ical.PropDateTimeStart))
		}
	})

	t.Run("an all-day due date makes the start a date too", func(t *testing.T) {
		todo := newTodo("x", setProp(ical.PropDateTimeStart, "20260914T090000Z"))
		apply(todo, TaskInput{Title: "x", Due: "2026-09-15T00:00:00Z", AllDay: true})
		start := todo.Props.Get(ical.PropDateTimeStart)
		if start.Value != "20260914" || start.ValueType() != ical.ValueDate {
			t.Fatalf("DTSTART %q (%s)", start.Value, start.ValueType())
		}
	})

	t.Run("a new repeat rule anchors a task with no start at its due date", func(t *testing.T) {
		todo := newTodo("x")
		apply(todo, TaskInput{Title: "x", Due: "2026-09-15T00:00:00Z", AllDay: true, RRule: "FREQ=WEEKLY"})
		if valueIn(todo, ical.PropDateTimeStart) != "20260915" || valueIn(todo, ical.PropRecurrenceRule) != "FREQ=WEEKLY" {
			t.Fatalf("%+v", todo.Props)
		}
	})

	t.Run("completion is dated once, and undone with the status", func(t *testing.T) {
		todo := newTodo("x")
		apply(todo, TaskInput{Title: "x", Status: taskCompleted})
		if valueIn(todo, ical.PropCompleted) != "20260914T120000Z" || valueIn(todo, ical.PropPercentComplete) != "100" {
			t.Fatalf("%+v", todo.Props)
		}
		now = now.Add(time.Hour)
		apply(todo, TaskInput{Title: "renamed", Status: taskCompleted})
		if valueIn(todo, ical.PropCompleted) != "20260914T120000Z" {
			t.Fatalf("editing a completed task re-dated its completion: %q", valueIn(todo, ical.PropCompleted))
		}
		apply(todo, TaskInput{Title: "renamed", Status: taskInProcess, PercentComplete: 40})
		if todo.Props.Get(ical.PropCompleted) != nil || valueIn(todo, ical.PropPercentComplete) != "40" || valueIn(todo, ical.PropStatus) != "IN-PROCESS" {
			t.Fatalf("%+v", todo.Props)
		}
	})

	t.Run("cleared fields are removed", func(t *testing.T) {
		todo := newTodo("x",
			setProp(ical.PropDescription, "notes"), setProp(ical.PropPriority, "1"),
			setProp(ical.PropDue, "20260915T090000Z"), setProp(ical.PropRecurrenceRule, "FREQ=DAILY"))
		apply(todo, TaskInput{Title: "x"})
		for _, name := range []string{ical.PropDescription, ical.PropPriority, ical.PropDue, ical.PropRecurrenceRule} {
			if todo.Props.Get(name) != nil {
				t.Errorf("%s kept", name)
			}
		}
	})
}

func TestCompleteTask(t *testing.T) {
	now := time.Date(2026, 9, 14, 12, 0, 0, 0, time.UTC)
	tick := func(t *testing.T, todo *ical.Component) {
		t.Helper()
		if err := completeTask(todo, true, now); err != nil {
			t.Fatal(err)
		}
	}
	open := func(t *testing.T, todo *ical.Component) {
		t.Helper()
		if valueIn(todo, ical.PropStatus) != "NEEDS-ACTION" || todo.Props.Get(ical.PropCompleted) != nil {
			t.Fatalf("not left open: %+v", todo.Props)
		}
	}

	t.Run("a task that does not repeat is completed", func(t *testing.T) {
		todo := newTodo("x", setProp(ical.PropDue, "20260915T090000Z"))
		tick(t, todo)
		if valueIn(todo, ical.PropStatus) != "COMPLETED" || valueIn(todo, ical.PropCompleted) != "20260914T120000Z" ||
			valueIn(todo, ical.PropDue) != "20260915T090000Z" {
			t.Fatalf("%+v", todo.Props)
		}
	})

	t.Run("a repeating task moves to its next occurrence, on the wall clock across a DST change", func(t *testing.T) {
		if _, err := time.LoadLocation("Europe/Berlin"); err != nil {
			t.Skip("no tzdata:", err)
		}
		todo := newTodo("x",
			setProp(ical.PropDateTimeStart, "20261020T090000", "TZID", "Europe/Berlin"),
			setProp(ical.PropDue, "20261020T100000", "TZID", "Europe/Berlin"),
			setProp(ical.PropRecurrenceRule, "FREQ=WEEKLY"))
		tick(t, todo)
		open(t, todo)
		start, due := todo.Props.Get(ical.PropDateTimeStart), todo.Props.Get(ical.PropDue)
		if start.Value != "20261027T090000" || due.Value != "20261027T100000" || due.Params.Get("TZID") != "Europe/Berlin" {
			t.Fatalf("moved to %s .. %s %v", start.Value, due.Value, due.Params)
		}
	})

	t.Run("a COUNT counts the ticks down, and the last one completes the task", func(t *testing.T) {
		todo := newTodo("x",
			setProp(ical.PropDateTimeStart, "20260914T090000Z"),
			setProp(ical.PropDue, "20260914T090000Z"),
			setProp(ical.PropRecurrenceRule, "FREQ=DAILY;COUNT=3"))
		tick(t, todo)
		open(t, todo)
		if valueIn(todo, ical.PropDue) != "20260915T090000Z" || valueIn(todo, ical.PropRecurrenceRule) != "FREQ=DAILY;COUNT=2" {
			t.Fatalf("after one tick: %+v", todo.Props)
		}
		tick(t, todo)
		tick(t, todo)
		if valueIn(todo, ical.PropStatus) != "COMPLETED" || valueIn(todo, ical.PropDue) != "20260916T090000Z" {
			t.Fatalf("after three ticks: %+v", todo.Props)
		}
	})

	t.Run("a series past its UNTIL is completed", func(t *testing.T) {
		todo := newTodo("x",
			setProp(ical.PropDateTimeStart, "20260914T090000Z"),
			setProp(ical.PropRecurrenceRule, "FREQ=WEEKLY;UNTIL=20260920T000000Z"))
		tick(t, todo)
		if valueIn(todo, ical.PropStatus) != "COMPLETED" {
			t.Fatalf("%+v", todo.Props)
		}
	})

	t.Run("an excluded occurrence is skipped", func(t *testing.T) {
		todo := newTodo("x",
			setProp(ical.PropDateTimeStart, "20260914T090000Z"),
			setProp(ical.PropRecurrenceRule, "FREQ=WEEKLY"),
			setProp(ical.PropExceptionDates, "20260921T090000Z"))
		tick(t, todo)
		if valueIn(todo, ical.PropDateTimeStart) != "20260928T090000Z" {
			t.Fatalf("moved to %s", valueIn(todo, ical.PropDateTimeStart))
		}
	})

	t.Run("a task with only a due date is anchored there, and keeps its dates as dates", func(t *testing.T) {
		todo := newTodo("x",
			setProp(ical.PropDue, "20260930", "VALUE", "DATE"),
			setProp(ical.PropRecurrenceRule, "FREQ=MONTHLY"))
		tick(t, todo)
		open(t, todo)
		start, due := todo.Props.Get(ical.PropDateTimeStart), todo.Props.Get(ical.PropDue)
		if due.Value != "20261030" || due.ValueType() != ical.ValueDate || start.Value != "20261030" || start.ValueType() != ical.ValueDate {
			t.Fatalf("moved to start %s (%s), due %s (%s)", start.Value, start.ValueType(), due.Value, due.ValueType())
		}
	})

	t.Run("ticking back on reopens it", func(t *testing.T) {
		todo := newTodo("x", setProp(ical.PropStatus, "COMPLETED"), setProp(ical.PropCompleted, "20260101T000000Z"), setProp(ical.PropPercentComplete, "100"))
		if err := completeTask(todo, false, now); err != nil {
			t.Fatal(err)
		}
		open(t, todo)
		if todo.Props.Get(ical.PropPercentComplete) != nil {
			t.Fatal("percent complete kept")
		}
	})

	t.Run("a rule that cannot be read is an error, not a completed series", func(t *testing.T) {
		todo := newTodo("x", setProp(ical.PropDateTimeStart, "20260914T090000Z"), setProp(ical.PropRecurrenceRule, "FREQ=SOMETIMES"))
		if err := completeTask(todo, true, now); err == nil || valueIn(todo, ical.PropStatus) == "COMPLETED" {
			t.Fatalf("err %v, status %q", err, valueIn(todo, ical.PropStatus))
		}
	})
}

// Outlook names zones the Windows way, which Go cannot load. Such a time is
// read on its own wall clock as UTC, rather than as no due date at all, which
// the next save would then have removed.
func TestTaskTimeInAnUnknownZone(t *testing.T) {
	todo := newTodo("x", setProp(ical.PropDue, "20260915T170000", "TZID", "W. Europe Standard Time"))
	task, err := extractTask(&caldav.CalendarObject{Data: calendarOf(todo)})
	if err != nil {
		t.Fatal(err)
	}
	if task.Due != "2026-09-15T17:00:00Z" {
		t.Fatalf("due read as %q", task.Due)
	}
}
