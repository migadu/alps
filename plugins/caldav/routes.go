package alpscaldav

import (
	"bytes"
	"encoding/xml"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav/caldav"
	"github.com/google/uuid"
	"github.com/migadu/alps"
	"github.com/migadu/alps/internal/davsave"
	"github.com/migadu/alps/internal/itip"
)

// resolveDAVPath returns the URL path to use for a DAV object href. DAV servers
// return absolute hrefs (a full URL, or a path rooted at the server such as
// "/dav/calendars/..."), which already include any endpoint base path and must
// be used as-is. Only a relative href is joined onto the configured endpoint's
// base path. path.Join-ing an absolute href onto the base double-prefixes it
// (e.g. "/dav/dav/calendars/...") and 404s on any endpoint not mounted at "/".
func resolveDAVPath(base *url.URL, href string) string {
	if u, err := url.Parse(href); err == nil && u.IsAbs() {
		return u.Path
	}
	if strings.HasPrefix(href, "/") {
		return href
	}
	return path.Join(base.Path, href)
}

// xmlEscape returns s escaped for inclusion in XML character data.
func xmlEscape(s string) string {
	var b bytes.Buffer
	// xml.EscapeText only fails if the writer fails; a bytes.Buffer never does.
	_ = xml.EscapeText(&b, []byte(s))
	return b.String()
}

type CalendarData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Path        string `json:"path"`
	// The components the calendar accepts, as the server states them; none
	// stated means all. Lets the calendar page leave out a task-only list.
	Components []string `json:"components,omitempty"`
}

type EventData struct {
	UID          string `json:"uid"`
	Summary      string `json:"summary"`
	Description  string `json:"description,omitempty"`
	Start        string `json:"start"`
	End          string `json:"end"`
	Path         string `json:"path"`
	CalendarPath string `json:"calendarPath"`
	Location     string `json:"location,omitempty"`
	RRule        string `json:"rrule,omitempty"`
	AllDay       bool   `json:"allDay"`
	// The version this was read at. An edit sends it back, and is refused
	// with 412 if the event has been saved elsewhere since.
	ETag string `json:"etag,omitempty"`
	// Organizer and Attendees are who a meeting involves. Role is the user's
	// part in it: "organizer", "attendee", or "" for an event of their own.
	// Status is their answer, when they are an attendee.
	Organizer *Person  `json:"organizer,omitempty"`
	Attendees []Person `json:"attendees,omitempty"`
	Role      string   `json:"role,omitempty"`
	Status    string   `json:"status,omitempty"`
	// Ended reports that the event is over, the whole series for one that
	// repeats: nobody is told of a change to it, or asked to answer it.
	Ended bool `json:"ended,omitempty"`
}

// eventRequest is what the event editor sends.
type eventRequest struct {
	EventData
	// Notify says whether to tell the guests about the change. Unsaid is
	// yes; a server that schedules tells them regardless.
	Notify *bool `json:"notify"`
	// Lang is the language to write the messages' readable text in.
	Lang string `json:"lang"`
}

// eventSaved is what a save or delete of an event answers.
type eventSaved struct {
	OK string `json:"ok"`
	Saved
}

func parseObjectPath(s string) (string, error) {
	p, err := url.PathUnescape(s)
	if err != nil {
		err = fmt.Errorf("failed to parse path: %v", err)
		return "", alps.NewHTTPError(http.StatusBadRequest, err)
	}
	return p, nil
}

func extractEventData(co *caldav.CalendarObject) (EventData, error) {
	master := itip.Master(co.Data)
	if master == nil || master.Name != ical.CompEvent {
		return EventData{}, fmt.Errorf("no event in calendar object")
	}
	event := ical.Event{Component: master}

	summary, _ := event.Props.Text(ical.PropSummary)
	description, _ := event.Props.Text(ical.PropDescription)
	uid, _ := event.Props.Text(ical.PropUID)
	location, _ := event.Props.Text(ical.PropLocation)

	var rrule string
	if prop := event.Props.Get(ical.PropRecurrenceRule); prop != nil {
		rrule = prop.Value
	}

	// Through the calendar's own VTIMEZONEs: a meeting from Outlook names its
	// zone the Windows way, which DateTimeStart cannot read, and it came out
	// as the year 1.
	start, end, _, _ := itemTimes(co.Data, event.Component)

	return EventData{
		UID:          uid,
		Summary:      summary,
		Description:  description,
		Location:     location,
		RRule:        rrule,
		AllDay:       eventIsAllDay(&event),
		Start:        start.UTC().Format(time.RFC3339),
		End:          end.UTC().Format(time.RFC3339),
		Path:         co.Path,
		CalendarPath: "", // populated later
		ETag:         co.ETag,
	}, nil
}

