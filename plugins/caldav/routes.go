package alpscaldav

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"git.sr.ht/~emersion/alps"
	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav/caldav"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CalendarRenderData struct {
	alps.BaseRenderData
	Time               time.Time
	Now                time.Time
	Dates              [7 * 6]time.Time
	Calendar           *caldav.Calendar
	Events             []CalendarObject
	PrevPage, NextPage string
	PrevTime, NextTime time.Time

	EventsForDate func(time.Time) []CalendarObject
	DaySuffix     func(n int) string
	Sub           func(a, b int) int
}

type EventRenderData struct {
	alps.BaseRenderData
	Calendar *caldav.Calendar
	Event    CalendarObject
}

type UpdateEventRenderData struct {
	alps.BaseRenderData
	Calendar       *caldav.Calendar
	CalendarObject *caldav.CalendarObject // nil if creating a new contact
	Event          *ical.Event
}

var monthPageLayout = "2006-01"

func parseObjectPath(s string) (string, error) {
	p, err := url.PathUnescape(s)
	if err != nil {
		err = fmt.Errorf("failed to parse path: %v", err)
		return "", echo.NewHTTPError(http.StatusBadRequest, err)
	}
	return string(p), nil
}

func parseTime(dateStr, timeStr string) (time.Time, error) {
	layout := inputDateLayout
	s := dateStr
	if timeStr != "" {
		layout = inputDateLayout + "T" + inputTimeLayout
		s = dateStr + "T" + timeStr
	}
	t, err := time.Parse(layout, s)
	if err != nil {
		err = fmt.Errorf("malformed date: %v", err)
		return time.Time{}, echo.NewHTTPError(http.StatusBadRequest, err)
	}
	return t, nil
}

