package maildir

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"sort"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-maildir"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/migadu/alps/provider"
	imapprovider "github.com/migadu/alps/provider/imap"
)

func buildBodyStructure(e *message.Entity) imap.BodyStructure {
	mediaType, params, _ := e.Header.ContentType()
	if mediaType == "" {
		mediaType = "text/plain"
	}

	disp, dispParams, _ := e.Header.ContentDisposition()

	var disposition *imap.BodyStructureDisposition
	if disp != "" {
		disposition = &imap.BodyStructureDisposition{
			Value:  disp,
			Params: dispParams,
		}
	}

	if strings.HasPrefix(mediaType, "multipart/") {
		subtype := strings.TrimPrefix(mediaType, "multipart/")
		var children []imap.BodyStructure
		mr := e.MultipartReader()
		if mr != nil {
			for {
				p, err := mr.NextPart()
				if err != nil {
					break
				}
				children = append(children, buildBodyStructure(p))
			}
		}

		return &imap.BodyStructureMultiPart{
			Children: children,
			Subtype:  subtype,
			Extended: &imap.BodyStructureMultiPartExt{
				Params:      params,
				Disposition: disposition,
			},
		}
	}

	parts := strings.SplitN(mediaType, "/", 2)
	typ := "text"
	subtype := "plain"
	if len(parts) == 2 {
		typ = parts[0]
		subtype = parts[1]
	}

	return &imap.BodyStructureSinglePart{
		Type:        typ,
		Subtype:     subtype,
		Params:      params,
		ID:          e.Header.Get("Content-ID"),
		Description: e.Header.Get("Content-Description"),
		Encoding:    e.Header.Get("Content-Transfer-Encoding"),
		Extended: &imap.BodyStructureSinglePartExt{
			Disposition: disposition,
		},
	}
}

// Helper to convert maildir.Message to provider.Message
func (p *Provider) parseMessage(mailbox string, key string, r io.Reader, mdFlags []maildir.Flag) (*provider.Message, error) {
	msg, err := message.Read(r)
	if err != nil {
		return nil, err
	}

	mr := mail.NewReader(msg)
	header := mr.Header

	date, _ := header.Date()
	subject, _ := header.Subject()
	from, _ := header.AddressList("From")
	sender, _ := header.AddressList("Sender")
	replyTo, _ := header.AddressList("Reply-To")
	to, _ := header.AddressList("To")
	cc, _ := header.AddressList("Cc")
	bcc, _ := header.AddressList("Bcc")
	inReplyTo, _ := header.Text("In-Reply-To")
	messageId, _ := header.Text("Message-ID")
	referencesStr, _ := header.Text("References")

	convertAddrs := func(addrs []*mail.Address) []provider.Address {
		res := make([]provider.Address, len(addrs))
		for i, a := range addrs {
			parts := strings.Split(a.Address, "@")
			host := ""
			mbox := a.Address
			if len(parts) == 2 {
				mbox = parts[0]
				host = parts[1]
			}
			res[i] = provider.Address{
				Name:    a.Name,
				Mailbox: mbox,
				Host:    host,
			}
		}
		return res
	}

	envelope := &provider.Envelope{
		Date:      date,
		Subject:   subject,
		From:      convertAddrs(from),
		Sender:    convertAddrs(sender),
		ReplyTo:   convertAddrs(replyTo),
		To:        convertAddrs(to),
		Cc:        convertAddrs(cc),
		Bcc:       convertAddrs(bcc),
		InReplyTo: inReplyTo,
		MessageID: messageId,
	}

	bodyStruct := buildBodyStructure(msg)
	flags := maildirFlagsToProviderFlags(mdFlags)

	var references []string
	if referencesStr != "" {
		references = provider.ParseReferences(referencesStr)
	}

	return &provider.Message{
		ID:            MaildirMessageID(key),
		Mailbox:       mailbox,
		Flags:         flags,
		Envelope:      envelope,
		BodyStructure: &imapprovider.IMAPBodyStructure{BodyStructure: bodyStruct},
		References:    references,
	}, nil
}

func getAllMessages(dir maildir.Dir) ([]*maildir.Message, error) {
	// Move unseen messages from new/ to cur/
	_, _ = dir.Unseen()

	var msgs []*maildir.Message
	err := dir.Walk(func(m *maildir.Message) error {
		msgs = append(msgs, m)
		return nil
	})
	return msgs, err
}

