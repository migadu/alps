// Package itip applies the iCalendar Transport-Independent Interoperability
// Protocol (RFC 5546) to calendar objects: reading the scheduling message an
// invitation carries, answering it, and folding what an organizer or attendee
// sends back into the copy a calendar holds.
//
// It knows nothing about how a message travels. The same messages go by email
// (RFC 6047) when alps sends them itself, and are left to a server that
// schedules on its own (RFC 6638), in which case none of the message builders
// here are used.
package itip

import (
	"errors"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/emersion/go-ical"
	"github.com/teambition/rrule-go"
)

// The methods alps reads and writes (RFC 5546 §1.4).
const (
	MethodPublish = "PUBLISH"
	MethodRequest = "REQUEST"
	MethodReply   = "REPLY"
	MethodCancel  = "CANCEL"
)

// Participation statuses (RFC 5545 §3.2.12). The last two are for tasks.
const (
	NeedsAction = "NEEDS-ACTION"
	Accepted    = "ACCEPTED"
	Tentative   = "TENTATIVE"
	Declined    = "DECLINED"
	Delegated   = "DELEGATED"
	Completed   = "COMPLETED"
	InProcess   = "IN-PROCESS"
)

var (
	// ErrNotInvited is an answer from, or on behalf of, an address the
	// calendar object does not list as an attendee.
	ErrNotInvited = errors.New("itip: not an attendee")
	// ErrOutdated is an answer to a version the organizer has since replaced.
	ErrOutdated = errors.New("itip: answers an earlier version")
)

// Address returns the email address a CAL-ADDRESS names, lower-cased for
// comparison, or "" when it is not a mailto: address.
func Address(value string) string {
	v := strings.TrimSpace(value)
	if len(v) < len("mailto:") || !strings.EqualFold(v[:len("mailto:")], "mailto:") {
		return ""
	}
	addr := strings.TrimSpace(v[len("mailto:"):])
	if unescaped, err := url.PathUnescape(addr); err == nil {
		addr = unescaped
	}
	if !strings.Contains(addr, "@") {
		return ""
	}
	return strings.ToLower(addr)
}

// Method returns a calendar's METHOD, upper-cased, or "" when it carries none.
func Method(cal *ical.Calendar) string {
	if prop := cal.Props.Get(ical.PropMethod); prop != nil {
		return strings.ToUpper(strings.TrimSpace(prop.Value))
	}
	return ""
}

func isItem(comp *ical.Component) bool {
	return comp.Name == ical.CompEvent || comp.Name == ical.CompToDo
}

// Items returns the events and tasks of a calendar: a series' master and the
// overrides of its occurrences.
func Items(cal *ical.Calendar) []*ical.Component {
	var items []*ical.Component
	for _, child := range cal.Children {
		if isItem(child) {
			items = append(items, child)
		}
	}
	return items
}

// Master returns the item a calendar object is about: the one without a
// RECURRENCE-ID, or the first when it holds only overrides.
func Master(cal *ical.Calendar) *ical.Component {
	items := Items(cal)
	for _, item := range items {
		if item.Props.Get(ical.PropRecurrenceID) == nil {
			return item
		}
	}
	if len(items) > 0 {
		return items[0]
	}
	return nil
}

// UID returns an item's UID.
func UID(comp *ical.Component) string {
	uid, _ := comp.Props.Text(ical.PropUID)
	return uid
}

// Sequence returns an item's revision number, 0 when it has none.
func Sequence(comp *ical.Component) int {
	if prop := comp.Props.Get(ical.PropSequence); prop != nil {
		if n, err := strconv.Atoi(strings.TrimSpace(prop.Value)); err == nil {
			return n
		}
	}
	return 0
}

// SetSequence writes an item's revision number.
func SetSequence(comp *ical.Component, n int) {
	prop := ical.NewProp(ical.PropSequence)
	prop.Value = strconv.Itoa(n)
	comp.Props.Set(prop)
}

// Newer reports whether a is a later revision of an item than b: a higher
// SEQUENCE, or the same one stamped later (RFC 5546 §2.1.5).
func Newer(a, b *ical.Component) bool {
	if sa, sb := Sequence(a), Sequence(b); sa != sb {
		return sa > sb
	}
	ta, errA := stamp(a)
	tb, errB := stamp(b)
	if errA != nil || errB != nil {
		return false
	}
	return ta.After(tb)
}

