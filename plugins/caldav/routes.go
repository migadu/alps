package koushincaldav

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"git.sr.ht/~emersion/koushin"
	"github.com/emersion/go-webdav/caldav"
)

type CalendarRenderData struct {
	koushin.BaseRenderData
	Time               time.Time
	Calendar           *caldav.Calendar
	Events             []caldav.CalendarObject
	PrevPage, NextPage string
}

type EventRenderData struct {
	koushin.BaseRenderData
	Calendar *caldav.Calendar
	Event    *caldav.CalendarObject
}

var monthPageLayout = "2006-01"

func registerRoutes(p *koushin.GoPlugin, u *url.URL) {
	p.GET("/calendar", func(ctx *koushin.Context) error {
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
			BaseRenderData: *koushin.NewBaseRenderData(ctx),
			Time:           start,
			Calendar:       calendar,
			Events:         events,
			PrevPage:       start.AddDate(0, -1, 0).Format(monthPageLayout),
			NextPage:       start.AddDate(0, 1, 0).Format(monthPageLayout),
		})
	})

	p.GET("/calendar/:uid", func(ctx *koushin.Context) error {
		uid := ctx.Param("uid")

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
						"DESCRIPTION",
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
					Name: "VEVENT",
					Props: []caldav.PropFilter{{
						Name:      "UID",
						TextMatch: &caldav.TextMatch{Text: uid},
					}},
				}},
			},
		}
		events, err := c.QueryCalendar(calendar.Path, &query)
		if err != nil {
			return fmt.Errorf("failed to query calendar: %v", err)
		}
		if len(events) != 1 {
			return fmt.Errorf("expected exactly one calendar object with UID %q, got %v", uid, len(events))
		}
		event := &events[0]

		return ctx.Render(http.StatusOK, "event.html", &EventRenderData{
			BaseRenderData: *koushin.NewBaseRenderData(ctx),
			Calendar:       calendar,
			Event:          event,
		})
	})
}