func (p *Provider) ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]provider.Message, int, error) {
	dir := p.getDir(mailbox)
	msgs, err := getAllMessages(dir)
	if err != nil {
		return nil, 0, err
	}

	sort.Slice(msgs, func(i, j int) bool {
		if sortOrder == "date-asc" {
			return msgs[i].Key() < msgs[j].Key()
		}
		return msgs[i].Key() > msgs[j].Key()
	})

	total := len(msgs)

	start := page * pageSize
	if start >= total {
		return []provider.Message{}, total, nil
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	var messages []provider.Message
	for _, m := range msgs[start:end] {
		f, err := m.Open()
		if err != nil {
			continue
		}

		flags := m.Flags()
		msg, err := p.parseMessage(mailbox, m.Key(), f, flags)
		f.Close()

		if err == nil && msg != nil {
			messages = append(messages, *msg)
		}
	}

	return messages, total, nil
}

func (p *Provider) SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]provider.Message, int, error) {
	dir := p.getDir(mailbox)
	msgs, err := getAllMessages(dir)
	if err != nil {
		return nil, 0, err
	}

	queryLower := strings.ToLower(query)
	var matchedMsgs []*maildir.Message

	queryLowerBytes := []byte(queryLower)
	queryLen := len(queryLowerBytes)

	for _, m := range msgs {
		path := m.Filename()
		f, err := os.Open(path)
		if err != nil {
			continue
		}

		buf := make([]byte, 32*1024)
		var overlap []byte

		for {
			n, err := f.Read(buf)
			if n > 0 {
				chunk := bytes.ToLower(append(overlap, buf[:n]...))
				if bytes.Contains(chunk, queryLowerBytes) {
					matchedMsgs = append(matchedMsgs, m)
					break // Stop scanning the message on first occurence
				}

				if len(chunk) > queryLen {
					overlap = chunk[len(chunk)-queryLen:]
				} else {
					overlap = chunk
				}
			}
			if err != nil {
				break
			}
		}
		f.Close()
	}

	sort.Slice(matchedMsgs, func(i, j int) bool {
		if sortOrder == "date-asc" {
			return matchedMsgs[i].Key() < matchedMsgs[j].Key()
		}
		return matchedMsgs[i].Key() > matchedMsgs[j].Key()
	})

	total := len(matchedMsgs)
	start := page * pageSize
	if start >= total {
		return []provider.Message{}, total, nil
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	var messages []provider.Message
	for _, m := range matchedMsgs[start:end] {
		f, err := m.Open()
		if err != nil {
			continue
		}

		flags := m.Flags()
		msg, err := p.parseMessage(mailbox, m.Key(), f, flags)
		f.Close()

		if err == nil && msg != nil {
			messages = append(messages, *msg)
		}
	}

	return messages, total, nil
}

func (p *Provider) GetMessageMetadata(mailbox string, id provider.MessageID) (*provider.Message, error) {
	key := id.String()
	dir := p.getDir(mailbox)
	m, err := dir.MessageByKey(key)
	if err != nil {
		return nil, err
	}
	f, err := m.Open()
	if err != nil {
		return nil, err
	}
	defer f.Close()

	return p.parseMessage(mailbox, key, f, m.Flags())
}

func traverseEntity(e *message.Entity, partPath []int) (*message.Entity, error) {
	if len(partPath) == 0 {
		return e, nil
	}

	idx := partPath[0]
	mr := e.MultipartReader()
	if mr == nil {
		return nil, fmt.Errorf("entity is not multipart")
	}

	var part *message.Entity
	for i := 1; i <= idx; i++ {
		p, err := mr.NextPart()
		if err != nil {
			return nil, err
		}
		if i == idx {
			part = p
			break
		}
	}

	if part == nil {
		return nil, fmt.Errorf("part %d not found", idx)
	}

	return traverseEntity(part, partPath[1:])
}

func extractEntityData(e *message.Entity, limit int64) ([]byte, []byte, error) {
	var headerBuf bytes.Buffer
	for fields := e.Header.Fields(); fields.Next(); {
		headerBuf.WriteString(fmt.Sprintf("%s: %s\r\n", fields.Key(), fields.Value()))
	}
	headerBuf.WriteString("\r\n")

	var bodyReader io.Reader = e.Body
	if limit > 0 {
		bodyReader = io.LimitReader(bodyReader, limit)
	}

	bodyBuf, err := io.ReadAll(bodyReader)
	if err != nil {
		return nil, nil, err
	}

	return headerBuf.Bytes(), bodyBuf, nil
}

func (p *Provider) getMessagePartEntity(mailbox string, key string, partPath []int) (*provider.Message, *message.Entity, io.ReadCloser, error) {
	dir := p.getDir(mailbox)
	m, err := dir.MessageByKey(key)
	if err != nil {
		return nil, nil, nil, err
	}
	f, err := m.Open()
	if err != nil {
		return nil, nil, nil, err
	}

	seeker, ok := f.(io.Seeker)
	if !ok {
		f.Close()
		return nil, nil, nil, fmt.Errorf("underlying file is not seekable")
	}

	msgMeta, err := p.parseMessage(mailbox, key, f, m.Flags())
	if err != nil {
		f.Close()
		return nil, nil, nil, err
	}

	if _, err := seeker.Seek(0, io.SeekStart); err != nil {
		f.Close()
		return nil, nil, nil, err
	}

	e, err := message.Read(f)
	if err != nil {
		f.Close()
		return nil, nil, nil, err
	}

	part, err := traverseEntity(e, partPath)
	if err != nil {
		f.Close()
		return nil, nil, nil, err
	}

	return msgMeta, part, f, nil
}

func (p *Provider) GetMessagePart(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, error) {
	msgMeta, part, f, err := p.getMessagePartEntity(mailbox, id.String(), partPath)
	if err != nil {
		return nil, nil, err
	}

	_, bodyBuf, err := extractEntityData(part, 0)
	f.Close()
	if err != nil {
		return nil, nil, err
	}

	part.Body = bytes.NewReader(bodyBuf)
	return msgMeta, part, nil
}

func (p *Provider) GetMessagePartRaw(mailbox string, id provider.MessageID, partPath []int, limit int64) (*provider.Message, []byte, []byte, error) {
	msgMeta, part, f, err := p.getMessagePartEntity(mailbox, id.String(), partPath)
	if err != nil {
		return nil, nil, nil, err
	}
	defer f.Close()

	headerBuf, bodyBuf, err := extractEntityData(part, limit)
	if err != nil {
		return nil, nil, nil, err
	}

	return msgMeta, headerBuf, bodyBuf, nil
}

func (p *Provider) GetMessagePartWithData(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, []byte, []byte, error) {
	msgMeta, part, f, err := p.getMessagePartEntity(mailbox, id.String(), partPath)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	defer f.Close()

	headerBuf, bodyBuf, err := extractEntityData(part, 0)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	part.Body = bytes.NewReader(bodyBuf)
	return msgMeta, part, headerBuf, bodyBuf, nil
}

func (p *Provider) SetMessagesFlags(mailbox string, ids []provider.MessageID, op provider.FlagOperation) error {
	dir := p.getDir(mailbox)

	for _, id := range ids {
		key := id.String()
		m, err := dir.MessageByKey(key)
		if err != nil {
			continue
		}
		currentFlags := m.Flags()

		newFlagsMap := make(map[maildir.Flag]bool)
		for _, f := range currentFlags {
			newFlagsMap[f] = true
		}

		mdOpFlags := providerFlagsToMaildirFlags(op.Flags)

		switch op.Op {
		case provider.FlagOpSet:
			newFlagsMap = make(map[maildir.Flag]bool)
			for _, f := range mdOpFlags {
				newFlagsMap[f] = true
			}
		case provider.FlagOpAdd:
			for _, f := range mdOpFlags {
				newFlagsMap[f] = true
			}
		case provider.FlagOpRemove:
			for _, f := range mdOpFlags {
				delete(newFlagsMap, f)
			}
		}

		var newFlags []maildir.Flag
		for f := range newFlagsMap {
			newFlags = append(newFlags, f)
		}

		_ = m.SetFlags(newFlags)
	}
	return nil
}

func (p *Provider) MarkAnswered(mailbox string, id provider.MessageID) error {
	return p.SetMessagesFlags(mailbox, []provider.MessageID{id}, provider.FlagOperation{
		Op:    provider.FlagOpAdd,
		Flags: []provider.Flag{provider.FlagAnswered},
	})
}

func (p *Provider) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, mboxType provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	dir := p.getDir(mailbox)

	delivery, err := maildir.NewDelivery(string(dir))
	if err != nil {
		return nil, nil, 0, err
	}

	size, err := msg.WriteTo(delivery)
	if err != nil {
		delivery.Abort()
		return nil, nil, 0, err
	}

	err = delivery.Close()
	if err != nil {
		return nil, nil, 0, err
	}

	return nil, nil, uint32(size), nil
}