func stamp(comp *ical.Component) (time.Time, error) {
	prop := comp.Props.Get(ical.PropDateTimeStamp)
	if prop == nil {
		return time.Time{}, errors.New("itip: no DTSTAMP")
	}
	return prop.DateTime(time.UTC)
}

// Party is an organizer or attendee as a property describes them.
type Party struct {
	Address string
	Name    string
	// SentBy is who acts for them (RFC 5545 §3.2.18), when someone does.
	SentBy string
	// Status is an attendee's participation status, upper-cased.
	Status string
	// Role is an attendee's role, upper-cased.
	Role string
	// RSVP reports whether the organizer asked for an answer. RFC 5545's
	// default is no, but the invitations people send ask as a matter of course
	// and say so; only an explicit FALSE is read as not asking.
	RSVP bool
}

// PartyOf reads an ORGANIZER or ATTENDEE property.
func PartyOf(prop *ical.Prop) Party {
	return partyOf(prop)
}

func partyOf(prop *ical.Prop) Party {
	p := Party{
		Address: Address(prop.Value),
		Name:    prop.Params.Get(ical.ParamCommonName),
		SentBy:  Address(prop.Params.Get(ical.ParamSentBy)),
		Status:  strings.ToUpper(prop.Params.Get(ical.ParamParticipationStatus)),
		Role:    strings.ToUpper(prop.Params.Get(ical.ParamRole)),
		RSVP:    !strings.EqualFold(prop.Params.Get(ical.ParamRSVP), "FALSE"),
	}
	if prop.Name == ical.PropAttendee {
		if p.Status == "" {
			p.Status = NeedsAction
		}
		if p.Role == "" {
			p.Role = "REQ-PARTICIPANT"
		}
	}
	return p
}

// Organizer returns an item's organizer, or nil when it names none.
func Organizer(comp *ical.Component) *Party {
	prop := comp.Props.Get(ical.PropOrganizer)
	if prop == nil {
		return nil
	}
	p := partyOf(prop)
	if p.Address == "" {
		return nil
	}
	return &p
}

// Attendees returns an item's attendees that have an email address.
func Attendees(comp *ical.Component) []Party {
	var out []Party
	for i := range comp.Props[ical.PropAttendee] {
		if p := partyOf(&comp.Props[ical.PropAttendee][i]); p.Address != "" {
			out = append(out, p)
		}
	}
	return out
}

// Attendee returns the ATTENDEE property naming addr, for changing in place,
// or nil.
func Attendee(comp *ical.Component, addr string) *ical.Prop {
	addr = strings.ToLower(addr)
	for i := range comp.Props[ical.PropAttendee] {
		if Address(comp.Props[ical.PropAttendee][i].Value) == addr {
			return &comp.Props[ical.PropAttendee][i]
		}
	}
	return nil
}

// Acts reports whether someone with address addr may speak for a party: the
// party themselves, or the one their SENT-BY names.
func (p Party) Acts(addr string) bool {
	addr = strings.ToLower(addr)
	return addr != "" && (addr == p.Address || addr == p.SentBy)
}

// Invite makes organizer the organizer of comp and attendees its attendees.
// An attendee already listed keeps what their property says (their answer
// above all) and has only their name refreshed; one added is asked to answer.
// With no attendees the item stops being a meeting: its organizer goes too.
//
// It returns the addresses added and removed.
func Invite(comp *ical.Component, organizer Party, attendees []Party) (added, removed []string) {
	previous := map[string]ical.Prop{}
	for _, prop := range comp.Props[ical.PropAttendee] {
		if addr := Address(prop.Value); addr != "" {
			previous[addr] = prop
		}
	}

	var props []ical.Prop
	kept := map[string]bool{}
	for _, a := range attendees {
		addr := strings.ToLower(strings.TrimSpace(a.Address))
		if addr == "" || kept[addr] {
			continue
		}
		kept[addr] = true
		prop, ok := previous[addr]
		if ok {
			prop.Params = cloneParams(prop.Params)
		} else {
			prop = *ical.NewProp(ical.PropAttendee)
			prop.Value = "mailto:" + addr
			prop.Params.Set(ical.ParamCalendarUserType, "INDIVIDUAL")
			prop.Params.Set(ical.ParamRole, "REQ-PARTICIPANT")
			prop.Params.Set(ical.ParamParticipationStatus, NeedsAction)
			prop.Params.Set(ical.ParamRSVP, "TRUE")
			added = append(added, addr)
		}
		if a.Name != "" {
			prop.Params.Set(ical.ParamCommonName, a.Name)
		}
		props = append(props, prop)
	}
	for addr := range previous {
		if !kept[addr] {
			removed = append(removed, addr)
		}
	}
	sort.Strings(removed)

	// Properties with no email address are someone else's (a room booked by
	// another system, say), and stay as they were.
	for _, prop := range comp.Props[ical.PropAttendee] {
		if Address(prop.Value) == "" {
			props = append(props, prop)
		}
	}

	if len(props) == 0 {
		comp.Props.Del(ical.PropAttendee)
		comp.Props.Del(ical.PropOrganizer)
		return added, removed
	}
	comp.Props[ical.PropAttendee] = props

	prop := ical.NewProp(ical.PropOrganizer)
	if existing := comp.Props.Get(ical.PropOrganizer); existing != nil && Address(existing.Value) == strings.ToLower(organizer.Address) {
		prop.Params = cloneParams(existing.Params)
	}
	prop.Value = "mailto:" + strings.ToLower(organizer.Address)
	if organizer.Name != "" {
		prop.Params.Set(ical.ParamCommonName, organizer.Name)
	}
	comp.Props.Set(prop)
	return added, removed
}

