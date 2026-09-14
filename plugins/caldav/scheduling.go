package alpscaldav

import (
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
	"github.com/emersion/go-webdav/caldav"
	"github.com/migadu/alps"
	"github.com/migadu/alps/internal/davsave"
	"github.com/migadu/alps/internal/imip"
	"github.com/migadu/alps/internal/itip"
	"github.com/teambition/rrule-go"
)

// Scheduling is inviting people to events and tasks, and answering
// invitations (RFC 5546). Who carries the messages depends on the server.
//
// A server that advertises calendar-auto-schedule (RFC 6638) schedules on its
// own: it sends the invitations and replies that a change to a calendar
// object implies, and files what arrives. alps then only writes the calendar,
// and sends nothing, or everyone would get every message twice.
//
// Otherwise alps sends them itself, by email (RFC 6047), from the account's
// own submission server. No server-specific switch decides between the two:
// the server's own DAV header does, so a server that starts scheduling is
// used for it as soon as it says so.

// clock is the time the decisions below are made at; tests fix it.
var clock = time.Now

// ended reports whether an event is over: its last occurrence has finished.
// Nobody is told about a change to one, or asked to answer it: an update to
// the past only rewrites its record.
//
// A series with neither UNTIL nor COUNT has no last occurrence, and is never
// over. Nor is a task, which still matters overdue.
func ended(cal *ical.Calendar, now time.Time) bool {
	items := itip.Items(cal)
	if len(items) == 0 {
		return false
	}
	for _, item := range items {
		if item.Name != ical.CompEvent {
			return false
		}
		start, end, _, ok := itemTimes(cal, item)
		if !ok {
			return false
		}
		length := end.Sub(start)
		last := end
		if rule := item.Props.Get(ical.PropRecurrenceRule); rule != nil {
			opt, err := rrule.StrToROption(rule.Value)
			if err != nil || (opt.Until.IsZero() && opt.Count == 0) || (!opt.Until.IsZero() && opt.Until.After(now)) {
				return false
			}
			opt.Dtstart = start.UTC()
			r, err := rrule.NewRRule(*opt)
			if err != nil {
				return false
			}
			if all := r.All(); len(all) > 0 {
				last = all[len(all)-1].Add(length)
			}
		}
		for _, rdate := range item.Props[ical.PropRecurrenceDates] {
			for _, value := range strings.Split(rdate.Value, ",") {
				if strings.Contains(value, "/") {
					return false // A PERIOD: not worth reading for this.
				}
				one := ical.Prop{Name: rdate.Name, Value: strings.TrimSpace(value), Params: rdate.Params}
				t, _, err := itip.Time(cal, &one)
				if err != nil {
					return false
				}
				if t.Add(length).After(last) {
					last = t.Add(length)
				}
			}
		}
		if last.After(now) {
			return false
		}
	}
	return true
}

// How long what a server says about scheduling is believed before asking
// again.
const schedulingTTL = 10 * time.Minute

type schedulingAccount struct {
	// server reports that the calendar server schedules on its own.
	server bool
	// addresses are the user's own calendar addresses, lower-cased: the login,
	// and those the principal lists in calendar-user-address-set (RFC 6638
	// §2.4.1), which is how a server says which aliases are the user's.
	addresses []string
	// email is the address the user organizes from and alps sends as: the
	// login, which the submission server always accepts.
	email string
	// name is the name the user sends mail under, from the mail settings.
	name    string
	fetched time.Time
}

// owns reports whether addr is one of the user's calendar addresses.
func (a *schedulingAccount) owns(addr string) bool {
	addr = strings.ToLower(strings.TrimSpace(addr))
	for _, own := range a.addresses {
		if own == addr {
			return true
		}
	}
	return false
}

// mode names who delivers scheduling messages, as the API spells it.
func (a *schedulingAccount) mode() string {
	if a.server {
		return "server"
	}
	return "email"
}

func (a *schedulingAccount) party() itip.Party {
	return itip.Party{Address: a.email, Name: a.name}
}

