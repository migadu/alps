package alpsbase

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"mime"
	"mime/multipart"
	"strings"
	"time"

	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
)

func quote(r io.Reader) (string, error) {
	scanner := bufio.NewScanner(r)
	var builder strings.Builder
	for scanner.Scan() {
		builder.WriteString("> ")
		builder.Write(scanner.Bytes())
		builder.WriteString("\n")
	}
	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("quote: failed to read original message: %s", err)
	}
	builder.WriteString("\n")
	return builder.String(), nil
}

type Attachment interface {
	MIMEType() string
	Filename() string
	Open() (io.ReadCloser, error)
}

type formAttachment struct {
	*multipart.FileHeader
}

func (att *formAttachment) Open() (io.ReadCloser, error) {
	return att.FileHeader.Open()
}

func (att *formAttachment) MIMEType() string {
	// TODO: retain params, e.g. "charset"?
	t, _, _ := mime.ParseMediaType(att.FileHeader.Header.Get("Content-Type"))
	return t
}

func (att *formAttachment) Filename() string {
	return att.FileHeader.Filename
}

type imapAttachment struct {
	Mailbox string
	Uid     uint32
	Node    *IMAPPartNode

	Body []byte
}

func (att *imapAttachment) Open() (io.ReadCloser, error) {
	if att.Body == nil {
		return nil, fmt.Errorf("IMAP attachment has not been pre-fetched")
	}
	return ioutil.NopCloser(bytes.NewReader(att.Body)), nil
}

func (att *imapAttachment) MIMEType() string {
	return att.Node.MIMEType
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
	Text        string
	Attachments []Attachment
}

func (msg *OutgoingMessage) ToString() string {
	return strings.Join(msg.To, ", ")
}

func (msg *OutgoingMessage) CcString() string {
	return strings.Join(msg.Cc, ", ")
}

func (msg *OutgoingMessage) BccString() string {
	return strings.Join(msg.Bcc, ", ")
}

func writeAttachment(mw *mail.Writer, att Attachment) error {
	var h mail.AttachmentHeader
	h.SetContentType(att.MIMEType(), nil)
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

func (msg *OutgoingMessage) WriteTo(w io.Writer) error {
	fromAddr, err := mail.ParseAddress(msg.From)
	if err != nil {
		return err
	}
	from := []*mail.Address{fromAddr}

	to, err := parseAddressList(msg.To)
	if err != nil {
		return err
	}
	cc, err := parseAddressList(msg.Cc)
	if err != nil {
		return err
	}
	bcc, err := parseAddressList(msg.Bcc)
	if err != nil {
		return err
	}
	var h mail.Header
	h.SetDate(time.Now())
	h.SetAddressList("From", from)
	h.SetAddressList("To", to)
	if len(cc) > 0 {
		h.SetAddressList("Cc", cc)
	}
	if len(bcc) > 0 {
		h.SetAddressList("Bcc", bcc)
	}
	if msg.Subject != "" {
		h.SetText("Subject", msg.Subject)
	}
	if msg.InReplyTo != "" {
		h.Set("In-Reply-To", msg.InReplyTo)
	}

	h.Set("Message-Id", msg.MessageID)
	if msg.MessageID == "" {
		panic(fmt.Errorf("Attempting to send message without message ID"))
	}

	mw, err := mail.CreateWriter(w, h)
	if err != nil {
		return fmt.Errorf("failed to create mail writer: %v", err)
	}

	var th mail.InlineHeader
	th.Set("Content-Type", "text/plain; charset=utf-8")

	tw, err := mw.CreateSingleInline(th)
	if err != nil {
		return fmt.Errorf("failed to create text part: %v", err)
	}
	defer tw.Close()

	if _, err := io.WriteString(tw, msg.Text); err != nil {
		return fmt.Errorf("failed to write text part: %v", err)
	}

	if err := tw.Close(); err != nil {
		return fmt.Errorf("failed to close text part: %v", err)
	}

	for _, att := range msg.Attachments {
		if err := writeAttachment(mw, att); err != nil {
			return err
		}
	}

	if err := mw.Close(); err != nil {
		return fmt.Errorf("failed to close mail writer: %v", err)
	}

	return nil
}

func sendMessage(c *smtp.Client, msg *OutgoingMessage) error {
	addr, _ := mail.ParseAddress(msg.From)
	if err := c.Mail(addr.Address, nil); err != nil {
		return fmt.Errorf("MAIL FROM failed: %v", err)
	}

	var rcpts []string
	for _, field := range [][]string{msg.To, msg.Cc, msg.Bcc} {
		rcpts = append(rcpts, field...)
	}

	for _, rcpt := range rcpts {
		addr, _ := mail.ParseAddress(rcpt)
		if err := c.Rcpt(addr.Address); err != nil {
			return fmt.Errorf("RCPT TO failed: %v (%s)", err, addr.Address)
		}
	}

	stripped := *msg
	stripped.Bcc = nil

	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("DATA failed: %v", err)
	}

	if err := stripped.WriteTo(w); err != nil {
		return fmt.Errorf("failed to write outgoing message: %v", err)
	}

	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to close SMTP data writer: %v", err)
	}

	return nil
}
