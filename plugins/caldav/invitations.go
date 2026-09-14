package alpscaldav

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"path"
	"strings"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-webdav/caldav"
	"github.com/google/uuid"
	"github.com/migadu/alps"
	"github.com/migadu/alps/internal/davsave"
	"github.com/migadu/alps/internal/imip"
	"github.com/migadu/alps/internal/itip"
	"github.com/migadu/alps/provider"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// An invitation arrives as a calendar part of an email (RFC 6047). These
// routes read that part and settle it against the user's calendar: they answer
// an invitation, and apply what an organizer's update or cancellation, or an
// attendee's reply, says to the copy the calendar holds.
//
// The message is always read here, never taken from the browser: what gets
// written to the calendar, and what is mailed as the user, comes from the
// message in the user's mailbox. And no message makes the user an organizer.
// An invitation that names them as its organizer changes nothing and sends
// nothing, or anyone could send an .ics that has alps mail invitations, as
// the user, to whomever it lists.

// The largest calendar part read. Invitations are a few kilobytes; one with
// a long series of overrides is still far below this.
const maxInvitationBytes = 1 << 20

type invitationMessage struct {
	cal *ical.Calendar
	// sender is the message's From address, lower-cased.
	sender string
	// recipients are its To and Cc addresses, lower-cased.
	recipients []string
	// authFailed is the receiving server's verdict that the message failed
	// DMARC, DKIM or SPF: its From is not to be believed.
	authFailed bool
}

// calendarParts lists the parts of a message that may hold an iTIP message:
// text/calendar first, as RFC 6047 sends it, then application/ics and .ics
// attachments.
func calendarParts(bs provider.BodyStructure) [][]int {
	var preferred, others [][]int
	bs.Walk(func(path []int, part provider.BodyStructure) bool {
		p := append([]int(nil), path...)
		switch mediaType := part.MediaType(); {
		case mediaType == "text/calendar":
			preferred = append(preferred, p)
		case imip.ContentType(mediaType):
			others = append(others, p)
		case strings.HasSuffix(strings.ToLower(filenameOf(part)), ".ics"):
			others = append(others, p)
		}
		return true
	})
	return append(preferred, others...)
}

func filenameOf(part provider.BodyStructure) string {
	if wrapped, ok := part.(*imapprovider.IMAPBodyStructure); ok {
		if single, ok := wrapped.BodyStructure.(*imap.BodyStructureSinglePart); ok {
			return single.Filename()
		}
	}
	return ""
}

func addressOf(a provider.Address) string {
	if a.Mailbox == "" || a.Host == "" {
		return ""
	}
	return strings.ToLower(a.Mailbox + "@" + a.Host)
}

var errNoInvitation = alps.NewHTTPError(http.StatusNotFound, "this message carries no invitation")

// errEventOver refuses an answer to an event that has ended.
var errEventOver = alps.NewHTTPError(http.StatusConflict, "this event is over")

// readInvitation reads the first calendar part of a message that decodes to
// an event or a task.
func (p *plugin) readInvitation(ctx *alps.Context, mailbox, uid string) (*invitationMessage, error) {
	if mailbox == "" || uid == "" {
		return nil, alps.NewHTTPError(http.StatusBadRequest, "mailbox and uid are required")
	}
	var found *invitationMessage
	err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(mp provider.MailProvider) error {
		id, err := mp.ParseMessageID(uid)
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		meta, err := mp.GetMessageMetadata(mailbox, id)
		if err != nil {
			return err
		}
		if meta == nil || meta.BodyStructure == nil {
			return errNoInvitation
		}
		for _, partPath := range calendarParts(meta.BodyStructure) {
			_, entity, err := mp.GetMessagePart(mailbox, id, partPath)
			if err != nil && len(partPath) == 1 && partPath[0] == 1 && !strings.HasPrefix(meta.BodyStructure.MediaType(), "multipart/") {
				// The body of a message that is not multipart: IMAP numbers it
				// part 1, and a provider that reads the file itself takes it as
				// the message.
				_, entity, err = mp.GetMessagePart(mailbox, id, nil)
			}
			if err != nil || entity == nil {
				continue
			}
			data, err := io.ReadAll(io.LimitReader(entity.Body, maxInvitationBytes+1))
			if err != nil || len(data) > maxInvitationBytes {
				continue
			}
			cal, err := ical.NewDecoder(bytes.NewReader(data)).Decode()
			if err != nil || itip.Master(cal) == nil || itip.UID(itip.Master(cal)) == "" {
				continue
			}
			found = &invitationMessage{cal: cal, authFailed: meta.BimiFailed}
			if env := meta.Envelope; env != nil {
				if len(env.From) > 0 {
					found.sender = addressOf(env.From[0])
				}
				for _, a := range append(append([]provider.Address(nil), env.To...), env.Cc...) {
					if addr := addressOf(a); addr != "" {
						found.recipients = append(found.recipients, addr)
					}
				}
			}
			return nil
		}
		return errNoInvitation
	})
	if err != nil {
		return nil, err
	}
	return found, nil
}