// scheduling returns what the server says about scheduling for the session's
// user. The calendar home must already have been looked up
// (clientWithCalendars does it). A question the server does not answer counts
// as no: alps then sends the messages itself, which is what it would do for a
// server that never heard of RFC 6638.
func (p *plugin) scheduling(ctx *alps.Context, c *caldav.Client) *schedulingAccount {
	username := ctx.Session.Username()
	p.cacheMutex.RLock()
	cached := p.accounts[username]
	homeSet := p.homeSetCache[username]
	p.cacheMutex.RUnlock()

	acct := &schedulingAccount{email: strings.ToLower(username), fetched: time.Now()}
	if cached != nil && time.Since(cached.fetched) < schedulingTTL {
		acct.server, acct.addresses, acct.fetched = cached.server, cached.addresses, cached.fetched
	} else {
		hc := p.httpClient(ctx.Session)
		if homeSet != "" {
			acct.server = p.advertisesAutoSchedule(ctx, hc, homeSet)
		}
		acct.addresses = []string{acct.email}
		if principal, err := c.FindCurrentUserPrincipal(ctx.Request.Context()); err == nil {
			for _, addr := range p.calendarUserAddresses(ctx, hc, principal) {
				if !acct.owns(addr) {
					acct.addresses = append(acct.addresses, addr)
				}
			}
		}
		p.cacheMutex.Lock()
		if len(p.accounts) > 1000 {
			p.accounts = make(map[string]*schedulingAccount)
		}
		p.accounts[username] = acct
		p.cacheMutex.Unlock()
	}

	// Read each time: it is the user's to change in the settings.
	var settings struct {
		From string `json:"from"`
	}
	_ = ctx.Session.Store().Get("base.settings", &settings)
	return &schedulingAccount{server: acct.server, addresses: acct.addresses, email: acct.email, name: settings.From, fetched: acct.fetched}
}

// advertisesAutoSchedule asks the calendar home what it supports: RFC 6638
// §2 has a scheduling server name calendar-auto-schedule in its DAV header.
func (p *plugin) advertisesAutoSchedule(ctx *alps.Context, hc *http.Client, homeSet string) bool {
	req, err := http.NewRequestWithContext(ctx.Request.Context(), http.MethodOptions, davsave.URL(p.url, homeSet), nil)
	if err != nil {
		return false
	}
	resp, err := hc.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 64<<10))
	for _, value := range resp.Header.Values("DAV") {
		for _, token := range strings.Split(value, ",") {
			if strings.EqualFold(strings.TrimSpace(token), "calendar-auto-schedule") {
				return true
			}
		}
	}
	return false
}

// calendarUserAddresses reads the principal's calendar-user-address-set: the
// addresses, aliases among them, that the server knows as the user's.
func (p *plugin) calendarUserAddresses(ctx *alps.Context, hc *http.Client, principal string) []string {
	body := `<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><C:calendar-user-address-set/></D:prop></D:propfind>`
	req, err := http.NewRequestWithContext(ctx.Request.Context(), "PROPFIND", davsave.URL(p.url, principal), strings.NewReader(body))
	if err != nil {
		return nil
	}
	req.Header.Set("Content-Type", "application/xml; charset=utf-8")
	req.Header.Set("Depth", "0")
	resp, err := hc.Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return nil
	}

	var addresses []string
	dec := xml.NewDecoder(io.LimitReader(resp.Body, 256<<10))
	inSet, inHref := false, false
	for {
		tok, err := dec.Token()
		if err != nil {
			break
		}
		switch t := tok.(type) {
		case xml.StartElement:
			switch {
			case t.Name.Local == "calendar-user-address-set":
				inSet = true
			case inSet && t.Name.Local == "href":
				inHref = true
			}
		case xml.EndElement:
			switch t.Name.Local {
			case "calendar-user-address-set":
				inSet = false
			case "href":
				inHref = false
			}
		case xml.CharData:
			if inHref {
				if addr := itip.Address(string(t)); addr != "" {
					addresses = append(addresses, addr)
				}
			}
		}
	}
	return addresses
}

// Person is an organizer or attendee as the API gives them.
type Person struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
	// Status is an attendee's answer, lower-cased RFC 5545: needs-action,
	// accepted, tentative, declined, delegated, and for tasks in-process and
	// completed.
	Status string `json:"status,omitempty"`
	// Role is an attendee's role, lower-cased: req-participant,
	// opt-participant, chair or non-participant.
	Role string `json:"role,omitempty"`
}

func personOf(p itip.Party) Person {
	return Person{Email: p.Address, Name: p.Name, Status: strings.ToLower(p.Status), Role: strings.ToLower(p.Role)}
}

// The answers the API takes, and the statuses they are.
var answerStatuses = map[string]string{
	"accepted":     itip.Accepted,
	"tentative":    itip.Tentative,
	"declined":     itip.Declined,
	"in-process":   itip.InProcess,
	"completed":    itip.Completed,
	"needs-action": itip.NeedsAction,
}

// meeting is who an item involves, seen from the user.
type meeting struct {
	organizer *itip.Party
	attendees []itip.Party
	// role is "organizer" when the user organizes it, "attendee" when they
	// are invited, and "" for an item of their own with nobody else in it,
	// or one that names them in neither way.
	role string
	// me is the user's address among the attendees, when they are one.
	me string
}

