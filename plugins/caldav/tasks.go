package alpscaldav

import (
	"fmt"
	"net/http"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav/caldav"
	"github.com/google/uuid"
	"github.com/migadu/alps"
	"github.com/migadu/alps/internal/davsave"
	"github.com/migadu/alps/internal/itip"
	"github.com/teambition/rrule-go"
)

// Tasks are the VTODOs in the user's calendars (RFC 5545 §3.6.2). They live in
// the same collections as events and go through the same client, path guards
// and conditional write. What differs is the component, and that a task may
// have no date at all.

// The four statuses RFC 5545 defines for a VTODO, as the API spells them.
const (
	taskNeedsAction = "needs-action"
	taskInProcess   = "in-process"
	taskCompleted   = "completed"
	taskCancelled   = "cancelled"
)

type TaskData struct {
	UID         string `json:"uid"`
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	// Due and Start are RFC 3339 instants, or empty when the task has none. An
	// all-day date is its UTC midnight, as for events.
	Due       string `json:"due,omitempty"`
	Start     string `json:"start,omitempty"`
	AllDay    bool   `json:"allDay"`
	Status    string `json:"status"`
	Completed string `json:"completed,omitempty"`
	// PercentComplete is 0 to 100, Priority RFC 5545's 1 (highest) to 9, with
	// 0 for none.
	PercentComplete int    `json:"percentComplete,omitempty"`
	Priority        int    `json:"priority,omitempty"`
	RRule           string `json:"rrule,omitempty"`
	// Organizer and Attendees are who a task is assigned by and to. Role is
	// the user's part in that, "organizer" or "attendee", and Answer their
	// own answer when it was assigned to them.
	Organizer    *Person  `json:"organizer,omitempty"`
	Attendees    []Person `json:"attendees,omitempty"`
	Role         string   `json:"role,omitempty"`
	Answer       string   `json:"answer,omitempty"`
	Path         string   `json:"path"`
	CalendarPath string   `json:"calendarPath"`
	// The version this was read at; see EventData.ETag.
	ETag string `json:"etag,omitempty"`
	// Sent and SendFailed answer a write that may have emailed someone; see
	// Saved.
	Sent       bool `json:"sent,omitempty"`
	SendFailed bool `json:"sendFailed,omitempty"`
}

// TaskInput is what the task editor sends: every field it has, each time.
type TaskInput struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	Due             string `json:"due"`
	AllDay          bool   `json:"allDay"`
	Status          string `json:"status"`
	PercentComplete int    `json:"percentComplete"`
	Priority        int    `json:"priority"`
	RRule           string `json:"rrule"`
	CalendarPath    string `json:"calendarPath"`
	ETag            string `json:"etag"`
	// Attendees are whom the task is assigned to; left out, it stays assigned
	// as it is.
	Attendees []Person `json:"attendees"`
	// Notify says whether to tell them, or the organizer, about the change.
	// Unsaid is yes.
	Notify *bool  `json:"notify"`
	Lang   string `json:"lang"`
}

// parse validates the input and returns its due instant.
func (in *TaskInput) parse() (time.Time, error) {
	var due time.Time
	if strings.TrimSpace(in.Title) == "" {
		return due, alps.NewHTTPError(http.StatusBadRequest, "a task needs a title")
	}
	switch in.Status {
	case "", taskNeedsAction, taskInProcess, taskCompleted, taskCancelled:
	default:
		return due, alps.NewHTTPError(http.StatusBadRequest, "unknown task status")
	}
	if in.Priority < 0 || in.Priority > 9 {
		return due, alps.NewHTTPError(http.StatusBadRequest, "priority must be 0 to 9")
	}
	if in.PercentComplete < 0 || in.PercentComplete > 100 {
		return due, alps.NewHTTPError(http.StatusBadRequest, "percent complete must be 0 to 100")
	}
	if in.Due != "" {
		var err error
		if due, err = time.Parse(time.RFC3339, in.Due); err != nil {
			return due, alps.NewHTTPError(http.StatusBadRequest, "invalid due date format")
		}
	}
	if in.RRule != "" {
		// The rule is anchored at a date, and a task with none has nothing to
		// repeat from.
		if in.Due == "" {
			return due, alps.NewHTTPError(http.StatusBadRequest, "a repeating task needs a due date")
		}
		if _, err := rrule.StrToROption(in.RRule); err != nil {
			return due, alps.NewHTTPError(http.StatusBadRequest, "invalid repeat rule")
		}
	}
	return due, nil
}

