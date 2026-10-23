package imip

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
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

// deliveries is a go-smtp backend that counts the messages it receives
// whole.
type deliveries struct {
	mu sync.Mutex
	n  int
}

func (d *deliveries) NewSession(*smtp.Conn) (smtp.Session, error) { return d, nil }
func (d *deliveries) Mail(context.Context, string, *smtp.MailOptions) error {
	return nil
}
func (d *deliveries) Rcpt(context.Context, string, *smtp.RcptOptions) error {
	return nil
}
func (d *deliveries) Reset()        {}
func (d *deliveries) Logout() error { return nil }

// Data counts a message only once it has arrived whole: one that ends before
// the final "." is not delivered.
func (d *deliveries) Data(_ context.Context, r io.Reader) error {
	if _, err := io.ReadAll(r); err != nil {
		return err
	}
	d.mu.Lock()
	defer d.mu.Unlock()
	d.n++
	return nil
}

func dialDeliveries(t *testing.T) (*smtp.Client, *deliveries) {
	t.Helper()
	d := &deliveries{}
	srv := smtp.NewServer(d)
	srv.Domain = "localhost"
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })
	c, err := smtp.Dial(ln.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { c.Close() })
	return c, d
}

// A message that cannot be written is not sent. Its DATA used to be ended
// all the same, and the server delivered an empty message to every guest.
func TestSendDeliversNothingItCouldNotWrite(t *testing.T) {
	c, d := dialDeliveries(t)
	m := &Message{
		From:     &mail.Address{Address: "ada@example.com"},
		To:       []*mail.Address{{Address: "grace@example.org"}},
		Calendar: calendar(""),
	}
	if err := Send(c, "ada@example.com", m); err == nil {
		t.Fatal("Send reported a message it could not write as sent")
	}
	d.mu.Lock()
	defer d.mu.Unlock()
	if d.n != 0 {
		t.Errorf("the server accepted %d messages", d.n)
	}
}

// answering takes a message whole, and then answers it as the test chooses:
// with reply, or, when reply is nil, by dropping the connection.
type answering struct {
	deliveries
	reply error
}

func (a *answering) NewSession(c *smtp.Conn) (smtp.Session, error) {
	return &answeringSession{a, c}, nil
}

type answeringSession struct {
	*answering
	conn *smtp.Conn
}

func (s *answeringSession) Data(ctx context.Context, r io.Reader) error {
	if err := s.deliveries.Data(ctx, r); err != nil {
		return err
	}
	if s.reply == nil {
		s.conn.Conn().Close()
	}
	return s.reply
}

// The session's DoSMTP sends again what fails on a temporary refusal or a
// failed connection. A refusal of the message is one; a connection that
// fails once the message is in is not, as the server may have taken it, and
// the guests would have it twice.
func TestSendOffersForAnotherTryOnlyWhatTheServerRefused(t *testing.T) {
	for name, tc := range map[string]struct {
		reply      error
		mayBeTried bool
	}{
		"refused for now":          {&smtp.SMTPError{Code: 451, EnhancedCode: smtp.EnhancedCode{4, 3, 0}, Message: "try again"}, true},
		"refused for good":         {&smtp.SMTPError{Code: 554, EnhancedCode: smtp.EnhancedCode{5, 6, 0}, Message: "no"}, false},
		"no answer to the message": {nil, false},
	} {
		t.Run(name, func(t *testing.T) {
			a := &answering{reply: tc.reply}
			srv := smtp.NewServer(a)
			srv.Domain = "localhost"
			ln, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			go srv.Serve(ln)
			t.Cleanup(func() { srv.Close() })
			c, err := smtp.Dial(ln.Addr().String())
			if err != nil {
				t.Fatal(err)
			}
			t.Cleanup(func() { c.Close() })

			m := &Message{
				From:     &mail.Address{Address: "ada@example.com"},
				To:       []*mail.Address{{Address: "grace@example.org"}},
				Calendar: calendar("REQUEST"),
			}
			err = Send(c, "ada@example.com", m)
			if err == nil {
				t.Fatal("Send reported the message as taken")
			}
			var smtpErr *smtp.SMTPError
			var netErr net.Error
			tried := errors.As(err, &smtpErr) && smtpErr.Temporary() ||
				errors.As(err, &netErr) || errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF)
			if tried != tc.mayBeTried {
				t.Errorf("%v: offered for another try %v, want %v", err, tried, tc.mayBeTried)
			}
		})
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