// eventIsAllDay reports whether an event is date-based ("all day") rather than
// timed.
//
// It is the server's to say, from the property itself, because the client cannot
// tell: Start and End reach it as RFC 3339 instants, and the frontend used to
// guess all-day from a UTC-midnight suffix. That guess is why the write path
// stored all-day events as UTC-midnight DATE-TIMEs, which every other CalDAV
// client reads as a timed event starting at midnight UTC: the evening before,
// anywhere west of Greenwich.
//
// A VALUE=DATE start is all-day by definition, and so is a start with no VALUE
// parameter but a date's length, which is how go-ical's own DateTime reads it.
// The UTC-midnight pair is still accepted so that the events alps has already
// written in that shape keep showing as all-day; a timed event that genuinely
// runs from one UTC midnight to another is misread exactly as it was before.
func eventIsAllDay(event *ical.Event) bool {
	start := event.Props.Get(ical.PropDateTimeStart)
	if start == nil {
		return false
	}
	switch start.ValueType() {
	case ical.ValueDate:
		return true
	case ical.ValueDefault:
		if len(start.Value) == len("20060102") {
			return true
		}
	}
	end := event.Props.Get(ical.PropDateTimeEnd)
	return end != nil && isUTCMidnight(start.Value) && isUTCMidnight(end.Value)
}

func isUTCMidnight(value string) bool {
	return len(value) == len("20060102T150405Z") && strings.HasSuffix(value, "T000000Z")
}

// setEventTimes writes DTSTART and DTEND, as DATE values for an all-day event.
//
// The all-day date is the UTC calendar date of the instant the client sent,
// which the frontend builds as UTC midnight of the day the user picked. Both
// setters replace the property whole, so switching an event between all-day and
// timed leaves no stale VALUE or TZID parameter behind.
func setEventTimes(event *ical.Event, start, end time.Time, allDay bool) {
	if allDay {
		event.Props.SetDate(ical.PropDateTimeStart, start.UTC())
		event.Props.SetDate(ical.PropDateTimeEnd, end.UTC())
		return
	}
	event.Props.SetDateTime(ical.PropDateTimeStart, start)
	event.Props.SetDateTime(ical.PropDateTimeEnd, end)
}

// errChangedElsewhere answers a save made against a version that is no longer
// the stored one: most often the user's own phone saved the object while it
// was open here.
var errChangedElsewhere = alps.NewHTTPError(http.StatusPreconditionFailed, "changed elsewhere since it was opened")

// putCalendar writes cal to objectPath, conditional on etag when there is one,
// and returns the ETag of the version written.
func (p *plugin) putCalendar(ctx *alps.Context, c *caldav.Client, objectPath string, cal *ical.Calendar, etag string) (string, error) {
	var buf bytes.Buffer
	if err := ical.NewEncoder(&buf).Encode(cal); err != nil {
		return "", fmt.Errorf("failed to encode calendar object: %v", err)
	}
	newETag, err := davsave.Put(ctx.Request.Context(), p.httpClient(ctx.Session), davsave.URL(p.url, objectPath), ical.MIMEType, buf.Bytes(), etag)
	if errors.Is(err, davsave.ErrConflict) {
		return "", errChangedElsewhere
	}
	if err != nil {
		return "", fmt.Errorf("failed to put calendar object: %v", err)
	}
	if newETag == "" {
		// Withheld (see davsave.Put). Read back, or the next save from the same
		// editor would carry no version to be checked against.
		if fresh, err := c.GetCalendarObject(ctx.Request.Context(), objectPath); err == nil {
			newETag = fresh.ETag
		}
	}
	return newETag, nil
}

