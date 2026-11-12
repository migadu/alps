package alps

import (
	"crypto/tls"
	"fmt"
	"net"
	"os"
	"time"

	"github.com/emersion/go-smtp"
	"github.com/migadu/alps/provider"
)

func (s *Server) dialSMTP(username string) (*smtp.Client, error) {
	host, useTLS, insecure := s.smtp.host, s.smtp.tls, s.smtp.insecure

	// A provider that routes the mail store per domain may route submission
	// the same way. An empty answer means it has no opinion for this login,
	// and the globally configured server stands.
	if raw := s.ServiceURLFor(provider.ServiceSMTP, username); raw != "" {
		{
			h, t, i, err := parseSMTPURL(raw, s.Options.SMTP.Insecure)
			if err != nil {
				return nil, fmt.Errorf("provider named an unusable SMTP server for %q: %v", username, err)
			}
			host, useTLS, insecure = h, t, i
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

	// A failure to connect is wrapped, so that DoSMTP can tell a connection
	// that failed, which it tries again, from a refusal or a certificate it
	// cannot trust, which it does not.
	var c *smtp.Client
	var err error
	if useTLS {
		c, err = smtp.DialTLS(host, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTPS server: %w", err)
		}
	} else if !insecure {
		conn, dialErr := net.DialTimeout("tcp", host, timeout)
		if dialErr != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %w", dialErr)
		}
		serverName, _, splitErr := net.SplitHostPort(host)
		if splitErr != nil {
			conn.Close()
			return nil, splitErr
		}
		// NewClientStartTLS reads the greeting and negotiates STARTTLS before
		// callers can set CommandTimeout. Bound that exchange at the connection.
		expired := make(chan struct{})
		timer := time.AfterFunc(timeout, func() { conn.Close(); close(expired) })
		c, err = smtp.NewClientStartTLS(conn, &tls.Config{ServerName: serverName})
		if !timer.Stop() {
			<-expired
			if c != nil {
				c.Close()
			}
			return nil, fmt.Errorf("SMTP STARTTLS setup timed out: %w", os.ErrDeadlineExceeded)
		}
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
		}
	} else {
		c, err = smtp.Dial(host)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
		}
	}

	// Set timeouts on the client
	c.CommandTimeout = timeout
	c.SubmissionTimeout = timeout

	return c, err
}