// AskAgain sets every attendee but those at the given addresses back to
// needing to answer, as an organizer does when a meeting moves (RFC 5546
// §2.1.4): an acceptance of one time is not one of another.
func AskAgain(comp *ical.Component, except ...string) {
	skip := map[string]bool{}
	for _, addr := range except {
		skip[strings.ToLower(addr)] = true
	}
	for i := range comp.Props[ical.PropAttendee] {
		prop := &comp.Props[ical.PropAttendee][i]
		if skip[Address(prop.Value)] {
			continue
		}
		prop.Params.Set(ical.ParamParticipationStatus, NeedsAction)
		prop.Params.Set(ical.ParamRSVP, "TRUE")
	}
}

// The properties that say when an item happens.
var whenProps = []string{
	ical.PropDateTimeStart, ical.PropDateTimeEnd, ical.PropDuration, ical.PropDue,
	ical.PropRecurrenceRule, ical.PropRecurrenceDates, ical.PropExceptionDates,
}

// And those that say what it is.
var whatProps = []string{ical.PropSummary, ical.PropLocation, ical.PropDescription, ical.PropStatus}

// Rescheduled reports whether b happens at another time than a.
func Rescheduled(a, b *ical.Component) bool {
	return fingerprint(a, whenProps) != fingerprint(b, whenProps)
}

// Revised reports whether b differs from a in anything its attendees are
// told: when it is, what it is, where, or whether it is still on.
func Revised(a, b *ical.Component) bool {
	return Rescheduled(a, b) || fingerprint(a, whatProps) != fingerprint(b, whatProps)
}

func fingerprint(comp *ical.Component, names []string) string {
	var b strings.Builder
	for _, name := range names {
		var values []string
		for _, prop := range comp.Props[name] {
			values = append(values, prop.Params.Get(ical.ParamValue)+";"+prop.Params.Get(ical.ParamTimezoneID)+":"+prop.Value)
		}
		sort.Strings(values)
		b.WriteString(name)
		b.WriteString("=")
		b.WriteString(strings.Join(values, ","))
		b.WriteString("\n")
	}
	return b.String()
}

// Clone returns a deep copy of a calendar.
func Clone(cal *ical.Calendar) *ical.Calendar {
	return &ical.Calendar{Component: cloneComponent(cal.Component)}
}

func cloneComponent(comp *ical.Component) *ical.Component {
	out := &ical.Component{Name: comp.Name, Props: make(ical.Props, len(comp.Props))}
	for name, props := range comp.Props {
		copied := make([]ical.Prop, len(props))
		for i, prop := range props {
			copied[i] = ical.Prop{Name: prop.Name, Value: prop.Value, Params: cloneParams(prop.Params)}
		}
		out.Props[name] = copied
	}
	for _, child := range comp.Children {
		out.Children = append(out.Children, cloneComponent(child))
	}
	return out
}

func cloneParams(params ical.Params) ical.Params {
	out := make(ical.Params, len(params))
	for name, values := range params {
		out[name] = append([]string(nil), values...)
	}
	return out
}

