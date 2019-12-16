package koushin

import (
	"fmt"

	"github.com/emersion/go-imap"
	imapclient "github.com/emersion/go-imap/client"
	"github.com/emersion/go-message/charset"
)

func init() {
	imap.CharsetReader = charset.Reader
}

func (s *Server) dialIMAP() (*imapclient.Client, error) {
	var c *imapclient.Client
	var err error
	if s.imap.tls {
		c, err = imapclient.DialTLS(s.imap.host, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to IMAPS server: %v", err)
		}
	} else {
		c, err = imapclient.Dial(s.imap.host)
		if err != nil {
			return nil, fmt.Errorf("failed to connect to IMAP server: %v", err)
		}
		if !s.imap.insecure {
			if err := c.StartTLS(nil); err != nil {
				c.Close()
				return nil, fmt.Errorf("STARTTLS failed: %v", err)
			}
		}
	}

	return c, err
}
