package alpscaldav

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-ical"
	"github.com/migadu/alps/internal/itip"
)

// meetingBody is what the event editor sends for an event on 16 September.
func meetingBody(summary string, guests ...Person) map[string]any {
	m := map[string]any{"summary": summary, "start": "2026-09-16T08:00:00Z", "end": "2026-09-16T09:00:00Z", "calendarPath": testCalendar}
	if guests != nil {
		m["attendees"] = guests
	}
	return m
}

type savedEvent struct {
	Path, ETag       string
	Sent, SendFailed bool
}

func (h *harness) saveMeeting(objectPath string, body map[string]any) savedEvent {
	h.t.Helper()
	url := "/calendar/events"
	if objectPath != "" {
		url += "/" + pathParam(objectPath) + "/edit"
	}
	r := h.do("POST", url, body)
	h.expect(r, http.StatusOK)
	var saved savedEvent
	h.decode(r, &saved)
	return saved
}

func recipients(m sentMail) string {
	return strings.Join(m.to, ",")
}

func TestNewMeetingInvitesItsGuests(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	// The user on their own guest list is not mailed.
	saved := h.saveMeeting("", meetingBody("Review", Person{Email: "Grace Hopper <Grace@Example.org>"}, Person{Email: "ada@example.com"}))
	if !saved.Sent || saved.SendFailed {
		t.Fatalf("saved %+v", saved)
	}

	stored := h.dav.get(t, saved.Path).Data
	item := itip.Master(stored)
	if org := itip.Organizer(item); org == nil || org.Address != "ada@example.com" {
		t.Fatalf("organizer %+v", org)
	}
	grace := itip.PartyOf(itip.Attendee(item, "grace@example.org"))
	if grace.Status != itip.NeedsAction || !grace.RSVP || grace.Name != "Grace Hopper" {
		t.Fatalf("Grace %+v", grace)
	}

	sent := mails.messages()
	if len(sent) != 1 || recipients(sent[0]) != "grace@example.org" || sent[0].from != testUser {
		t.Fatalf("sent %+v", sent)
	}
	method, invite, header := calendarPart(t, sent[0])
	if method != "REQUEST" || len(itip.Attendees(itip.Master(invite))) != 2 {
		t.Fatalf("method %s", method)
	}
	if from, _ := header.AddressList("From"); len(from) != 1 || from[0].Address != "ada@example.com" {
		t.Fatalf("from %v", from)
	}
	if ev := h.listed(saved.Path); ev.Role != "organizer" || len(ev.Attendees) != 2 {
		t.Fatalf("listed %+v", ev)
	}
}

