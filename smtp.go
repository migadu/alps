package koushin

import (
	"bufio"
	"fmt"
	"io"
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
	return builder.String(), nil
}

func (s *Server) connectSMTP() (*smtp.Client, error) {
	var c *smtp.Client
	var err error
	if s.smtp.tls {
		c, err = smtp.DialTLS(s.smtp.host, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTPS server: %v", err)
		}
	} else {
		c, err = smtp.Dial(s.smtp.host)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %v", err)
		}
		if !s.smtp.insecure {
			if err := c.StartTLS(nil); err != nil {
				c.Close()
				return nil, fmt.Errorf("STARTTLS failed: %v", err)
			}
		}
	}

	return c, err
}

type OutgoingMessage struct {
	From      string
	To        []string
	Subject   string
	InReplyTo string
	Text      string
}

func (msg *OutgoingMessage) ToString() string {
	return strings.Join(msg.To, ", ")
}

func (msg *OutgoingMessage) WriteTo(w io.Writer) error {
	from := []*mail.Address{{"", msg.From}}

	to := make([]*mail.Address, len(msg.To))
	for i, addr := range msg.To {
		to[i] = &mail.Address{"", addr}
	}

	var h mail.Header
	h.SetDate(time.Now())
	h.SetAddressList("From", from)
	h.SetAddressList("To", to)
	if msg.Subject != "" {
		h.SetText("Subject", msg.Subject)
	}
	if msg.InReplyTo != "" {
		h.Set("In-Reply-To", msg.InReplyTo)
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

	if err := mw.Close(); err != nil {
		return fmt.Errorf("failed to close mail writer: %v", err)
	}

	return nil
}

func sendMessage(c *smtp.Client, msg *OutgoingMessage) error {
	if err := c.Mail(msg.From, nil); err != nil {
		return fmt.Errorf("MAIL FROM failed: %v", err)
	}

	for _, to := range msg.To {
		if err := c.Rcpt(to); err != nil {
			return fmt.Errorf("RCPT TO failed: %v", err)
		}
	}

	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("DATA failed: %v", err)
	}
	defer w.Close()

	if err := msg.WriteTo(w); err != nil {
		return fmt.Errorf("failed to write outgoing message: %v", err)
	}

	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to close SMTP data writer: %v", err)
	}

	return nil
}
