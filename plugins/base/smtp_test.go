package alpsbase

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
)

type memAttachment struct {
	name, mimeType string
	body           []byte
}

func (a memAttachment) MIMEType() (string, map[string]string) { return a.mimeType, nil }
func (a memAttachment) Filename() string                      { return a.name }
func (a memAttachment) Open() (io.ReadCloser, error) {
	return io.NopCloser(bytes.NewReader(a.body)), nil
}

func outgoing() *OutgoingMessage {
	return &OutgoingMessage{
		From:      "Ada Lovelace <ada@example.com>",
		To:        []string{"Charles Babbage <charles@example.com>"},
		Cc:        []string{"mary@example.com"},
		Bcc:       []string{"hidden@example.com"},
		Subject:   "Notes on the Engine",
		MessageID: "<1@example.com>",
		Text:      "text body",
	}
}

type renderedPart struct {
	contentType string
	filename    string
	body        string
}

// render writes msg and reads it back as a mail client would.
func render(t *testing.T, msg *OutgoingMessage) (mail.Header, []renderedPart, string) {
	t.Helper()
	var buf bytes.Buffer
	n, err := msg.WriteTo(&buf)
	if err != nil {
		t.Fatal(err)
	}
	if n != int64(buf.Len()) {
		t.Errorf("WriteTo reported %d bytes and wrote %d", n, buf.Len())
	}
	r, err := mail.CreateReader(bytes.NewReader(buf.Bytes()))
	if err != nil {
		t.Fatal(err)
	}
	var parts []renderedPart
	for {
		p, err := r.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			t.Fatal(err)
		}
		body, _ := io.ReadAll(p.Body)
		part := renderedPart{body: string(body)}
		switch h := p.Header.(type) {
		case *mail.InlineHeader:
			part.contentType, _, _ = h.ContentType()
		case *mail.AttachmentHeader:
			part.contentType, _, _ = h.ContentType()
			part.filename, _ = h.Filename()
		}
		parts = append(parts, part)
	}
	return r.Header, parts, buf.String()
}

func headerSection(raw string) string {
	if i := strings.Index(raw, "\r\n\r\n"); i >= 0 {
		return raw[:i+2]
	}
	return raw
}

func TestOutgoingMessage_Headers(t *testing.T) {
	h, _, raw := render(t, outgoing())

	from, _ := h.AddressList("From")
	to, _ := h.AddressList("To")
	cc, _ := h.AddressList("Cc")
	if len(from) != 1 || from[0].Address != "ada@example.com" || from[0].Name != "Ada Lovelace" {
		t.Errorf("From = %v", from)
	}
	if len(to) != 1 || to[0].Address != "charles@example.com" || len(cc) != 1 || cc[0].Address != "mary@example.com" {
		t.Errorf("To = %v, Cc = %v", to, cc)
	}
	if subject, _ := h.Subject(); subject != "Notes on the Engine" {
		t.Errorf("Subject = %q", subject)
	}
	if id := h.Get("Message-Id"); id != "<1@example.com>" {
		t.Errorf("Message-Id = %q", id)
	}
	if _, err := h.Date(); err != nil {
		t.Errorf("Date: %v", err)
	}
	// Bcc recipients are delivered to but never named in the message itself.
	if h.Get("Bcc") != "" || strings.Contains(raw, "hidden@example.com") {
		t.Error("the Bcc recipient is visible in the message")
	}
	if h.Get("Reply-To") != "" || h.Get("In-Reply-To") != "" {
		t.Error("Reply-To or In-Reply-To set without being asked for")
	}
}

func TestOutgoingMessage_ReplyHeaders(t *testing.T) {
	msg := outgoing()
	msg.ReplyTo = "team@example.com"
	msg.InReplyTo = "<original@example.com>"
	h, _, _ := render(t, msg)
	if h.Get("Reply-To") != "team@example.com" || h.Get("In-Reply-To") != "<original@example.com>" {
		t.Errorf("Reply-To = %q, In-Reply-To = %q", h.Get("Reply-To"), h.Get("In-Reply-To"))
	}
	if refs := h.Get("References"); refs != "<original@example.com>" {
		t.Errorf("References = %q, want the message replied to", refs)
	}
}

// The composer sends the IDs it has, and the envelope gives them without angle
// brackets. Written bare, In-Reply-To is not a msg-id: a server parsing it
// keeps nothing, and the reply belongs to no conversation, in threading here
// and in the recipient's client alike.
func TestOutgoingMessage_ReplyHeadersFromBareIDs(t *testing.T) {
	msg := outgoing()
	msg.InReplyTo = "parent@example.com"
	msg.References = "root@example.com middle@example.com parent@example.com"
	h, _, _ := render(t, msg)
	if got, err := h.MsgIDList("In-Reply-To"); err != nil || len(got) != 1 || got[0] != "parent@example.com" {
		t.Errorf("In-Reply-To = %q, parsed as %q, %v", h.Get("In-Reply-To"), got, err)
	}
	got, err := h.MsgIDList("References")
	want := []string{"root@example.com", "middle@example.com", "parent@example.com"}
	if err != nil || strings.Join(got, " ") != strings.Join(want, " ") {
		t.Errorf("References = %q, parsed as %q, %v; want %q", h.Get("References"), got, err, want)
	}
}