// The states an invitation can be in, as the API names them.
const (
	// A REQUEST the user can answer.
	invAnswer = "answer"
	// A REQUEST or PUBLISH newer than the copy in the calendar.
	invUpdate = "update"
	// A message older than the copy in the calendar.
	invOutdated = "outdated"
	// A message about something the user organizes.
	invOrganizer = "organizer"
	// A REQUEST that lists none of the user's addresses.
	invNotInvited = "not-invited"
	// A CANCEL for a copy still in the calendar.
	invCancel = "cancel"
	// A CANCEL with no copy left to remove.
	invCancelled = "cancelled"
	// A REPLY that changes an attendee's answer in the user's meeting.
	invReply = "reply"
	// A REPLY whose answer the meeting already records, or that the server
	// records on its own.
	invReplied = "replied"
	// A REPLY about nothing the user organizes, or from someone not invited.
	invUnknown = "unknown"
	// A PUBLISH not yet in the calendar, and one that is.
	invAdd   = "add"
	invAdded = "added"
	// A method alps does not act on (COUNTER, REFRESH, ADD...).
	invUnsupported = "unsupported"
)

type invitation struct {
	msg    *invitationMessage
	method string
	// item is the message's master event or task.
	item      *ical.Component
	c         *caldav.Client
	calendars []caldav.Calendar
	acct      *schedulingAccount
	// me is the user's address among the attendees.
	me string
	// copy is the calendar object with the same UID, if the user has one.
	copy     *caldav.CalendarObject
	copyItem *ical.Component
	state    string
	// verified reports that the message comes from whoever may say what it
	// says: the organizer for an update or a cancellation, the attendee for
	// a reply.
	verified bool
	replier  *itip.Party
	// ended reports that the event is over: see ended.
	ended bool
}

func (p *plugin) inspectInvitation(ctx *alps.Context, mailbox, uid string) (*invitation, error) {
	msg, err := p.readInvitation(ctx, mailbox, uid)
	if err != nil {
		return nil, err
	}
	inv := &invitation{msg: msg, method: itip.Method(msg.cal), item: itip.Master(msg.cal)}
	if inv.method == "" {
		// An .ics with no method is a calendar being shared, as PUBLISH is.
		inv.method = itip.MethodPublish
	}
	if inv.c, inv.calendars, err = p.clientWithCalendars(ctx.Request.Context(), ctx.Session); err != nil {
		return nil, err
	}
	inv.acct = p.scheduling(ctx, inv.c)
	if inv.copy, err = p.findCopy(ctx, inv.c, inv.calendars, inv.item.Name, itip.UID(inv.item)); err != nil {
		return nil, err
	}
	if inv.copy != nil {
		inv.copyItem = itip.Master(inv.copy.Data)
	}
	// A reply need not carry when the event is, or its rule: the copy says.
	source := inv.msg.cal
	if inv.method == itip.MethodReply && inv.copy != nil {
		source = inv.copy.Data
	}
	inv.ended = ended(source, clock())
	inv.decide()
	return inv, nil
}