func TestMeetingChangesToldToTheGuestsTheyConcern(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	grace, charles, dora := Person{Email: "grace@example.org"}, Person{Email: "charles@example.com"}, Person{Email: "dora@example.com"}
	objectPath := h.saveMeeting("", meetingBody("Review", grace, charles)).Path

	// Grace accepts.
	answered := itip.Clone(h.dav.get(t, objectPath).Data)
	itip.Answer(answered, "grace@example.org", itip.Accepted)
	h.dav.save(objectPath, answered)

	last := func(wantCount int) (string, *ical.Calendar, string) {
		t.Helper()
		sent := mails.messages()
		if len(sent) != wantCount {
			t.Fatalf("%d messages sent, want %d", len(sent), wantCount)
		}
		method, cal, _ := calendarPart(t, sent[len(sent)-1])
		return method, cal, recipients(sent[len(sent)-1])
	}
	stored := func() *ical.Component { return itip.Master(h.dav.get(t, objectPath).Data) }

	// Renamed: everyone hears, and Grace's acceptance stands.
	h.saveMeeting(objectPath, meetingBody("Compiler review", grace, charles))
	if method, _, to := last(2); method != "REQUEST" || to != "grace@example.org,charles@example.com" {
		t.Fatalf("rename: %s to %s", method, to)
	}
	if itip.Sequence(stored()) != 1 || statusOf(t, h.dav.get(t, objectPath).Data, "grace@example.org") != itip.Accepted {
		t.Fatal("a rename lost Grace's answer, or did not move the sequence on")
	}

	// Moved: everyone is asked again.
	moved := meetingBody("Compiler review", grace, charles)
	moved["start"], moved["end"] = "2026-09-17T08:00:00Z", "2026-09-17T09:00:00Z"
	h.saveMeeting(objectPath, moved)
	if method, _, _ := last(3); method != "REQUEST" || itip.Sequence(stored()) != 2 {
		t.Fatalf("move: %s, sequence %d", method, itip.Sequence(stored()))
	}
	if statusOf(t, h.dav.get(t, objectPath).Data, "grace@example.org") != itip.NeedsAction {
		t.Fatal("Grace's acceptance of the old time stands")
	}

	// A guest added: only they hear.
	moved["attendees"] = []Person{grace, charles, dora}
	h.saveMeeting(objectPath, moved)
	if method, _, to := last(4); method != "REQUEST" || to != "dora@example.com" || itip.Sequence(stored()) != 3 {
		t.Fatalf("added: %s to %s", method, to)
	}

	// A guest removed: only they hear, that it is off for them.
	moved["attendees"] = []Person{grace, dora}
	h.saveMeeting(objectPath, moved)
	method, cancel, to := last(5)
	if method != "CANCEL" || to != "charles@example.com" || itip.Sequence(itip.Master(cancel)) != 4 {
		t.Fatalf("removed: %s to %s", method, to)
	}
	if a := itip.Attendees(itip.Master(cancel)); len(a) != 1 || a[0].Address != "charles@example.com" {
		t.Fatalf("the cancellation names %+v", a)
	}

	// Told to tell them, as the editor's question says when answered yes.
	told := meetingBody("Compiler review", grace, dora)
	told["start"], told["end"], told["notify"] = "2026-09-17T08:00:00Z", "2026-09-17T09:00:00Z", true
	told["summary"] = "Compiler review, room 5"
	if saved := h.saveMeeting(objectPath, told); !saved.Sent {
		t.Fatal("not told when asked to")
	}
	last(6)

	// Asked not to tell anyone.
	quiet := meetingBody("Review", grace, dora)
	quiet["start"], quiet["end"], quiet["notify"] = "2026-09-17T08:00:00Z", "2026-09-17T09:00:00Z", false
	if saved := h.saveMeeting(objectPath, quiet); saved.Sent {
		t.Fatal("told the guests when asked not to")
	}
	last(6)

	// An editor that sends no guest list keeps the one there is.
	delete(quiet, "attendees")
	delete(quiet, "notify")
	quiet["summary"] = "Review, again"
	h.saveMeeting(objectPath, quiet)
	if _, _, to := last(7); to != "grace@example.org,dora@example.com" {
		t.Fatalf("to %s", to)
	}
	if len(itip.Attendees(stored())) != 2 {
		t.Fatal("the guest list went")
	}
}

func TestMeetingWithEveryoneRemovedIsTheUsersAgain(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	objectPath := h.saveMeeting("", meetingBody("Review", Person{Email: "grace@example.org"})).Path
	body := meetingBody("Review")
	body["attendees"] = []Person{}
	h.saveMeeting(objectPath, body)

	item := itip.Master(h.dav.get(t, objectPath).Data)
	if item.Props.Get(ical.PropOrganizer) != nil || item.Props.Get(ical.PropAttendee) != nil {
		t.Fatal("still a meeting")
	}
	sent := mails.messages()
	if len(sent) != 2 || recipients(sent[1]) != "grace@example.org" {
		t.Fatalf("sent %d", len(sent))
	}
	if method, _, _ := calendarPart(t, sent[1]); method != "CANCEL" {
		t.Fatalf("method %s", method)
	}
}

