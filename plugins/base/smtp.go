package alpsbase

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"strings"
	"time"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
)

type Attachment interface {
	MIMEType() (string, map[string]string)
	Filename() string
	Open() (io.ReadCloser, error)
}

type formAttachment struct {
	*multipart.FileHeader
}

func (att *formAttachment) Open() (io.ReadCloser, error) {
	return att.FileHeader.Open()
}

func (att *formAttachment) MIMEType() (string, map[string]string) {
	t, params, _ := mime.ParseMediaType(att.FileHeader.Header.Get("Content-Type"))
	return t, params
}

func (att *formAttachment) Filename() string {
	return att.FileHeader.Filename
}

type imapAttachment struct {
	Mailbox string
	Uid     string
	Node    *IMAPPartNode

	Body []byte
}

func (att *imapAttachment) Open() (io.ReadCloser, error) {
	if att.Body == nil {
		return nil, fmt.Errorf("IMAP attachment has not been pre-fetched")
	}
	return io.NopCloser(bytes.NewReader(att.Body)), nil
}

func (att *imapAttachment) MIMEType() (string, map[string]string) {
	return att.Node.MIMEType, att.Node.Params
}

func (att *imapAttachment) Filename() string {
	return att.Node.Filename
}

type OutgoingMessage struct {
	From        string
	To          []string
	Cc          []string
	Bcc         []string
	Subject     string
	MessageID   string
	InReplyTo   string
	ReplyTo     string
	Text        string
	HTML        string
	Attachments []Attachment
}

// countingWriter wraps an io.Writer and counts bytes written
type countingWriter struct {
	w io.Writer
	n int64
}

func (cw *countingWriter) Write(p []byte) (n int, err error) {
	n, err = cw.w.Write(p)
	cw.n += int64(n)
	return
}

func (msg *OutgoingMessage) ToString() string {
	return strings.Join(msg.To, ", ")
}

func writeAttachment(mw *mail.Writer, att Attachment) error {
	var h mail.AttachmentHeader
	t, params := att.MIMEType()
	h.SetContentType(t, params)
	h.SetFilename(att.Filename())

	aw, err := mw.CreateAttachment(h)
	if err != nil {
		return fmt.Errorf("failed to create attachment: %v", err)
	}
	defer aw.Close()

	f, err := att.Open()
	if err != nil {
		return fmt.Errorf("failed to open attachment: %v", err)
	}
	defer f.Close()

	if _, err := io.Copy(aw, f); err != nil {
		return fmt.Errorf("failed to write attachment: %v", err)
	}

	if err := f.Close(); err != nil {
		return fmt.Errorf("failed to close attachment: %v", err)
	}
	if err := aw.Close(); err != nil {
		return fmt.Errorf("failed to close attachment writer: %v", err)
	}

	return nil
}

func prepareAddressList(addresses []string) ([]*mail.Address, error) {
	l := make([]*mail.Address, len(addresses))
	for i, rcpt := range addresses {
		addr, err := mail.ParseAddress(rcpt)
		if err != nil {
			return nil, err
		}
		l[i] = addr
	}

	return l, nil
}

