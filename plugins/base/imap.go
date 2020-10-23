package alpsbase

import (
	"bufio"
	"bytes"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/dustin/go-humanize"
	"github.com/emersion/go-imap"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/textproto"
	imapclient "github.com/emersion/go-imap/client"
	imapspecialuse "github.com/emersion/go-imap-specialuse"
)

type MailboxInfo struct {
	*imap.MailboxInfo

	Active bool
	Unseen int
}

func (mbox *MailboxInfo) URL() *url.URL {
	return &url.URL{
		Path: fmt.Sprintf("/mailbox/%v", url.PathEscape(mbox.Name)),
	}
}

func (mbox *MailboxInfo) HasAttr(flag string) bool {
	for _, attr := range mbox.Attributes {
		if attr == flag {
			return true
		}
	}
	return false
}

func listMailboxes(conn *imapclient.Client) ([]MailboxInfo, error) {
	ch := make(chan *imap.MailboxInfo, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.List("", "*", ch)
	}()

	var mailboxes []MailboxInfo
	for mbox := range ch {
		mailboxes = append(mailboxes, MailboxInfo{mbox, false, -1})
	}

	if err := <-done; err != nil {
		return nil, fmt.Errorf("failed to list mailboxes: %v", err)
	}

	sort.Slice(mailboxes, func(i, j int) bool {
		if mailboxes[i].Name == "INBOX" {
			return true
		}
		if mailboxes[j].Name == "INBOX" {
			return false
		}
		return mailboxes[i].Name < mailboxes[j].Name
	})
	return mailboxes, nil
}

type MailboxStatus struct {
	*imap.MailboxStatus
}

func (mbox *MailboxStatus) URL() *url.URL {
	return &url.URL{
		Path: fmt.Sprintf("/mailbox/%v", url.PathEscape(mbox.Name)),
	}
}

func getMailboxStatus(conn *imapclient.Client, name string) (*MailboxStatus, error) {
	items := []imap.StatusItem{
		imap.StatusMessages,
		imap.StatusUidValidity,
		imap.StatusUnseen,
	}
	status, err := conn.Status(name, items)
	if err != nil {
		return nil, fmt.Errorf("failed to get mailbox status: %v", err)
	}
	return &MailboxStatus{status}, nil
}

type mailboxType int

const (
	mailboxSent mailboxType = iota
	mailboxDrafts
)

func getMailboxByType(conn *imapclient.Client, mboxType mailboxType) (*MailboxInfo, error) {
	ch := make(chan *imap.MailboxInfo, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.List("", "%", ch)
	}()

	// TODO: configurable fallback names?
	var attr string
	var fallbackNames []string
	switch mboxType {
	case mailboxSent:
		attr = imapspecialuse.Sent
		fallbackNames = []string{"Sent"}
	case mailboxDrafts:
		attr = imapspecialuse.Drafts
		fallbackNames = []string{"Draft", "Drafts"}
	}

	var attrMatched bool
	var best *imap.MailboxInfo
	for mbox := range ch {
		for _, a := range mbox.Attributes {
			if attr == a {
				best = mbox
				attrMatched = true
				break
			}
		}
		if attrMatched {
			break
		}

		for _, fallback := range fallbackNames {
			if strings.EqualFold(fallback, mbox.Name) {
				best = mbox
				break
			}
		}
	}

	if err := <-done; err != nil {
		return nil, fmt.Errorf("failed to get mailbox with attribute %q: %v", attr, err)
	}

	if best == nil {
		return nil, nil
	}
	return &MailboxInfo{best, false, -1}, nil
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

	Mailbox string
}

func (msg *IMAPMessage) URL() *url.URL {
	return &url.URL{
		Path: fmt.Sprintf("/message/%v/%v", url.PathEscape(msg.Mailbox), msg.Uid),
	}
}

func newIMAPPartNode(msg *IMAPMessage, path []int, part *imap.BodyStructure) *IMAPPartNode {
	filename, _ := part.Filename()
	return &IMAPPartNode{
		Path:     path,
		MIMEType: strings.ToLower(part.MIMEType + "/" + part.MIMESubType),
		Filename: filename,
		Message:  msg,
		Size:     part.Size,
	}
}