func meetingOf(item *ical.Component, acct *schedulingAccount) meeting {
	m := meeting{organizer: itip.Organizer(item), attendees: itip.Attendees(item)}
	if m.organizer != nil && acct.owns(m.organizer.Address) {
		m.role = "organizer"
		return m
	}
	for _, a := range m.attendees {
		if acct.owns(a.Address) {
			m.me, m.role = a.Address, "attendee"
			return m
		}
	}
	return m
}

// status is the user's own answer, when they are an attendee.
func (m meeting) status() string {
	for _, a := range m.attendees {
		if a.Address == m.me {
			return a.Status
		}
	}
	return ""
}

func (m meeting) rsvp() bool {
	for _, a := range m.attendees {
		if a.Address == m.me {
			return a.RSVP
		}
	}
	return false
}

// people fills the API's view of who an item involves.
func (m meeting) people() (organizer *Person, attendees []Person, role, status string) {
	if m.organizer == nil && len(m.attendees) == 0 {
		return nil, nil, "", ""
	}
	if m.organizer != nil {
		o := personOf(*m.organizer)
		organizer = &o
	}
	for _, a := range m.attendees {
		attendees = append(attendees, personOf(a))
	}
	return organizer, attendees, m.role, strings.ToLower(m.status())
}

// letter is one scheduling message and who it goes to.
type letter struct {
	to  []itip.Party
	cal *ical.Calendar
}

// deliver emails scheduling messages as the user, one submission each, so a
// retry after a failure repeats only the message that failed. On a server
// that schedules on its own it sends nothing: see the top of this file.
func (p *plugin) deliver(ctx *alps.Context, acct *schedulingAccount, from string, lang string, letters []letter) (sent int, err error) {
	if acct.server {
		return 0, nil
	}
	words := wordsFor(lang)
	for _, l := range letters {
		var to []*mail.Address
		seen := map[string]bool{}
		for _, party := range l.to {
			if party.Address == "" || acct.owns(party.Address) || seen[party.Address] {
				continue
			}
			seen[party.Address] = true
			to = append(to, &mail.Address{Name: party.Name, Address: party.Address})
		}
		if len(to) == 0 {
			continue
		}
		subject, text := words.describe(l.cal, acct)
		msg := &imip.Message{
			From:     &mail.Address{Name: acct.name, Address: from},
			To:       to,
			Subject:  subject,
			Text:     text,
			Calendar: l.cal,
		}
		err := ctx.Session.DoSMTP(func(c *smtp.Client) error {
			return imip.Send(c, acct.email, msg)
		})
		if err != nil {
			return sent, fmt.Errorf("failed to send the %s: %v", strings.ToLower(itip.Method(l.cal)), err)
		}
		sent++
	}
	return sent, nil
}

// tell delivers letters, and reports whether alps sent any and whether
// sending failed. The change they describe is saved either way: see Saved.
func (p *plugin) tell(ctx *alps.Context, acct *schedulingAccount, from, lang string, letters []letter) (sent, failed bool) {
	n, err := p.deliver(ctx, acct, from, lang, letters)
	if err != nil {
		ctx.Server.Logger().Printf("caldav: %v", err)
		return n > 0, true
	}
	return n > 0, false
}

// maxAttendees bounds a guest list: every guest is mailed on every change.
const maxAttendees = 200

// partiesOf reads the guest list an editor sent. An entry that is not one
// email address is refused, rather than written into the calendar and handed
// to the submission server.
func partiesOf(people []Person) ([]itip.Party, error) {
	if len(people) > maxAttendees {
		return nil, alps.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("a meeting can have at most %d guests", maxAttendees))
	}
	parties := make([]itip.Party, 0, len(people))
	for _, person := range people {
		addr, err := mail.ParseAddress(strings.TrimSpace(person.Email))
		if err != nil || strings.ContainsAny(addr.Address, " \r\n") {
			return nil, alps.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("not an email address: %q", person.Email))
		}
		name := strings.TrimSpace(person.Name)
		if name == "" {
			name = addr.Name
		}
		if strings.ContainsAny(name, "\r\n") {
			return nil, alps.NewHTTPError(http.StatusBadRequest, "a guest's name cannot span lines")
		}
		parties = append(parties, itip.Party{Address: strings.ToLower(addr.Address), Name: name})
	}
	return parties, nil
}

// partiesNamed returns the parties at the given addresses.
func partiesNamed(parties []itip.Party, addresses []string) []itip.Party {
	named := map[string]bool{}
	for _, addr := range addresses {
		named[addr] = true
	}
	var out []itip.Party
	for _, party := range parties {
		if named[party.Address] {
			out = append(out, party)
		}
	}
	return out
}