// holdsComponent reports whether a calendar accepts objects of the named
// component. A server that does not state the set accepts them all (RFC 4791
// §5.2.3).
func holdsComponent(cal caldav.Calendar, name string) bool {
	if len(cal.SupportedComponentSet) == 0 {
		return true
	}
	for _, comp := range cal.SupportedComponentSet {
		if strings.EqualFold(comp, name) {
			return true
		}
	}
	return false
}

// calendarHolding returns the path, as the calendar listing spells it, of the
// calendar an object is inside.
func calendarHolding(objectPath string, calendars []caldav.Calendar) string {
	cleaned := normalizeDAVPath(objectPath) + "/"
	for _, cal := range calendars {
		if strings.HasPrefix(cleaned, normalizeDAVPath(cal.Path)+"/") {
			return cal.Path
		}
	}
	return ""
}

// masterTask is the VTODO a task object is read and edited through: the one
// without a RECURRENCE-ID. Overrides of single occurrences that the object may
// also hold are left as they are.
func masterTask(cal *ical.Calendar) *ical.Component {
	var first *ical.Component
	for _, child := range cal.Children {
		if child.Name != ical.CompToDo {
			continue
		}
		if child.Props.Get(ical.PropRecurrenceID) == nil {
			return child
		}
		if first == nil {
			first = child
		}
	}
	return first
}

// propTime reads a date or date-time property, and whether it is a date.
//
// A TZID that names no zone this server knows (Outlook writes Windows zone
// names) is read as UTC rather than failing: a due date that could not be read
// would be missing from the editor, and gone after its next save.
func propTime(prop *ical.Prop) (time.Time, bool, error) {
	isDate := prop.ValueType() == ical.ValueDate ||
		(prop.ValueType() == ical.ValueDefault && len(prop.Value) == len("20060102"))
	t, err := prop.DateTime(time.UTC)
	if err != nil && prop.Params.Get(ical.PropTimezoneID) != "" {
		bare := *prop
		bare.Params = ical.Params{}
		for name, values := range prop.Params {
			if name != ical.PropTimezoneID {
				bare.Params[name] = values
			}
		}
		t, err = bare.DateTime(time.UTC)
	}
	return t, isDate, err
}

func intProp(comp *ical.Component, name string) int {
	prop := comp.Props.Get(name)
	if prop == nil {
		return 0
	}
	n, _ := strconv.Atoi(strings.TrimSpace(prop.Value))
	return n
}

func setIntProp(comp *ical.Component, name string, n int) {
	if n == 0 {
		comp.Props.Del(name)
		return
	}
	prop := ical.NewProp(name)
	prop.Value = strconv.Itoa(n)
	comp.Props.Set(prop)
}

func setTextProp(comp *ical.Component, name, text string) {
	if text == "" {
		comp.Props.Del(name)
		return
	}
	comp.Props.SetText(name, text)
}

func setTimeProp(comp *ical.Component, name string, t time.Time, allDay bool) {
	if allDay {
		comp.Props.SetDate(name, t.UTC())
		return
	}
	comp.Props.SetDateTime(name, t.UTC())
}

// sameTime reports whether a property already holds t, in the same form.
func sameTime(prop *ical.Prop, t time.Time, allDay bool) bool {
	if prop == nil {
		return false
	}
	stored, isDate, err := propTime(prop)
	if err != nil || isDate != allDay {
		return false
	}
	if allDay {
		return stored.Format("20060102") == t.UTC().Format("20060102")
	}
	return stored.Equal(t)
}