func registerRoutes(p *plugin) {
	p.GET("/calendar/calendars", func(ctx *alps.Context) error {
		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		var calDatas []CalendarData
		for _, calendar := range calendars {
			calDatas = append(calDatas, CalendarData{
				Name:        calendar.Name,
				Description: calendar.Description,
				Path:        calendar.Path,
				Components:  calendar.SupportedComponentSet,
			})
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"calendars": calDatas,
			// Who sends invitations and replies: "server" or "email".
			"scheduling": p.scheduling(ctx, c).mode(),
		})
	})

	p.POST("/calendar/calendars", func(ctx *alps.Context) error {
		var req struct {
			Name string `json:"name"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		if req.Name == "" {
			return alps.NewHTTPError(http.StatusBadRequest, "Calendar name is required")
		}

		_, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		p.cacheMutex.RLock()
		homeSet, ok := p.homeSetCache[ctx.Session.Username()]
		p.cacheMutex.RUnlock()

		if !ok || homeSet == "" {
			if len(calendars) > 0 {
				homeSet = path.Dir(calendars[0].Path)
			} else {
				return fmt.Errorf("failed to determine calendar home set")
			}
		}

		newID := uuid.New().String()
		newPath := path.Join(homeSet, newID) + "/"

		targetURL := *p.url
		targetURL.Path = resolveDAVPath(p.url, newPath)
		if !strings.HasSuffix(targetURL.Path, "/") {
			targetURL.Path += "/"
		}

		xmlPayload := fmt.Sprintf(`<?xml version="1.0" encoding="utf-8" ?>
<C:mkcalendar xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:set>
    <D:prop>
      <D:displayname>%s</D:displayname>
    </D:prop>
  </D:set>
</C:mkcalendar>`, xmlEscape(req.Name))

		rt := authRoundTripper{
			server:  http.DefaultTransport,
			session: ctx.Session,
			debug:   p.debug,
		}
		hc := &http.Client{Transport: &rt}

		httpReq, err := http.NewRequestWithContext(ctx.Request.Context(), "MKCALENDAR", targetURL.String(), strings.NewReader(xmlPayload))
		if err != nil {
			return err
		}
		httpReq.Header.Set("Content-Type", "application/xml; charset=utf-8")

		resp, err := hc.Do(httpReq)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusMethodNotAllowed || resp.StatusCode == http.StatusNotImplemented {
			httpReq, err = http.NewRequestWithContext(ctx.Request.Context(), "POST", targetURL.String(), strings.NewReader(xmlPayload))
			if err != nil {
				return err
			}
			httpReq.Header.Set("Content-Type", "application/xml; charset=utf-8")
			resp2, err := hc.Do(httpReq)
			if err != nil {
				return err
			}
			defer resp2.Body.Close()
			if resp2.StatusCode/100 != 2 {
				return fmt.Errorf("failed to create calendar via POST: %s", resp2.Status)
			}
		} else if resp.StatusCode/100 != 2 {
			return fmt.Errorf("failed to create calendar via MKCALENDAR: %s", resp.Status)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "path": newPath})
	})

	p.PATCH("/calendar/calendars/{path}", func(ctx *alps.Context) error {
		var req struct {
			Name string `json:"name"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		if req.Name == "" {
			return alps.NewHTTPError(http.StatusBadRequest, "Calendar name is required")
		}

		calPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		_, _, err = p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		targetURL := *p.url
		targetURL.Path = resolveDAVPath(p.url, calPath)
		if !strings.HasSuffix(targetURL.Path, "/") {
			targetURL.Path += "/"
		}

		xmlPayload := fmt.Sprintf(`<?xml version="1.0" encoding="utf-8" ?>
<D:propertyupdate xmlns:D="DAV:">
  <D:set>
    <D:prop>
      <D:displayname>%s</D:displayname>
    </D:prop>
  </D:set>
</D:propertyupdate>`, xmlEscape(req.Name))

		rt := authRoundTripper{
			server:  http.DefaultTransport,
			session: ctx.Session,
			debug:   p.debug,
		}
		hc := &http.Client{Transport: &rt}

		httpReq, err := http.NewRequestWithContext(ctx.Request.Context(), "PROPPATCH", targetURL.String(), strings.NewReader(xmlPayload))
		if err != nil {
			return err
		}
		httpReq.Header.Set("Content-Type", "application/xml; charset=utf-8")

		resp, err := hc.Do(httpReq)
		if err != nil {
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusMethodNotAllowed || resp.StatusCode == http.StatusNotImplemented {
			httpReq, err = http.NewRequestWithContext(ctx.Request.Context(), "POST", targetURL.String(), strings.NewReader(xmlPayload))
			if err != nil {
				return err
			}
			httpReq.Header.Set("Content-Type", "application/xml; charset=utf-8")
			resp2, err := hc.Do(httpReq)
			if err != nil {
				return err
			}
			defer resp2.Body.Close()
			if resp2.StatusCode/100 != 2 && resp2.StatusCode != 207 {
				return fmt.Errorf("failed to rename calendar via POST: %s", resp2.Status)
			}
		} else if resp.StatusCode/100 != 2 && resp.StatusCode != 207 {
			return fmt.Errorf("failed to rename calendar via PROPPATCH: %s", resp.Status)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
	})

	p.DELETE("/calendar/calendars/{path}", func(ctx *alps.Context) error {
		calPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		// Must BE one of the user's calendars. RemoveAll takes children with it,
		// so an unconstrained path here deletes whatever collection it names.
		calPath, err = requireCalendarPath(calPath, calendars)
		if err != nil {
			return err
		}

		if strings.HasSuffix(calPath, "/default") || strings.HasSuffix(calPath, "/default/") || calPath == "default" {
			return alps.NewHTTPError(http.StatusBadRequest, "Cannot delete the default calendar")
		}

		if err := c.RemoveAll(ctx.Request.Context(), calPath); err != nil {
			return fmt.Errorf("failed to delete calendar: %v", err)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
	})

	p.GET("/calendar/events", func(ctx *alps.Context) error {
		startStr := ctx.QueryParam("start")
		endStr := ctx.QueryParam("end")
		queryStr := ctx.QueryParam("query")

		var start, end time.Time
		var err error

		if queryStr != "" {
			// When searching, expand the date range to catch past and future events
			now := time.Now()
			start = now.AddDate(0, -3, 0) // 3 months back
			end = now.AddDate(0, 3, 0)    // 3 months forward
		} else {
			if startStr != "" {
				start, err = time.Parse(time.RFC3339, startStr)
				if err != nil {
					return alps.NewHTTPError(http.StatusBadRequest, "invalid start date format")
				}
			} else {
				now := time.Now()
				start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
			}

			if endStr != "" {
				end, err = time.Parse(time.RFC3339, endStr)
				if err != nil {
					return alps.NewHTTPError(http.StatusBadRequest, "invalid end date format")
				}
			} else {
				end = start.AddDate(0, 1, 0)
			}
		}

		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		query := caldav.CalendarQuery{
			// Whole objects. An event's times are read through the calendar's
			// VTIMEZONEs, which a request naming only VEVENT properties leaves
			// out, and who a meeting involves is in properties it left out too.
			CompRequest: caldav.CalendarCompRequest{Name: "VCALENDAR", AllProps: true, AllComps: true},
			CompFilter: caldav.CompFilter{
				Name: "VCALENDAR",
				Comps: []caldav.CompFilter{{
					Name:  "VEVENT",
					Start: start,
					End:   end,
				}},
			},
		}

		var events []EventData
		acct := p.scheduling(ctx, c)
		listedAt := clock()
		qLower := strings.ToLower(queryStr)
		for _, calendar := range calendars {
			if !holdsComponent(calendar, ical.CompEvent) {
				continue
			}
			calendarObjects, err := c.QueryCalendar(ctx.Request.Context(), calendar.Path, &query)
			if err != nil {
				continue // Skip if this specific calendar fails to query
			}

			for _, co := range calendarObjects {
				if len(co.Data.Events()) > 0 {
					eventData, err := extractEventData(&co)
					if err == nil {
						if qLower != "" {
							if !strings.Contains(strings.ToLower(eventData.Summary), qLower) &&
								!strings.Contains(strings.ToLower(eventData.Description), qLower) &&
								!strings.Contains(strings.ToLower(eventData.Location), qLower) {
								continue
							}
						}
						eventData.CalendarPath = calendar.Path
						eventData.Organizer, eventData.Attendees, eventData.Role, eventData.Status = meetingOf(itip.Master(co.Data), acct).people()
						eventData.Ended = ended(co.Data, listedAt)
						events = append(events, eventData)
					}
				}
			}
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"events": events,
		})
	})

	updateEvent := func(ctx *alps.Context) error {
		var req eventRequest
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}

		// Empty for create, where there is no {path}; url.PathUnescape("") gives
		// "" with no error. So a non-nil error is a malformed path, and it was
		// discarded outright by the `_`. The empty result then reads as "this is
		// a create" everywhere below, so editing an event through a malformed
		// path silently made a SECOND event rather than reporting anything.
		calendarObjectPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		// An edit reads the object at this path and writes it back through
		// PutCalendarObject. Unconstrained, that writes an iCalendar over
		// whatever the path names.
		if calendarObjectPath != "" {
			calendarObjectPath, err = requireCalendarObjectPath(calendarObjectPath, calendars)
			if err != nil {
				return err
			}
		}

		var co *caldav.CalendarObject
		var before *ical.Calendar
		var event *ical.Event
		if calendarObjectPath != "" {
			co, err = c.GetCalendarObject(ctx.Request.Context(), calendarObjectPath)
			if err != nil {
				return fmt.Errorf("failed to get CalDAV event: %v", err)
			}
			// Compared here as well as sent as If-Match below, because they
			// cover different spans: If-Match only the moment between this read
			// and the write, this the whole time the editor was open.
			if req.ETag != "" && !davsave.Same(req.ETag, co.ETag) {
				return errChangedElsewhere
			}
			before = itip.Clone(co.Data)
			events := co.Data.Events()
			if len(events) != 1 {
				return fmt.Errorf("expected exactly one event, got %d", len(events))
			}
			event = &events[0]
		} else {
			event = ical.NewEvent()
		}

		start, err := time.Parse(time.RFC3339, req.Start)
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, "invalid start date format")
		}
		end, err := time.Parse(time.RFC3339, req.End)
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, "invalid end date format")
		}

		if start.After(end) {
			return alps.NewHTTPError(http.StatusBadRequest, "event start is after its end")
		}

		event.Props.SetDateTime(ical.PropDateTimeStamp, time.Now())
		event.Props.SetText(ical.PropSummary, req.Summary)
		setEventTimes(event, start, end, req.AllDay)
		event.Props.Del(ical.PropDuration)

		if req.Description != "" {
			description := strings.ReplaceAll(req.Description, "\r", "")
			event.Props.SetText(ical.PropDescription, description)
		} else {
			event.Props.Del(ical.PropDescription)
		}

		if req.Location != "" {
			event.Props.SetText(ical.PropLocation, req.Location)
		} else {
			event.Props.Del(ical.PropLocation)
		}

		if req.RRule != "" {
			event.Props.Set(&ical.Prop{
				Name:  ical.PropRecurrenceRule,
				Value: req.RRule,
			})
		} else {
			event.Props.Del(ical.PropRecurrenceRule)
		}

		newID := uuid.New()
		if prop := event.Props.Get(ical.PropUID); prop == nil {
			event.Props.SetText(ical.PropUID, newID.String())
		}

		// An edit writes back the object it read, with the event changed in it:
		// what else the object holds, the VTIMEZONEs its times are written in
		// above all, stays.
		var cal *ical.Calendar
		if co != nil {
			cal = co.Data
		} else {
			cal = ical.NewCalendar()
			cal.Props.SetText(ical.PropProductID, "-//migadu//alps//EN")
			cal.Props.SetText(ical.PropVersion, "2.0")
			cal.Children = append(cal.Children, event.Component)
		}

		guests, err := partiesOf(req.Attendees)
		if err != nil {
			return err
		}
		acct := p.scheduling(ctx, c)
		letters, from := organize(acct, before, cal, guests, req.Attendees != nil, time.Now())

		var objectPath, baseETag string
		if co != nil {
			objectPath, baseETag = co.Path, co.ETag
			// Optional: support moving events to different calendar if req.CalendarPath is provided and different from current parent
			// But skipping for now unless specifically required.
		} else {
			// Select target calendar
			var targetCal *caldav.Calendar
			if req.CalendarPath != "" {
				for i := range calendars {
					if calendars[i].Path == req.CalendarPath {
						targetCal = &calendars[i]
						break
					}
				}
			}
			if targetCal == nil {
				// The first that takes events. A task-only list (Apple keeps
				// Reminders in such calendars) refuses them.
				for i := range calendars {
					if holdsComponent(calendars[i], ical.CompEvent) {
						targetCal = &calendars[i]
						break
					}
				}
			}
			// With no calendars at all, targetCal is still nil and the line
			// below dereferenced it — a nil panic rather than an error, for an
			// account the server simply has nothing provisioned for yet.
			if targetCal == nil {
				return alps.NewHTTPError(http.StatusConflict, "no calendar available to create the event in")
			}

			objectPath = path.Join(targetCal.Path, newID.String()+".ics")
		}
		etag, err := p.putCalendar(ctx, c, objectPath, cal, baseETag)
		if err != nil {
			return err
		}
		saved := eventSaved{OK: "true", Saved: Saved{Path: objectPath, ETag: etag}}
		if req.Notify == nil || *req.Notify {
			saved.Sent, saved.SendFailed = p.tell(ctx, acct, from, req.Lang, letters)
		}
		return ctx.JSON(http.StatusOK, saved)
	}

	p.POST("/calendar/events", updateEvent)
	p.POST("/calendar/events/{path}/edit", updateEvent)

	deleteObject := func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		// Must be INSIDE one of them: this route deletes an event, and RemoveAll
		// would just as happily delete the calendar holding it.
		path, err = requireCalendarObjectPath(path, calendars)
		if err != nil {
			return err
		}

		// Read first, for who removing it tells: see departure.
		var letters []letter
		var from string
		var header http.Header
		var acct *schedulingAccount
		if co, err := c.GetCalendarObject(ctx.Request.Context(), path); err == nil && itip.Master(co.Data) != nil {
			acct = p.scheduling(ctx, c)
			letters, from, header = departure(acct, co.Data, ctx.QueryParam("notify") != "0", time.Now())
		}

		if header != nil {
			err = davsave.Delete(ctx.Request.Context(), p.httpClient(ctx.Session), davsave.URL(p.url, path), "", header)
		} else {
			err = c.RemoveAll(ctx.Request.Context(), path)
		}
		if err != nil {
			return fmt.Errorf("failed to delete calendar object: %v", err)
		}

		saved := eventSaved{OK: "true"}
		if acct != nil {
			saved.Sent, saved.SendFailed = p.tell(ctx, acct, from, ctx.QueryParam("lang"), letters)
		}
		return ctx.JSON(http.StatusOK, saved)
	}

	p.DELETE("/calendar/events/{path}", deleteObject)
	// A task is removed as an event is: one object inside one of the user's
	// calendars.
	p.DELETE("/calendar/tasks/{path}", deleteObject)

	// Answering an invitation already in the calendar, as the reader answers
	// one in a message.
	p.POST("/calendar/events/{path}/respond", p.respondToCopy)
	p.POST("/calendar/tasks/{path}/respond", p.respondToCopy)

	registerTaskRoutes(p)
	registerInvitationRoutes(p)
}

