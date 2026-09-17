package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/emersion/go-sasl"
	"github.com/emersion/go-smtp"
)

// sentMessage is one message the submission server accepted.
type sentMessage struct {
	From       string    `json:"from"`
	Recipients []string  `json:"recipients"`
	Username   string    `json:"username"`
	Data       string    `json:"data"`
	At         time.Time `json:"at"`
}

// outbox records every accepted submission, in order, for tests to inspect.
// Mail to a remote address goes nowhere else, so this is the only proof that
// a reply or a forward left with the right recipients and body.
type outbox struct {
	mu   sync.Mutex
	sent []sentMessage
}

func (o *outbox) add(m sentMessage) {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.sent = append(o.sent, m)
}

// list is never nil: an empty outbox is `[]` to a test, not `null`.
func (o *outbox) list() []sentMessage {
	o.mu.Lock()
	defer o.mu.Unlock()
	return append([]sentMessage{}, o.sent...)
}

func (o *outbox) clear() {
	o.mu.Lock()
	defer o.mu.Unlock()
	o.sent = nil
}

// submission is the SMTP server alps sends through. It authenticates
// against the IMAP server, records what it accepts, and hands mail for a local
// domain to the mail server's own delivery endpoint, so a message sent to your
// own address arrives in the inbox the way it would in production — filters
// included.
type submission struct {
	creds        *credentials
	outbox       *outbox
	localDomains []string
	deliverURL   string
	deliverKey   string
}

func (s *submission) NewSession(*smtp.Conn) (smtp.Session, error) {
	return &submissionSession{srv: s}, nil
}

func (s *submission) isLocal(addr string) bool {
	at := strings.LastIndexByte(addr, '@')
	if at < 0 {
		return false
	}
	domain := strings.ToLower(addr[at+1:])
	for _, d := range s.localDomains {
		if domain == d {
			return true
		}
	}
	return false
}

// deliver posts the message to the mail server for the local recipients.
func (s *submission) deliver(ctx context.Context, recipients []string, data []byte) error {
	body, err := json.Marshal(map[string]any{"recipients": recipients, "message": string(data)})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.deliverURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.deliverKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		msg, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("local delivery: %s: %s", resp.Status, msg)
	}
	return nil
}

// relay accepts the same mail without authentication. It is only ever
// listened on for the IMAP server's outbound queue.
type relay struct {
	*submission
}

func (r *relay) NewSession(*smtp.Conn) (smtp.Session, error) {
	return &submissionSession{srv: r.submission, unauthenticated: true}, nil
}

type submissionSession struct {
	srv             *submission
	unauthenticated bool
	username        string
	from            string
	rcpts           []string
}

func (s *submissionSession) AuthMechanisms() []string {
	return []string{sasl.Plain}
}

func (s *submissionSession) Auth(mech string) (sasl.Server, error) {
	if mech != sasl.Plain {
		return nil, smtp.ErrAuthUnknownMechanism
	}
	return sasl.NewPlainServer(func(identity, username, password string) error {
		if identity != "" && identity != username {
			return smtp.ErrAuthFailed
		}
		if err := s.srv.creds.check(username, password); err != nil {
			return smtp.ErrAuthFailed
		}
		s.username = username
		return nil
	}), nil
}

func (s *submissionSession) Mail(_ context.Context, from string, _ *smtp.MailOptions) error {
	if s.username == "" && !s.unauthenticated {
		return smtp.ErrAuthRequired
	}
	s.from = from
	return nil
}

func (s *submissionSession) Rcpt(_ context.Context, to string, _ *smtp.RcptOptions) error {
	s.rcpts = append(s.rcpts, to)
	return nil
}

func (s *submissionSession) Data(ctx context.Context, r io.Reader) error {
	data, err := io.ReadAll(r)
	if err != nil {
		return err
	}
	s.srv.outbox.add(sentMessage{
		From:       s.from,
		Recipients: append([]string(nil), s.rcpts...),
		Username:   s.username,
		Data:       string(data),
		At:         time.Now().UTC(),
	})

	var local []string
	for _, rcpt := range s.rcpts {
		if s.srv.isLocal(rcpt) {
			local = append(local, rcpt)
		}
	}
	if len(local) == 0 {
		return nil
	}
	if err := s.srv.deliver(ctx, local, data); err != nil {
		return &smtp.SMTPError{Code: 451, EnhancedCode: smtp.EnhancedCode{4, 3, 0}, Message: err.Error()}
	}
	return nil
}

func (s *submissionSession) Reset() {
	s.from = ""
	s.rcpts = nil
}

func (s *submissionSession) Logout() error {
	return nil
}
