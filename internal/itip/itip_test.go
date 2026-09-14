package itip

import (
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-ical"
)

func parse(t *testing.T, text string) *ical.Calendar {
	t.Helper()
	cal, err := ical.NewDecoder(strings.NewReader(strings.ReplaceAll(text, "\n", "\r\n"))).Decode()
	if err != nil {
		t.Fatalf("decoding: %v", err)
	}
	return cal
}

func encode(t *testing.T, cal *ical.Calendar) string {
	t.Helper()
	var b strings.Builder
	if err := ical.NewEncoder(&b).Encode(cal); err != nil {
		t.Fatalf("encoding: %v", err)
	}
	return b.String()
}

// As Google Calendar sends one: the organizer listed among the attendees.
const googleRequest = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:20260916T080000Z
DTEND:20260916T090000Z
DTSTAMP:20260914T101500Z
ORGANIZER;CN=Grace Hopper:mailto:grace@example.org
UID:7kukuqrfedlm2f9t5a6uq9m1jp@google.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE
 ;CN=Grace Hopper;X-NUM-GUESTS=0:mailto:grace@example.org
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
 TRUE;CN=Ada@Example.com;X-NUM-GUESTS=0:mailto:Ada@Example.com
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Compiler review
LOCATION:Room 4
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:This is an event reminder
TRIGGER:-P0DT0H10M0S
END:VALARM
END:VEVENT
END:VCALENDAR
`

// As Outlook sends one: a Windows zone name, defined by the VTIMEZONE it
// carries.
const outlookRequest = `BEGIN:VCALENDAR
METHOD:REQUEST
PRODID:Microsoft Exchange Server 2010
VERSION:2.0
BEGIN:VTIMEZONE
TZID:W. Europe Standard Time
BEGIN:STANDARD
DTSTART:16010101T030000
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
RRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=10
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:16010101T020000
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
RRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=-1SU;BYMONTH=3
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
ORGANIZER;CN=Grace Hopper:mailto:grace@example.org
ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=Ada:mailto:ada@example.com
RRULE:FREQ=WEEKLY;BYDAY=WE
UID:040000008200E00074C5B7101A82E0080000000001
SUMMARY;LANGUAGE=en-US:Weekly sync
DTSTART;TZID=W. Europe Standard Time:20260916T100000
DTEND;TZID=W. Europe Standard Time:20260916T110000
SEQUENCE:0
DTSTAMP:20260914T101500Z
END:VEVENT
END:VCALENDAR
`

func TestAddressReadsMailtoOnly(t *testing.T) {
	for value, want := range map[string]string{
		"mailto:Ada@Example.com":    "ada@example.com",
		"MAILTO:ada@example.com":    "ada@example.com",
		" mailto:ada%40example.com": "ada@example.com",
		"urn:uuid:1234":             "",
		"mailto:not-an-address":     "",
	} {
		if got := Address(value); got != want {
			t.Errorf("Address(%q) = %q, want %q", value, got, want)
		}
	}
}

func TestTimeResolvesAWindowsZoneThroughItsVTIMEZONE(t *testing.T) {
	cal := parse(t, outlookRequest)
	start := Master(cal).Props.Get(ical.PropDateTimeStart)
	got, isDate, err := Time(cal, start)
	if err != nil || isDate {
		t.Fatalf("Time: %v, isDate %v", err, isDate)
	}
	// Mid-September is summer time, UTC+2.
	if want := time.Date(2026, 9, 16, 8, 0, 0, 0, time.UTC); !got.Equal(want) {
		t.Fatalf("read %v, want %v", got.UTC(), want)
	}

	// And after the last Sunday of October, standard time, UTC+1.
	winter := *start
	winter.Value = "20261104T100000"
	got, _, _ = Time(cal, &winter)
	if want := time.Date(2026, 11, 4, 9, 0, 0, 0, time.UTC); !got.Equal(want) {
		t.Fatalf("read %v in November, want %v", got.UTC(), want)
	}
}

func TestTimeUsesAKnownZoneAndReadsTheRestAsUTC(t *testing.T) {
	prop := ical.NewProp(ical.PropDateTimeStart)
	prop.Value = "20260916T100000"
	prop.Params.Set(ical.ParamTimezoneID, "America/New_York")
	got, _, err := Time(nil, prop)
	if err != nil || !got.Equal(time.Date(2026, 9, 16, 14, 0, 0, 0, time.UTC)) {
		t.Fatalf("New York: %v %v", got.UTC(), err)
	}
	prop.Params.Set(ical.ParamTimezoneID, "Nowhere Standard Time")
	if got, _, _ := Time(nil, prop); !got.Equal(time.Date(2026, 9, 16, 10, 0, 0, 0, time.UTC)) {
		t.Fatalf("an unknown zone read as %v", got)
	}
	date := ical.NewProp(ical.PropDateTimeStart)
	date.Value = "20260916"
	if got, isDate, _ := Time(nil, date); !isDate || got.Format("20060102") != "20260916" {
		t.Fatalf("a date read as %v, %v", got, isDate)
	}
}

func TestReplyNamesOnlyTheAttendeeWithoutAlarms(t *testing.T) {
	cal := Stored(parse(t, googleRequest))
	if !Answer(cal, "ada@example.com", Accepted) {
		t.Fatal("Ada is an attendee")
	}
	now := time.Date(2026, 9, 14, 12, 0, 0, 0, time.UTC)
	reply, err := Reply(cal, "ada@example.com", now)
	if err != nil {
		t.Fatal(err)
	}
	if Method(reply) != MethodReply {
		t.Fatalf("method %q", Method(reply))
	}
	item := Master(reply)
	attendees := Attendees(item)
	if len(attendees) != 1 || attendees[0].Address != "ada@example.com" || attendees[0].Status != Accepted {
		t.Fatalf("attendees %+v", attendees)
	}
	if Organizer(item).Address != "grace@example.org" || UID(item) != "7kukuqrfedlm2f9t5a6uq9m1jp@google.com" {
		t.Fatalf("organizer or UID lost: %s", encode(t, reply))
	}
	if hasAlarm(item) {
		t.Fatal("the reply carries the attendee's reminder")
	}
	if got, _ := stamp(item); !got.Equal(now) {
		t.Fatalf("stamped %v", got)
	}
	// The copy itself is untouched by building the reply.
	if len(Attendees(Master(cal))) != 2 || !hasAlarm(Master(cal)) {
		t.Fatal("building the reply changed the stored copy")
	}
	encode(t, reply)

	if _, err := Reply(cal, "mallory@example.net", now); err != ErrNotInvited {
		t.Fatalf("a reply for someone not invited: %v", err)
	}
}

func TestStoredDropsMethod(t *testing.T) {
	cal := Stored(parse(t, googleRequest))
	if Method(cal) != "" || !strings.Contains(encode(t, cal), "SUMMARY:Compiler review") {
		t.Fatalf("stored copy: %s", encode(t, cal))
	}
}

func TestNewerComparesSequenceThenStamp(t *testing.T) {
	a := Master(parse(t, googleRequest))
	b := Master(parse(t, googleRequest))
	if Newer(a, b) || Newer(b, a) {
		t.Fatal("the same revision is newer than itself")
	}
	b.Props.SetDateTime(ical.PropDateTimeStamp, time.Date(2026, 9, 15, 0, 0, 0, 0, time.UTC))
	if !Newer(b, a) || Newer(a, b) {
		t.Fatal("a later stamp at the same sequence is not newer")
	}
	SetSequence(a, 1)
	if !Newer(a, b) {
		t.Fatal("a higher sequence stamped earlier is not newer")
	}
}

func TestUpdateKeepsTheAnswerUnlessMoved(t *testing.T) {
	stored := Stored(parse(t, googleRequest))
	Answer(stored, "ada@example.com", Accepted)

	renamed := parse(t, googleRequest)
	// The organizer's update carries no reminder; the attendee's own stays.
	dropAlarms(Master(renamed))
	Master(renamed).Props.SetText(ical.PropSummary, "Compiler review (room change)")
	SetSequence(Master(renamed), 1)
	got := Update(stored, renamed, "ada@example.com")
	if Method(got) != "" {
		t.Fatal("the updated copy carries METHOD")
	}
	if s := partyOf(Attendee(Master(got), "ada@example.com")).Status; s != Accepted {
		t.Fatalf("a renamed meeting lost the answer: %s", s)
	}
	if text, _ := Master(got).Props.Text(ical.PropSummary); text != "Compiler review (room change)" {
		t.Fatalf("summary %q", text)
	}
	if !hasAlarm(Master(got)) {
		t.Fatal("the attendee's reminder was dropped")
	}

	moved := parse(t, googleRequest)
	Master(moved).Props.Get(ical.PropDateTimeStart).Value = "20260917T080000Z"
	Master(moved).Props.Get(ical.PropDateTimeEnd).Value = "20260917T090000Z"
	SetSequence(Master(moved), 2)
	got = Update(stored, moved, "ada@example.com")
	if s := partyOf(Attendee(Master(got), "ada@example.com")).Status; s != NeedsAction {
		t.Fatalf("a moved meeting kept the answer to the old time: %s", s)
	}
}

func TestApplyCancelOfAWholeSeriesAndOfOneOccurrence(t *testing.T) {
	stored := Stored(parse(t, outlookRequest))
	whole := parse(t, strings.Replace(outlookRequest, "METHOD:REQUEST", "METHOD:CANCEL", 1))
	if !ApplyCancel(Clone(stored), whole) {
		t.Fatal("cancelling the series leaves something")
	}

	one := parse(t, strings.Replace(outlookRequest, "METHOD:REQUEST", "METHOD:CANCEL", 1))
	rid := ical.NewProp(ical.PropRecurrenceID)
	rid.Value = "20260923T100000"
	rid.Params.Set(ical.ParamTimezoneID, "W. Europe Standard Time")
	Master(one).Props.Set(rid)

	// The stored copy has an override for that week, written in UTC.
	override := cloneComponent(Master(stored))
	override.Props.Del(ical.PropRecurrenceRule)
	utcRID := ical.NewProp(ical.PropRecurrenceID)
	utcRID.Value = "20260923T080000Z"
	override.Props.Set(utcRID)
	stored.Children = append(stored.Children, override)

	if ApplyCancel(stored, one) {
		t.Fatal("cancelling one week removed the series")
	}
	if len(Items(stored)) != 1 {
		t.Fatalf("the override for the cancelled week is still there: %s", encode(t, stored))
	}
	exdates := Master(stored).Props[ical.PropExceptionDates]
	if len(exdates) != 1 || exdates[0].Value != "20260923T100000" || exdates[0].Params.Get(ical.ParamTimezoneID) != "W. Europe Standard Time" {
		t.Fatalf("EXDATE %+v", exdates)
	}
}

func TestApplyReply(t *testing.T) {
	organizerCopy := Stored(parse(t, googleRequest))
	answer := Stored(parse(t, googleRequest))
	Answer(answer, "ada@example.com", Tentative)
	reply, err := Reply(answer, "ada@example.com", time.Now())
	if err != nil {
		t.Fatal(err)
	}

	changed, err := ApplyReply(organizerCopy, reply)
	if err != nil || !changed {
		t.Fatalf("changed %v, err %v", changed, err)
	}
	if s := partyOf(Attendee(Master(organizerCopy), "ada@example.com")).Status; s != Tentative {
		t.Fatalf("status %s", s)
	}
	if changed, _ := ApplyReply(organizerCopy, reply); changed {
		t.Fatal("the same answer again changed something")
	}

	crasher := Clone(reply)
	Master(crasher).Props.Get(ical.PropAttendee).Value = "mailto:mallory@example.net"
	if _, err := ApplyReply(organizerCopy, crasher); err != ErrNotInvited {
		t.Fatalf("an answer from someone not invited: %v", err)
	}

	SetSequence(Master(organizerCopy), 3)
	if _, err := ApplyReply(organizerCopy, reply); err != ErrOutdated {
		t.Fatalf("an answer to an earlier revision: %v", err)
	}
}

func TestInviteKeepsAnswersAndReportsChanges(t *testing.T) {
	comp := Master(Stored(parse(t, googleRequest)))
	Attendee(comp, "ada@example.com").Params.Set(ical.ParamParticipationStatus, Accepted)

	me := Party{Address: "grace@example.org", Name: "Grace Hopper"}
	added, removed := Invite(comp, me, []Party{
		{Address: "Ada@example.com", Name: "Ada Lovelace"},
		{Address: "charles@example.com"},
	})
	if strings.Join(added, ",") != "charles@example.com" || strings.Join(removed, ",") != "grace@example.org" {
		t.Fatalf("added %v, removed %v", added, removed)
	}
	ada := partyOf(Attendee(comp, "ada@example.com"))
	if ada.Status != Accepted || ada.Name != "Ada Lovelace" {
		t.Fatalf("Ada %+v", ada)
	}
	charles := partyOf(Attendee(comp, "charles@example.com"))
	if charles.Status != NeedsAction || !charles.RSVP {
		t.Fatalf("Charles %+v", charles)
	}
	if Organizer(comp).Address != "grace@example.org" {
		t.Fatal("organizer")
	}

	AskAgain(comp, "grace@example.org")
	if partyOf(Attendee(comp, "ada@example.com")).Status != NeedsAction {
		t.Fatal("AskAgain kept an answer")
	}

	_, removed = Invite(comp, me, nil)
	if len(removed) != 2 || comp.Props.Get(ical.PropOrganizer) != nil || comp.Props.Get(ical.PropAttendee) != nil {
		t.Fatalf("a meeting with nobody invited: removed %v, %s", removed, comp.Props)
	}
}

func TestCancel(t *testing.T) {
	cal := Stored(parse(t, googleRequest))
	now := time.Now()

	everyone := Cancel(cal, nil, now)
	item := Master(everyone)
	if Method(everyone) != MethodCancel || Sequence(item) != 1 || len(Attendees(item)) != 2 {
		t.Fatalf("cancel for everyone: %s", encode(t, everyone))
	}
	if status, _ := item.Props.Text(ical.PropStatus); status != "CANCELLED" {
		t.Fatalf("status %q", status)
	}

	one := Cancel(cal, []string{"ada@example.com"}, now)
	if a := Attendees(Master(one)); len(a) != 1 || a[0].Address != "ada@example.com" || Sequence(Master(one)) != 0 {
		t.Fatalf("cancel for one: %s", encode(t, one))
	}
	if Sequence(Master(cal)) != 0 || Method(cal) != "" {
		t.Fatal("building a cancel changed the copy")
	}
}

func TestRescheduledAndRevised(t *testing.T) {
	a := Master(parse(t, googleRequest))
	b := Master(parse(t, googleRequest))
	if Rescheduled(a, b) || Revised(a, b) {
		t.Fatal("identical items differ")
	}
	b.Props.SetText(ical.PropLocation, "Room 5")
	if Rescheduled(a, b) || !Revised(a, b) {
		t.Fatal("a new room")
	}
	b.Props.Get(ical.PropDateTimeStart).Value = "20260916T083000Z"
	if !Rescheduled(a, b) {
		t.Fatal("a new start")
	}
}
