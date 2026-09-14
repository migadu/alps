package alpscaldav

import (
	"context"
	"encoding/base64"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
	"github.com/migadu/alps/internal/itip"
	"github.com/migadu/alps/provider"
	"github.com/migadu/alps/provider/maildir"
)

// mailRecorder is a submission server that keeps what it is sent.
type mailRecorder struct {
	mu   sync.Mutex
	sent []sentMail
}

type sentMail struct {
	from string
	to   []string
	data []byte
}

func (r *mailRecorder) NewSession(*smtp.Conn) (smtp.Session, error) {
	return &mailSession{r: r}, nil
}

func (r *mailRecorder) messages() []sentMail {
	r.mu.Lock()
	defer r.mu.Unlock()
	return append([]sentMail(nil), r.sent...)
}

type mailSession struct {
	r    *mailRecorder
	from string
	to   []string
}

func (s *mailSession) AuthMechanisms() []string { return []string{sasl.Plain} }

func (s *mailSession) Auth(string) (sasl.Server, error) {
	return sasl.NewPlainServer(func(_, username, password string) error {
		if username != testUser || password != testPassword {
			return errors.New("invalid credentials")
		}
		return nil
	}), nil
}

func (s *mailSession) Mail(_ context.Context, from string, _ *smtp.MailOptions) error {
	s.from = from
	return nil
}

func (s *mailSession) Rcpt(_ context.Context, to string, _ *smtp.RcptOptions) error {
	s.to = append(s.to, to)
	return nil
}

func (s *mailSession) Data(_ context.Context, r io.Reader) error {
	data, err := io.ReadAll(r)
	if err != nil {
		return err
	}
	s.r.mu.Lock()
	s.r.sent = append(s.r.sent, sentMail{from: s.from, to: s.to, data: data})
	s.r.mu.Unlock()
	return nil
}

func (s *mailSession) Reset()        { s.from, s.to = "", nil }
func (s *mailSession) Logout() error { return nil }

func startMailRecorder(t *testing.T) (*mailRecorder, string) {
	t.Helper()
	rec := &mailRecorder{}
	srv := smtp.NewServer(rec)
	srv.Domain = "localhost"
	srv.AllowInsecureAuth = true
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })
	return rec, "smtp+insecure://" + ln.Addr().String()
}

// davFront plays the parts of a calendar server go-webdav's handler does not:
// advertising scheduling, listing the user's addresses. And it records the
// deletes it passes on.
type davFront struct {
	autoSchedule bool
	addresses    []string

	mu      sync.Mutex
	deletes []http.Header
}

func (f *davFront) wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodOptions:
			if f.autoSchedule {
				w.Header().Add("DAV", "calendar-auto-schedule")
			}
		case "PROPFIND":
			body, _ := io.ReadAll(r.Body)
			if strings.Contains(string(body), "calendar-user-address-set") {
				var hrefs strings.Builder
				for _, addr := range f.addresses {
					hrefs.WriteString("<D:href>mailto:" + addr + "</D:href>")
				}
				w.Header().Set("Content-Type", "application/xml; charset=utf-8")
				w.WriteHeader(http.StatusMultiStatus)
				io.WriteString(w, `<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:response><D:href>`+r.URL.Path+`</D:href><D:propstat><D:prop><C:calendar-user-address-set>`+hrefs.String()+`</C:calendar-user-address-set></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>`)
				return
			}
			r.Body = io.NopCloser(strings.NewReader(string(body)))
		case http.MethodDelete:
			f.mu.Lock()
			f.deletes = append(f.deletes, r.Header.Clone())
			f.mu.Unlock()
		}
		next.ServeHTTP(w, r)
	})
}

type rawMail []byte

func (m rawMail) WriteTo(w io.Writer) (int64, error) {
	n, err := w.Write(m)
	return int64(n), err
}

// deliver puts a message carrying ics as its calendar part into the user's
// inbox, and returns its ID.
func (h *harness) deliver(from, subject, ics string) string {
	h.t.Helper()
	return h.deliverTo(from, "Ada <ada@example.com>", subject, ics)
}