// vouches reports whether the message's sender may speak for a party.
func (inv *invitation) vouches(party *itip.Party) bool {
	return party != nil && !inv.msg.authFailed && party.Acts(inv.msg.sender)
}

func (inv *invitation) findMe(item *ical.Component) string {
	attendees := itip.Attendees(item)
	for _, a := range attendees {
		if inv.acct.owns(a.Address) {
			return a.Address
		}
	}
	// An alias the server does not list as the user's: the attendee the
	// message was addressed to, when exactly one is. At worst this answers as
	// an address the user received the invitation at, and only to its
	// organizer, whom the submission server lets them mail or not.
	match, n := "", 0
	for _, a := range attendees {
		for _, r := range inv.msg.recipients {
			if a.Address == r {
				match, n = a.Address, n+1
			}
		}
	}
	if n == 1 {
		return match
	}
	return ""
}

func (inv *invitation) organizedByUser(item *ical.Component) bool {
	org := itip.Organizer(item)
	return org != nil && inv.acct.owns(org.Address)
}

func (inv *invitation) decide() {
	switch inv.method {
	case itip.MethodRequest:
		if inv.organizedByUser(inv.item) || (inv.copyItem != nil && inv.organizedByUser(inv.copyItem)) {
			inv.state = invOrganizer
			return
		}
		inv.me = inv.findMe(inv.item)
		if inv.me == "" && inv.copyItem != nil {
			inv.me = inv.findMe(inv.copyItem)
		}
		if itip.Organizer(inv.item) == nil || inv.me == "" {
			inv.state = invNotInvited
			return
		}
		if inv.copyItem == nil {
			inv.verified = inv.vouches(itip.Organizer(inv.item))
			inv.state = invAnswer
			return
		}
		// The organizer the calendar already knows, not the one this message
		// names, is who may change the copy.
		inv.verified = inv.vouches(itip.Organizer(inv.copyItem))
		switch {
		case itip.Newer(inv.item, inv.copyItem):
			inv.state = invUpdate
		case itip.Newer(inv.copyItem, inv.item):
			inv.state = invOutdated
		default:
			inv.state = invAnswer
		}

	case itip.MethodCancel:
		if inv.copyItem == nil {
			inv.state = invCancelled
			return
		}
		if inv.organizedByUser(inv.copyItem) {
			inv.state = invOrganizer
			return
		}
		inv.me = inv.findMe(inv.copyItem)
		inv.verified = inv.vouches(itip.Organizer(inv.copyItem))
		if itip.Newer(inv.copyItem, inv.item) {
			inv.state = invOutdated
		} else {
			inv.state = invCancel
		}

	case itip.MethodReply:
		attendees := itip.Attendees(inv.item)
		if len(attendees) == 0 {
			inv.state = invUnknown
			return
		}
		inv.replier = &attendees[0]
		inv.verified = inv.vouches(inv.replier)
		if inv.copyItem == nil || !inv.organizedByUser(inv.copyItem) {
			inv.state = invUnknown
			return
		}
		changed, err := itip.ApplyReply(itip.Clone(inv.copy.Data), inv.msg.cal)
		switch {
		case errors.Is(err, itip.ErrOutdated):
			inv.state = invOutdated
		case err != nil:
			inv.state = invUnknown
		case changed && !inv.acct.server:
			inv.state = invReply
		default:
			// A scheduling server records replies itself, and an organizer's
			// write of an attendee's answer is not one it takes.
			inv.state = invReplied
		}

	case itip.MethodPublish:
		switch {
		case inv.copyItem == nil:
			inv.state = invAdd
		case itip.Newer(inv.item, inv.copyItem):
			inv.state = invUpdate
		default:
			inv.state = invAdded
		}

	default:
		inv.state = invUnsupported
	}
}

