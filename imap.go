package koushin

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"sort"
	"strconv"
	"strings"

	"github.com/emersion/go-imap"
	imapclient "github.com/emersion/go-imap/client"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/textproto"
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
	go func() {
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

func ensureMailboxSelected(conn *imapclient.Client, mboxName string) error {
	mbox := conn.Mailbox()
	if mbox == nil || mbox.Name != mboxName {
		if _, err := conn.Select(mboxName, false); err != nil {
			return err
		}
	}
	return nil
}

type imapMessage struct {
	*imap.Message
}

func textPartPath(bs *imap.BodyStructure) ([]int, bool) {
	if bs.Disposition != "" && !strings.EqualFold(bs.Disposition, "inline") {
		return nil, false
	}

	if strings.EqualFold(bs.MIMEType, "text") {
		return []int{1}, true
	}

	if !strings.EqualFold(bs.MIMEType, "multipart") {
		return nil, false
	}

	textPartNum := -1
	for i, part := range bs.Parts {
		num := i + 1

		if strings.EqualFold(part.MIMEType, "multipart") {
			if subpath, ok := textPartPath(part); ok {
				return append([]int{num}, subpath...), true
			}
		}
		if !strings.EqualFold(part.MIMEType, "text") {
			continue
		}

		var pick bool
		switch strings.ToLower(part.MIMESubType) {
		case "plain":
			pick = true
		case "html":
			pick = textPartNum < 0
		}

		if pick {
			textPartNum = num
		}
	}

	if textPartNum > 0 {
		return []int{textPartNum}, true
	}
	return nil, false
}

func (msg *imapMessage) TextPartName() string {
	if msg.BodyStructure == nil {
		return ""
	}

	path, ok := textPartPath(msg.BodyStructure)
	if !ok {
		return ""
	}

	l := make([]string, len(path))
	for i, partNum := range path {
		l[i] = strconv.Itoa(partNum)
	}

	return strings.Join(l, ".")
}

type IMAPPartNode struct {
	Path     []int
	MIMEType string
	Children []IMAPPartNode
}

func (node *IMAPPartNode) PathString() string {
	l := make([]string, len(node.Path))
	for i, partNum := range node.Path {
		l[i] = strconv.Itoa(partNum)
	}

	return strings.Join(l, ".")
}

func imapPartTree(bs *imap.BodyStructure, path []int) *IMAPPartNode {
	if !strings.EqualFold(bs.MIMEType, "multipart") && len(path) == 0 {
		path = []int{1}
	}

	node := &IMAPPartNode{
		Path:     path,
		MIMEType: strings.ToLower(bs.MIMEType + "/" + bs.MIMESubType),
		Children: make([]IMAPPartNode, len(bs.Parts)),
	}

	for i, part := range bs.Parts {
		num := i + 1

		partPath := append([]int(nil), path...)
		partPath = append(partPath, num)

		node.Children[i] = *imapPartTree(part, partPath)
	}

	return node
}

func (msg *imapMessage) PartTree() *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	return imapPartTree(msg.BodyStructure, nil)
}

func listMessages(conn *imapclient.Client, mboxName string) ([]imapMessage, error) {
	if err := ensureMailboxSelected(conn, mboxName); err != nil {
		return nil, err
	}

	n := uint32(10)

	mbox := conn.Mailbox()
	from := uint32(1)
	to := mbox.Messages
	if mbox.Messages > n {
		from = mbox.Messages - n
	}
	seqSet := new(imap.SeqSet)
	seqSet.AddRange(from, to)

	fetch := []imap.FetchItem{imap.FetchEnvelope, imap.FetchUid, imap.FetchBodyStructure}

	ch := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.Fetch(seqSet, fetch, ch)
	}()

	msgs := make([]imapMessage, 0, n)
	for msg := range ch {
		msgs = append(msgs, imapMessage{msg})
	}

	if err := <-done; err != nil {
		return nil, err
	}

	// Reverse list of messages
	for i := len(msgs)/2 - 1; i >= 0; i-- {
		opp := len(msgs) - 1 - i
		msgs[i], msgs[opp] = msgs[opp], msgs[i]
	}

	return msgs, nil
}

func getMessage(conn *imapclient.Client, mboxName string, uid uint32, partPath []int) (*imapMessage, string, error) {
	if err := ensureMailboxSelected(conn, mboxName); err != nil {
		return nil, "", err
	}

	seqSet := new(imap.SeqSet)
	seqSet.AddNum(uid)

	var textHeaderSection imap.BodySectionName
	textHeaderSection.Peek = true
	textHeaderSection.Specifier = imap.HeaderSpecifier
	textHeaderSection.Path = partPath

	var textBodySection imap.BodySectionName
	textBodySection.Peek = true
	textBodySection.Path = partPath

	fetch := []imap.FetchItem{
		imap.FetchEnvelope,
		imap.FetchUid,
		imap.FetchBodyStructure,
		textHeaderSection.FetchItem(),
		textBodySection.FetchItem(),
	}

	ch := make(chan *imap.Message, 1)
	if err := conn.UidFetch(seqSet, fetch, ch); err != nil {
		return nil, "", err
	}

	msg := <-ch
	if msg == nil {
		return nil, "", fmt.Errorf("server didn't return message")
	}

	headerReader := bufio.NewReader(msg.GetBody(&textHeaderSection))
	h, err := textproto.ReadHeader(headerReader)
	if err != nil {
		return nil, "", err
	}

	text, err := message.New(message.Header{h}, msg.GetBody(&textBodySection))
	if err != nil {
		return nil, "", err
	}

	b, err := ioutil.ReadAll(text.Body)
	if err != nil {
		return nil, "", err
	}

	return &imapMessage{msg}, string(b), nil
}