func TestOutgoingMessage_LongReferencesKeepTheRoot(t *testing.T) {
	var chain []string
	for i := 0; i < 30; i++ {
		chain = append(chain, fmt.Sprintf("<m%d@example.com>", i))
	}
	msg := outgoing()
	msg.InReplyTo = "<m29@example.com>"
	msg.References = strings.Join(chain, " ")
	h, _, _ := render(t, msg)
	got, _ := h.MsgIDList("References")
	if len(got) != maxReferences || got[0] != "m0@example.com" || got[len(got)-1] != "m29@example.com" || got[1] != "m11@example.com" {
		t.Errorf("References = %q", got)
	}
}

func TestOutgoingMessage_EncodesNonASCIIHeaders(t *testing.T) {
	msg := outgoing()
	msg.Subject = "Über die Maschine — 🚂"
	msg.From = "Adá Lóvelace <ada@example.com>"
	h, _, raw := render(t, msg)
	if subject, _ := h.Subject(); subject != msg.Subject {
		t.Errorf("Subject came back as %q", subject)
	}
	if from, _ := h.AddressList("From"); len(from) != 1 || from[0].Name != "Adá Lóvelace" {
		t.Errorf("From came back as %v", from)
	}
	for i, b := range []byte(headerSection(raw)) {
		if b > 0x7e {
			t.Fatalf("raw byte 0x%x at %d in the header section", b, i)
		}
	}
}

func TestOutgoingMessage_HeaderValuesCannotAddHeaders(t *testing.T) {
	cases := map[string]func(*OutgoingMessage){
		"subject":          func(m *OutgoingMessage) { m.Subject = "hello\r\nBcc: victim@example.net" },
		"reply-to":         func(m *OutgoingMessage) { m.ReplyTo = "team@example.com\r\nBcc: victim@example.net" },
		"in-reply-to":      func(m *OutgoingMessage) { m.InReplyTo = "<a@example.com>\r\nBcc: victim@example.net" },
		"bare in-reply-to": func(m *OutgoingMessage) { m.InReplyTo = "a@example.com\r\nBcc: victim@example.net" },
		"references": func(m *OutgoingMessage) {
			m.InReplyTo = "a@example.com"
			m.References = "<r@example.com\r\nBcc: victim@example.net>"
		},
	}
	for name, mutate := range cases {
		msg := outgoing()
		msg.Bcc = nil
		mutate(msg)
		var buf bytes.Buffer
		if _, err := msg.WriteTo(&buf); err != nil {
			continue // refusing the message is an acceptable answer
		}
		for _, line := range strings.Split(headerSection(buf.String()), "\r\n") {
			if strings.HasPrefix(strings.ToLower(line), "bcc:") {
				t.Errorf("%s: a header value started a new header: %q", name, line)
			}
		}
	}
}

func TestOutgoingMessage_Bodies(t *testing.T) {
	t.Run("text only", func(t *testing.T) {
		h, parts, _ := render(t, outgoing())
		if ct, _, _ := h.ContentType(); ct != "text/plain" {
			t.Errorf("Content-Type = %q", ct)
		}
		if len(parts) != 1 || !strings.Contains(parts[0].body, "text body") {
			t.Errorf("parts = %+v", parts)
		}
	})

	t.Run("text and HTML", func(t *testing.T) {
		msg := outgoing()
		msg.HTML = "<p>html body</p>"
		h, parts, _ := render(t, msg)
		if ct, _, _ := h.ContentType(); ct != "multipart/alternative" {
			t.Errorf("Content-Type = %q", ct)
		}
		if len(parts) != 2 || parts[0].contentType != "text/plain" || parts[1].contentType != "text/html" || !strings.Contains(parts[1].body, "html body") {
			t.Errorf("parts = %+v", parts)
		}
	})

	t.Run("with attachments", func(t *testing.T) {
		for _, html := range []string{"", "<p>html body</p>"} {
			msg := outgoing()
			msg.HTML = html
			msg.Attachments = []Attachment{memAttachment{name: "Report Ü.pdf", mimeType: "application/pdf", body: []byte("%PDF-1.7 data")}}
			h, parts, _ := render(t, msg)
			if ct, _, _ := h.ContentType(); ct != "multipart/mixed" {
				t.Errorf("html=%v: Content-Type = %q", html != "", ct)
			}
			last := parts[len(parts)-1]
			if last.filename != "Report Ü.pdf" || last.contentType != "application/pdf" || last.body != "%PDF-1.7 data" {
				t.Errorf("html=%v: attachment = %+v", html != "", last)
			}
			wantParts := 2
			if html != "" {
				wantParts = 3
			}
			if len(parts) != wantParts {
				t.Errorf("html=%v: %d parts, want %d", html != "", len(parts), wantParts)
			}
		}
	})
}

