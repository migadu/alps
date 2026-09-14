package alpscaldav

import (
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-ical"
	"github.com/migadu/alps/internal/itip"
)

func calendarWith(items ...string) string {
	return "BEGIN:VCALENDAR\nPRODID:-//test//EN\nVERSION:2.0\n" + strings.Join(items, "") + "END:VCALENDAR\n"
}

func eventWith(props string) string {
	return "BEGIN:VEVENT\nUID:e@example.org\nDTSTAMP:20260801T000000Z\n" + props + "END:VEVENT\n"
}

func TestEnded(t *testing.T) {
	for name, c := range map[string]struct {
		ics  string
		want bool
	}{
		"finished this morning": {calendarWith(eventWith("DTSTART:20260914T080000Z\nDTEND:20260914T090000Z\n")), true},
		"still going":           {calendarWith(eventWith("DTSTART:20260914T110000Z\nDTEND:20260914T130000Z\n")), false},
		"all day today":         {calendarWith(eventWith("DTSTART;VALUE=DATE:20260914\nDTEND;VALUE=DATE:20260915\n")), false},
		"all day yesterday":     {calendarWith(eventWith("DTSTART;VALUE=DATE:20260913\nDTEND;VALUE=DATE:20260914\n")), true},
		"weekly, no end":        {calendarWith(eventWith("DTSTART:20260105T080000Z\nDTEND:20260105T090000Z\nRRULE:FREQ=WEEKLY\n")), false},
		"weekly until August":   {calendarWith(eventWith("DTSTART:20260105T080000Z\nDTEND:20260105T090000Z\nRRULE:FREQ=WEEKLY;UNTIL=20260801T000000Z\n")), true},
		"weekly until October":  {calendarWith(eventWith("DTSTART:20260105T080000Z\nDTEND:20260105T090000Z\nRRULE:FREQ=WEEKLY;UNTIL=20261001T000000Z\n")), false},
		"three weeks in August": {calendarWith(eventWith("DTSTART:20260803T080000Z\nDTEND:20260803T090000Z\nRRULE:FREQ=WEEKLY;COUNT=3\n")), true},
		"ten weeks from August": {calendarWith(eventWith("DTSTART:20260803T080000Z\nDTEND:20260803T090000Z\nRRULE:FREQ=WEEKLY;COUNT=10\n")), false},
		"an extra date to come": {calendarWith(eventWith("DTSTART:20260803T080000Z\nDTEND:20260803T090000Z\nRDATE:20260801T080000Z,20260920T080000Z\n")), false},
		"extra dates gone":      {calendarWith(eventWith("DTSTART:20260803T080000Z\nDTEND:20260803T090000Z\nRDATE:20260810T080000Z\n")), true},
		"an occurrence moved ahead": {calendarWith(
			eventWith("DTSTART:20260803T080000Z\nDTEND:20260803T090000Z\nRRULE:FREQ=WEEKLY;COUNT=3\n"),
			eventWith("RECURRENCE-ID:20260817T080000Z\nDTSTART:20260920T080000Z\nDTEND:20260920T090000Z\n"),
		), false},
		"an overdue task": {calendarWith("BEGIN:VTODO\nUID:t@example.org\nDTSTAMP:20260801T000000Z\nDUE:20260801T080000Z\nEND:VTODO\n"), false},
	} {
		if got := ended(parseICS(t, c.ics), testNow); got != c.want {
			t.Errorf("%s: ended %v, want %v", name, got, c.want)
		}
	}
}

// The meeting of 10 September.
func pastRequest() string {
	return strings.NewReplacer("20260916T080000Z", "20260910T080000Z", "20260916T090000Z", "20260910T090000Z").Replace(request)
}

