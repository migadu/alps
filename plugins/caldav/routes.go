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
}