func calendarAddress(value string) string {
	if len(value) >= len("mailto:") && strings.EqualFold(value[:len("mailto:")], "mailto:") {
		return value[len("mailto:"):]
	}
	return value
}

func taskStatus(todo *ical.Component) string {
	if prop := todo.Props.Get(ical.PropStatus); prop != nil {
		switch strings.ToUpper(strings.TrimSpace(prop.Value)) {
		case "NEEDS-ACTION":
			return taskNeedsAction
		case "IN-PROCESS":
			return taskInProcess
		case "COMPLETED":
			return taskCompleted
		case "CANCELLED":
			return taskCancelled
		}
	}
	// No STATUS is needs-action (RFC 5545 §3.8.1.11), unless the task carries a
	// completion time: some clients mark completion with that alone.
	if todo.Props.Get(ical.PropCompleted) != nil {
		return taskCompleted
	}
	return taskNeedsAction
}

func extractTask(co *caldav.CalendarObject) (TaskData, error) {
	todo := masterTask(co.Data)
	if todo == nil {
		return TaskData{}, fmt.Errorf("no task in calendar object")
	}

	task := TaskData{Status: taskStatus(todo), Path: co.Path, ETag: co.ETag}
	task.UID, _ = todo.Props.Text(ical.PropUID)
	task.Title, _ = todo.Props.Text(ical.PropSummary)
	task.Description, _ = todo.Props.Text(ical.PropDescription)
	if prop := todo.Props.Get(ical.PropDue); prop != nil {
		if due, isDate, err := propTime(prop); err == nil {
			task.Due = due.Format(time.RFC3339)
			task.AllDay = isDate
		}
	}
	if prop := todo.Props.Get(ical.PropDateTimeStart); prop != nil {
		if start, isDate, err := propTime(prop); err == nil {
			task.Start = start.Format(time.RFC3339)
			if task.Due == "" {
				task.AllDay = isDate
			}
		}
	}
	if prop := todo.Props.Get(ical.PropCompleted); prop != nil {
		if completed, _, err := propTime(prop); err == nil {
			task.Completed = completed.UTC().Format(time.RFC3339)
		}
	}
	task.PercentComplete = intProp(todo, ical.PropPercentComplete)
	task.Priority = intProp(todo, ical.PropPriority)
	if prop := todo.Props.Get(ical.PropRecurrenceRule); prop != nil {
		task.RRule = prop.Value
	}
	return task, nil
}

func stampTask(todo *ical.Component, now time.Time) {
	todo.Props.SetDateTime(ical.PropDateTimeStamp, now.UTC())
	todo.Props.SetDateTime(ical.PropLastModified, now.UTC())
}

// applyTask writes the editor's fields onto a VTODO. Every property and
// component the editor has no field for is left as it was: alarms, attendees,
// categories, other clients' X- properties.
func applyTask(todo *ical.Component, in TaskInput, due time.Time, now time.Time) {
	todo.Props.SetText(ical.PropSummary, strings.TrimSpace(in.Title))
	setTextProp(todo, ical.PropDescription, strings.ReplaceAll(in.Description, "\r", ""))

	// A due date the editor sent back unchanged is not rewritten. It arrives as
	// an instant, and writing it out again would turn a zoned or floating time
	// into UTC, which other clients may show differently.
	if in.Due == "" {
		todo.Props.Del(ical.PropDue)
	} else if !sameTime(todo.Props.Get(ical.PropDue), due, in.AllDay) {
		setTimeProp(todo, ical.PropDue, due, in.AllDay)
		// DUE and DURATION are mutually exclusive in a VTODO.
		todo.Props.Del(ical.PropDuration)
	}

	if in.RRule == "" {
		todo.Props.Del(ical.PropRecurrenceRule)
	} else if prop := todo.Props.Get(ical.PropRecurrenceRule); prop == nil || prop.Value != in.RRule {
		rule := ical.NewProp(ical.PropRecurrenceRule)
		rule.Value = in.RRule
		todo.Props.Set(rule)
	}
	alignStart(todo, in, due)

	status := in.Status
	if status == "" {
		status = taskNeedsAction
	}
	todo.Props.SetText(ical.PropStatus, strings.ToUpper(status))
	percent := in.PercentComplete
	if status == taskCompleted {
		if todo.Props.Get(ical.PropCompleted) == nil {
			todo.Props.SetDateTime(ical.PropCompleted, now.UTC())
		}
		percent = 100
	} else {
		todo.Props.Del(ical.PropCompleted)
	}
	setIntProp(todo, ical.PropPercentComplete, percent)
	setIntProp(todo, ical.PropPriority, in.Priority)
	stampTask(todo, now)
}

