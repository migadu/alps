package alpscaldav

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"

	"git.sr.ht/~migadu/alps"
	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav/caldav"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CalendarMonthRenderData struct {
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

type CalendarWeekRenderData struct {
	alps.BaseRenderData
	Time               time.Time
	Now                time.Time
	Dates              [7]time.Time
	Calendar           *caldav.Calendar
	Events             []CalendarObject
	PrevPage, NextPage string
	PrevTime, NextTime time.Time

	EventsForDate func(time.Time) []CalendarObject
	DaySuffix     func(n int) string
}

type CalendarDateRenderData struct {
	alps.BaseRenderData
	Time               time.Time
	Now                time.Time
	Calendar           *caldav.Calendar
	Events             []CalendarObject
	PrevPage, NextPage string
	PrevTime, NextTime time.Time
}

type EventRenderData struct {
	alps.BaseRenderData
	Calendar       *caldav.Calendar
	CalendarObject CalendarObject
	Event          Event
	ParseDuration  func(d time.Duration) *Duration
}

type UpdateEventRenderData struct {
	alps.BaseRenderData
	Calendar       *caldav.Calendar
	CalendarObject CalendarObject // internal object nil if creating new event
	Event          *ical.Event
}

type UpdateEventAlarmRenderData struct {
	alps.BaseRenderData
	Calendar       *caldav.Calendar
	CalendarObject CalendarObject
	Alarm          *ical.Component
	Create         bool
	ParseDuration  func(d time.Duration) *Duration
}

const (
	monthPageLayout = "2006-01"
	datePageLayout  = "2006-01-02"
)