// Stored returns a scheduling message as a calendar collection holds it: a
// copy without METHOD, which a stored object must not carry (RFC 4791 §4.1).
func Stored(msg *ical.Calendar) *ical.Calendar {
	cal := Clone(msg)
	cal.Props.Del(ical.PropMethod)
	return cal
}

// Answer sets attendee's participation status throughout cal, and reports
// whether any item lists them.
func Answer(cal *ical.Calendar, attendee, status string) bool {
	found := false
	for _, item := range Items(cal) {
		if prop := Attendee(item, attendee); prop != nil {
			prop.Params.Set(ical.ParamParticipationStatus, status)
			found = true
		}
	}
	return found
}

// Message returns cal as a scheduling message of the given method: a copy
// with METHOD set and every item stamped now. Alarms are left out, being
// reminders their owner set for themselves.
func Message(cal *ical.Calendar, method string, now time.Time) *ical.Calendar {
	msg := Clone(cal)
	msg.Props.SetText(ical.PropMethod, method)
	for _, item := range Items(msg) {
		dropAlarms(item)
		item.Props.SetDateTime(ical.PropDateTimeStamp, now.UTC())
	}
	return msg
}

func dropAlarms(comp *ical.Component) {
	children := comp.Children[:0]
	for _, child := range comp.Children {
		if child.Name != ical.CompAlarm {
			children = append(children, child)
		}
	}
	comp.Children = children
}

// Reply returns the REPLY an attendee sends: the items of cal that list them,
// each listing them alone, at the status cal holds for them (RFC 5546
// §3.2.3).
func Reply(cal *ical.Calendar, attendee string, now time.Time) (*ical.Calendar, error) {
	msg := Message(cal, MethodReply, now)
	var children []*ical.Component
	for _, child := range msg.Children {
		if !isItem(child) {
			children = append(children, child)
			continue
		}
		prop := Attendee(child, attendee)
		if prop == nil {
			continue
		}
		child.Props[ical.PropAttendee] = []ical.Prop{*prop}
		children = append(children, child)
	}
	msg.Children = children
	if len(Items(msg)) == 0 {
		return nil, ErrNotInvited
	}
	return msg, nil
}

// Cancel returns the CANCEL of a whole meeting or task (RFC 5546 §3.2.5).
// Sent to everyone, it moves the revision on, as the cancellation is one.
// Given addresses, it names only those attendees: the ones removed from
// something that goes on, whose revision the save that removed them has
// already moved.
func Cancel(cal *ical.Calendar, attendees []string, now time.Time) *ical.Calendar {
	msg := Message(cal, MethodCancel, now)
	master := Master(msg)
	var children []*ical.Component
	for _, child := range msg.Children {
		if !isItem(child) || child == master {
			children = append(children, child)
		}
	}
	msg.Children = children
	if master == nil {
		return msg
	}
	master.Props.SetText(ical.PropStatus, "CANCELLED")
	if attendees == nil {
		SetSequence(master, Sequence(master)+1)
		return msg
	}
	named := map[string]bool{}
	for _, addr := range attendees {
		named[strings.ToLower(addr)] = true
	}
	var props []ical.Prop
	for _, prop := range master.Props[ical.PropAttendee] {
		if named[Address(prop.Value)] {
			props = append(props, prop)
		}
	}
	master.Props[ical.PropAttendee] = props
	return msg
}

// Update returns the copy an organizer's newer REQUEST makes of the one
// stored: the request itself, keeping from the stored copy what is the
// attendee's own. That is their answer, unless the item has been moved in time
// since they gave it, and the alarms they set.
func Update(stored, request *ical.Calendar, attendee string) *ical.Calendar {
	updated := Stored(request)
	previous := map[string]*ical.Component{}
	for _, item := range Items(stored) {
		previous[recurrenceKey(stored, item)] = item
	}
	for _, item := range Items(updated) {
		old, ok := previous[recurrenceKey(updated, item)]
		if !ok {
			continue
		}
		if !Rescheduled(old, item) {
			if was, now := Attendee(old, attendee), Attendee(item, attendee); was != nil && now != nil {
				now.Params.Set(ical.ParamParticipationStatus, partyOf(was).Status)
			}
		}
		if !hasAlarm(item) {
			for _, child := range old.Children {
				if child.Name == ical.CompAlarm {
					item.Children = append(item.Children, cloneComponent(child))
				}
			}
		}
	}
	return updated
}

