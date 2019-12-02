package koushin

import (
	"sort"

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

	sort.Slice(mailboxes, func(i, j int) bool {
		return mailboxes[i].Name < mailboxes[j].Name
	})
	return mailboxes, nil
}

func listMessages(conn *imapclient.Client, mboxName string) ([]*imap.Message, error) {
	mbox := conn.Mailbox()
	if mbox == nil || mbox.Name != mboxName {
		var err error
		mbox, err = conn.Select(mboxName, false)
		if err != nil {
			return nil, err
		}
	}

	n := uint32(10)
	from := uint32(1)
	to := mbox.Messages
	if mbox.Messages > n {
		from = mbox.Messages - n
	}
	seqSet := new(imap.SeqSet)
	seqSet.AddRange(from, to)

	ch := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.Fetch(seqSet, []imap.FetchItem{imap.FetchEnvelope}, ch)
	}()

	msgs := make([]*imap.Message, 0, n)
	for msg := range ch {
		msgs = append(msgs, msg)
	}

	if err := <-done; err != nil {
		return nil, err
	}

	// Reverse list of messages
	for i := len(msgs)/2-1; i >= 0; i-- {
		opp := len(msgs)-1-i
		msgs[i], msgs[opp] = msgs[opp], msgs[i]
	}

	return msgs, nil
}
