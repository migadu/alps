package koushinbase

import (
	"bufio"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/emersion/go-imap"
	imapclient "github.com/emersion/go-imap/client"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/textproto"
)

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
		return nil, fmt.Errorf("failed to list mailboxes: %v", err)
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
			return fmt.Errorf("failed to select mailbox: %v", err)
		}
	}
	return nil
}

type IMAPMessage struct {
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

func (msg *IMAPMessage) TextPartName() string {
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
	Filename string
	Children []IMAPPartNode
}

func (node IMAPPartNode) PathString() string {
	l := make([]string, len(node.Path))
	for i, partNum := range node.Path {
		l[i] = strconv.Itoa(partNum)
	}

	return strings.Join(l, ".")
}

func (node IMAPPartNode) IsText() bool {
	return strings.HasPrefix(strings.ToLower(node.MIMEType), "text/")
}

func (node IMAPPartNode) String() string {
	if node.Filename != "" {
		return fmt.Sprintf("%s (%s)", node.Filename, node.MIMEType)
	} else {
		return node.MIMEType
	}
}

func imapPartTree(bs *imap.BodyStructure, path []int) *IMAPPartNode {
	if !strings.EqualFold(bs.MIMEType, "multipart") && len(path) == 0 {
		path = []int{1}
	}

	filename, _ := bs.Filename()

	node := &IMAPPartNode{
		Path:     path,
		MIMEType: strings.ToLower(bs.MIMEType + "/" + bs.MIMESubType),
		Filename: filename,
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

func (msg *IMAPMessage) PartTree() *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	return imapPartTree(msg.BodyStructure, nil)
}

func (msg *IMAPMessage) HasFlag(flag string) bool {
	for _, f := range msg.Flags {
		if imap.CanonicalFlag(f) == flag {
			return true
		}
	}
	return false
}

func listMessages(conn *imapclient.Client, mboxName string, page int) ([]IMAPMessage, error) {
	if err := ensureMailboxSelected(conn, mboxName); err != nil {
		return nil, err
	}

	mbox := conn.Mailbox()
	to := int(mbox.Messages) - page*messagesPerPage
	from := to - messagesPerPage + 1
	if from <= 0 {
		from = 1
	}
	if to <= 0 {
		return nil, nil
	}

	var seqSet imap.SeqSet
	seqSet.AddRange(uint32(from), uint32(to))

	fetch := []imap.FetchItem{imap.FetchEnvelope, imap.FetchUid, imap.FetchBodyStructure}

	ch := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.Fetch(&seqSet, fetch, ch)
	}()

	msgs := make([]IMAPMessage, 0, to-from)
	for msg := range ch {
		msgs = append(msgs, IMAPMessage{msg})
	}

	if err := <-done; err != nil {
		return nil, fmt.Errorf("failed to fetch message list: %v", err)
	}

	// Reverse list of messages
	for i := len(msgs)/2 - 1; i >= 0; i-- {
		opp := len(msgs) - 1 - i
		msgs[i], msgs[opp] = msgs[opp], msgs[i]
	}

	return msgs, nil
}

func searchMessages(conn *imapclient.Client, mboxName, query string) ([]IMAPMessage, error) {
	if err := ensureMailboxSelected(conn, mboxName); err != nil {
		return nil, err
	}

	criteria := imap.SearchCriteria{Text: []string{query}}
	nums, err := conn.Search(&criteria)
	if err != nil {
		return nil, fmt.Errorf("UID SEARCH failed: %v", err)
	}
	if len(nums) == 0 {
		return nil, nil
	}

	indexes := make(map[uint32]int)
	for i, num := range nums {
		indexes[num] = i
	}

	// TODO: paging
	var seqSet imap.SeqSet
	seqSet.AddNum(nums...)

	fetch := []imap.FetchItem{imap.FetchEnvelope, imap.FetchUid, imap.FetchBodyStructure}

	ch := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.Fetch(&seqSet, fetch, ch)
	}()

	msgs := make([]IMAPMessage, len(nums))
	for msg := range ch {
		i, ok := indexes[msg.SeqNum]
		if !ok {
			continue
		}
		msgs[i] = IMAPMessage{msg}
	}

	if err := <-done; err != nil {
		return nil, fmt.Errorf("failed to fetch message list: %v", err)
	}

	return msgs, nil
}

func getMessagePart(conn *imapclient.Client, mboxName string, uid uint32, partPath []int) (*IMAPMessage, *message.Entity, error) {
	if err := ensureMailboxSelected(conn, mboxName); err != nil {
		return nil, nil, err
	}

	seqSet := new(imap.SeqSet)
	seqSet.AddNum(uid)

	var partHeaderSection imap.BodySectionName
	partHeaderSection.Peek = true
	if len(partPath) > 0 {
		partHeaderSection.Specifier = imap.MIMESpecifier
	} else {
		partHeaderSection.Specifier = imap.HeaderSpecifier
	}
	partHeaderSection.Path = partPath

	var partBodySection imap.BodySectionName
	partBodySection.Peek = true
	if len(partPath) > 0 {
		partBodySection.Specifier = imap.EntireSpecifier
	} else {
		partBodySection.Specifier = imap.TextSpecifier
	}
	partBodySection.Path = partPath

	fetch := []imap.FetchItem{
		imap.FetchEnvelope,
		imap.FetchUid,
		imap.FetchBodyStructure,
		imap.FetchFlags,
		partHeaderSection.FetchItem(),
		partBodySection.FetchItem(),
	}

	ch := make(chan *imap.Message, 1)
	if err := conn.UidFetch(seqSet, fetch, ch); err != nil {
		return nil, nil, fmt.Errorf("failed to fetch message: %v", err)
	}

	msg := <-ch
	if msg == nil {
		return nil, nil, fmt.Errorf("server didn't return message")
	}

	headerReader := bufio.NewReader(msg.GetBody(&partHeaderSection))
	h, err := textproto.ReadHeader(headerReader)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read part header: %v", err)
	}

	part, err := message.New(message.Header{h}, msg.GetBody(&partBodySection))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create message reader: %v", err)
	}

	return &IMAPMessage{msg}, part, nil
}