func hasAlarm(comp *ical.Component) bool {
	for _, child := range comp.Children {
		if child.Name == ical.CompAlarm {
			return true
		}
	}
	return false
}

// ApplyCancel removes from a stored copy what a CANCEL cancels, and reports
// whether nothing is left of it, in which case the object is to be deleted.
// A cancelled occurrence is excluded from its series, and its override, if
// the copy has one, goes.
func ApplyCancel(stored, cancel *ical.Calendar) (gone bool) {
	for _, item := range Items(cancel) {
		rid := item.Props.Get(ical.PropRecurrenceID)
		if rid == nil {
			return true
		}
		key := recurrenceKey(cancel, item)
		var children []*ical.Component
		for _, child := range stored.Children {
			if isItem(child) && child.Props.Get(ical.PropRecurrenceID) != nil && recurrenceKey(stored, child) == key {
				continue
			}
			children = append(children, child)
		}
		stored.Children = children
		if master := Master(stored); master != nil && master.Props.Get(ical.PropRecurrenceID) == nil {
			exdate := ical.Prop{Name: ical.PropExceptionDates, Value: rid.Value, Params: cloneParams(rid.Params)}
			exdate.Params.Del(ical.ParamRange)
			master.Props.Add(&exdate)
		}
	}
	return len(Items(stored)) == 0
}

// ApplyReply records in the organizer's stored copy the status an attendee's
// REPLY reports, and reports whether that changed anything. An answer from
// someone the copy does not list is refused, as is one to a revision the
// organizer has since replaced: it accepted a time that no longer stands.
func ApplyReply(stored, reply *ical.Calendar) (changed bool, err error) {
	byKey := map[string]*ical.Component{}
	for _, item := range Items(stored) {
		byKey[recurrenceKey(stored, item)] = item
	}
	for _, item := range Items(reply) {
		target, ok := byKey[recurrenceKey(reply, item)]
		if !ok {
			// An answer for a single occurrence the copy has no override for.
			// Recording it would mean inventing that override; it is left.
			continue
		}
		if Sequence(item) < Sequence(target) {
			return false, ErrOutdated
		}
		for _, answer := range Attendees(item) {
			prop := Attendee(target, answer.Address)
			if prop == nil {
				return false, ErrNotInvited
			}
			if partyOf(prop).Status != answer.Status {
				prop.Params.Set(ical.ParamParticipationStatus, answer.Status)
				changed = true
			}
		}
	}
	return changed, nil
}

// recurrenceKey names which occurrence an item is: "" for a master, or the
// instant its RECURRENCE-ID names, so that the same occurrence matches
// however each side wrote its time.
func recurrenceKey(cal *ical.Calendar, comp *ical.Component) string {
	prop := comp.Props.Get(ical.PropRecurrenceID)
	if prop == nil {
		return ""
	}
	t, isDate, err := Time(cal, prop)
	if err != nil {
		return prop.Value
	}
	if isDate {
		return t.Format("20060102")
	}
	return t.UTC().Format("20060102T150405Z")
}

// Time reads a DATE or DATE-TIME property of an item in cal, and whether it
// is a date.
//
// A TZID is the zone of that name when this system has one, and otherwise
// the VTIMEZONE cal defines under it (RFC 5545 §3.6.5): Outlook names its
// zones the Windows way ("W. Europe Standard Time"), which no zone database
// knows, and a time read as UTC instead is hours out. A zone neither resolves,
// and a floating time, are read as UTC.
func Time(cal *ical.Calendar, prop *ical.Prop) (time.Time, bool, error) {
	value := strings.TrimSpace(prop.Value)
	// The VALUE parameter itself, not ValueType, which answers DATE-TIME for a
	// DTSTART that states no VALUE even when what it holds is a date.
	valueType := strings.ToUpper(prop.Params.Get(ical.ParamValue))
	if valueType == string(ical.ValueDate) || (valueType == "" && len(value) == len("20060102")) {
		t, err := time.ParseInLocation("20060102", value, time.UTC)
		return t, true, err
	}
	if strings.HasSuffix(value, "Z") {
		t, err := time.ParseInLocation("20060102T150405Z", value, time.UTC)
		return t, false, err
	}
	wall, err := time.ParseInLocation("20060102T150405", value, time.UTC)
	if err != nil {
		return wall, false, err
	}
	tzid := prop.Params.Get(ical.ParamTimezoneID)
	if tzid == "" {
		return wall, false, nil
	}
	if loc, err := time.LoadLocation(tzid); err == nil {
		t, err := time.ParseInLocation("20060102T150405", value, loc)
		return t, false, err
	}
	if cal != nil {
		for _, child := range cal.Children {
			if child.Name != ical.CompTimezone {
				continue
			}
			if id, _ := child.Props.Text(ical.PropTimezoneID); id != tzid {
				continue
			}
			if offset, ok := zoneOffset(child, wall); ok {
				return wall.Add(-offset).In(time.FixedZone(tzid, int(offset/time.Second))), false, nil
			}
		}
	}
	return wall, false, nil
}