func TestDeletingAMeetingCancelsItForTheGuests(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	objectPath := h.saveMeeting("", meetingBody("Review", Person{Email: "grace@example.org"})).Path

	r := h.do("DELETE", "/calendar/events/"+pathParam(objectPath), nil)
	h.expect(r, http.StatusOK)
	var saved savedEvent
	h.decode(r, &saved)
	sent := mails.messages()
	if !saved.Sent || len(sent) != 2 || len(h.copies()) != 0 {
		t.Fatalf("saved %+v, sent %d, calendar %v", saved, len(sent), h.copies())
	}
	method, cancel, _ := calendarPart(t, sent[1])
	if status, _ := itip.Master(cancel).Props.Text(ical.PropStatus); method != "CANCEL" || status != "CANCELLED" || itip.Sequence(itip.Master(cancel)) != 1 {
		t.Fatalf("%s %s", method, status)
	}

	quiet := h.saveMeeting("", meetingBody("Other", Person{Email: "grace@example.org"})).Path
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(quiet)+"?notify=0", nil), http.StatusOK)
	if len(mails.messages()) != 3 || len(h.copies()) != 0 {
		t.Fatalf("sent %d", len(mails.messages()))
	}
}

func TestDeletingAnInvitationDeclinesIt(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	invited := testCalendar + "review.ics"
	h.dav.save(invited, itip.Stored(parseICS(t, request)))
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(invited)+"?lang=fr", nil), http.StatusOK)
	sent := mails.messages()
	if len(sent) != 1 || recipients(sent[0]) != "grace@example.org" {
		t.Fatalf("sent %+v", sent)
	}
	method, reply, header := calendarPart(t, sent[0])
	if a := itip.Attendees(itip.Master(reply)); method != "REPLY" || len(a) != 1 || a[0].Status != itip.Declined {
		t.Fatalf("%s %+v", method, a)
	}
	if subject, _ := header.Subject(); subject != "Refusé: Compiler review" {
		t.Fatalf("subject %q", subject)
	}

	// Already declined, cancelled by the organizer, or no answers asked for:
	// nobody to tell.
	for name, ics := range map[string]string{
		"declined.ics":  strings.Replace(request, "ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION", "ATTENDEE;CN=Ada;PARTSTAT=DECLINED", 1),
		"cancelled.ics": strings.Replace(request, "SUMMARY:", "STATUS:CANCELLED\nSUMMARY:", 1),
		"quiet.ics":     strings.Replace(request, "ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION;RSVP=TRUE", "ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION;RSVP=FALSE", 1),
	} {
		h.dav.save(testCalendar+name, itip.Stored(parseICS(t, ics)))
		h.expect(h.do("DELETE", "/calendar/events/"+pathParam(testCalendar+name), nil), http.StatusOK)
	}
	if len(mails.messages()) != 1 {
		t.Fatalf("sent %d", len(mails.messages()))
	}
}

func TestDeletingAnInvitationOnAServerThatSchedules(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	front := &davFront{autoSchedule: true}
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: front.wrap})
	for _, name := range []string{"quiet.ics", "told.ics"} {
		h.dav.save(testCalendar+name, itip.Stored(parseICS(t, strings.Replace(request, "review@example.org", name, 1))))
	}
	h.dav.save(testCalendar+"cancelled.ics", itip.Stored(parseICS(t, strings.Replace(request, "SUMMARY:", "STATUS:CANCELLED\nSUMMARY:", 1))))
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(testCalendar+"quiet.ics")+"?notify=0", nil), http.StatusOK)
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(testCalendar+"told.ics"), nil), http.StatusOK)
	// Cancelled by its organizer, who has no one left to hear a decline from.
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(testCalendar+"cancelled.ics"), nil), http.StatusOK)
	if len(front.deletes) != 3 || front.deletes[0].Get("Schedule-Reply") != "F" || front.deletes[1].Get("Schedule-Reply") != "" || front.deletes[2].Get("Schedule-Reply") != "F" {
		t.Fatalf("deletes %+v", front.deletes)
	}
	if len(mails.messages()) != 0 || len(h.copies()) != 0 {
		t.Fatalf("sent %d, calendar %v", len(mails.messages()), h.copies())
	}
}