func parseObjectPath(s string) (string, error) {
	p, err := url.PathUnescape(s)
	if err != nil {
		err = fmt.Errorf("failed to parse path: %v", err)
		return "", echo.NewHTTPError(http.StatusBadRequest, err)
	}
	return p, nil
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

type Duration struct {
	time.Duration
	Value int
	Unit  string
}

func parseDuration(d time.Duration) *Duration {
	day := 24 * time.Hour
	week := 7 * day

	var value int
	var unit string
	if d%(week) == 0 {
		value = int(d / week)
		unit = "w"
	} else if d%(day) == 0 {
		value = int(d / day)
		unit = "d"
	} else if d%time.Hour == 0 {
		value = int(d.Hours())
		unit = "h"
	} else {
		value = int(d.Minutes())
		unit = "m"
	}

	if value == 0 {
		unit = "m"
	}
	if value < 0 {
		value = -value
	}

	return &Duration{
		Duration: d,
		Value:    value,
		Unit:     unit,
	}

}

func registerRoutes(p *alps.GoPlugin, u *url.URL) {
	p.GET("/calendar", func(ctx *alps.Context) error {
		return ctx.Redirect(http.StatusFound, "/calendar/month")
	})

	p.GET("/calendar/month", func(ctx *alps.Context) error {
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
		for i := 0; i < len(dates); i++ {
			dates[i] = initialDate
			initialDate = initialDate.AddDate(0, 0, 1)
		}

		eventMap := make(map[string][]CalendarObject)
		for _, ev := range events {
			ev := ev // make a copy
			// TODO: include event on each date for which it is active
			co := ev.Data.Events()[0]
			startTime, _ := co.DateTimeStart(nil)
			startTime = startTime.UTC()
			startDate := startTime.Format(datePageLayout)
			eventMap[startDate] = append(eventMap[startDate], CalendarObject{&ev})
		}

		return ctx.Render(http.StatusOK, "calendar-month.html", &CalendarMonthRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).
				WithTitle(calendar.Name + " Calendar: " + start.Format("January 2006")),
			Time:     start,
			Now:      time.Now(), // TODO: Use client time zone
			Calendar: calendar,
			Dates:    dates,
			Events:   newCalendarObjectList(events),
			PrevPage: start.AddDate(0, -1, 0).Format(monthPageLayout),
			NextPage: start.AddDate(0, 1, 0).Format(monthPageLayout),
			PrevTime: start.AddDate(0, -1, 0),
			NextTime: start.AddDate(0, 1, 0),

			EventsForDate: func(when time.Time) []CalendarObject {
				if events, ok := eventMap[when.Format(datePageLayout)]; ok {
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

	p.GET("/calendar/week", func(ctx *alps.Context) error {
		var start time.Time
		if s := ctx.QueryParam("date"); s != "" {
			var err error
			start, err = time.Parse(datePageLayout, s)
			if err != nil {
				return fmt.Errorf("failed to parse date: %v", err)
			}
		} else {
			now := time.Now()
			start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		}
		start = start.AddDate(0, 0, -int(start.Weekday()))
		end := start.AddDate(0, 0, 7)

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
		var dates [7]time.Time
		initialDate := start.UTC()
		for i := 0; i < len(dates); i++ {
			dates[i] = initialDate
			initialDate = initialDate.AddDate(0, 0, 1)
		}

		eventMap := make(map[string][]CalendarObject)
		for _, ev := range events {
			ev := ev // make a copy
			// TODO: include event on each date for which it is active
			co := ev.Data.Events()[0]
			startTime, _ := co.DateTimeStart(nil)
			startTime = startTime.UTC()
			startDate := startTime.Format(datePageLayout)
			eventMap[startDate] = append(eventMap[startDate], CalendarObject{&ev})
		}

		title := start.Format("January 02") + " - " + start.AddDate(0, 0, 6).Format("January 02")

		return ctx.Render(http.StatusOK, "calendar-week.html", &CalendarWeekRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).
				WithTitle(calendar.Name + " Calendar: " + title),
			Time:     start,
			Now:      time.Now(), // TODO: Use client time zone
			Calendar: calendar,
			Dates:    dates,
			Events:   newCalendarObjectList(events),
			PrevPage: start.AddDate(0, 0, -7).Format(datePageLayout),
			NextPage: start.AddDate(0, 0, 7).Format(datePageLayout),
			PrevTime: start.AddDate(0, 0, -7),
			NextTime: start.AddDate(0, 0, 7),

			EventsForDate: func(when time.Time) []CalendarObject {
				if events, ok := eventMap[when.Format(datePageLayout)]; ok {
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
		})
	})

	p.GET("/calendar/date", func(ctx *alps.Context) error {
		var start time.Time
		if s := ctx.QueryParam("date"); s != "" {
			var err error
			start, err = time.Parse(datePageLayout, s)
			if err != nil {
				return fmt.Errorf("failed to parse date: %v", err)
			}
		} else {
			now := time.Now()
			start = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		}
		end := start.AddDate(0, 0, 1)

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

		return ctx.Render(http.StatusOK, "calendar-date.html", &CalendarDateRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).
				WithTitle(calendar.Name + " Calendar: " + start.Format("January 02, 2006")),
			Time:     start,
			Now:      time.Now(), // TODO: Use client time zone
			Events:   newCalendarObjectList(events),
			Calendar: calendar,
			PrevPage: start.AddDate(0, 0, -1).Format(datePageLayout),
			NextPage: start.AddDate(0, 0, 1).Format(datePageLayout),
			PrevTime: start.AddDate(0, 0, -1),
			NextTime: start.AddDate(0, 0, 1),
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

		coList, err := c.MultiGetCalendar(path, &multiGet)
		if err != nil {
			return fmt.Errorf("failed to multi-get calendar: %v", err)
		}
		if len(coList) != 1 {
			return fmt.Errorf("expected exactly one calendar object with path %q, got %v", path, len(coList))
		}
		co := &coList[0]
		event := &co.Data.Events()[0]
		summary, _ := event.Props.Text("SUMMARY")

		return ctx.Render(http.StatusOK, "event.html", &EventRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).WithTitle(summary),
			Calendar:       calendar,
			CalendarObject: CalendarObject{co},
			Event:          Event{event},
			ParseDuration:  parseDuration,
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
			if s := ctx.QueryParam("date"); s != "" {
				date, err := time.Parse(datePageLayout, s)
				if err != nil {
					return fmt.Errorf("failed to parse date: %v", err)
				}
				event.Props.SetDateTime(ical.PropDateTimeStart, date)
				event.Props.SetDateTime(ical.PropDateTimeEnd, date)
			}
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
			CalendarObject: CalendarObject{co},
			Event:          event,
		})
	}

	p.GET("/calendar/create", updateEvent)
	p.POST("/calendar/create", updateEvent)

	p.GET("/calendar/:path/update", updateEvent)
	p.POST("/calendar/:path/update", updateEvent)

	updateEventAlarm := func(ctx *alps.Context) error {
		calendarObjectPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, calendar, err := getCalendar(u, ctx.Session)
		if err != nil {
			return err
		}

		co, err := c.GetCalendarObject(calendarObjectPath)
		if err != nil {
			return fmt.Errorf("failed to get CalDAV event: %v", err)
		}
		cal := co.Data
		events := cal.Events()
		if len(events) != 1 {
			return fmt.Errorf("expected exactly one event, got %d", len(events))
		}
		event := &events[0]

		indexParam := ctx.Param("index")
		var alarm *ical.Component
		if indexParam != "" {
			idx, err := strconv.Atoi(indexParam)
			if err != nil {
				return fmt.Errorf("failed to parse alarm index: %v", err)
			}
			alarms := Event{event}.Alarms()
			if idx < 0 || idx > len(alarms)-1 {
				return fmt.Errorf("out of bounds alarm index: %v", idx)
			}
			alarm = alarms[idx]
		} else {
			alarm = ical.NewComponent(ical.CompAlarm)

			trigger := ical.NewProp(ical.PropTrigger)
			trigger.SetValueType(ical.ValueDuration)
			trigger.SetDuration(-15 * time.Minute)
			alarm.Props.Set(trigger)
			alarm.Props.SetText(ical.PropAction, ical.ParamDisplay)
		}

		if ctx.Request().Method == "POST" {
			value, err := strconv.Atoi(ctx.FormValue("value"))
			if err != nil {
				return fmt.Errorf("failed to parse duration value: %v", err)
			}

			unitStr := ctx.FormValue("unit")
			var unit time.Duration
			switch unitStr {
			case "m":
				unit = time.Minute
			case "h":
				unit = time.Hour
			case "d":
				unit = 24 * time.Hour
			case "w":
				unit = 7 * 24 * time.Hour
			default:
				return fmt.Errorf("invalid duration unit: %v", unitStr)
			}

			duration := time.Duration(value) * unit
			if ctx.FormValue("precedence") == "before" {
				duration = -duration
			}

			trigger := alarm.Props.Get(ical.PropTrigger)
			trigger.SetValueType(ical.ValueDuration)
			trigger.SetDuration(duration)

			related := strings.ToUpper(ctx.FormValue("related"))
			switch related {
			case "START", "END":
				trigger.Params.Set(ical.ParamRelated, related)
			default:
				return fmt.Errorf("invalid RELATED parameter value: %v", related)
			}

			if indexParam == "" {
				event.Children = append(event.Children, alarm)
			}

			co, err = c.PutCalendarObject(co.Path, cal)
			if err != nil {
				return fmt.Errorf("failed to put calendar object: %v", err)
			}

			return ctx.Redirect(http.StatusFound, CalendarObject{co}.URL())
		}

		return ctx.Render(http.StatusOK, "update-reminder.html", &UpdateEventAlarmRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx).WithTitle("Update reminder"),
			Calendar:       calendar,
			CalendarObject: CalendarObject{co},
			Alarm:          alarm,
			Create:         indexParam == "",
			ParseDuration:  parseDuration,
		})
	}

	p.GET("/calendar/:path/alarms/create", updateEventAlarm)
	p.POST("/calendar/:path/alarms/create", updateEventAlarm)
	p.GET("/calendar/:path/alarms/:index/update", updateEventAlarm)
	p.POST("/calendar/:path/alarms/:index/update", updateEventAlarm)

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

	p.POST("/calendar/:path/alarms/:index/delete", func(ctx *alps.Context) error {
		calendarObjectPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		alarmIdx, err := strconv.Atoi(ctx.Param("index"))
		if err != nil {
			return fmt.Errorf("failed to parse alarm index: %v", err)
		}

		c, _, err := getCalendar(u, ctx.Session)
		if err != nil {
			return err
		}

		co, err := c.GetCalendarObject(calendarObjectPath)
		if err != nil {
			return fmt.Errorf("failed to get CalDAV event: %v", err)
		}
		cal := co.Data
		events := cal.Events()
		if len(events) != 1 {
			return fmt.Errorf("expected exactly one event, got %d", len(events))
		}
		event := &events[0]
		children := event.Children

		var alarms, i int
		for i = 0; i < len(children); i++ {
			if children[i].Name == ical.CompAlarm {
				if alarmIdx == alarms {
					break
				}
				alarms = alarms + 1
			}
		}
		if i == len(children) {
			return fmt.Errorf("failed to find alarm with index %v", alarmIdx)
		}
		event.Children = append(children[:i], children[i+1:]...)

		co, err = c.PutCalendarObject(co.Path, cal)
		if err != nil {
			return fmt.Errorf("failed to put calendar object: %v", err)
		}

		ctx.Session.PutNotice("Reminder deleted.")
		return ctx.Redirect(http.StatusFound, CalendarObject{co}.URL())
	})

}