func (h *harness) deliverTo(from, to, subject, ics string) string {
	h.t.Helper()
	cal := base64.StdEncoding.EncodeToString([]byte(strings.ReplaceAll(ics, "\n", "\r\n")))
	method := ""
	if i := strings.Index(ics, "METHOD:"); i >= 0 {
		method = strings.TrimSpace(ics[i+len("METHOD:") : i+strings.Index(ics[i:], "\n")])
	}
	msg := "From: " + from + "\r\nTo: " + to + "\r\nSubject: " + subject + "\r\nMessage-ID: <" + subject + "@test>\r\nMIME-Version: 1.0\r\n" +
		"Content-Type: multipart/alternative; boundary=b\r\n\r\n" +
		"--b\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nYou are invited.\r\n" +
		"--b\r\nContent-Type: text/calendar; charset=utf-8; method=" + method + "\r\nContent-Transfer-Encoding: base64\r\n\r\n" + cal + "\r\n--b--\r\n"
	mp := maildir.NewProvider(h.mailDir, testUser)
	if _, _, _, err := mp.AppendMessage("INBOX", rawMail(msg), provider.MailboxTypeArchive); err != nil {
		h.t.Fatal(err)
	}
	messages, _, err := mp.ListMessages("INBOX", "", 0, 100)
	if err != nil {
		h.t.Fatal(err)
	}
	for _, m := range messages {
		if m.Envelope != nil && m.Envelope.Subject == subject {
			return m.ID.String()
		}
	}
	h.t.Fatalf("delivered %q, but it is not in the inbox", subject)
	return ""
}

func (h *harness) invitation(uid string) InvitationView {
	h.t.Helper()
	r := h.do("GET", "/calendar/invitation?mailbox=INBOX&uid="+uid, nil)
	h.expect(r, http.StatusOK)
	var view InvitationView
	h.decode(r, &view)
	return view
}

func (h *harness) copies() []string {
	h.dav.mu.Lock()
	defer h.dav.mu.Unlock()
	var paths []string
	for p := range h.dav.objects {
		paths = append(paths, p)
	}
	return paths
}

// onlyCopy returns the one object in the calendar.
func (h *harness) onlyCopy() *ical.Calendar {
	h.t.Helper()
	paths := h.copies()
	if len(paths) != 1 {
		h.t.Fatalf("the calendar holds %d objects: %v", len(paths), paths)
	}
	return h.dav.get(h.t, paths[0]).Data
}

func statusOf(t *testing.T, cal *ical.Calendar, addr string) string {
	t.Helper()
	prop := itip.Attendee(itip.Master(cal), addr)
	if prop == nil {
		t.Fatalf("%s is not an attendee", addr)
	}
	return itip.PartyOf(prop).Status
}

// calendarPart reads the text/calendar part of a sent message.
func calendarPart(t *testing.T, m sentMail) (method string, cal *ical.Calendar, header mail.Header) {
	t.Helper()
	r, err := mail.CreateReader(strings.NewReader(string(m.data)))
	if err != nil {
		t.Fatal(err)
	}
	for {
		p, err := r.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatal(err)
		}
		ct, params, _ := p.Header.(*mail.InlineHeader).ContentType()
		if ct != "text/calendar" {
			continue
		}
		cal, err := ical.NewDecoder(p.Body).Decode()
		if err != nil {
			t.Fatal(err)
		}
		return params["method"], cal, r.Header
	}
	t.Fatalf("no calendar part in %s", m.data)
	return "", nil, r.Header
}