func (msg *IMAPMessage) TextPart() *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	var best *IMAPPartNode
	isTextPlain := false
	msg.BodyStructure.Walk(func(path []int, part *imap.BodyStructure) bool {
		if !strings.EqualFold(part.MIMEType, "text") {
			return true
		}
		if part.Disposition != "" && !strings.EqualFold(part.Disposition, "inline") {
			return true
		}

		switch strings.ToLower(part.MIMESubType) {
		case "plain":
			isTextPlain = true
			best = newIMAPPartNode(msg, path, part)
		case "html":
			if !isTextPlain {
				best = newIMAPPartNode(msg, path, part)
			}
		}
		return true
	})

	return best
}

func (msg *IMAPMessage) HTMLPart() *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	var best *IMAPPartNode
	msg.BodyStructure.Walk(func(path []int, part *imap.BodyStructure) bool {
		if !strings.EqualFold(part.MIMEType, "text") {
			return true
		}
		if part.Disposition != "" && !strings.EqualFold(part.Disposition, "inline") {
			return true
		}

		if part.MIMESubType == "html" {
			best = newIMAPPartNode(msg, path, part)
		}
		return true
	})

	return best
}

func (msg *IMAPMessage) Attachments() []IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	var attachments []IMAPPartNode
	msg.BodyStructure.Walk(func(path []int, part *imap.BodyStructure) bool {
		if !strings.EqualFold(part.Disposition, "attachment") {
			return true
		}

		attachments = append(attachments, *newIMAPPartNode(msg, path, part))
		return true
	})
	return attachments
}

func pathsEqual(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func (msg *IMAPMessage) PartByPath(path []int) *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}
	if len(path) == 0 {
		return newIMAPPartNode(msg, nil, msg.BodyStructure)
	}

	var result *IMAPPartNode
	msg.BodyStructure.Walk(func(p []int, part *imap.BodyStructure) bool {
		if result == nil && pathsEqual(path, p) {
			result = newIMAPPartNode(msg, p, part)
		}
		return result == nil
	})
	return result
}

func (msg *IMAPMessage) PartByID(id string) *IMAPPartNode {
	if msg.BodyStructure == nil || id == "" {
		return nil
	}

	var result *IMAPPartNode
	msg.BodyStructure.Walk(func(path []int, part *imap.BodyStructure) bool {
		if result == nil && part.Id == "<"+id+">" {
			result = newIMAPPartNode(msg, path, part)
		}
		return result == nil
	})
	return result
}

type IMAPPartNode struct {
	Path     []int
	MIMEType string
	Filename string
	Children []IMAPPartNode
	Message  *IMAPMessage
	Size     uint32
}

func (node IMAPPartNode) PathString() string {
	l := make([]string, len(node.Path))
	for i, partNum := range node.Path {
		l[i] = strconv.Itoa(partNum)
	}
	return strings.Join(l, ".")
}

func (node IMAPPartNode) SizeString() string {
	return humanize.IBytes(uint64(node.Size))
}

func (node IMAPPartNode) URL(raw bool) *url.URL {
	u := node.Message.URL()
	if raw {
		u.Path += "/raw"
	}
	q := u.Query()
	q.Set("part", node.PathString())
	u.RawQuery = q.Encode()
	return u
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

func imapPartTree(msg *IMAPMessage, bs *imap.BodyStructure, path []int) *IMAPPartNode {
	if !strings.EqualFold(bs.MIMEType, "multipart") && len(path) == 0 {
		path = []int{1}
	}

	filename, _ := bs.Filename()

	node := &IMAPPartNode{
		Path:     path,
		MIMEType: strings.ToLower(bs.MIMEType + "/" + bs.MIMESubType),
		Filename: filename,
		Children: make([]IMAPPartNode, len(bs.Parts)),
		Message:  msg,
		Size:     bs.Size,
	}

	for i, part := range bs.Parts {
		num := i + 1

		partPath := append([]int(nil), path...)
		partPath = append(partPath, num)

		node.Children[i] = *imapPartTree(msg, part, partPath)
	}

	return node
}

func (msg *IMAPMessage) PartTree() *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	return imapPartTree(msg, msg.BodyStructure, nil)
}

func (msg *IMAPMessage) HasFlag(flag string) bool {
	for _, f := range msg.Flags {
		if imap.CanonicalFlag(f) == flag {
			return true
		}
	}
	return false
}