func TestEditingSomeoneElsesMeetingTellsNobody(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	invited := testCalendar + "review.ics"
	h.dav.save(invited, itip.Stored(parseICS(t, request)))

	h.saveMeeting(invited, meetingBody("My notes on the review", Person{Email: "mallory@example.net"}))
	item := itip.Master(h.dav.get(t, invited).Data)
	if org := itip.Organizer(item); org == nil || org.Address != "grace@example.org" || len(itip.Attendees(item)) != 2 || itip.Sequence(item) != 0 {
		t.Fatalf("someone else's meeting changed hands: %+v", itip.Attendees(item))
	}
	if summary, _ := item.Props.Text(ical.PropSummary); summary != "My notes on the review" || len(mails.messages()) != 0 {
		t.Fatalf("summary %q, sent %d", summary, len(mails.messages()))
	}
}

// An edit writes back the object it read: a meeting from Outlook keeps the
// VTIMEZONE its times are written in.
func TestEditKeepsTheRestOfTheObject(t *testing.T) {
	h := newHarness(t)
	objectPath := testCalendar + "sync.ics"
	cal := itip.Stored(parseICS(t, request))
	tz := ical.NewComponent(ical.CompTimezone)
	tz.Props.SetText(ical.PropTimezoneID, "W. Europe Standard Time")
	standard := ical.NewComponent(ical.CompTimezoneStandard)
	standard.Props.Set(&ical.Prop{Name: ical.PropDateTimeStart, Value: "16010101T030000", Params: ical.Params{}})
	standard.Props.Set(&ical.Prop{Name: ical.PropTimezoneOffsetFrom, Value: "+0200", Params: ical.Params{}})
	standard.Props.Set(&ical.Prop{Name: ical.PropTimezoneOffsetTo, Value: "+0100", Params: ical.Params{}})
	tz.Children = append(tz.Children, standard)
	cal.Children = append([]*ical.Component{tz}, cal.Children...)
	h.dav.save(objectPath, cal)

	h.saveMeeting(objectPath, meetingBody("Renamed"))
	kept := false
	for _, child := range h.dav.get(t, objectPath).Data.Children {
		kept = kept || child.Name == ical.CompTimezone
	}
	if !kept {
		t.Fatal("the VTIMEZONE was dropped")
	}
}

func TestServerThatSchedulesSendsTheInvitations(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	front := &davFront{autoSchedule: true}
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: front.wrap})
	saved := h.saveMeeting("", meetingBody("Review", Person{Email: "grace@example.org"}))
	if saved.Sent || len(mails.messages()) != 0 {
		t.Fatalf("saved %+v, sent %d", saved, len(mails.messages()))
	}
	if org := itip.Organizer(itip.Master(h.dav.get(t, saved.Path).Data)); org == nil || org.Address != "ada@example.com" {
		t.Fatal("not written as a meeting for the server to schedule")
	}
}

func TestGuestListTakesOnlyAddresses(t *testing.T) {
	h := newHarness(t)
	for _, guest := range []Person{
		{Email: "not an address"},
		{Email: "grace@example.org\r\nBcc: mallory@example.net"},
		{Email: ""},
		{Email: "grace@example.org", Name: "Grace\r\nBcc: mallory@example.net"},
	} {
		h.expect(h.do("POST", "/calendar/events", meetingBody("Review", guest)), http.StatusBadRequest)
	}
	crowd := make([]Person, maxAttendees+1)
	for i := range crowd {
		crowd[i] = Person{Email: fmt.Sprintf("guest%d@example.com", i)}
	}
	h.expect(h.do("POST", "/calendar/events", meetingBody("Review", crowd...)), http.StatusBadRequest)
	if len(h.copies()) != 0 {
		t.Fatalf("calendar %v", h.copies())
	}
}
