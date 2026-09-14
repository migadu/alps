package imip

import (
	"bytes"
	"io"
	"strings"
	"testing"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-message/mail"
)

func calendar(method string) *ical.Calendar {
	event := ical.NewEvent()
	event.Props.SetText(ical.PropUID, "standup@example.org")
	event.Props.SetText(ical.PropSummary, "Café standup")
	event.Props.SetText(ical.PropDescription, strings.Repeat("A long agenda line. ", 20))
	event.Props.SetText(ical.PropDateTimeStamp, "20260914T100000Z")
	cal := ical.NewCalendar()
	cal.Props.SetText(ical.PropProductID, "-//test//EN")
	cal.Props.SetText(ical.PropVersion, "2.0")
	if method != "" {
		cal.Props.SetText(ical.PropMethod, method)
	}
	cal.Children = append(cal.Children, event.Component)
	return cal
}

func TestMessageCarriesTheCalendarAsRFC6047Has(t *testing.T) {
	m := &Message{
		From:     &mail.Address{Name: "Ada Lovelace", Address: "ada@example.com"},
		To:       []*mail.Address{{Address: "grace@example.org"}},
		Subject:  "Accepted: Café standup",
		Text:     "Ada Lovelace has accepted.",
		Calendar: calendar("REPLY"),
	}
	var buf bytes.Buffer
	if _, err := m.WriteTo(&buf); err != nil {
		t.Fatal(err)
	}

	r, err := mail.CreateReader(&buf)
	if err != nil {
		t.Fatal(err)
	}
	if subject, _ := r.Header.Subject(); subject != "Accepted: Café standup" {
		t.Fatalf("subject %q", subject)
	}
	if id, _ := r.Header.MessageID(); id == "" {
		t.Fatal("no Message-Id")
	}
	var calendarPart []byte
	var method string
	for {
		p, err := r.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatal(err)
		}
		ct, params, _ := p.Header.(*mail.InlineHeader).ContentType()
		if ct == "text/calendar" {
			method = params["method"]
			calendarPart, _ = io.ReadAll(p.Body)
		}
	}
	if method != "REPLY" {
		t.Fatalf("method parameter %q", method)
	}
	got, err := ical.NewDecoder(bytes.NewReader(calendarPart)).Decode()
	if err != nil {
		t.Fatalf("the calendar part does not decode: %v\n%s", err, calendarPart)
	}
	if summary, _ := got.Children[0].Props.Text(ical.PropSummary); summary != "Café standup" {
		t.Fatalf("summary %q", summary)
	}
}

func TestMessageRefusesACalendarWithoutMethod(t *testing.T) {
	m := &Message{From: &mail.Address{Address: "ada@example.com"}, Calendar: calendar("")}
	if _, err := m.WriteTo(io.Discard); err == nil {
		t.Fatal("wrote a scheduling message with no method")
	}
}

func TestContentType(t *testing.T) {
	for mediaType, want := range map[string]bool{
		"text/calendar; method=REQUEST; charset=UTF-8": true,
		"TEXT/CALENDAR":   true,
		"application/ics": true,
		"text/plain":      false,
	} {
		if got := ContentType(mediaType); got != want {
			t.Errorf("ContentType(%q) = %v", mediaType, got)
		}
	}
}