func TestOutgoingMessage_RefusesAnUnparseableAddress(t *testing.T) {
	for name, mutate := range map[string]func(*OutgoingMessage){
		"from": func(m *OutgoingMessage) { m.From = "not an address" },
		"to":   func(m *OutgoingMessage) { m.To = []string{"charles@"} },
		"cc":   func(m *OutgoingMessage) { m.Cc = []string{"<<>>"} },
	} {
		msg := outgoing()
		mutate(msg)
		if _, err := msg.WriteTo(io.Discard); err == nil {
			t.Errorf("%s: an unparseable address was written", name)
		}
	}
}

// smtpRecorder is a go-smtp backend that keeps what it was given.
type smtpRecorder struct {
	mu   sync.Mutex
	from string
	rcpt []string
	data string
}

func (b *smtpRecorder) NewSession(*smtp.Conn) (smtp.Session, error) { return &smtpSession{b: b}, nil }

type smtpSession struct{ b *smtpRecorder }

func (s *smtpSession) Mail(_ context.Context, from string, _ *smtp.MailOptions) error {
	s.b.mu.Lock()
	defer s.b.mu.Unlock()
	s.b.from = from
	return nil
}

func (s *smtpSession) Rcpt(_ context.Context, to string, _ *smtp.RcptOptions) error {
	s.b.mu.Lock()
	defer s.b.mu.Unlock()
	if strings.HasPrefix(to, "refused@") {
		return &smtp.SMTPError{Code: 550, EnhancedCode: smtp.EnhancedCode{5, 1, 1}, Message: "no such user"}
	}
	s.b.rcpt = append(s.b.rcpt, to)
	return nil
}

func (s *smtpSession) Data(_ context.Context, r io.Reader) error {
	data, err := io.ReadAll(r)
	s.b.mu.Lock()
	defer s.b.mu.Unlock()
	s.b.data = string(data)
	return err
}

func (s *smtpSession) Reset()        {}
func (s *smtpSession) Logout() error { return nil }

// Any credentials will do: the session under test authenticates as its user.
func (s *smtpSession) AuthMechanisms() []string { return []string{sasl.Plain} }
func (s *smtpSession) Auth(string) (sasl.Server, error) {
	return sasl.NewPlainServer(func(string, string, string) error { return nil }), nil
}

// listenRecorder serves a recorder and returns the address to configure.
func listenRecorder(t *testing.T) (string, *smtpRecorder) {
	t.Helper()
	rec := &smtpRecorder{}
	srv := smtp.NewServer(rec)
	srv.Domain = "localhost"
	srv.AllowInsecureAuth = true
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })
	return "smtp+insecure://" + ln.Addr().String(), rec
}

