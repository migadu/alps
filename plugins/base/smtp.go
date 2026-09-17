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
	"github.com/migadu/alps/provider"
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

	// The part's Content-ID in the message it is carried from, without angle
	// brackets, and whether it was part of that message's body there. An HTML
	// body names such a part by cid:, so it must arrive under the same ID.
	CID    string
	Inline bool
}

func (att *imapAttachment) ContentID() string {
	return att.CID
}

func (att *imapAttachment) IsInline() bool {
	return att.Inline
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
	References  string // the conversation before the message InReplyTo names
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

// contentID is the Content-ID an attachment has to keep, if it has one. The
// ID is read from another message, so one that could not be written back as
// a msg-id — whitespace, brackets, anything outside printable ASCII — is
// dropped rather than let into a header.
func contentID(att Attachment) string {
	c, ok := att.(interface{ ContentID() string })
	if !ok {
		return ""
	}
	id := c.ContentID()
	if id == "" || len(id) > 998 {
		return ""
	}
	for _, r := range id {
		if r <= ' ' || r > '~' || r == '<' || r == '>' {
			return ""
		}
	}
	return id
}

func setContentID(h *message.Header, att Attachment) {
	if id := contentID(att); id != "" {
		h.Set("Content-Id", "<"+id+">")
	}
}

// embedded reports whether att is one of the HTML body's own images rather
// than a file: carried inline, under a Content-ID the body refers to.
func embedded(att Attachment) bool {
	i, ok := att.(interface{ IsInline() bool })
	return ok && i.IsInline() && contentID(att) != ""
}

func writeAttachment(mw *mail.Writer, att Attachment) error {
	var h mail.AttachmentHeader
	t, params := att.MIMEType()
	h.SetContentType(t, params)
	h.SetFilename(att.Filename())
	setContentID(&h.Header, att)

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

// maxReferences bounds the References a reply carries. RFC 5322 lets a long
// chain be shortened; the first ID, the conversation's root, is kept.
const maxReferences = 20

// replyHeaders returns the message a reply answers and its References: the
// conversation before that message, then the message itself. The composer
// sends IDs bare, as the envelope gives them, and they are written back with
// their angle brackets; without them a server cannot read In-Reply-To at all,
// and the reply is lost to threading, here and in the recipient's client.
func replyHeaders(inReplyTo, references string) (string, []string) {
	parents := provider.MessageIDs(inReplyTo)
	if len(parents) == 0 {
		return "", nil
	}
	parent := parents[0]
	var refs []string
	for _, id := range provider.MessageIDs(references) {
		if id != parent {
			refs = append(refs, id)
		}
	}
	refs = append(refs, parent)
	if len(refs) > maxReferences {
		refs = append(refs[:1], refs[len(refs)-maxReferences+1:]...)
	}
	return parent, refs
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
	if parent, refs := replyHeaders(msg.InReplyTo, msg.References); parent != "" {
		h.SetMsgIDList("In-Reply-To", []string{parent})
		h.SetMsgIDList("References", refs)
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

	var images, files []Attachment
	for _, att := range msg.Attachments {
		if hasHTML && embedded(att) {
			images = append(images, att)
		} else {
			files = append(files, att)
		}
	}
	if len(images) > 0 {
		if err := msg.writeRelated(cw, h, images, files); err != nil {
			return cw.n, err
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

	for _, att := range files {
		if err := writeAttachment(mw, att); err != nil {
			return cw.n, err
		}
	}

	if err := mw.Close(); err != nil {
		return cw.n, fmt.Errorf("failed to close mail writer: %v", err)
	}

	return cw.n, nil
}

// writeRelated writes an HTML message whose body shows images of its own:
//
//	multipart/mixed              (only when there are files as well)
//	  multipart/related
//	    multipart/alternative    text, then HTML
//	    image …                  inline, under the Content-ID the HTML names
//	  file …
//
// The images sit beside the HTML that refers to them, where a client looks a
// cid: reference up, and are not offered as files the sender attached.
func (msg *OutgoingMessage) writeRelated(w io.Writer, h mail.Header, images, files []Attachment) error {
	var relatedHeader message.Header
	relatedHeader.SetContentType("multipart/related", map[string]string{"type": "multipart/alternative"})

	var root, related *message.Writer
	var err error
	if len(files) == 0 {
		h.SetContentType("multipart/related", map[string]string{"type": "multipart/alternative"})
		if root, err = message.CreateWriter(w, h.Header); err != nil {
			return fmt.Errorf("failed to create mail writer: %v", err)
		}
		related = root
	} else {
		h.SetContentType("multipart/mixed", nil)
		if root, err = message.CreateWriter(w, h.Header); err != nil {
			return fmt.Errorf("failed to create mail writer: %v", err)
		}
		if related, err = root.CreatePart(relatedHeader); err != nil {
			return fmt.Errorf("failed to create related part: %v", err)
		}
	}

	var altHeader message.Header
	altHeader.SetContentType("multipart/alternative", nil)
	alt, err := related.CreatePart(altHeader)
	if err != nil {
		return fmt.Errorf("failed to create alternative part: %v", err)
	}
	if err := writeTextPart(alt, "text/plain", msg.Text); err != nil {
		return err
	}
	if err := writeTextPart(alt, "text/html", msg.HTML); err != nil {
		return err
	}
	if err := alt.Close(); err != nil {
		return fmt.Errorf("failed to close alternative part: %v", err)
	}

	for _, att := range images {
		if err := writeBinaryPart(related, att, "inline"); err != nil {
			return err
		}
	}
	if related != root {
		if err := related.Close(); err != nil {
			return fmt.Errorf("failed to close related part: %v", err)
		}
	}

	for _, att := range files {
		if err := writeBinaryPart(root, att, "attachment"); err != nil {
			return err
		}
	}
	if err := root.Close(); err != nil {
		return fmt.Errorf("failed to close mail writer: %v", err)
	}
	return nil
}

func writeTextPart(parent *message.Writer, mediaType, body string) error {
	var h message.Header
	h.SetContentType(mediaType, map[string]string{"charset": "utf-8"})
	h.Set("Content-Disposition", "inline")
	h.Set("Content-Transfer-Encoding", "quoted-printable")
	pw, err := parent.CreatePart(h)
	if err != nil {
		return fmt.Errorf("failed to create %s part: %v", mediaType, err)
	}
	if _, err := io.WriteString(pw, body); err != nil {
		return fmt.Errorf("failed to write %s part: %v", mediaType, err)
	}
	if err := pw.Close(); err != nil {
		return fmt.Errorf("failed to close %s part: %v", mediaType, err)
	}
	return nil
}

func writeBinaryPart(parent *message.Writer, att Attachment, disposition string) error {
	var h message.Header
	t, params := att.MIMEType()
	h.SetContentType(t, params)
	h.SetContentDisposition(disposition, map[string]string{"filename": att.Filename()})
	h.Set("Content-Transfer-Encoding", "base64")
	setContentID(&h, att)

	pw, err := parent.CreatePart(h)
	if err != nil {
		return fmt.Errorf("failed to create attachment: %v", err)
	}
	f, err := att.Open()
	if err != nil {
		return fmt.Errorf("failed to open attachment: %v", err)
	}
	defer f.Close()
	if _, err := io.Copy(pw, f); err != nil {
		return fmt.Errorf("failed to write attachment: %v", err)
	}
	if err := pw.Close(); err != nil {
		return fmt.Errorf("failed to close attachment: %v", err)
	}
	return nil
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
