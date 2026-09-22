package alps

import (
	"fmt"
	"time"

	"github.com/emersion/go-smtp"
	"github.com/migadu/alps/provider"
)

func (s *Server) dialSMTP(username string) (*smtp.Client, error) {
	host, tls, insecure := s.smtp.host, s.smtp.tls, s.smtp.insecure

	// A provider that routes the mail store per domain may route submission
	// the same way. An empty answer means it has no opinion for this login,
	// and the globally configured server stands.
	if raw := s.ServiceURLFor(provider.ServiceSMTP, username); raw != "" {
		{
			h, t, i, err := parseSMTPURL(raw, s.Options.SMTP.Insecure)
			if err != nil {
				return nil, fmt.Errorf("provider named an unusable SMTP server for %q: %v", username, err)
			}
			host, tls, insecure = h, t, i
		}
	}

	if host == "" {
		return nil, fmt.Errorf("SMTP is disabled")
	}

	// Configure timeout for SMTP operations
	timeout := s.Options.SMTPTimeout
	if timeout == 0 {
		timeout = 30 * time.Second // Default to 30s
	}

	var c *smtp.Client
	var err error
	if tls {
		c, err = smtp.DialTLS(host, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTPS server: %v", err)
		}
	} else if !insecure {
		c, err = smtp.DialStartTLS(host, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %v", err)
		}
	} else {
		c, err = smtp.Dial(host)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %v", err)
		}
	}

	// Set timeouts on the client
	c.CommandTimeout = timeout
	c.SubmissionTimeout = timeout

	return c, err
}