func dialRecorder(t *testing.T) (*smtp.Client, *smtpRecorder) {
	t.Helper()
	addr, rec := listenRecorder(t)
	c, err := smtp.Dial(strings.TrimPrefix(addr, "smtp+insecure://"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { c.Close() })
	return c, rec
}

func TestSendMessage_DeliversToEveryRecipientAndNamesOnlyTheVisibleOnes(t *testing.T) {
	c, rec := dialRecorder(t)
	if err := sendMessage(c, outgoing()); err != nil {
		t.Fatal(err)
	}
	if err := c.Quit(); err != nil {
		t.Fatal(err)
	}
	rec.mu.Lock()
	defer rec.mu.Unlock()
	if rec.from != "ada@example.com" {
		t.Errorf("MAIL FROM %q", rec.from)
	}
	want := []string{"charles@example.com", "hidden@example.com", "mary@example.com"}
	if strings.Join(rec.rcpt, ",") != strings.Join(want, ",") {
		t.Errorf("RCPT TO %v, want %v", rec.rcpt, want)
	}
	if !strings.Contains(rec.data, "Notes on the Engine") || strings.Contains(rec.data, "hidden@example.com") {
		t.Errorf("DATA = %q", rec.data)
	}
}

func TestSendMessage_ReportsTheRefusedRecipient(t *testing.T) {
	c, _ := dialRecorder(t)
	msg := outgoing()
	msg.Cc = []string{"refused@example.com"}
	err := sendMessage(c, msg)
	var smtpErr *smtp.SMTPError
	if err == nil || !strings.Contains(err.Error(), "refused@example.com") || !errors.As(err, &smtpErr) && !strings.Contains(err.Error(), "550") {
		t.Errorf("got %v, want the server's refusal naming the address", err)
	}
}

// structure describes a written message as a tree of media types, each leaf
// with its disposition and Content-ID: enough to see where a part landed.
func structure(t *testing.T, raw string) string {
	t.Helper()
	e, err := message.Read(strings.NewReader(raw))
	if err != nil {
		t.Fatal(err)
	}
	var walk func(*message.Entity) string
	walk = func(e *message.Entity) string {
		mediaType, _, _ := e.Header.ContentType()
		if mr := e.MultipartReader(); mr != nil {
			var children []string
			for {
				p, err := mr.NextPart()
				if err == io.EOF {
					break
				}
				if err != nil {
					t.Fatal(err)
				}
				children = append(children, walk(p))
			}
			return mediaType + "[" + strings.Join(children, " ") + "]"
		}
		disp, _, _ := e.Header.ContentDisposition()
		leaf := mediaType
		if disp != "" {
			leaf += ";" + disp
		}
		if id := e.Header.Get("Content-Id"); id != "" {
			leaf += id
		}
		return leaf
	}
	return walk(e)
}

func chartImage(cid string) *imapAttachment {
	return &imapAttachment{
		Node:   &IMAPPartNode{MIMEType: "image/png", Filename: "chart.png"},
		Body:   []byte("\x89PNG\r\n"),
		CID:    cid,
		Inline: true,
	}
}

// The body's images travel beside the HTML that names them, under the same
// Content-ID, so the recipient's client can resolve every cid: reference.
func TestOutgoingMessage_InlineImagesTravelWithTheHTML(t *testing.T) {
	pdf := memAttachment{name: "report.pdf", mimeType: "application/pdf", body: []byte("%PDF")}

	for name, tc := range map[string]struct {
		html        string
		attachments []Attachment
		want        string
	}{
		"images only": {
			html:        `<img src="cid:chart@remote.test">`,
			attachments: []Attachment{chartImage("chart@remote.test")},
			want:        "multipart/related[multipart/alternative[text/plain;inline text/html;inline] image/png;inline<chart@remote.test>]",
		},
		"images and a file": {
			html:        `<img src="cid:chart@remote.test">`,
			attachments: []Attachment{pdf, chartImage("chart@remote.test")},
			want:        "multipart/mixed[multipart/related[multipart/alternative[text/plain;inline text/html;inline] image/png;inline<chart@remote.test>] application/pdf;attachment]",
		},
		// Without HTML nothing refers to the image, so it goes as a file, and
		// keeps its ID.
		"no HTML": {
			attachments: []Attachment{chartImage("chart@remote.test")},
			want:        "multipart/mixed[text/plain;inline image/png;attachment<chart@remote.test>]",
		},
		// An ID that could not be written back as one is not written at all.
		"an ID that is not one": {
			html:        `<p>hi</p>`,
			attachments: []Attachment{chartImage("chart>\r\nBcc: victim@example.com")},
			want:        "multipart/mixed[multipart/alternative[text/plain;inline text/html;inline] image/png;attachment]",
		},
	} {
		t.Run(name, func(t *testing.T) {
			msg := outgoing()
			msg.HTML = tc.html
			msg.Attachments = tc.attachments
			var buf bytes.Buffer
			if _, err := msg.WriteTo(&buf); err != nil {
				t.Fatal(err)
			}
			if got := structure(t, buf.String()); got != tc.want {
				t.Errorf("structure\n got %s\nwant %s", got, tc.want)
			}
			if strings.Contains(headerSection(buf.String()), "victim") {
				t.Error("a part's ID reached the message header")
			}
		})
	}
}

// What the parts hold survives the new layout: the text, the HTML, and the
// image's bytes.
func TestOutgoingMessage_RelatedPartsKeepTheirContent(t *testing.T) {
	msg := outgoing()
	msg.HTML = `<p>see <img src="cid:chart@remote.test"></p>`
	msg.Attachments = []Attachment{chartImage("chart@remote.test")}
	h, parts, _ := render(t, msg)
	if ct, params, _ := h.ContentType(); ct != "multipart/related" || params["type"] != "multipart/alternative" {
		t.Errorf("Content-Type = %q %v", ct, params)
	}
	var bodies []string
	for _, p := range parts {
		bodies = append(bodies, p.body)
	}
	joined := strings.Join(bodies, "|")
	for _, want := range []string{"text body", `cid:chart@remote.test`, "\x89PNG\r\n"} {
		if !strings.Contains(joined, want) {
			t.Errorf("no part holds %q: %q", want, joined)
		}
	}
}