func (p *Provider) DeleteMessages(mailbox string, ids []provider.MessageID) error {
	dir := p.getDir(mailbox)
	for _, id := range ids {
		m, err := dir.MessageByKey(id.String())
		if err == nil {
			m.Remove()
		}
	}
	return nil
}

func (p *Provider) MoveMessages(sourceMailbox, destMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	src := p.getDir(sourceMailbox)
	dst := p.getDir(destMailbox)
	res := make(map[provider.MessageID]provider.MessageID)

	for _, id := range ids {
		m, err := src.MessageByKey(id.String())
		if err == nil {
			err = m.MoveTo(dst)
			if err == nil {
				res[id] = MaildirMessageID(m.Key())
			}
		}
	}
	return res, nil
}

func (p *Provider) CopyMessages(sourceMailbox, destMailbox string, ids []provider.MessageID) (map[provider.MessageID]provider.MessageID, error) {
	src := p.getDir(sourceMailbox)
	dst := p.getDir(destMailbox)
	res := make(map[provider.MessageID]provider.MessageID)

	for _, id := range ids {
		m, err := src.MessageByKey(id.String())
		if err == nil {
			newM, err := m.CopyTo(dst)
			if err == nil {
				res[id] = MaildirMessageID(newM.Key())
			}
		}
	}
	return res, nil
}
