package alpscaldav

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"git.sr.ht/~emersion/alps"
	"github.com/emersion/go-webdav/caldav"
	"github.com/labstack/echo/v4"
)

type CalendarRenderData struct {
	alps.BaseRenderData
	Time               time.Time
	Calendar           *caldav.Calendar
	Events             []CalendarObject
	PrevPage, NextPage string
}

type EventRenderData struct {
	alps.BaseRenderData
	Calendar *caldav.Calendar
	Event    CalendarObject
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

		return ctx.Render(http.StatusOK, "calendar.html", &CalendarRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			Time:           start,
			Calendar:       calendar,
			Events:         newCalendarObjectList(events),
			PrevPage:       start.AddDate(0, -1, 0).Format(monthPageLayout),
			NextPage:       start.AddDate(0, 1, 0).Format(monthPageLayout),
		})
	})

	p.GET("/calendar/:path", func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, err := newClient(u, ctx.Session)
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

		return ctx.Render(http.StatusOK, "event.html", &EventRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			Calendar:       calendar,
			Event:          CalendarObject{event},
		})
	})
}