// autoApply reports whether opening the message should apply it: a change
// the organizer or attendee who may make it sent, to an event not yet over.
// Anything else waits for the user to ask.
func (inv *invitation) autoApply() bool {
	if !inv.verified || inv.ended || inv.method == itip.MethodPublish {
		return false
	}
	return inv.state == invUpdate || inv.state == invCancel || inv.state == invReply
}

// findCopy returns the object in the user's calendars holding the item with
// this UID, or nil.
func (p *plugin) findCopy(ctx *alps.Context, c *caldav.Client, calendars []caldav.Calendar, kind, uid string) (*caldav.CalendarObject, error) {
	request := caldav.CalendarCompRequest{Name: "VCALENDAR", AllProps: true, AllComps: true}
	byUID := caldav.CalendarQuery{
		CompRequest: request,
		CompFilter: caldav.CompFilter{Name: "VCALENDAR", Comps: []caldav.CompFilter{{
			Name:  kind,
			Props: []caldav.PropFilter{{Name: ical.PropUID, TextMatch: &caldav.TextMatch{Text: uid}}},
		}}},
	}
	all := caldav.CalendarQuery{
		CompRequest: request,
		CompFilter:  caldav.CompFilter{Name: "VCALENDAR", Comps: []caldav.CompFilter{{Name: kind}}},
	}
	for _, calendar := range calendars {
		if !holdsComponent(calendar, kind) {
			continue
		}
		objects, err := c.QueryCalendar(ctx.Request.Context(), calendar.Path, &byUID)
		if err != nil {
			// A server that cannot match text is asked for everything of the
			// kind; the UID is compared here either way.
			if objects, err = c.QueryCalendar(ctx.Request.Context(), calendar.Path, &all); err != nil {
				continue
			}
		}
		for i := range objects {
			if item := itip.Master(objects[i].Data); item != nil && item.Name == kind && itip.UID(item) == uid {
				return &objects[i], nil
			}
		}
	}
	return nil, nil
}

// itemTimes returns when an item starts and ends, and whether it is all-day.
// A task's end is its due date.
func itemTimes(cal *ical.Calendar, item *ical.Component) (start, end time.Time, allDay, ok bool) {
	startProp := item.Props.Get(ical.PropDateTimeStart)
	if item.Name == ical.CompToDo && item.Props.Get(ical.PropDue) != nil {
		if due, isDate, err := itip.Time(cal, item.Props.Get(ical.PropDue)); err == nil {
			end, allDay, ok = due, isDate, true
		}
		if startProp == nil {
			return end, end, allDay, ok
		}
	}
	if startProp == nil {
		return start, end, allDay, ok
	}
	start, allDay, err := itip.Time(cal, startProp)
	if err != nil {
		return start, end, allDay, false
	}
	if !end.IsZero() {
		return start, end, allDay, true
	}
	if endProp := item.Props.Get(ical.PropDateTimeEnd); endProp != nil {
		if t, _, err := itip.Time(cal, endProp); err == nil {
			return start, t, allDay, true
		}
	}
	if durProp := item.Props.Get(ical.PropDuration); durProp != nil {
		if d, err := durProp.Duration(); err == nil {
			return start, start.Add(d), allDay, true
		}
	}
	if allDay {
		return start, start.AddDate(0, 0, 1), true, true
	}
	return start, start, false, true
}

// Clash is an event in the user's calendar at the same time as an
// invitation.
type Clash struct {
	Summary string `json:"summary"`
	// Start and End are left out for a repeating event: the times of the
	// series' first occurrence are not those of the one that clashes.
	Start  string `json:"start,omitempty"`
	End    string `json:"end,omitempty"`
	AllDay bool   `json:"allDay"`
}

const maxClashes = 5