func listMessages(conn *imapclient.Client, mbox *MailboxStatus, page, messagesPerPage int) ([]IMAPMessage, error) {
	if err := ensureMailboxSelected(conn, mbox.Name); err != nil {
		return nil, err
	}

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

	fetch := []imap.FetchItem{
		imap.FetchFlags,
		imap.FetchEnvelope,
		imap.FetchUid,
		imap.FetchBodyStructure,
	}

	ch := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.Fetch(&seqSet, fetch, ch)
	}()

	msgs := make([]IMAPMessage, 0, to-from)
	for msg := range ch {
		msgs = append(msgs, IMAPMessage{msg, mbox.Name})
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

func searchMessages(conn *imapclient.Client, mboxName, query string, page, messagesPerPage int) (msgs []IMAPMessage, total int, err error) {
	if err := ensureMailboxSelected(conn, mboxName); err != nil {
		return nil, 0, err
	}

	criteria := PrepareSearch(query)
	nums, err := conn.Search(criteria)
	if err != nil {
		return nil, 0, fmt.Errorf("UID SEARCH failed: %v", err)
	}
	total = len(nums)

	from := page * messagesPerPage
	to := from + messagesPerPage
	if from >= len(nums) {
		return nil, total, nil
	}
	if to > len(nums) {
		to = len(nums)
	}
	nums = nums[from:to]

	indexes := make(map[uint32]int)
	for i, num := range nums {
		indexes[num] = i
	}

	var seqSet imap.SeqSet
	seqSet.AddNum(nums...)

	fetch := []imap.FetchItem{
		imap.FetchEnvelope,
		imap.FetchFlags,
		imap.FetchUid,
		imap.FetchBodyStructure,
	}

	ch := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- conn.Fetch(&seqSet, fetch, ch)
	}()

	msgs = make([]IMAPMessage, len(nums))
	for msg := range ch {
		i, ok := indexes[msg.SeqNum]
		if !ok {
			continue
		}
		msgs[i] = IMAPMessage{msg, mboxName}
	}

	if err := <-done; err != nil {
		return nil, 0, fmt.Errorf("failed to fetch message list: %v", err)
	}

	return msgs, total, nil
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
		imap.FetchRFC822Size,
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

	body := msg.GetBody(&partHeaderSection)
	if body == nil {
		return nil, nil, fmt.Errorf("server didn't return message")
	}

	headerReader := bufio.NewReader(body)
	h, err := textproto.ReadHeader(headerReader)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read part header: %v", err)
	}

	part, err := message.New(message.Header{h}, msg.GetBody(&partBodySection))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create message reader: %v", err)
	}

	return &IMAPMessage{msg, mboxName}, part, nil
}

func markMessageAnswered(conn *imapclient.Client, mboxName string, uid uint32) error {
	if err := ensureMailboxSelected(conn, mboxName); err != nil {
		return err
	}

	seqSet := new(imap.SeqSet)
	seqSet.AddNum(uid)
	item := imap.FormatFlagsOp(imap.AddFlags, true)
	flags := []interface{}{imap.AnsweredFlag}
	return conn.UidStore(seqSet, item, flags, nil)
}

func appendMessage(c *imapclient.Client, msg *OutgoingMessage, mboxType mailboxType) (saved bool, err error) {
	mbox, err := getMailboxByType(c, mboxType)
	if err != nil {
		return false, err
	}
	if mbox == nil {
		return false, nil
	}

	// IMAP needs to know in advance the final size of the message, so
	// there's no way around storing it in a buffer here.
	var buf bytes.Buffer
	if err := msg.WriteTo(&buf); err != nil {
		return false, err
	}

	flags := []string{imap.SeenFlag}
	if mboxType == mailboxDrafts {
		flags = append(flags, imap.DraftFlag)
	}
	if err := c.Append(mbox.Name, flags, time.Now(), &buf); err != nil {
		return false, err
	}

	return true, nil
}

func deleteMessage(c *imapclient.Client, mboxName string, uid uint32) error {
	if err := ensureMailboxSelected(c, mboxName); err != nil {
		return err
	}

	seqSet := new(imap.SeqSet)
	seqSet.AddNum(uid)
	item := imap.FormatFlagsOp(imap.AddFlags, true)
	flags := []interface{}{imap.DeletedFlag}
	if err := c.UidStore(seqSet, item, flags, nil); err != nil {
		return err
	}

	return c.Expunge(nil)
}
