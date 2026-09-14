// Package imip sends iTIP messages by email (RFC 6047).
//
// It is how alps schedules when the calendar server does not: a server that
// advertises calendar-auto-schedule (RFC 6638) delivers invitations and
// replies itself, and nothing here is used for it.
package imip

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"strings"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
)

// Message is one scheduling message to one or more recipients.
type Message struct {
	From    *mail.Address
	To      []*mail.Address
	Subject string
	// Text is the plain-text part, for a mail client that cannot read the
	// calendar part.
	Text     string
	Calendar *ical.Calendar
}

// WriteTo writes the message as RFC 6047 §2.4 has it: a text/calendar part
// whose method parameter repeats the calendar's METHOD, as the alternative to
// a readable text part.
func (m *Message) WriteTo(w io.Writer) (int64, error) {
	method := ""
	if prop := m.Calendar.Props.Get(ical.PropMethod); prop != nil {
		method = strings.ToUpper(prop.Value)
	}
	if method == "" {
		return 0, fmt.Errorf("imip: the calendar carries no METHOD")
	}
	var body bytes.Buffer
	if err := ical.NewEncoder(&body).Encode(m.Calendar); err != nil {
		return 0, fmt.Errorf("imip: encoding the calendar: %v", err)
	}

	var h mail.Header
	h.SetDate(time.Now())
	h.SetAddressList("From", []*mail.Address{m.From})
	h.SetAddressList("To", m.To)
	h.SetSubject(m.Subject)
	if err := h.GenerateMessageID(); err != nil {
		return 0, err
	}
	h.SetContentType("multipart/alternative", nil)

	cw := &countingWriter{w: w}
	mw, err := message.CreateWriter(cw, h.Header)
	if err != nil {
		return cw.n, err
	}

	var text message.Header
	text.SetContentType("text/plain", map[string]string{"charset": "utf-8"})
	text.Set("Content-Transfer-Encoding", "quoted-printable")
	if err := writePart(mw, text, []byte(m.Text)); err != nil {
		return cw.n, err
	}

	var cal message.Header
	cal.SetContentType("text/calendar", map[string]string{"charset": "utf-8", "method": method})
	// Base64 carries the calendar's CRLF line ends and folded lines as they
	// are; some readers are strict about both.
	cal.Set("Content-Transfer-Encoding", "base64")
	if err := writePart(mw, cal, body.Bytes()); err != nil {
		return cw.n, err
	}

	if err := mw.Close(); err != nil {
		return cw.n, err
	}
	return cw.n, nil
}

func writePart(mw *message.Writer, h message.Header, body []byte) error {
	pw, err := mw.CreatePart(h)
	if err != nil {
		return err
	}
	if _, err := pw.Write(body); err != nil {
		return err
	}
	return pw.Close()
}

type countingWriter struct {
	w io.Writer
	n int64
}

func (cw *countingWriter) Write(p []byte) (int, error) {
	n, err := cw.w.Write(p)
	cw.n += int64(n)
	return n, err
}

// Send submits the message over c. The envelope sender is the account's own
// address, which the submission server always lets it use; the From header
// names the organizer or attendee the message speaks for.
func Send(c *smtp.Client, envelopeFrom string, m *Message) error {
	if len(m.To) == 0 {
		return nil
	}
	if err := c.Mail(envelopeFrom, nil); err != nil {
		return fmt.Errorf("MAIL FROM failed: %v", err)
	}
	for _, to := range m.To {
		if err := c.Rcpt(to.Address, nil); err != nil {
			return fmt.Errorf("RCPT TO failed: %v (%s)", err, to.Address)
		}
	}
	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("DATA failed: %v", err)
	}
	if _, err := m.WriteTo(w); err != nil {
		w.Close()
		return fmt.Errorf("failed to write the message: %v", err)
	}
	return w.Close()
}

// ContentType reports whether a MIME type is one an iTIP message travels as:
// text/calendar, or the application/ics some senders attach it under.
func ContentType(mediaType string) bool {
	t, _, err := mime.ParseMediaType(mediaType)
	if err != nil {
		t = strings.ToLower(strings.TrimSpace(mediaType))
	}
	return t == "text/calendar" || t == "application/ics"
}