// zoneOffset returns the UTC offset a VTIMEZONE gives a wall-clock time: that
// of the observance (STANDARD or DAYLIGHT) that began most recently before it.
func zoneOffset(tz *ical.Component, wall time.Time) (time.Duration, bool) {
	var (
		best       time.Time
		bestOffset time.Duration
		found      bool
		// Before the first onset, the zone was at the offset that onset left.
		earliest     time.Time
		earliestFrom time.Duration
		haveEarliest bool
	)
	for _, obs := range tz.Children {
		if obs.Name != ical.CompTimezoneStandard && obs.Name != ical.CompTimezoneDaylight {
			continue
		}
		to, okTo := parseOffset(obs.Props.Get(ical.PropTimezoneOffsetTo))
		from, okFrom := parseOffset(obs.Props.Get(ical.PropTimezoneOffsetFrom))
		startProp := obs.Props.Get(ical.PropDateTimeStart)
		if !okTo || startProp == nil {
			continue
		}
		start, err := time.ParseInLocation("20060102T150405", strings.TrimSpace(startProp.Value), time.UTC)
		if err != nil {
			continue
		}
		if !haveEarliest || start.Before(earliest) {
			earliest, haveEarliest = start, true
			earliestFrom = to
			if okFrom {
				earliestFrom = from
			}
		}

		onsets := []time.Time{}
		if !start.After(wall) {
			onsets = append(onsets, start)
		}
		if rule := obs.Props.Get(ical.PropRecurrenceRule); rule != nil {
			if opt, err := rrule.StrToROption(rule.Value); err == nil {
				opt.Dtstart = start
				// Zones are defined from long ago (Outlook's start in 1601), and
				// rrule-go gives up expanding a yearly rule centuries before
				// today. The rule's BY parts fix the day in any year, so it is
				// started from the year before instead.
				if opt.Freq == rrule.YEARLY && start.Year() < wall.Year()-1 {
					opt.Dtstart = time.Date(wall.Year()-1, start.Month(), start.Day(), start.Hour(), start.Minute(), start.Second(), 0, time.UTC)
				}
				if r, err := rrule.NewRRule(*opt); err == nil {
					if t := r.Before(wall, true); !t.IsZero() {
						onsets = append(onsets, t)
					}
				}
			}
		}
		for _, rdate := range obs.Props[ical.PropRecurrenceDates] {
			for _, v := range strings.Split(rdate.Value, ",") {
				if t, err := time.ParseInLocation("20060102T150405", strings.TrimSpace(v), time.UTC); err == nil && !t.After(wall) {
					onsets = append(onsets, t)
				}
			}
		}
		for _, t := range onsets {
			if !found || t.After(best) {
				best, bestOffset, found = t, to, true
			}
		}
	}
	if found {
		return bestOffset, true
	}
	if haveEarliest {
		return earliestFrom, true
	}
	return 0, false
}

// parseOffset reads a UTC-OFFSET value: +HHMM or +HHMMSS.
func parseOffset(prop *ical.Prop) (time.Duration, bool) {
	if prop == nil {
		return 0, false
	}
	v := strings.TrimSpace(prop.Value)
	if len(v) != 5 && len(v) != 7 {
		return 0, false
	}
	sign := time.Duration(1)
	switch v[0] {
	case '-':
		sign = -1
	case '+':
	default:
		return 0, false
	}
	h, err1 := strconv.Atoi(v[1:3])
	m, err2 := strconv.Atoi(v[3:5])
	s := 0
	var err3 error
	if len(v) == 7 {
		s, err3 = strconv.Atoi(v[5:7])
	}
	if err1 != nil || err2 != nil || err3 != nil {
		return 0, false
	}
	return sign * (time.Duration(h)*time.Hour + time.Duration(m)*time.Minute + time.Duration(s)*time.Second), true
}
