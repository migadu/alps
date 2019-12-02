package koushin

import (
	"github.com/emersion/go-imap"
	imapclient "github.com/emersion/go-imap/client"
)

func (s *Server) connectIMAP() (*imapclient.Client, error) {
	var c *imapclient.Client
	var err error
	if s.imap.tls {
		c, err = imapclient.DialTLS(s.imap.host, nil)
		if err != nil {
			return nil, err
		}
	} else {
		c, err = imapclient.Dial(s.imap.host)
		if err != nil {
			return nil, err
		}
		if !s.imap.insecure {
			if err := c.StartTLS(nil); err != nil {
				c.Close()
				return nil, err
			}
		}
	}

	return c, err
}

func listMailboxes(conn *imapclient.Client) ([]*imap.MailboxInfo, error) {
	ch := make(chan *imap.MailboxInfo, 10)
	done := make(chan error, 1)
	go func () {
		done <- conn.List("", "*", ch)
	}()

	var mailboxes []*imap.MailboxInfo
	for mbox := range ch {
		mailboxes = append(mailboxes, mbox)
	}

	if err := <-done; err != nil {
		return nil, err
	}

	return mailboxes, nil
}
