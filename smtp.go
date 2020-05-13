package alps

import (
	"fmt"

	"github.com/emersion/go-smtp"
)

func (s *Server) dialSMTP() (*smtp.Client, error) {
	if s.smtp.host == "" {
		return nil, fmt.Errorf("SMTP is disabled")
	}

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