// respondToCopy answers, from the calendar, an invitation it holds: the
// answer goes into the copy, and to the organizer.
func (p *plugin) respondToCopy(ctx *alps.Context) error {
	var req struct {
		Status string `json:"status"`
		ETag   string `json:"etag"`
		Lang   string `json:"lang"`
	}
	if err := ctx.BindJSON(&req); err != nil {
		return ctx.RespondBindError(err)
	}
	status, ok := answerStatuses[req.Status]
	if !ok {
		return alps.NewHTTPError(http.StatusBadRequest, "unknown answer")
	}
	objectPath, err := parseObjectPath(ctx.Param("path"))
	if err != nil {
		return err
	}
	c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
	if err != nil {
		return err
	}
	if objectPath, err = requireCalendarObjectPath(objectPath, calendars); err != nil {
		return err
	}
	co, err := c.GetCalendarObject(ctx.Request.Context(), objectPath)
	if err != nil {
		return fmt.Errorf("failed to get calendar object: %v", err)
	}
	if req.ETag != "" && !davsave.Same(req.ETag, co.ETag) {
		return errChangedElsewhere
	}
	master := itip.Master(co.Data)
	if master == nil {
		return alps.NewHTTPError(http.StatusBadRequest, "not an event or a task")
	}
	if ended(co.Data, clock()) {
		return errEventOver
	}
	acct := p.scheduling(ctx, c)
	m := meetingOf(master, acct)
	if m.role != "attendee" || m.organizer == nil {
		return alps.NewHTTPError(http.StatusConflict, "you are not invited to this")
	}
	cal := itip.Clone(co.Data)
	itip.Answer(cal, m.me, status)
	etag, err := p.putCalendar(ctx, c, objectPath, cal, co.ETag)
	if err != nil {
		return err
	}
	saved, _ := p.sendReply(ctx, acct, cal, m.me, req.Lang)
	saved.Path, saved.ETag = objectPath, etag
	return ctx.JSON(http.StatusOK, saved)
}
