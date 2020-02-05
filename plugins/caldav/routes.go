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
	Calendar *caldav.Calendar
	Events   []caldav.CalendarObject
}

type EventRenderData struct {
	koushin.BaseRenderData
	Calendar *caldav.Calendar
	Event    *caldav.CalendarObject
}

func registerRoutes(p *koushin.GoPlugin, u *url.URL) {
	p.GET("/calendar", func(ctx *koushin.Context) error {
		// TODO: multi-calendar support
		c, calendar, err := getCalendar(u, ctx.Session)
		if err != nil {
			return err
		}

		now := time.Now()
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		end := start.AddDate(0, 1, 0)

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
			Calendar:       calendar,
			Events:         events,
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