func (msg *OutgoingMessage) WriteTo(w io.Writer) (int64, error) {
	fromAddr, err := mail.ParseAddress(msg.From)
	if err != nil {
		return 0, err
	}
	from := []*mail.Address{fromAddr}

	to, err := prepareAddressList(msg.To)
	if err != nil {
		return 0, err
	}

	cc, err := prepareAddressList(msg.Cc)
	if err != nil {
		return 0, err
	}

	var h mail.Header
	h.SetDate(time.Now())
	h.SetAddressList("From", from)
	h.SetAddressList("To", to)
	h.SetAddressList("Cc", cc)
	if msg.Subject != "" {
		h.SetText("Subject", msg.Subject)
	}
	if msg.InReplyTo != "" {
		h.Set("In-Reply-To", msg.InReplyTo)
	}
	if msg.ReplyTo != "" {
		h.Set("Reply-To", msg.ReplyTo)
	}

	h.Set("Message-Id", msg.MessageID)
	if msg.MessageID == "" {
		panic(fmt.Errorf("attempting to send message without message ID"))
	}

	// Use a counting writer to track bytes written
	cw := &countingWriter{w: w}

	hasHTML := msg.HTML != ""

	if len(msg.Attachments) == 0 && !hasHTML {
		h.Set("Content-Type", "text/plain; charset=utf-8")
		mw, err := message.CreateWriter(cw, h.Header)
		if err != nil {
			return cw.n, fmt.Errorf("failed to create mail writer: %v", err)
		}

		if _, err := io.WriteString(mw, msg.Text); err != nil {
			return cw.n, fmt.Errorf("failed to write text part: %v", err)
		}

		if err := mw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close mail writer: %v", err)
		}

		return cw.n, nil
	}

	if len(msg.Attachments) == 0 && hasHTML {
		h.Set("Content-Type", "multipart/alternative")
		mw, err := message.CreateWriter(cw, h.Header)
		if err != nil {
			return cw.n, fmt.Errorf("failed to create mail writer: %v", err)
		}

		var textHeader message.Header
		textHeader.Set("Content-Type", "text/plain; charset=utf-8")
		textHeader.Set("Content-Disposition", "inline")
		tw, err := mw.CreatePart(textHeader)
		if err != nil {
			return cw.n, fmt.Errorf("failed to create text part: %v", err)
		}
		if _, err := io.WriteString(tw, msg.Text); err != nil {
			return cw.n, fmt.Errorf("failed to write text part: %v", err)
		}
		if err := tw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close text part: %v", err)
		}

		var htmlHeader message.Header
		htmlHeader.Set("Content-Type", "text/html; charset=utf-8")
		htmlHeader.Set("Content-Disposition", "inline")
		hw, err := mw.CreatePart(htmlHeader)
		if err != nil {
			return cw.n, fmt.Errorf("failed to create html part: %v", err)
		}
		if _, err := io.WriteString(hw, msg.HTML); err != nil {
			return cw.n, fmt.Errorf("failed to write html part: %v", err)
		}
		if err := hw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close html part: %v", err)
		}

		if err := mw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close mail writer: %v", err)
		}

		return cw.n, nil
	}

	mw, err := mail.CreateWriter(cw, h)
	if err != nil {
		return cw.n, fmt.Errorf("failed to create mail writer: %v", err)
	}

	if hasHTML {
		iw, err := mw.CreateInline()
		if err != nil {
			return cw.n, fmt.Errorf("failed to create inline writer: %v", err)
		}

		var textHeader mail.InlineHeader
		textHeader.Set("Content-Type", "text/plain; charset=utf-8")
		tw, err := iw.CreatePart(textHeader)
		if err != nil {
			return cw.n, fmt.Errorf("failed to create text part: %v", err)
		}
		if _, err := io.WriteString(tw, msg.Text); err != nil {
			return cw.n, fmt.Errorf("failed to write text part: %v", err)
		}
		if err := tw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close text part: %v", err)
		}

		var htmlHeader mail.InlineHeader
		htmlHeader.Set("Content-Type", "text/html; charset=utf-8")
		hw, err := iw.CreatePart(htmlHeader)
		if err != nil {
			return cw.n, fmt.Errorf("failed to create html part: %v", err)
		}
		if _, err := io.WriteString(hw, msg.HTML); err != nil {
			return cw.n, fmt.Errorf("failed to write html part: %v", err)
		}
		if err := hw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close html part: %v", err)
		}

		if err := iw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close inline writer: %v", err)
		}
	} else {
		var th mail.InlineHeader
		th.Set("Content-Type", "text/plain; charset=utf-8")

		tw, err := mw.CreateSingleInline(th)
		if err != nil {
			return cw.n, fmt.Errorf("failed to create text part: %v", err)
		}

		if _, err := io.WriteString(tw, msg.Text); err != nil {
			return cw.n, fmt.Errorf("failed to write text part: %v", err)
		}

		if err := tw.Close(); err != nil {
			return cw.n, fmt.Errorf("failed to close text part: %v", err)
		}
	}

	for _, att := range msg.Attachments {
		if err := writeAttachment(mw, att); err != nil {
			return cw.n, err
		}
	}

	if err := mw.Close(); err != nil {
		return cw.n, fmt.Errorf("failed to close mail writer: %v", err)
	}

	return cw.n, nil
}

func sendMessage(c *smtp.Client, msg *OutgoingMessage) error {
	addr, err := mail.ParseAddress(msg.From)
	if err != nil {
		return fmt.Errorf("parsing 'From' address failed: %v", err)
	}

	if err := c.Mail(addr.Address, nil); err != nil {
		return fmt.Errorf("MAIL FROM failed: %v", err)
	}

	for _, to := range append(msg.To, append(msg.Bcc, msg.Cc...)...) {
		addr, err := mail.ParseAddress(to)
		if err != nil {
			return fmt.Errorf("parsing address %q failed: %v", to, err)
		}

		if err := c.Rcpt(addr.Address, nil); err != nil {
			return fmt.Errorf("RCPT TO failed: %v (%s)", err, addr.Address)
		}
	}

	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("DATA failed: %v", err)
	}
	defer w.Close()

	if _, err := msg.WriteTo(w); err != nil {
		return fmt.Errorf("failed to write outgoing message: %v", err)
	}

	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to close SMTP data writer: %v", err)
	}

	return nil
}
