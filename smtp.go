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
	return s.dialSMTPWithTimeout(username, s.Options.SMTPTimeout)
}

func (s *Server) dialSMTPWithTimeout(username string, timeout time.Duration) (*smtp.Client, error) {
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
	if timeout == 0 {
		timeout = 30 * time.Second // Default to 30s
	}

	// A failure to connect is wrapped, so that DoSMTP can tell a connection
	// that failed, which it tries again, from a refusal or a certificate it
	// cannot trust, which it does not.
	dialTimeout := timeout
	if dialTimeout < 0 {
		dialTimeout = 0
	}

	var c *smtp.Client
	var err error
	if useTLS {
		serverName, _, splitErr := net.SplitHostPort(host)
		if splitErr != nil {
			return nil, splitErr
		}
		// Include both the TCP connection and TLS handshake in the configured
		// timeout, rather than the SMTP package's fixed dialer timeout.
		conn, dialErr := tls.DialWithDialer(&net.Dialer{Timeout: dialTimeout}, "tcp", host, &tls.Config{ServerName: serverName})
		err = dialErr
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTPS server: %w", err)
		}
		c = smtp.NewClient(conn)
	} else if !insecure {
		conn, dialErr := net.DialTimeout("tcp", host, dialTimeout)
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
		var timer *time.Timer
		if timeout > 0 {
			timer = time.AfterFunc(timeout, func() { conn.Close(); close(expired) })
		}
		c, err = smtp.NewClientStartTLS(conn, &tls.Config{ServerName: serverName})
		if timer != nil && !timer.Stop() {
			<-expired
			if c != nil {
				c.Close()
			}
			return nil, fmt.Errorf("SMTP STARTTLS setup timed out: %w", os.ErrDeadlineExceeded)
		}
		if err != nil {
			conn.Close()
			return nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
		}
	} else {
		conn, dialErr := net.DialTimeout("tcp", host, dialTimeout)
		err = dialErr
		if err != nil {
			return nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
		}
		c = smtp.NewClient(conn)
	}

	// NewClient reads the greeting lazily. Apply the timeout before Hello or
	// Auth can read it, for plain connections as well as implicit TLS.
	if timeout > 0 {
		c.CommandTimeout = timeout
		c.SubmissionTimeout = timeout
	}

	return c, err
}

// smtpMessageSizeLimit makes a short, cached capability probe. It authenticates
// no credentials: SIZE is advertised by EHLO, after STARTTLS where configured.
func (s *Server) smtpMessageSizeLimit(username string) (int64, error) {
	timeout := time.Second
	if s.Options.SMTPTimeout > 0 && s.Options.SMTPTimeout < timeout {
		timeout = s.Options.SMTPTimeout
	}
	client, err := s.dialSMTPWithTimeout(username, timeout)
	if err != nil {
		return 0, err
	}
	defer client.Close()
	if err := client.Hello("localhost"); err != nil {
		return 0, err
	}
	defer client.Quit()
	size, ok := client.MaxMessageSize()
	if !ok || size <= 0 {
		return 0, nil
	}
	return int64(size), nil
}