// alignStart keeps DTSTART valid against the DUE just written: RFC 5545 has
// the two share a value type, with DTSTART not after DUE. A repeating task
// needs a DTSTART, which anchors its rule, and one without it is anchored at
// its due date.
func alignStart(todo *ical.Component, in TaskInput, due time.Time) {
	if in.Due == "" {
		return
	}
	prop := todo.Props.Get(ical.PropDateTimeStart)
	if prop == nil {
		if in.RRule != "" {
			setTimeProp(todo, ical.PropDateTimeStart, due, in.AllDay)
		}
		return
	}
	start, isDate, err := propTime(prop)
	if err != nil {
		return
	}
	if start.After(due) && !sameTime(prop, due, in.AllDay) {
		if in.RRule != "" {
			setTimeProp(todo, ical.PropDateTimeStart, due, in.AllDay)
		} else {
			todo.Props.Del(ical.PropDateTimeStart)
		}
		return
	}
	if isDate != in.AllDay {
		setTimeProp(todo, ical.PropDateTimeStart, start, in.AllDay)
	}
}

// completeTask ticks a task off, or back on.
//
// A VTODO has one STATUS for its whole series, so completing a repeating task
// as it stands would complete every later occurrence with it: a weekly chore
// ticked off once would never come back. It moves to its next occurrence
// instead and stays open, which is what Apple Reminders and Thunderbird do.
// Only a series with no occurrence left is completed.
func completeTask(todo *ical.Component, done bool, now time.Time) error {
	defer stampTask(todo, now)
	if !done {
		todo.Props.SetText(ical.PropStatus, "NEEDS-ACTION")
		todo.Props.Del(ical.PropCompleted)
		todo.Props.Del(ical.PropPercentComplete)
		return nil
	}
	moved, err := rollForward(todo)
	if err != nil {
		return err
	}
	if moved {
		todo.Props.SetText(ical.PropStatus, "NEEDS-ACTION")
		todo.Props.Del(ical.PropCompleted)
		todo.Props.Del(ical.PropPercentComplete)
		return nil
	}
	todo.Props.SetText(ical.PropStatus, "COMPLETED")
	todo.Props.SetDateTime(ical.PropCompleted, now.UTC())
	setIntProp(todo, ical.PropPercentComplete, 100)
	return nil
}

