package alpsviewcalendar

import (
	"fmt"
	"html/template"
	"strings"
	"time"

	"git.sr.ht/~migadu/alps"
	alpsbase "git.sr.ht/~migadu/alps/plugins/base"
	"github.com/emersion/go-ical"
	"github.com/emersion/go-message"
)

const inputDateLayout = "2006-01-02"

var templateFuncs = template.FuncMap{
	"formatdate": func(t time.Time) string {
		return t.Format("Mon Jan 02 15:04")
	},
}

var tplSrc = `
<table>
  <tr>
    <th colspan="2">
      Invitation to <strong>{{.Event.Props.Text "SUMMARY"}}</strong>
    </th>
  </tr>
  <tr>
    <th>Start date:</th>
    <td>{{(.Event.DateTimeStart nil).In .Location | formatdate}}</td>
  </tr>
  <tr>
    <th>End date:</th>
    <td>{{(.Event.DateTimeEnd nil).In .Location | formatdate}}</td>
  </tr>
</table>
`

var tpl = template.Must(template.New("view-calendar.html").Funcs(templateFuncs).Parse(tplSrc))

type viewer struct{}

type eventRenderData struct {
	Event    *ical.Event
	Location *time.Location
}

func (viewer) ViewMessagePart(ctx *alps.Context, msg *alpsbase.IMAPMessage, part *message.Entity) (interface{}, error) {
	mimeType, _, err := part.Header.ContentType()
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(mimeType, "text/calendar") {
		return nil, alpsbase.ErrViewUnsupported
	}

	settings, err := alpsbase.LoadSettings(ctx.Session.Store())
	if err != nil {
		return nil, fmt.Errorf("failed to load settings: %v", err)
	}
	loc, err := time.LoadLocation(settings.Timezone)
	if err != nil {
		return nil, fmt.Errorf("failed to load location: %v", err)
	}

	dec := ical.NewDecoder(part.Body)
	cal, err := dec.Decode()
	if err != nil {
		return nil, err
	}

	events := cal.Events()
	if len(events) == 0 {
		return nil, fmt.Errorf("calendar does not contain events")
	}

	var sb strings.Builder
	err = tpl.ExecuteTemplate(&sb, "view-calendar.html", &eventRenderData{
		Event:    &events[0],
		Location: loc,
	})
	if err != nil {
		return "", err
	}
	return template.HTML(sb.String()), nil
}

func init() {
	alpsbase.RegisterViewer(viewer{})
}