// clashes lists the busy events that overlap an invitation. Free time
// (TRANSP:TRANSPARENT), cancelled events and invitations the user declined do
// not clash, and neither does an all-day event with a timed invitation: a
// holiday or a birthday does not fill the day.
func (p *plugin) clashes(ctx *alps.Context, inv *invitation) []Clash {
	if inv.item.Name != ical.CompEvent {
		return nil
	}
	start, end, allDay, ok := itemTimes(inv.msg.cal, inv.item)
	if !ok {
		return nil
	}
	if !end.After(start) {
		end = start.Add(time.Minute)
	}
	query := caldav.CalendarQuery{
		CompRequest: caldav.CalendarCompRequest{Name: "VCALENDAR", AllProps: true, AllComps: true},
		CompFilter: caldav.CompFilter{Name: "VCALENDAR", Comps: []caldav.CompFilter{{
			Name: ical.CompEvent, Start: start, End: end,
		}}},
	}
	uid := itip.UID(inv.item)
	clashes := []Clash{}
	for _, calendar := range inv.calendars {
		if !holdsComponent(calendar, ical.CompEvent) {
			continue
		}
		objects, err := inv.c.QueryCalendar(ctx.Request.Context(), calendar.Path, &query)
		if err != nil {
			continue
		}
		for i := range objects {
			item := itip.Master(objects[i].Data)
			if item == nil || item.Name != ical.CompEvent || itip.UID(item) == uid {
				continue
			}
			if transp, _ := item.Props.Text(ical.PropTransparency); strings.EqualFold(transp, "TRANSPARENT") {
				continue
			}
			if status, _ := item.Props.Text(ical.PropStatus); strings.EqualFold(status, "CANCELLED") {
				continue
			}
			if m := meetingOf(item, inv.acct); m.role == "attendee" && m.status() == itip.Declined {
				continue
			}
			s, e, isDate, ok := itemTimes(objects[i].Data, item)
			if !ok || (isDate && !allDay) {
				continue
			}
			clash := Clash{AllDay: isDate}
			clash.Summary, _ = item.Props.Text(ical.PropSummary)
			if item.Props.Get(ical.PropRecurrenceRule) == nil {
				clash.Start, clash.End = s.UTC().Format(time.RFC3339), e.UTC().Format(time.RFC3339)
			}
			clashes = append(clashes, clash)
			if len(clashes) == maxClashes {
				return clashes
			}
		}
	}
	return clashes
}

// CopyRef names the copy of an invitation in the user's calendar.
type CopyRef struct {
	Path         string `json:"path"`
	CalendarPath string `json:"calendarPath"`
	ETag         string `json:"etag,omitempty"`
}

// InvitationView is what the reader shows of an invitation.
type InvitationView struct {
	// Method is request, reply, cancel or publish.
	Method string `json:"method"`
	// Kind is event or task.
	Kind        string `json:"kind"`
	UID         string `json:"uid"`
	Summary     string `json:"summary"`
	Description string `json:"description,omitempty"`
	Location    string `json:"location,omitempty"`
	// Start and End are RFC 3339 instants; an all-day date is its UTC
	// midnight, as for events. A task's due date is its end.
	Start     string   `json:"start,omitempty"`
	End       string   `json:"end,omitempty"`
	AllDay    bool     `json:"allDay"`
	RRule     string   `json:"rrule,omitempty"`
	Organizer *Person  `json:"organizer,omitempty"`
	Attendees []Person `json:"attendees"`
	// Me is the address the invitation is for, among the user's.
	Me string `json:"me,omitempty"`
	// Status is the user's answer as it stands: in their calendar when it
	// holds a copy, else in the invitation.
	Status string `json:"status,omitempty"`
	// Replier is who a REPLY is from, with their answer.
	Replier *Person  `json:"replier,omitempty"`
	Copy    *CopyRef `json:"copy,omitempty"`
	// State says where the invitation stands against the calendar; see the
	// inv* constants.
	State string `json:"state"`
	// AutoApply tells the reader to apply the message as it opens it: an
	// update, cancellation or reply sent by whoever may send it.
	AutoApply bool `json:"autoApply"`
	// Sender is the message's From address, and SenderVerified whether it is
	// the organizer's (or, for a reply, the attendee's) and passed the
	// receiving server's checks.
	Sender         string `json:"sender,omitempty"`
	SenderVerified bool   `json:"senderVerified"`
	// Ended reports that the event is over, so there is nothing to answer.
	Ended bool `json:"ended"`
	// Scheduling is who sends replies: "server" or "email" (alps).
	Scheduling string         `json:"scheduling"`
	Clashes    []Clash        `json:"clashes"`
	Calendars  []CalendarData `json:"calendars"`
}