const request = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:20260916T080000Z
DTEND:20260916T090000Z
DTSTAMP:20260914T101500Z
ORGANIZER;CN=Grace Hopper:mailto:grace@example.org
UID:review@example.org
ATTENDEE;CN=Grace Hopper;PARTSTAT=ACCEPTED;RSVP=TRUE:mailto:grace@example.org
ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:ada@example.com
SEQUENCE:0
SUMMARY:Compiler review
LOCATION:Room 4
END:VEVENT
END:VCALENDAR
`

func withMethod(ics, method string) string {
	return strings.Replace(ics, "METHOD:REQUEST", "METHOD:"+method, 1)
}

func TestInvitationAnsweredIntoTheCalendarAndToTheOrganizer(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	// A dentist appointment in the same hour, and a holiday that day.
	h.dav.save(testCalendar+"dentist.ics", eventCalendar("dentist", "Dentist"))
	uid := h.deliver("Grace Hopper <grace@example.org>", "Invitation", request)

	view := h.invitation(uid)
	if view.State != invAnswer || view.Me != "ada@example.com" || view.Status != "needs-action" || view.Copy != nil {
		t.Fatalf("view %+v", view)
	}
	if view.Summary != "Compiler review" || view.Start != "2026-09-16T08:00:00Z" || view.Organizer.Email != "grace@example.org" || !view.SenderVerified {
		t.Fatalf("view %+v", view)
	}
	if view.Scheduling != "email" || view.AutoApply {
		t.Fatalf("scheduling %q, autoApply %v", view.Scheduling, view.AutoApply)
	}
	if len(view.Clashes) != 0 {
		t.Fatalf("clashes with the dentist on the 14th: %+v", view.Clashes)
	}

	h.dav.save(testCalendar+"dentist.ics", func() *ical.Calendar {
		cal := eventCalendar("dentist", "Dentist")
		itip.Master(cal).Props.SetDateTime(ical.PropDateTimeStart, time.Date(2026, 9, 16, 8, 30, 0, 0, time.UTC))
		itip.Master(cal).Props.SetDateTime(ical.PropDateTimeEnd, time.Date(2026, 9, 16, 9, 30, 0, 0, time.UTC))
		return cal
	}())
	if clashes := h.invitation(uid).Clashes; len(clashes) != 1 || clashes[0].Summary != "Dentist" {
		t.Fatalf("clashes %+v", clashes)
	}
	h.dav.mu.Lock()
	delete(h.dav.objects, testCalendar+"dentist.ics")
	h.dav.mu.Unlock()

	r := h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted", Lang: "de"})
	h.expect(r, http.StatusOK)
	var saved Saved
	h.decode(r, &saved)
	if !saved.Sent || saved.SendFailed || saved.Path == "" {
		t.Fatalf("saved %+v", saved)
	}

	stored := h.onlyCopy()
	if itip.Method(stored) != "" || statusOf(t, stored, "ada@example.com") != itip.Accepted {
		t.Fatal("the copy is not an accepted, stored event")
	}

	sent := mails.messages()
	if len(sent) != 1 || sent[0].from != testUser || strings.Join(sent[0].to, ",") != "grace@example.org" {
		t.Fatalf("sent %+v", sent)
	}
	method, reply, header := calendarPart(t, sent[0])
	if method != "REPLY" || itip.Method(reply) != itip.MethodReply {
		t.Fatalf("method %q", method)
	}
	if a := itip.Attendees(itip.Master(reply)); len(a) != 1 || a[0].Address != "ada@example.com" || a[0].Status != itip.Accepted {
		t.Fatalf("reply attendees %+v", a)
	}
	if subject, _ := header.Subject(); subject != "Angenommen: Compiler review" {
		t.Fatalf("subject %q", subject)
	}

	view = h.invitation(uid)
	if view.State != invAnswer || view.Status != "accepted" || view.Copy == nil || view.Copy.CalendarPath != testCalendar {
		t.Fatalf("after answering: %+v", view)
	}

	// Changing the answer rewrites the same copy.
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "declined"}), http.StatusOK)
	if statusOf(t, h.onlyCopy(), "ada@example.com") != itip.Declined || len(mails.messages()) != 2 {
		t.Fatal("the second answer did not replace the first")
	}
}

func TestInvitationUpdateKeepsTheAnswerAndNeedsTheOrganizer(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	first := h.deliver("grace@example.org", "Invitation", request)
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: first, Status: "accepted"}), http.StatusOK)

	update := strings.Replace(strings.Replace(request, "SEQUENCE:0", "SEQUENCE:1", 1), "Room 4", "Room 5", 1)
	forged := h.deliver("Mallory <mallory@example.net>", "Forged update", update)
	view := h.invitation(forged)
	if view.State != invUpdate || view.AutoApply || view.SenderVerified {
		t.Fatalf("an update from someone else applies itself: %+v", view)
	}

	real := h.deliver("grace@example.org", "Updated invitation", update)
	view = h.invitation(real)
	if view.State != invUpdate || !view.AutoApply || view.Status != "accepted" {
		t.Fatalf("the organizer's update: %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: real}), http.StatusOK)
	stored := h.onlyCopy()
	if location, _ := itip.Master(stored).Props.Text(ical.PropLocation); location != "Room 5" {
		t.Fatalf("location %q", location)
	}
	if statusOf(t, stored, "ada@example.com") != itip.Accepted {
		t.Fatal("a room change lost the answer")
	}
	if view := h.invitation(real); view.State != invAnswer {
		t.Fatalf("applied, the update is still %q", view.State)
	}
	// The old invitation is now behind the calendar.
	if view := h.invitation(first); view.State != invOutdated {
		t.Fatalf("the first invitation is %q", view.State)
	}
	if len(mails.messages()) != 1 {
		t.Fatalf("applying an update mailed someone: %d messages", len(mails.messages()))
	}
}

func TestCancellationRemovesTheCopyWithoutDeclining(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	front := &davFront{}
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: front.wrap})
	uid := h.deliver("grace@example.org", "Invitation", request)
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"}), http.StatusOK)

	cancel := h.deliver("grace@example.org", "Cancelled", strings.Replace(withMethod(request, "CANCEL"), "SEQUENCE:0", "SEQUENCE:1", 1))
	view := h.invitation(cancel)
	if view.State != invCancel || !view.AutoApply {
		t.Fatalf("view %+v", view)
	}
	r := h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: cancel})
	h.expect(r, http.StatusOK)
	var saved Saved
	h.decode(r, &saved)
	if !saved.Removed || len(h.copies()) != 0 {
		t.Fatalf("saved %+v, calendar %v", saved, h.copies())
	}
	if len(front.deletes) != 1 || front.deletes[0].Get("Schedule-Reply") != "F" {
		t.Fatalf("deletes %+v", front.deletes)
	}
	if view := h.invitation(cancel); view.State != invCancelled {
		t.Fatalf("after removal: %q", view.State)
	}
}

// Nothing a message says makes the user an organizer: an .ics naming them as
// one would otherwise have alps mail its attendees as the user.
func TestInvitationNamingTheUserAsOrganizerDoesNothing(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	forged := strings.Replace(request, "ORGANIZER;CN=Grace Hopper:mailto:grace@example.org", "ORGANIZER:mailto:ada@example.com", 1)
	uid := h.deliver("mallory@example.net", "Invitation", forged)

	if view := h.invitation(uid); view.State != invOrganizer || view.AutoApply {
		t.Fatalf("view %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"}), http.StatusConflict)
	h.expect(h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: uid}), http.StatusConflict)
	if len(h.copies()) != 0 || len(mails.messages()) != 0 {
		t.Fatalf("calendar %v, mail %d", h.copies(), len(mails.messages()))
	}
}

func TestReplyRecordedInTheUsersMeeting(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	mine := strings.Replace(strings.Replace(request, "ORGANIZER;CN=Grace Hopper:mailto:grace@example.org", "ORGANIZER;CN=Ada:mailto:ada@example.com", 1),
		"ATTENDEE;CN=Grace Hopper;PARTSTAT=ACCEPTED", "ATTENDEE;CN=Grace Hopper;PARTSTAT=NEEDS-ACTION", 1)
	h.dav.save(testCalendar+"review.ics", itip.Stored(parseICS(t, mine)))

	answer := strings.Replace(withMethod(mine, "REPLY"), "ATTENDEE;CN=Grace Hopper;PARTSTAT=NEEDS-ACTION", "ATTENDEE;CN=Grace Hopper;PARTSTAT=TENTATIVE", 1)
	uid := h.deliver("grace@example.org", "Tentative", answer)
	view := h.invitation(uid)
	if view.State != invReply || !view.AutoApply || view.Replier == nil || view.Replier.Email != "grace@example.org" || view.Replier.Status != "tentative" {
		t.Fatalf("view %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: uid}), http.StatusOK)
	if got := statusOf(t, h.dav.get(t, testCalendar+"review.ics").Data, "grace@example.org"); got != itip.Tentative {
		t.Fatalf("Grace is %s", got)
	}
	if view := h.invitation(uid); view.State != invReplied {
		t.Fatalf("applied, the reply is %q", view.State)
	}

	crasher := h.deliver("mallory@example.net", "Accepted", strings.Replace(answer, "mailto:grace@example.org", "mailto:mallory@example.net", 1))
	if view := h.invitation(crasher); view.State != invUnknown || view.AutoApply {
		t.Fatalf("a reply from someone not invited: %+v", view)
	}
}

// A server that schedules does the sending; alps only writes the calendar.
func TestServerThatSchedulesSendsNothingFromAlps(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	front := &davFront{autoSchedule: true}
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: front.wrap})
	uid := h.deliver("grace@example.org", "Invitation", request)

	if view := h.invitation(uid); view.Scheduling != "server" {
		t.Fatalf("scheduling %q", view.Scheduling)
	}
	r := h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "tentative"})
	h.expect(r, http.StatusOK)
	var saved Saved
	h.decode(r, &saved)
	if saved.Sent || statusOf(t, h.onlyCopy(), "ada@example.com") != itip.Tentative {
		t.Fatalf("saved %+v", saved)
	}
	if len(mails.messages()) != 0 {
		t.Fatalf("alps mailed %d messages alongside a scheduling server", len(mails.messages()))
	}

	r = h.do("GET", "/calendar/calendars", nil)
	h.expect(r, http.StatusOK)
	var listing struct{ Scheduling string }
	h.decode(r, &listing)
	if listing.Scheduling != "server" {
		t.Fatalf("calendars say scheduling is %q", listing.Scheduling)
	}
}

// The aliases a server lists as the user's are theirs to answer as.
func TestInvitationToAnAliasTheServerLists(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	front := &davFront{addresses: []string{"ada@example.com", "countess@example.com"}}
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: front.wrap})
	toAlias := strings.Replace(request, "mailto:ada@example.com", "mailto:countess@example.com", 1)
	// Sent to the list the alias is on: only the server can say it is Ada's.
	uid := h.deliver("grace@example.org", "Invitation", toAlias)

	if view := h.invitation(uid); view.Me != "countess@example.com" || view.State != invAnswer {
		t.Fatalf("view %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"}), http.StatusOK)
	sent := mails.messages()
	if len(sent) != 1 {
		t.Fatalf("sent %d", len(sent))
	}
	_, _, header := calendarPart(t, sent[0])
	if from, _ := header.AddressList("From"); len(from) != 1 || from[0].Address != "countess@example.com" {
		t.Fatalf("the reply is from %v", from)
	}
}

// Saved, and not repeated: the calendar holds the answer even when the mail
// to the organizer could not go.
func TestAnswerSavedWhenTheReplyCannotBeSent(t *testing.T) {
	if testing.Short() {
		t.Skip("waits out the submission retries")
	}
	h := newHarness(t)
	uid := h.deliver("grace@example.org", "Invitation", request)
	r := h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"})
	h.expect(r, http.StatusOK)
	var saved Saved
	h.decode(r, &saved)
	if saved.Sent || !saved.SendFailed || statusOf(t, h.onlyCopy(), "ada@example.com") != itip.Accepted {
		t.Fatalf("saved %+v", saved)
	}
}

func TestOutlookInvitationReadInItsOwnZone(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	outlook := `BEGIN:VCALENDAR
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
UID:040000008200E00074C5B7101A82E0080000000001
SUMMARY:Sync
DTSTART;TZID=W. Europe Standard Time:20260916T100000
DTEND;TZID=W. Europe Standard Time:20260916T110000
SEQUENCE:0
DTSTAMP:20260914T101500Z
END:VEVENT
END:VCALENDAR
`
	uid := h.deliver("grace@example.org", "Sync", outlook)
	if view := h.invitation(uid); view.Start != "2026-09-16T08:00:00Z" || view.End != "2026-09-16T09:00:00Z" {
		t.Fatalf("read at %s to %s", view.Start, view.End)
	}
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"}), http.StatusOK)
	// Read as the listing reads it. (Not through the listing itself: the
	// time-range filter of go-webdav's test server cannot read the zone.)
	stored := h.dav.get(t, h.copies()[0])
	ev, err := extractEventData(&stored)
	if err != nil || ev.Start != "2026-09-16T08:00:00Z" || ev.End != "2026-09-16T09:00:00Z" {
		t.Fatalf("listed from %s to %s: %v", ev.Start, ev.End, err)
	}
}

func TestAnsweringFromTheCalendar(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	objectPath := testCalendar + "review.ics"
	h.dav.save(objectPath, itip.Stored(parseICS(t, request)))

	ev := h.listed(objectPath)
	r := h.do("POST", "/calendar/events/"+pathParam(objectPath)+"/respond", map[string]string{"status": "declined", "etag": ev.ETag})
	h.expect(r, http.StatusOK)
	if statusOf(t, h.dav.get(t, objectPath).Data, "ada@example.com") != itip.Declined || len(mails.messages()) != 1 {
		t.Fatal("the answer was not saved and sent")
	}

	// An event of the user's own has nobody to answer.
	own := testCalendar + "own.ics"
	h.dav.save(own, eventCalendar("own", "Lunch"))
	h.expect(h.do("POST", "/calendar/events/"+pathParam(own)+"/respond", map[string]string{"status": "accepted"}), http.StatusConflict)
}

func TestMessageWithoutInvitation(t *testing.T) {
	h := newHarness(t)
	mp := maildir.NewProvider(h.mailDir, testUser)
	if _, _, _, err := mp.AppendMessage("INBOX", rawMail("From: a@example.org\r\nSubject: Hello\r\n\r\nHi\r\n"), provider.MailboxTypeArchive); err != nil {
		t.Fatal(err)
	}
	messages, _, _ := mp.ListMessages("INBOX", "", 0, 10)
	h.expect(h.do("GET", "/calendar/invitation?mailbox=INBOX&uid="+messages[0].ID.String(), nil), http.StatusNotFound)
}

func parseICS(t *testing.T, text string) *ical.Calendar {
	t.Helper()
	cal, err := ical.NewDecoder(strings.NewReader(strings.ReplaceAll(text, "\n", "\r\n"))).Decode()
	if err != nil {
		t.Fatal(err)
	}
	return cal
}

// The organizer the calendar already knows is who may change the copy, not
// whoever a new message names.
func TestUpdateNamingANewOrganizerIsNotTheOrganizers(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	first := h.deliver("grace@example.org", "Invitation", request)
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: first, Status: "accepted"}), http.StatusOK)

	hijack := strings.Replace(strings.Replace(request, "SEQUENCE:0", "SEQUENCE:1", 1),
		"ORGANIZER;CN=Grace Hopper:mailto:grace@example.org", "ORGANIZER:mailto:mallory@example.net", 1)
	uid := h.deliver("mallory@example.net", "Moved", hijack)
	if view := h.invitation(uid); view.State != invUpdate || view.SenderVerified || view.AutoApply {
		t.Fatalf("an update from a new organizer: %+v", view)
	}
}

// An alias the server does not list: the attendee the message was sent to.
func TestInvitationToAnAliasItWasSentTo(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	toAlias := strings.Replace(request, "mailto:ada@example.com", "mailto:countess@example.com", 1)
	uid := h.deliverTo("grace@example.org", "countess@example.com", "Invitation", toAlias)
	if view := h.invitation(uid); view.Me != "countess@example.com" || view.State != invAnswer {
		t.Fatalf("view %+v", view)
	}

	// Sent to someone else, it names none of the user's addresses.
	other := h.deliverTo("grace@example.org", "team@example.com", "Team invitation", strings.Replace(toAlias, "review@example.org", "team@example.org", 1))
	if view := h.invitation(other); view.Me != "" || view.State != invNotInvited {
		t.Fatalf("view %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: other, Status: "accepted"}), http.StatusConflict)
	if len(mails.messages()) != 0 {
		t.Fatal("answered an invitation for someone else")
	}
}

func TestReplyLeftToAServerThatSchedules(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	front := &davFront{autoSchedule: true}
	h := startHarness(t, harnessOptions{smtp: smtpURL, wrap: front.wrap})
	mine := strings.Replace(strings.Replace(request, "ORGANIZER;CN=Grace Hopper:mailto:grace@example.org", "ORGANIZER;CN=Ada:mailto:ada@example.com", 1),
		"ATTENDEE;CN=Grace Hopper;PARTSTAT=ACCEPTED", "ATTENDEE;CN=Grace Hopper;PARTSTAT=NEEDS-ACTION", 1)
	h.dav.save(testCalendar+"review.ics", itip.Stored(parseICS(t, mine)))
	answer := strings.Replace(withMethod(mine, "REPLY"), "PARTSTAT=NEEDS-ACTION", "PARTSTAT=ACCEPTED", 1)
	uid := h.deliver("grace@example.org", "Accepted", answer)

	if view := h.invitation(uid); view.State != invReplied || view.AutoApply {
		t.Fatalf("view %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: uid}), http.StatusConflict)
}

func TestNoReplyWhenTheOrganizerAsksForNone(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	quiet := strings.Replace(request, "ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION;RSVP=TRUE", "ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION;RSVP=FALSE", 1)
	uid := h.deliver("grace@example.org", "Invitation", quiet)
	r := h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"})
	h.expect(r, http.StatusOK)
	var saved Saved
	h.decode(r, &saved)
	if saved.Sent || saved.SendFailed || len(mails.messages()) != 0 || statusOf(t, h.onlyCopy(), "ada@example.com") != itip.Accepted {
		t.Fatalf("saved %+v, mails %d", saved, len(mails.messages()))
	}
}

// Free time, declined invitations, all-day events and the invitation's own
// copy are not clashes.
func TestClashesLeaveOutWhatDoesNotFillTheTime(t *testing.T) {
	h := newHarness(t)
	at := func(uid, summary string, edit func(*ical.Component)) {
		cal := eventCalendar(uid, summary)
		item := itip.Master(cal)
		item.Props.SetDateTime(ical.PropDateTimeStart, time.Date(2026, 9, 16, 8, 15, 0, 0, time.UTC))
		item.Props.SetDateTime(ical.PropDateTimeEnd, time.Date(2026, 9, 16, 8, 45, 0, 0, time.UTC))
		if edit != nil {
			edit(item)
		}
		h.dav.save(testCalendar+uid+".ics", cal)
	}
	at("busy", "Busy", nil)
	at("free", "Free", func(item *ical.Component) { item.Props.SetText(ical.PropTransparency, "TRANSPARENT") })
	at("declined", "Declined", func(item *ical.Component) {
		item.Props.Set(&ical.Prop{Name: ical.PropOrganizer, Value: "mailto:grace@example.org", Params: ical.Params{}})
		item.Props.Add(&ical.Prop{Name: ical.PropAttendee, Value: "mailto:ada@example.com", Params: ical.Params{ical.ParamParticipationStatus: {"DECLINED"}}})
	})
	at("holiday", "Holiday", func(item *ical.Component) {
		item.Props.SetDate(ical.PropDateTimeStart, time.Date(2026, 9, 16, 0, 0, 0, 0, time.UTC))
		item.Props.SetDate(ical.PropDateTimeEnd, time.Date(2026, 9, 17, 0, 0, 0, 0, time.UTC))
	})
	at("review@example.org", "Its own copy", nil)

	uid := h.deliver("grace@example.org", "Invitation", request)
	clashes := h.invitation(uid).Clashes
	if len(clashes) != 1 || clashes[0].Summary != "Busy" || clashes[0].Start != "2026-09-16T08:15:00Z" {
		t.Fatalf("clashes %+v", clashes)
	}
}

func TestListedMeetingSaysWhoAndTheUsersPart(t *testing.T) {
	h := newHarness(t)
	invited := testCalendar + "review.ics"
	h.dav.save(invited, itip.Stored(parseICS(t, request)))
	ev := h.listed(invited)
	if ev.Role != "attendee" || ev.Status != "needs-action" || ev.Organizer == nil || ev.Organizer.Email != "grace@example.org" || len(ev.Attendees) != 2 {
		t.Fatalf("listed %+v", ev)
	}

	organized := testCalendar + "mine.ics"
	mine := strings.Replace(strings.Replace(request, "review@example.org", "mine@example.org", 1), "ORGANIZER;CN=Grace Hopper:mailto:grace@example.org", "ORGANIZER:mailto:ada@example.com", 1)
	h.dav.save(organized, itip.Stored(parseICS(t, mine)))
	if ev := h.listed(organized); ev.Role != "organizer" || ev.Status != "" {
		t.Fatalf("listed %+v", ev)
	}
	// The organizer has nobody to answer.
	h.expect(h.do("POST", "/calendar/events/"+pathParam(organized)+"/respond", map[string]string{"status": "accepted"}), http.StatusConflict)

	own := testCalendar + "own.ics"
	h.dav.save(own, eventCalendar("own", "Lunch"))
	if ev := h.listed(own); ev.Role != "" || ev.Organizer != nil || ev.Attendees != nil {
		t.Fatalf("listed %+v", ev)
	}
}

// Two attendees the message was sent to: which is the user's cannot be told.
func TestInvitationSentToTwoOfItsAttendees(t *testing.T) {
	h := newHarness(t)
	two := strings.Replace(strings.Replace(request, "mailto:ada@example.com", "mailto:team@example.com", 1),
		"ATTENDEE;CN=Grace Hopper;PARTSTAT=ACCEPTED;RSVP=TRUE:mailto:grace@example.org", "ATTENDEE;PARTSTAT=NEEDS-ACTION:mailto:ops@example.com", 1)
	uid := h.deliverTo("grace@example.org", "team@example.com, ops@example.com", "Invitation", two)
	if view := h.invitation(uid); view.Me != "" || view.State != invNotInvited {
		t.Fatalf("view %+v", view)
	}
}

// Answering an update, rather than applying it first, answers the update.
func TestAnsweringAnUpdateWritesIt(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	first := h.deliver("grace@example.org", "Invitation", request)
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: first, Status: "accepted"}), http.StatusOK)
	update := h.deliver("grace@example.org", "Updated", strings.Replace(strings.Replace(request, "SEQUENCE:0", "SEQUENCE:1", 1), "Room 4", "Room 5", 1))

	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: update, Status: "tentative"}), http.StatusOK)
	stored := h.onlyCopy()
	if location, _ := itip.Master(stored).Props.Text(ical.PropLocation); location != "Room 5" || statusOf(t, stored, "ada@example.com") != itip.Tentative {
		t.Fatalf("location %q", location)
	}
}

func TestPublishedEventAdded(t *testing.T) {
	mails, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	published := strings.Replace(withMethod(request, "PUBLISH"), "ATTENDEE;CN=Ada;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:ada@example.com\n", "", 1)
	uid := h.deliver("tickets@example.org", "Your booking", published)

	view := h.invitation(uid)
	if view.State != invAdd || view.AutoApply {
		t.Fatalf("view %+v", view)
	}
	h.expect(h.do("POST", "/calendar/invitation/respond", invitationRequest{Mailbox: "INBOX", UID: uid, Status: "accepted"}), http.StatusConflict)
	r := h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: uid, CalendarPath: testCalendar})
	h.expect(r, http.StatusOK)
	if itip.Method(h.onlyCopy()) != "" || h.invitation(uid).State != invAdded {
		t.Fatal("the published event is not in the calendar")
	}
	h.expect(h.do("POST", "/calendar/invitation/apply", invitationRequest{Mailbox: "INBOX", UID: uid}), http.StatusConflict)
	if len(h.copies()) != 1 || len(mails.messages()) != 0 {
		t.Fatalf("calendar %v, mails %d", h.copies(), len(mails.messages()))
	}
}

func TestAnsweringFromTheCalendarAgainstAnOldVersion(t *testing.T) {
	_, smtpURL := startMailRecorder(t)
	h := startHarness(t, harnessOptions{smtp: smtpURL})
	objectPath := testCalendar + "review.ics"
	h.dav.save(objectPath, itip.Stored(parseICS(t, request)))
	opened := h.listed(objectPath)
	h.dav.save(objectPath, itip.Stored(parseICS(t, strings.Replace(request, "Room 4", "Room 5", 1))))

	h.expect(h.do("POST", "/calendar/events/"+pathParam(objectPath)+"/respond", map[string]string{"status": "accepted", "etag": opened.ETag}), http.StatusPreconditionFailed)
	if statusOf(t, h.dav.get(t, objectPath).Data, "ada@example.com") != itip.NeedsAction {
		t.Fatal("answered a version that was not the one shown")
	}
}