func TestInvitationToAnEventThatIsOver(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	// Something else was on at the time, which no longer matters.
	busy := eventCalendar("busy", "Busy")
	itip.Master(busy).Props.SetDateTime(ical.PropDateTimeStart, time.Date(2026, 9, 10, 8, 15, 0, 0, time.UTC))
	itip.Master(busy).Props.SetDateTime(ical.PropDateTimeEnd, time.Date(2026, 9, 10, 8, 45, 0, 0, time.UTC))
	h.dav.save(testCalendar+"busy.ics", busy)

	uid := h.deliver("grace@example.org", "Invitation", pastRequest())
	if view := h.invitation(uid); !view.Ended || view.State != invAnswer || len(view.Clashes) != 0 {
		t.Fatalf("view %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"}), http.StatusConflict)
	if len(h.copies()) != 1 || len(mails.messages()) != 0 {
		t.Fatalf("calendar %v, sent %d", h.copies(), len(mails.messages()))
	}

	// With a copy in the calendar, its organizer's cancellation waits to be
	// asked for, and the calendar cannot answer it either.
	objectPath := testCalendar + "review.ics"
	h.dav.save(objectPath, itip.Stored(parseICS(t, pastRequest())))
	cancel := h.deliver("grace@example.org", "Cancelled", strings.Replace(withMethod(pastRequest(), "CANCEL"), "SEQUENCE:0", "SEQUENCE:1", 1))
	if view := h.invitation(cancel); view.State != invCancel || view.AutoApply || !view.Ended {
		t.Fatalf("view %+v", view)
	}
	if ev := h.listed(objectPath); !ev.Ended {
		t.Fatalf("listed %+v", ev)
	}
	h.expect(h.do("POST", "/calendar/events/"+pathParam(objectPath)+"/respond", map[string]string{"status": "declined"}), http.StatusConflict)

	// Removing it declines nothing.
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(objectPath), nil), http.StatusOK)
	if len(mails.messages()) != 0 {
		t.Fatalf("sent %d", len(mails.messages()))
	}
}

func TestMeetingThatIsOverTellsNobody(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	grace := Person{Email: "grace@example.org"}
	retro := meetingBody("Retro", grace)
	retro["start"], retro["end"] = "2026-09-10T08:00:00Z", "2026-09-10T09:00:00Z"
	saved := h.saveMeeting("", retro)
	if saved.Sent || len(mails.messages()) != 0 {
		t.Fatalf("a meeting recorded after the fact invited its guests: %+v", saved)
	}
	if itip.Organizer(itip.Master(h.dav.get(t, saved.Path).Data)) == nil {
		t.Fatal("not kept as a meeting")
	}

	retro["summary"] = "Retro, with notes"
	h.saveMeeting(saved.Path, retro)
	if len(mails.messages()) != 0 {
		t.Fatalf("notes on a past meeting sent %d messages", len(mails.messages()))
	}

	// Moved to next week, it is news.
	retro["start"], retro["end"] = "2026-09-21T08:00:00Z", "2026-09-21T09:00:00Z"
	h.saveMeeting(saved.Path, retro)
	if len(mails.messages()) != 1 {
		t.Fatalf("moving it to come sent %d messages", len(mails.messages()))
	}

	old := meetingBody("Old", grace)
	old["start"], old["end"] = "2026-09-01T08:00:00Z", "2026-09-01T09:00:00Z"
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(h.saveMeeting("", old).Path), nil), http.StatusOK)
	if len(mails.messages()) != 1 {
		t.Fatalf("deleting a past meeting sent %d messages", len(mails.messages()))
	}
}

// A scheduling server would decline on the user's behalf.
func TestInvitationThatIsOverDeletedOnASchedulingServer(t *testing.T) {
	front := &davFront{autoSchedule: true}
	h := startHarness(t, harnessOptions{wrap: front.wrap})
	objectPath := testCalendar + "review.ics"
	h.dav.save(objectPath, itip.Stored(parseICS(t, pastRequest())))
	h.expect(h.do("DELETE", "/calendar/events/"+pathParam(objectPath), nil), http.StatusOK)
	if len(front.deletes) != 1 || front.deletes[0].Get("Schedule-Reply") != "F" {
		t.Fatalf("deletes %+v", front.deletes)
	}
}

// Some clients answer with no times; the calendar's copy says when the
// meeting was.
func TestReplyToAMeetingThatIsOverWaits(t *testing.T) {
	h := newHarness(t)
	mine := strings.Replace(strings.Replace(pastRequest(), "ORGANIZER;CN=Grace Hopper:mailto:grace@example.org", "ORGANIZER:mailto:ada@example.com", 1),
		"ATTENDEE;CN=Grace Hopper;PARTSTAT=ACCEPTED", "ATTENDEE;CN=Grace Hopper;PARTSTAT=NEEDS-ACTION", 1)
	h.dav.save(testCalendar+"review.ics", itip.Stored(parseICS(t, mine)))
	reply := "BEGIN:VCALENDAR\nPRODID:-//test//EN\nVERSION:2.0\nMETHOD:REPLY\nBEGIN:VEVENT\nUID:review@example.org\nDTSTAMP:20260914T100000Z\nSEQUENCE:0\n" +
		"ORGANIZER:mailto:ada@example.com\nATTENDEE;PARTSTAT=ACCEPTED:mailto:grace@example.org\nEND:VEVENT\nEND:VCALENDAR\n"
	uid := h.deliver("grace@example.org", "Accepted", reply)
	if view := h.invitation(uid); view.State != invReply || view.AutoApply || !view.Ended {
		t.Fatalf("view %+v", view)
	}
}
