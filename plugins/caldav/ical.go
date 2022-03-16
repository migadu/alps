package alpscaldav

import (
	"github.com/emersion/go-ical"
)

type Event struct {
	*ical.Event
}

func (event Event) Alarms() []*ical.Component {
	return compChildrenByName(event.Component, ical.CompAlarm)
}

func compChildrenByName(comp *ical.Component, name string) []*ical.Component {
	l := make([]*ical.Component, 0, len(comp.Children))
	for _, child := range comp.Children {
		if child.Name == name {
			l = append(l, child)
		}
	}
	return l
}