func kindName(item *ical.Component) string {
	if item.Name == ical.CompToDo {
		return "task"
	}
	return "event"
}

func (p *plugin) invitationView(ctx *alps.Context, inv *invitation) InvitationView {
	view := InvitationView{
		Method:         strings.ToLower(inv.method),
		Kind:           kindName(inv.item),
		UID:            itip.UID(inv.item),
		State:          inv.state,
		AutoApply:      inv.autoApply(),
		Sender:         inv.msg.sender,
		SenderVerified: inv.verified,
		Scheduling:     inv.acct.mode(),
		Me:             inv.me,
		Ended:          inv.ended,
		Attendees:      []Person{},
		Clashes:        []Clash{},
		Calendars:      []CalendarData{},
	}
	view.Summary, _ = inv.item.Props.Text(ical.PropSummary)
	view.Description, _ = inv.item.Props.Text(ical.PropDescription)
	view.Location, _ = inv.item.Props.Text(ical.PropLocation)
	if rule := inv.item.Props.Get(ical.PropRecurrenceRule); rule != nil {
		view.RRule = rule.Value
	}
	if start, end, allDay, ok := itemTimes(inv.msg.cal, inv.item); ok {
		view.AllDay = allDay
		if !start.IsZero() && (inv.item.Name == ical.CompEvent || inv.item.Props.Get(ical.PropDateTimeStart) != nil) {
			view.Start = start.UTC().Format(time.RFC3339)
		}
		view.End = end.UTC().Format(time.RFC3339)
	}
	if org := itip.Organizer(inv.item); org != nil {
		o := personOf(*org)
		view.Organizer = &o
	}
	for _, a := range itip.Attendees(inv.item) {
		view.Attendees = append(view.Attendees, personOf(a))
	}
	if inv.replier != nil {
		r := personOf(*inv.replier)
		view.Replier = &r
	}

	statusSource := inv.item
	if inv.copy != nil {
		view.Copy = &CopyRef{Path: inv.copy.Path, CalendarPath: calendarHolding(inv.copy.Path, inv.calendars), ETag: inv.copy.ETag}
		statusSource = inv.copyItem
	}
	if inv.me != "" {
		if prop := itip.Attendee(statusSource, inv.me); prop != nil {
			view.Status = strings.ToLower(itip.PartyOf(prop).Status)
		}
	}

	for _, calendar := range inv.calendars {
		if holdsComponent(calendar, inv.item.Name) {
			view.Calendars = append(view.Calendars, CalendarData{Name: calendar.Name, Description: calendar.Description, Path: calendar.Path})
		}
	}
	if inv.method == itip.MethodRequest && !inv.ended && (inv.state == invAnswer || inv.state == invUpdate) {
		view.Clashes = p.clashes(ctx, inv)
	}
	return view
}

type invitationRequest struct {
	Mailbox string `json:"mailbox"`
	UID     string `json:"uid"`
	// Status is the answer: accepted, tentative or declined.
	Status string `json:"status"`
	// CalendarPath is where a first copy goes; the first calendar that takes
	// the item when empty.
	CalendarPath string `json:"calendarPath"`
	// Lang is the language to write the reply's readable text in.
	Lang string `json:"lang"`
}

// Saved is what a write that may also have mailed someone answers.
type Saved struct {
	Path string `json:"path,omitempty"`
	ETag string `json:"etag,omitempty"`
	// Removed reports that the copy was deleted rather than written.
	Removed bool `json:"removed,omitempty"`
	// Sent reports that alps emailed the message the change implies.
	Sent bool `json:"sent"`
	// SendFailed reports that the change was saved but its message could
	// not be sent. It is not an error status: the calendar holds the change,
	// and repeating the request would write it again.
	SendFailed bool `json:"sendFailed,omitempty"`
}