func registerRoutes(p *alps.GoPlugin, u *url.URL) {
	p.GET("/calendar", func(ctx *alps.Context) error {
		var start time.Time
		if s := ctx.QueryParam("month"); s != "" {
			var err error
			start, err = time.Parse(monthPageLayout, s)
			if err != nil {
				return fmt.Errorf("failed to parse month: %v", err)
			}
		} else {
			now := time.Now()
			start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		}
		end := start.AddDate(0, 1, 0)

		// TODO: multi-calendar support
		c, calendar, err := getCalendar(u, ctx.Session)
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
						"UID",
						"DTSTART",
						"DTEND",
						"DURATION",
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
		events, err := c.QueryCalendar(calendar.Path, &query)
		if err != nil {
			return fmt.Errorf("failed to query calendar: %v", err)
		}

		// TODO: Time zones are hard
		var dates [7 * 6]time.Time
		initialDate := start.UTC()
		initialDate = initialDate.AddDate(0, 0, -int(initialDate.Weekday()))
		for i := 0; i < len(dates); i += 1 {
			dates[i] = initialDate
			initialDate = initialDate.AddDate(0, 0, 1)
		}

		eventMap := make(map[time.Time][]CalendarObject)
		for _, ev := range events {
			ev := ev // make a copy
			// TODO: include event on each date for which it is active
			co := ev.Data.Events()[0]
			startTime, _ := co.DateTimeStart(nil)
			startTime = startTime.UTC().Truncate(time.Hour * 24)
			eventMap[startTime] = append(eventMap[startTime], CalendarObject{&ev})
		}

		return ctx.Render(http.StatusOK, "calendar.html", &CalendarRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).
				WithTitle(calendar.Name + " Calendar: " + start.Format("January 2006")),
			Time:           start,
			Now:            time.Now(), // TODO: Use client time zone
			Calendar:       calendar,
			Dates:          dates,
			Events:         newCalendarObjectList(events),
			PrevPage:       start.AddDate(0, -1, 0).Format(monthPageLayout),
			NextPage:       start.AddDate(0, 1, 0).Format(monthPageLayout),
			PrevTime:       start.AddDate(0, -1, 0),
			NextTime:       start.AddDate(0, 1, 0),

			EventsForDate: func(when time.Time) []CalendarObject {
				if events, ok := eventMap[when.Truncate(time.Hour*24)]; ok {
					return events
				}
				return nil
			},

			DaySuffix: func(n int) string {
				if n%100 >= 11 && n%100 <= 13 {
					return "th"
				}
				return map[int]string{
					0: "th",
					1: "st",
					2: "nd",
					3: "rd",
					4: "th",
					5: "th",
					6: "th",
					7: "th",
					8: "th",
					9: "th",
				}[n%10]
			},

			Sub: func(a, b int) int {
				// Why isn't this built-in, come on Go
				return a - b
			},
		})
	})

	p.GET("/calendar/:path", func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, calendar, err := getCalendar(u, ctx.Session)
		if err != nil {
			return err
		}

		multiGet := caldav.CalendarMultiGet{
			CompRequest: caldav.CalendarCompRequest{
				Name:  "VCALENDAR",
				Props: []string{"VERSION"},
				Comps: []caldav.CalendarCompRequest{{
					Name: "VEVENT",
					Props: []string{
						"SUMMARY",
						"DESCRIPTION",
						"UID",
						"DTSTART",
						"DTEND",
						"DURATION",
					},
				}},
			},
		}

		events, err := c.MultiGetCalendar(path, &multiGet)
		if err != nil {
			return fmt.Errorf("failed to multi-get calendar: %v", err)
		}
		if len(events) != 1 {
			return fmt.Errorf("expected exactly one calendar object with path %q, got %v", path, len(events))
		}
		event := &events[0]
		summary, _ := event.Data.Events()[0].Props.Text("SUMMARY")

		return ctx.Render(http.StatusOK, "event.html", &EventRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).WithTitle(summary),
			Calendar:       calendar,
			Event:          CalendarObject{event},
		})
	})

	updateEvent := func(ctx *alps.Context) error {
		calendarObjectPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, calendar, err := getCalendar(u, ctx.Session)
		if err != nil {
			return err
		}

		var co *caldav.CalendarObject
		var event *ical.Event
		if calendarObjectPath != "" {
			co, err = c.GetCalendarObject(calendarObjectPath)
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

		if ctx.Request().Method == "POST" {
			summary := ctx.FormValue("summary")
			description := ctx.FormValue("description")

			// TODO: whole-day events
			start, err := parseTime(ctx.FormValue("start-date"), ctx.FormValue("start-time"))
			if err != nil {
				return err
			}
			end, err := parseTime(ctx.FormValue("end-date"), ctx.FormValue("end-time"))
			if err != nil {
				return err
			}
			if start.After(end) {
				return echo.NewHTTPError(http.StatusBadRequest, "event start is after its end")
			}

			if start == end {
				end = start.Add(24 * time.Hour)
			}

			event.Props.SetDateTime(ical.PropDateTimeStamp, time.Now())
			event.Props.SetText(ical.PropSummary, summary)
			event.Props.SetDateTime(ical.PropDateTimeStart, start)
			event.Props.SetDateTime(ical.PropDateTimeEnd, end)
			event.Props.Del(ical.PropDuration)

			if description != "" {
				description = strings.ReplaceAll(description, "\r", "")
				event.Props.SetText(ical.PropDescription, description)
			} else {
				event.Props.Del(ical.PropDescription)
			}

			newID := uuid.New()
			if prop := event.Props.Get(ical.PropUID); prop == nil {
				event.Props.SetText(ical.PropUID, newID.String())
			}

			cal := ical.NewCalendar()
			cal.Props.SetText(ical.PropProductID, "-//emersion.fr//alps//EN")
			cal.Props.SetText(ical.PropVersion, "2.0")
			cal.Children = append(cal.Children, event.Component)

			var p string
			if co != nil {
				p = co.Path
			} else {
				p = path.Join(calendar.Path, newID.String()+".ics")
			}
			co, err = c.PutCalendarObject(p, cal)
			if err != nil {
				return fmt.Errorf("failed to put calendar object: %v", err)
			}

			return ctx.Redirect(http.StatusFound, CalendarObject{co}.URL())
		}

		summary, _ := event.Props.Text("SUMMARY")

		return ctx.Render(http.StatusOK, "update-event.html", &UpdateEventRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).WithTitle("Update " + summary),
			Calendar:       calendar,
			CalendarObject: co,
			Event:          event,
		})
	}

	p.GET("/calendar/create", updateEvent)
	p.POST("/calendar/create", updateEvent)

	p.GET("/calendar/:path/update", updateEvent)
	p.POST("/calendar/:path/update", updateEvent)

	p.POST("/calendar/:path/delete", func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, _, err := getCalendar(u, ctx.Session)
		if err != nil {
			return err
		}

		if err := c.RemoveAll(path); err != nil {
			return fmt.Errorf("failed to delete calendar object: %v", err)
		}

		return ctx.Redirect(http.StatusFound, "/calendar")
	})
}