// rollForward moves a repeating task's dates to its next occurrence, and
// reports whether there was one.
//
// DTSTART anchors the rule, so it moves along with DUE. A COUNT counts from
// DTSTART, so it is reduced by the occurrences moved past; otherwise the count
// would start again at every tick and the series would never end.
func rollForward(todo *ical.Component) (bool, error) {
	option, err := todo.Props.RecurrenceRule()
	if err != nil {
		return false, alps.NewHTTPError(http.StatusUnprocessableEntity, "the task's repeat rule could not be read")
	}
	if option == nil {
		return false, nil
	}

	due := todo.Props.Get(ical.PropDue)
	if todo.Props.Get(ical.PropDateTimeStart) == nil {
		if due == nil {
			return false, nil
		}
		anchor := ical.NewProp(ical.PropDateTimeStart)
		anchor.Value = due.Value
		for name, values := range due.Params {
			anchor.Params[name] = append([]string(nil), values...)
		}
		todo.Props.Set(anchor)
		due = todo.Props.Get(ical.PropDue)
	}
	startProp := todo.Props.Get(ical.PropDateTimeStart)
	start, _, err := propTime(startProp)
	if err != nil {
		return false, alps.NewHTTPError(http.StatusUnprocessableEntity, "the task's start could not be read")
	}

	option.Dtstart = start
	rule, err := rrule.NewRRule(*option)
	if err != nil {
		return false, alps.NewHTTPError(http.StatusUnprocessableEntity, "the task's repeat rule could not be read")
	}
	set := rrule.Set{}
	set.RRule(rule)
	set.DTStart(start)
	for _, exdate := range todo.Props[ical.PropExceptionDates] {
		for _, value := range strings.Split(exdate.Value, ",") {
			single := exdate
			single.Value = value
			if t, _, err := propTime(&single); err == nil {
				set.ExDate(t)
			}
		}
	}
	next := set.After(start, false)
	if next.IsZero() {
		return false, nil
	}

	if option.Count > 0 {
		passed := 0
		for _, t := range rule.Between(start, next, true) {
			if t.Before(next) {
				passed++
			}
		}
		if option.Count-passed <= 0 {
			return false, nil
		}
		option.Count -= passed
		option.Dtstart = time.Time{}
		todo.Props.SetRecurrenceRule(option)
	}

	if due != nil {
		if dueTime, _, err := propTime(due); err == nil {
			moveTime(due, next.Add(dueTime.Sub(start)).In(dueTime.Location()))
		}
	}
	moveTime(todo.Props.Get(ical.PropDateTimeStart), next)
	return true, nil
}

// moveTime rewrites a date or date-time property's value in its own form: a
// date stays a date, a UTC time stays UTC, and a zoned or floating time keeps
// its TZID and is written as the wall clock there.
func moveTime(prop *ical.Prop, t time.Time) {
	_, isDate, _ := propTime(prop)
	switch {
	case isDate:
		prop.Value = t.Format("20060102")
	case strings.HasSuffix(prop.Value, "Z"):
		prop.Value = t.UTC().Format("20060102T150405Z")
	default:
		prop.Value = t.Format("20060102T150405")
	}
}

// taskInScope reports whether a status belongs to a listing scope: "active"
// is work still to do, "closed" is completed or cancelled, and "" is both.
func taskInScope(status, scope string) bool {
	closed := status == taskCompleted || status == taskCancelled
	switch scope {
	case "active":
		return !closed
	case "closed":
		return closed
	}
	return true
}

// withPeople fills in who a task is assigned by and to, seen from the user.
func (task *TaskData) withPeople(todo *ical.Component, acct *schedulingAccount) {
	task.Organizer, task.Attendees, task.Role, task.Answer = meetingOf(todo, acct).people()
}

// respondTask answers with a task as it was just written.
func (p *plugin) respondTask(ctx *alps.Context, calendars []caldav.Calendar, acct *schedulingAccount, objectPath, etag string, cal *ical.Calendar, saved Saved) error {
	task, err := extractTask(&caldav.CalendarObject{Path: objectPath, ETag: etag, Data: cal})
	if err != nil {
		return err
	}
	task.CalendarPath = calendarHolding(objectPath, calendars)
	task.withPeople(masterTask(cal), acct)
	task.Sent, task.SendFailed = saved.Sent, saved.SendFailed
	return ctx.JSON(http.StatusOK, task)
}

// progress records, on a task assigned to the user, their own progress as
// their answer: COMPLETED once it is done, ACCEPTED when it is opened again.
// It returns their address when the answer changed, which the organizer is
// then to hear.
func progress(cal *ical.Calendar, todo *ical.Component, acct *schedulingAccount, wasDone bool) string {
	m := meetingOf(todo, acct)
	done := taskStatus(todo) == taskCompleted
	if m.role != "attendee" || m.organizer == nil || done == wasDone {
		return ""
	}
	status := itip.Accepted
	if done {
		status = itip.Completed
	}
	itip.Answer(cal, m.me, status)
	return m.me
}