// targetCalendar picks the calendar a new copy goes into.
func targetCalendar(calendars []caldav.Calendar, kind, requested string) (*caldav.Calendar, error) {
	for i := range calendars {
		if holdsComponent(calendars[i], kind) && (requested == "" || normalizeDAVPath(calendars[i].Path) == normalizeDAVPath(requested)) {
			return &calendars[i], nil
		}
	}
	if requested != "" {
		return nil, alps.NewHTTPError(http.StatusBadRequest, "not one of your calendars")
	}
	return nil, alps.NewHTTPError(http.StatusConflict, "no calendar available to add it to")
}

// stampItems gives every item the DTSTAMP a stored object needs, for a sender
// that left it out.
func stampItems(cal *ical.Calendar, now time.Time) {
	for _, item := range itip.Items(cal) {
		if item.Props.Get(ical.PropDateTimeStamp) == nil {
			item.Props.SetDateTime(ical.PropDateTimeStamp, now.UTC())
		}
	}
	if cal.Props.Get(ical.PropProductID) == nil {
		cal.Props.SetText(ical.PropProductID, "-//migadu//alps//EN")
	}
	if cal.Props.Get(ical.PropVersion) == nil {
		cal.Props.SetText(ical.PropVersion, "2.0")
	}
}

// sendReply mails the organizer the user's answer as cal now holds it, unless
// the server does that, or the organizer asked for no answer.
func (p *plugin) sendReply(ctx *alps.Context, acct *schedulingAccount, cal *ical.Calendar, me, lang string) (Saved, error) {
	var saved Saved
	item := itip.Master(cal)
	org := itip.Organizer(item)
	prop := itip.Attendee(item, me)
	if acct.server || org == nil || prop == nil {
		return saved, nil
	}
	if strings.EqualFold(prop.Params.Get(ical.ParamRSVP), "FALSE") {
		return saved, nil
	}
	reply, err := itip.Reply(cal, me, time.Now())
	if err != nil {
		return saved, nil
	}
	saved.Sent, saved.SendFailed = p.tell(ctx, acct, me, lang, []letter{{to: []itip.Party{*org}, cal: reply}})
	return saved, nil
}