// organize settles who a saved event or task involves, and returns what the
// guests are to be told, and the address it is told from.
//
// before is the object as it was read, nil for a new one, and after is it
// with the editor's changes. attendees is the guest list the editor sent;
// given false means it sent none, as an editor from before guest lists did,
// and the object keeps the list it has.
//
// Only the user's own meetings are theirs to organize. A copy of someone
// else's keeps its guest list whatever the editor sent, and a change to it
// is the user's own, told to nobody.
func organize(acct *schedulingAccount, before, after *ical.Calendar, attendees []itip.Party, given bool, now time.Time) ([]letter, string) {
	item := itip.Master(after)
	var old *ical.Component
	if before != nil {
		old = itip.Master(before)
	}
	if old != nil {
		if m := meetingOf(old, acct); m.organizer != nil && m.role != "organizer" {
			return nil, ""
		}
	}

	// The organizer the meeting already has, when it is one of the user's
	// addresses: guests' replies go to it.
	organizer := acct.party()
	if existing := itip.Organizer(item); existing != nil && acct.owns(existing.Address) {
		organizer.Address = existing.Address
		if organizer.Name == "" {
			organizer.Name = existing.Name
		}
	}

	var added, removed []string
	if given {
		added, removed = itip.Invite(item, organizer, attendees)
	}
	wasMeeting := old != nil && len(itip.Attendees(old)) > 0
	isMeeting := len(itip.Attendees(item)) > 0
	if !wasMeeting && !isMeeting {
		return nil, ""
	}
	// Over, and left in the past: a record kept, told to nobody. Moved to a
	// time still to come, it is news again.
	if now := clock(); ended(after, now) && (before == nil || ended(before, now)) {
		return nil, ""
	}

	revised := wasMeeting && itip.Revised(old, item)
	if wasMeeting && (revised || len(added) > 0 || len(removed) > 0) {
		itip.SetSequence(item, itip.Sequence(old)+1)
	}
	if wasMeeting && itip.Rescheduled(old, item) {
		itip.AskAgain(item, acct.addresses...)
	}

	var letters []letter
	if isMeeting {
		everyone := itip.Attendees(item)
		switch {
		case !wasMeeting || revised:
			letters = append(letters, letter{to: everyone, cal: itip.Message(after, itip.MethodRequest, now)})
		case len(added) > 0:
			// Only a guest was added: the others have nothing new to hear.
			letters = append(letters, letter{to: partiesNamed(everyone, added), cal: itip.Message(after, itip.MethodRequest, now)})
		}
	}
	if wasMeeting && len(removed) > 0 {
		cancel := itip.Cancel(before, removed, now)
		itip.SetSequence(itip.Master(cancel), itip.Sequence(item))
		letters = append(letters, letter{to: partiesNamed(itip.Attendees(old), removed), cal: cancel})
	}
	return letters, organizer.Address
}

// departure returns what removing a calendar object tells whom, and from
// which address. Removing an event that is over tells nobody. A meeting the user organizes is cancelled for its guests;
// an invitation they have not declined is declined to its organizer, unless
// it was cancelled or the organizer asked for no answers.
//
// Without notify nobody is told. A server that schedules is then asked not
// to decline for the user (RFC 6638 §8.1), as it is for a cancelled
// invitation, whose organizer has nobody left to hear from.
func departure(acct *schedulingAccount, cal *ical.Calendar, notify bool, now time.Time) ([]letter, string, http.Header) {
	item := itip.Master(cal)
	m := meetingOf(item, acct)
	status, _ := item.Props.Text(ical.PropStatus)
	cancelled := strings.EqualFold(status, "CANCELLED")
	over := ended(cal, clock())

	var header http.Header
	if acct.server && m.role == "attendee" && (!notify || cancelled || over) {
		header = http.Header{"Schedule-Reply": {"F"}}
	}
	if !notify || over {
		return nil, "", header
	}
	switch m.role {
	case "organizer":
		if len(m.attendees) > 0 {
			return []letter{{to: m.attendees, cal: itip.Cancel(cal, nil, now)}}, m.organizer.Address, header
		}
	case "attendee":
		if m.organizer == nil || cancelled || m.status() == itip.Declined || !m.rsvp() {
			return nil, "", header
		}
		declined := itip.Clone(cal)
		itip.Answer(declined, m.me, itip.Declined)
		if reply, err := itip.Reply(declined, m.me, now); err == nil {
			return []letter{{to: []itip.Party{*m.organizer}, cal: reply}}, m.me, header
		}
	}
	return nil, "", header
}