// assigneesDone reports whether everyone a task of the user's is assigned to
// has answered that they completed it.
func assigneesDone(todo *ical.Component, acct *schedulingAccount) bool {
	n := 0
	for _, a := range itip.Attendees(todo) {
		if acct.owns(a.Address) {
			continue
		}
		if a.Status != itip.Completed {
			return false
		}
		n++
	}
	return n > 0
}

// openTask reads the task object a request's {path} names, within the user's
// calendars.
func (p *plugin) openTask(ctx *alps.Context) (*caldav.Client, []caldav.Calendar, *caldav.CalendarObject, *ical.Component, error) {
	objectPath, err := parseObjectPath(ctx.Param("path"))
	if err != nil {
		return nil, nil, nil, nil, err
	}
	c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	if objectPath, err = requireCalendarObjectPath(objectPath, calendars); err != nil {
		return nil, nil, nil, nil, err
	}
	co, err := c.GetCalendarObject(ctx.Request.Context(), objectPath)
	if err != nil {
		return nil, nil, nil, nil, fmt.Errorf("failed to get CalDAV task: %v", err)
	}
	todo := masterTask(co.Data)
	if todo == nil {
		return nil, nil, nil, nil, alps.NewHTTPError(http.StatusBadRequest, "not a task")
	}
	co.Path = objectPath
	return c, calendars, co, todo, nil
}

