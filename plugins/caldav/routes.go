package alpscaldav

import (
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
)

type CalendarData struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Path        string `json:"path"`
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
	events := co.Data.Events()
	if len(events) == 0 {
		return EventData{}, fmt.Errorf("no event in calendar object")
	}
	event := events[0]

	summary, _ := event.Props.Text(ical.PropSummary)
	description, _ := event.Props.Text(ical.PropDescription)
	uid, _ := event.Props.Text(ical.PropUID)
	location, _ := event.Props.Text(ical.PropLocation)

	var rrule string
	if prop := event.Props.Get(ical.PropRecurrenceRule); prop != nil {
		rrule = prop.Value
	}

	start, _ := event.DateTimeStart(time.UTC)
	end, _ := event.DateTimeEnd(time.UTC)

	return EventData{
		UID:          uid,
		Summary:      summary,
		Description:  description,
		Location:     location,
		RRule:        rrule,
		Start:        start.Format(time.RFC3339),
		End:          end.Format(time.RFC3339),
		Path:         co.Path,
		CalendarPath: "", // populated later
	}, nil
}

func registerRoutes(p *plugin) {
	p.GET("/calendar/calendars", func(ctx *alps.Context) error {
		_, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		var calDatas []CalendarData
		for _, calendar := range calendars {
			calDatas = append(calDatas, CalendarData{
				Name:        calendar.Name,
				Description: calendar.Description,
				Path:        calendar.Path,
			})
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"calendars": calDatas,
		})
	})

	p.POST("/calendar/calendars", func(ctx *alps.Context) error {
		var req struct {
			Name string `json:"name"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
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
		targetURL.Path = path.Join(targetURL.Path, newPath)
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
</C:mkcalendar>`, req.Name)

		rt := authRoundTripper{
			server: http.DefaultTransport,
			session:  ctx.Session,
			debug:    p.debug,
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
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
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
		targetURL.Path = path.Join(targetURL.Path, calPath)
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
</D:propertyupdate>`, req.Name)

		rt := authRoundTripper{
			server: http.DefaultTransport,
			session:  ctx.Session,
			debug:    p.debug,
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

		c, _, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
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
			CompRequest: caldav.CalendarCompRequest{
				Name:  "VCALENDAR",
				Props: []string{"VERSION"},
				Comps: []caldav.CalendarCompRequest{{
					Name: "VEVENT",
					Props: []string{
						"SUMMARY",
						"DESCRIPTION",
						"LOCATION",
						"UID",
						"DTSTART",
						"DTEND",
						"DURATION",
						"RRULE",
					},
				}},
			},
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
		qLower := strings.ToLower(queryStr)
		for _, calendar := range calendars {
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
		var req EventData
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
		}

		calendarObjectPath, _ := parseObjectPath(ctx.Param("path")) // Will be empty for create

		c, calendars, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		var co *caldav.CalendarObject
		var event *ical.Event
		if calendarObjectPath != "" {
			co, err = c.GetCalendarObject(ctx.Request.Context(), calendarObjectPath)
			if err != nil {
				return fmt.Errorf("failed to get CalDAV event: %v", err)
			}
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
		event.Props.SetDateTime(ical.PropDateTimeStart, start)
		event.Props.SetDateTime(ical.PropDateTimeEnd, end)
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

		cal := ical.NewCalendar()
		cal.Props.SetText(ical.PropProductID, "-//migadu//alps//EN")
		cal.Props.SetText(ical.PropVersion, "2.0")
		cal.Children = append(cal.Children, event.Component)

		var p string
		if co != nil {
			p = co.Path
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
			if targetCal == nil && len(calendars) > 0 {
				targetCal = &calendars[0]
			}

			p = path.Join(targetCal.Path, newID.String()+".ics")
		}
		co, err = c.PutCalendarObject(ctx.Request.Context(), p, cal)
		if err != nil {
			return fmt.Errorf("failed to put calendar object: %v", err)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "path": co.Path})
	}

	p.POST("/calendar/events", updateEvent)
	p.POST("/calendar/events/{path}/edit", updateEvent)

	p.DELETE("/calendar/events/{path}", func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, _, err := p.clientWithCalendars(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		if err := c.RemoveAll(ctx.Request.Context(), path); err != nil {
			return fmt.Errorf("failed to delete calendar object: %v", err)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
	})
}