func registerInvitationRoutes(p *plugin) {
	p.GET("/calendar/invitation", func(ctx *alps.Context) error {
		inv, err := p.inspectInvitation(ctx, ctx.QueryParam("mailbox"), ctx.QueryParam("uid"))
		if err != nil {
			return err
		}
		return ctx.JSON(http.StatusOK, p.invitationView(ctx, inv))
	})

	// Answering an invitation: the answer goes into the calendar copy (made
	// from the invitation if there is none yet), and to the organizer.
	p.POST("/calendar/invitation/respond", func(ctx *alps.Context) error {
		var req invitationRequest
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		status, ok := answerStatuses[req.Status]
		if !ok || (status != itip.Accepted && status != itip.Tentative && status != itip.Declined) {
			return alps.NewHTTPError(http.StatusBadRequest, "status must be accepted, tentative or declined")
		}
		inv, err := p.inspectInvitation(ctx, req.Mailbox, req.UID)
		if err != nil {
			return err
		}
		if inv.method != itip.MethodRequest || (inv.state != invAnswer && inv.state != invUpdate && inv.state != invOutdated) {
			return alps.NewHTTPError(http.StatusConflict, "this is not an invitation you can answer")
		}
		if inv.ended {
			return errEventOver
		}

		now := time.Now()
		var cal *ical.Calendar
		var objectPath, baseETag string
		if inv.copy != nil {
			objectPath, baseETag = inv.copy.Path, inv.copy.ETag
			if inv.state == invUpdate {
				cal = itip.Update(inv.copy.Data, inv.msg.cal, inv.me)
			} else {
				cal = itip.Clone(inv.copy.Data)
			}
		} else {
			target, err := targetCalendar(inv.calendars, inv.item.Name, req.CalendarPath)
			if err != nil {
				return err
			}
			objectPath = path.Join(target.Path, uuid.New().String()+".ics")
			cal = itip.Stored(inv.msg.cal)
		}
		if !itip.Answer(cal, inv.me, status) {
			return alps.NewHTTPError(http.StatusConflict, "your calendar's copy does not list you")
		}
		stampItems(cal, now)

		etag, err := p.putCalendar(ctx, inv.c, objectPath, cal, baseETag)
		if err != nil {
			return err
		}
		saved, _ := p.sendReply(ctx, inv.acct, cal, inv.me, req.Lang)
		saved.Path, saved.ETag = objectPath, etag
		return ctx.JSON(http.StatusOK, saved)
	})

	// Applying what a message says to the calendar: an organizer's update or
	// cancellation, an attendee's reply to the user's meeting, or a published
	// event added.
	p.POST("/calendar/invitation/apply", func(ctx *alps.Context) error {
		var req invitationRequest
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		inv, err := p.inspectInvitation(ctx, req.Mailbox, req.UID)
		if err != nil {
			return err
		}

		now := time.Now()
		var saved Saved
		switch inv.state {
		case invUpdate:
			var cal *ical.Calendar
			if inv.method == itip.MethodPublish {
				cal = itip.Stored(inv.msg.cal)
			} else {
				cal = itip.Update(inv.copy.Data, inv.msg.cal, inv.me)
			}
			stampItems(cal, now)
			if saved.ETag, err = p.putCalendar(ctx, inv.c, inv.copy.Path, cal, inv.copy.ETag); err != nil {
				return err
			}
			saved.Path = inv.copy.Path

		case invCancel:
			cal := itip.Clone(inv.copy.Data)
			if itip.ApplyCancel(cal, inv.msg.cal) {
				// Schedule-Reply: F (RFC 6638 §8.1): a scheduling server
				// otherwise answers an attendee's delete with a decline, to
				// an organizer who has just cancelled.
				header := http.Header{"Schedule-Reply": {"F"}}
				err := davsave.Delete(ctx.Request.Context(), p.httpClient(ctx.Session), davsave.URL(p.url, inv.copy.Path), inv.copy.ETag, header)
				if errors.Is(err, davsave.ErrConflict) {
					return errChangedElsewhere
				}
				if err != nil {
					return err
				}
				saved.Removed = true
			} else {
				if saved.ETag, err = p.putCalendar(ctx, inv.c, inv.copy.Path, cal, inv.copy.ETag); err != nil {
					return err
				}
				saved.Path = inv.copy.Path
			}

		case invReply:
			cal := itip.Clone(inv.copy.Data)
			if _, err := itip.ApplyReply(cal, inv.msg.cal); err != nil {
				return alps.NewHTTPError(http.StatusConflict, err.Error())
			}
			// A task everyone it was assigned to has finished is finished.
			if todo := itip.Master(cal); todo.Name == ical.CompToDo && taskStatus(todo) != taskCompleted && assigneesDone(todo, inv.acct) {
				if err := completeTask(todo, true, now); err != nil {
					return err
				}
			}
			if saved.ETag, err = p.putCalendar(ctx, inv.c, inv.copy.Path, cal, inv.copy.ETag); err != nil {
				return err
			}
			saved.Path = inv.copy.Path

		case invAdd:
			target, err := targetCalendar(inv.calendars, inv.item.Name, req.CalendarPath)
			if err != nil {
				return err
			}
			cal := itip.Stored(inv.msg.cal)
			stampItems(cal, now)
			saved.Path = path.Join(target.Path, uuid.New().String()+".ics")
			if saved.ETag, err = p.putCalendar(ctx, inv.c, saved.Path, cal, ""); err != nil {
				return err
			}

		default:
			return alps.NewHTTPError(http.StatusConflict, "nothing in this message to apply to your calendar")
		}
		return ctx.JSON(http.StatusOK, saved)
	})
}