func registerTaskRoutes(p *plugin) {
	p.GET("/calendar/tasks", func(ctx *alps.Context) error {
		scope := ctx.QueryParam("scope")
		if scope != "" && scope != "active" && scope != "closed" {
			return alps.NewHTTPError(http.StatusBadRequest, "scope must be active or closed")
		}

		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		// No time range: a task list is not a window of time, and an undated
		// task, the common kind, belongs in none.
		query := caldav.CalendarQuery{
			CompRequest: caldav.CalendarCompRequest{Name: "VCALENDAR", AllProps: true, AllComps: true},
			CompFilter: caldav.CompFilter{
				Name:  "VCALENDAR",
				Comps: []caldav.CompFilter{{Name: ical.CompToDo}},
			},
		}

		acct := p.scheduling(ctx, c)
		tasks := []TaskData{}
		lists := []CalendarData{}
		failed := 0
		for _, calendar := range calendars {
			if !holdsComponent(calendar, ical.CompToDo) {
				continue
			}
			lists = append(lists, CalendarData{Name: calendar.Name, Description: calendar.Description, Path: calendar.Path})
			objects, err := c.QueryCalendar(ctx.Request.Context(), calendar.Path, &query)
			if err != nil {
				// Counted rather than skipped in silence, so the page can say
				// that the lists it shows are not all there is.
				failed++
				continue
			}
			for i := range objects {
				task, err := extractTask(&objects[i])
				if err != nil || !taskInScope(task.Status, scope) {
					continue
				}
				task.CalendarPath = calendar.Path
				task.withPeople(masterTask(objects[i].Data), acct)
				tasks = append(tasks, task)
			}
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"tasks":           tasks,
			"calendars":       lists,
			"failedCalendars": failed,
			"scheduling":      acct.mode(),
		})
	})

	p.POST("/calendar/tasks", func(ctx *alps.Context) error {
		var in TaskInput
		if err := ctx.BindJSON(&in); err != nil {
			return ctx.RespondBindError(err)
		}
		due, err := in.parse()
		if err != nil {
			return err
		}

		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}
		var target *caldav.Calendar
		for i := range calendars {
			if holdsComponent(calendars[i], ical.CompToDo) && (in.CalendarPath == "" || calendars[i].Path == in.CalendarPath) {
				target = &calendars[i]
				break
			}
		}
		if target == nil {
			if in.CalendarPath != "" {
				return alps.NewHTTPError(http.StatusBadRequest, "not one of your task lists")
			}
			return alps.NewHTTPError(http.StatusConflict, "no calendar available to add the task to")
		}

		assignees, err := partiesOf(in.Attendees)
		if err != nil {
			return err
		}
		acct := p.scheduling(ctx, c)

		now := time.Now()
		id := uuid.New().String()
		todo := ical.NewComponent(ical.CompToDo)
		todo.Props.SetText(ical.PropUID, id)
		todo.Props.SetDateTime(ical.PropCreated, now.UTC())
		applyTask(todo, in, due, now)

		cal := ical.NewCalendar()
		cal.Props.SetText(ical.PropProductID, "-//migadu//alps//EN")
		cal.Props.SetText(ical.PropVersion, "2.0")
		cal.Children = append(cal.Children, todo)
		letters, from := organize(acct, nil, cal, assignees, in.Attendees != nil, now)

		objectPath := path.Join(target.Path, id+".ics")
		etag, err := p.putCalendar(ctx, c, objectPath, cal, "")
		if err != nil {
			return err
		}
		var saved Saved
		if in.Notify == nil || *in.Notify {
			saved.Sent, saved.SendFailed = p.tell(ctx, acct, from, in.Lang, letters)
		}
		return p.respondTask(ctx, calendars, acct, objectPath, etag, cal, saved)
	})

	p.POST("/calendar/tasks/{path}/edit", func(ctx *alps.Context) error {
		var in TaskInput
		if err := ctx.BindJSON(&in); err != nil {
			return ctx.RespondBindError(err)
		}
		due, err := in.parse()
		if err != nil {
			return err
		}

		c, calendars, co, todo, err := p.openTask(ctx)
		if err != nil {
			return err
		}
		// See updateEvent: the editor's version covers the time it was open,
		// the If-Match below the moment between this read and the write.
		if in.ETag != "" && !davsave.Same(in.ETag, co.ETag) {
			return errChangedElsewhere
		}
		assignees, err := partiesOf(in.Attendees)
		if err != nil {
			return err
		}
		acct := p.scheduling(ctx, c)
		now := time.Now()
		before := itip.Clone(co.Data)
		wasDone := taskStatus(todo) == taskCompleted
		applyTask(todo, in, due, now)
		letters, from := organize(acct, before, co.Data, assignees, in.Attendees != nil, now)
		// An assignee who finished, or reopened, the task in the editor: see
		// progress.
		me := progress(co.Data, todo, acct, wasDone)

		etag, err := p.putCalendar(ctx, c, co.Path, co.Data, co.ETag)
		if err != nil {
			return err
		}
		var saved Saved
		if in.Notify == nil || *in.Notify {
			if me != "" {
				saved, _ = p.sendReply(ctx, acct, co.Data, me, in.Lang)
			} else {
				saved.Sent, saved.SendFailed = p.tell(ctx, acct, from, in.Lang, letters)
			}
		}
		return p.respondTask(ctx, calendars, acct, co.Path, etag, co.Data, saved)
	})

	// Ticking a task off, or back on. A field gesture rather than a form save,
	// like a star on a contact: it has no opinion about the rest of the task,
	// so a task saved elsewhere since it was read is read again and ticked
	// once more. A second refusal in a row is reported.
	//
	// On a task assigned to the user the tick is also their answer, and goes
	// to the organizer. On one they assigned it is their own record, and
	// mails nobody.
	p.POST("/calendar/tasks/{path}/complete", func(ctx *alps.Context) error {
		var req struct {
			Done bool   `json:"done"`
			Lang string `json:"lang"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}

		for attempt := 1; ; attempt++ {
			c, calendars, co, todo, err := p.openTask(ctx)
			if err != nil {
				return err
			}
			acct := p.scheduling(ctx, c)
			wasDone := taskStatus(todo) == taskCompleted
			if err := completeTask(todo, req.Done, time.Now()); err != nil {
				return err
			}
			me := progress(co.Data, todo, acct, wasDone)
			etag, err := p.putCalendar(ctx, c, co.Path, co.Data, co.ETag)
			if err == errChangedElsewhere && attempt == 1 {
				continue
			}
			if err != nil {
				return err
			}
			var saved Saved
			if me != "" {
				saved, _ = p.sendReply(ctx, acct, co.Data, me, req.Lang)
			}
			return p.respondTask(ctx, calendars, acct, co.Path, etag, co.Data, saved)
		}
	})
}
