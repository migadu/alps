package maildir

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"sort"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-maildir"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-message/textproto"
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

	single := &imap.BodyStructureSinglePart{
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
	if isAttachedMessage(e) {
		single.MessageRFC822 = attachedMessage(e)
	}
	return single
}

// isAttachedMessage reports whether e holds a message of its own, as a
// forward as attachment does.
func isAttachedMessage(e *message.Entity) bool {
	mediaType, _, _ := e.Header.ContentType()
	return mediaType == "message/rfc822"
}

// attachedMessage describes the message a message/rfc822 part holds as IMAP's
// BODYSTRUCTURE does (RFC 3501, section 7.4.2): by its envelope, which names
// it, and its own parts.
func attachedMessage(e *message.Entity) *imap.BodyStructureMessageRFC822 {
	inner, err := message.Read(e.Body)
	if err != nil {
		return nil
	}
	return &imap.BodyStructureMessageRFC822{
		Envelope:      envelopeOf(mail.Header{Header: inner.Header}),
		BodyStructure: buildBodyStructure(inner),
	}
}

// envelopeOf is an attached message's header as IMAP's ENVELOPE gives it.
func envelopeOf(h mail.Header) *imap.Envelope {
	addresses := func(key string) []imap.Address {
		list, _ := h.AddressList(key)
		var out []imap.Address
		for _, a := range list {
			mailbox, host := a.Address, ""
			if i := strings.LastIndex(a.Address, "@"); i >= 0 {
				mailbox, host = a.Address[:i], a.Address[i+1:]
			}
			out = append(out, imap.Address{Name: a.Name, Mailbox: mailbox, Host: host})
		}
		return out
	}
	date, _ := h.Date()
	subject, _ := h.Subject()
	inReplyTo, _ := h.MsgIDList("In-Reply-To")
	messageID, _ := h.MessageID()
	return &imap.Envelope{
		Date:      date,
		Subject:   subject,
		From:      addresses("From"),
		Sender:    addresses("Sender"),
		ReplyTo:   addresses("Reply-To"),
		To:        addresses("To"),
		Cc:        addresses("Cc"),
		Bcc:       addresses("Bcc"),
		InReplyTo: inReplyTo,
		MessageID: messageID,
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
	// A maildir nothing has been delivered to yet has no cur directory, often no
	// directory at all, because delivery is what creates them. That is an empty
	// mailbox, as ListMailboxes already counts it, not a failure to read one.
	if os.IsNotExist(err) {
		return nil, nil
	}
	return msgs, err
}

// countUnseen returns the number of messages that do not carry the \Seen flag.
// go-maildir's UnseenCount counts files in new/ (the "recently delivered" set),
// but getAllMessages empties new/ by moving those files to cur/, so after the
// first listing UnseenCount would always report 0. IMAP's NumUnseen means "no
// \Seen flag", so count that directly.
func countUnseen(msgs []*maildir.Message) int {
	n := 0
	for _, m := range msgs {
		seen := false
		for _, fl := range m.Flags() {
			if fl == maildir.FlagSeen {
				seen = true
				break
			}
		}
		if !seen {
			n++
		}
	}
	return n
}

func (p *Provider) ListMessages(mailbox string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {
	dir := p.getDir(mailbox)
	msgs, err := getAllMessages(dir)
	if err != nil {
		return nil, provider.PageInfo{}, err
	}

	sort.Slice(msgs, func(i, j int) bool {
		if sortOrder == "asc" {
			return msgs[i].Key() < msgs[j].Key()
		}
		return msgs[i].Key() > msgs[j].Key()
	})

	total := len(msgs)

	start := page * pageSize
	if start >= total {
		return []provider.Message{}, provider.PageInfo{Total: total}, nil
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

	return messages, provider.PageInfo{Total: total}, nil
}

// messageContains reports whether the stored message holds the query, matched
// as a case-insensitive substring of the whole file, headers and body alike.
// Read in chunks, keeping the tail of each so a match across a chunk boundary
// is still found, and stopped at the first one.
func messageContains(m *maildir.Message, query string) bool {
	wanted := []byte(strings.ToLower(query))
	if len(wanted) == 0 {
		return true
	}

	f, err := os.Open(m.Filename())
	if err != nil {
		return false
	}
	defer f.Close()

	buf := make([]byte, 32*1024)
	var overlap []byte
	for {
		n, err := f.Read(buf)
		if n > 0 {
			chunk := bytes.ToLower(append(overlap, buf[:n]...))
			if bytes.Contains(chunk, wanted) {
				return true
			}
			if len(chunk) > len(wanted) {
				overlap = chunk[len(chunk)-len(wanted):]
			} else {
				overlap = chunk
			}
		}
		if err != nil {
			return false
		}
	}
}

// SearchMessageIDs answers every message of the mailbox the query matches,
// newest first, and nothing about them: what an action on a whole folder is
// applied to. An empty query is the whole mailbox.
func (p *Provider) SearchMessageIDs(mailbox, query string) ([]provider.MessageID, error) {
	msgs, err := getAllMessages(p.getDir(mailbox))
	if err != nil {
		return nil, err
	}

	matched := msgs
	if query != "" {
		matched = nil
		for _, m := range msgs {
			if messageContains(m, query) {
				matched = append(matched, m)
			}
		}
	}

	sort.Slice(matched, func(i, j int) bool { return matched[i].Key() > matched[j].Key() })

	ids := make([]provider.MessageID, 0, len(matched))
	for _, m := range matched {
		ids = append(ids, MaildirMessageID(m.Key()))
	}
	return ids, nil
}

func (p *Provider) SearchMessages(mailbox, query string, sortOrder string, page, pageSize int) ([]provider.Message, provider.PageInfo, error) {
	dir := p.getDir(mailbox)
	msgs, err := getAllMessages(dir)
	if err != nil {
		return nil, provider.PageInfo{}, err
	}

	var matchedMsgs []*maildir.Message
	for _, m := range msgs {
		if messageContains(m, query) {
			matchedMsgs = append(matchedMsgs, m)
		}
	}

	sort.Slice(matchedMsgs, func(i, j int) bool {
		if sortOrder == "asc" {
			return matchedMsgs[i].Key() < matchedMsgs[j].Key()
		}
		return matchedMsgs[i].Key() > matchedMsgs[j].Key()
	})

	total := len(matchedMsgs)
	start := page * pageSize
	if start >= total {
		return []provider.Message{}, provider.PageInfo{Total: total}, nil
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

	return messages, provider.PageInfo{Total: total}, nil
}

// messageByKey finds a message for reading. A lookup that finds no file is a
// message that is gone, or a folder that was never delivered to, and says so
// with provider.ErrMessageNotFound rather than as a disk failure. Only the
// lookup can say it: a flag change renames the file, so one that vanishes
// before the open was not necessarily deleted.
func messageByKey(dir maildir.Dir, key string) (*maildir.Message, error) {
	m, err := dir.MessageByKey(key)
	var keyErr *maildir.KeyError
	if (errors.As(err, &keyErr) && keyErr.N == 0) || errors.Is(err, fs.ErrNotExist) {
		return nil, fmt.Errorf("key %q: %w", key, provider.ErrMessageNotFound)
	}
	return m, err
}

func (p *Provider) GetMessageMetadata(mailbox string, id provider.MessageID) (*provider.Message, error) {
	key := id.String()
	dir := p.getDir(mailbox)
	m, err := messageByKey(dir, key)
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

// storedPart is a part of a message as it is stored: its header, and its
// body with its transfer encoding and charset, as IMAP's BODY[n.MIME] and
// BODY[n] give them. A message read with message.Read has its parts' bodies
// decoded, and their bytes then no longer match their headers.
type storedPart struct {
	header textproto.Header
	body   io.Reader
}

func (part storedPart) contentType() (string, map[string]string) {
	h := message.Header{Header: part.header}
	mediaType, params, _ := h.ContentType()
	return mediaType, params
}

// readStoredMessage reads the header of the message r holds, and leaves its
// body to be read.
func readStoredMessage(r io.Reader) (storedPart, error) {
	br := bufio.NewReader(r)
	h, err := textproto.ReadHeader(br)
	if err != nil {
		return storedPart{}, err
	}
	return storedPart{header: h, body: br}, nil
}

// messagePart finds the part of the message m at partPath, numbered as IMAP
// numbers a message's parts (RFC 3501, section 6.4.5): a message that is not
// multipart has one part, its body, which is part 1. The reader asks for it
// by that number. Below it are the parts of the message the body may hold.
func messagePart(m storedPart, partPath []int) (storedPart, error) {
	if mediaType, _ := m.contentType(); len(partPath) > 0 && partPath[0] == 1 && !strings.HasPrefix(mediaType, "multipart/") {
		return traversePart(m, partPath[1:])
	}
	return traversePart(m, partPath)
}

func traversePart(part storedPart, partPath []int) (storedPart, error) {
	if len(partPath) == 0 {
		return part, nil
	}
	mediaType, params := part.contentType()

	// The parts of an attached message are numbered within it, as a
	// message's own are: 2.1 is the first part of the message at 2. The
	// message is the part's body, once its transfer encoding is undone.
	if mediaType == "message/rfc822" {
		decoded, err := message.New(message.Header{Header: part.header}, part.body)
		if err != nil {
			return storedPart{}, err
		}
		inner, err := readStoredMessage(decoded.Body)
		if err != nil {
			return storedPart{}, err
		}
		return messagePart(inner, partPath)
	}

	if !strings.HasPrefix(mediaType, "multipart/") {
		return storedPart{}, fmt.Errorf("entity is not multipart")
	}
	idx := partPath[0]
	mr := textproto.NewMultipartReader(part.body, params["boundary"])
	for i := 1; i <= idx; i++ {
		p, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			return storedPart{}, err
		}
		if i == idx {
			return traversePart(storedPart{header: p.Header, body: p}, partPath[1:])
		}
	}
	return storedPart{}, fmt.Errorf("part %d not found", idx)
}

// readPart reads the part at partPath of a message as it is stored: its
// header, parsed and in its bytes, and its body, of which at most limit bytes
// when limit is above 0.
func (p *Provider) readPart(mailbox string, key string, partPath []int, limit int64) (*provider.Message, textproto.Header, []byte, []byte, error) {
	dir := p.getDir(mailbox)
	m, err := messageByKey(dir, key)
	if err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}
	f, err := m.Open()
	if err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}
	defer f.Close()

	seeker, ok := f.(io.Seeker)
	if !ok {
		return nil, textproto.Header{}, nil, nil, fmt.Errorf("underlying file is not seekable")
	}

	msgMeta, err := p.parseMessage(mailbox, key, f, m.Flags())
	if err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}

	if _, err := seeker.Seek(0, io.SeekStart); err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}

	stored, err := readStoredMessage(f)
	if err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}
	part, err := messagePart(stored, partPath)
	if err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}

	var header bytes.Buffer
	if err := textproto.WriteHeader(&header, part.header); err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}
	body := part.body
	if limit > 0 {
		body = io.LimitReader(body, limit)
	}
	data, err := io.ReadAll(body)
	if err != nil {
		return nil, textproto.Header{}, nil, nil, err
	}
	return msgMeta, part.header, header.Bytes(), data, nil
}

// GetMessagePart answers the part as an entity, its body decoded.
func (p *Provider) GetMessagePart(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, error) {
	msgMeta, h, _, body, err := p.readPart(mailbox, id.String(), partPath, 0)
	if err != nil {
		return nil, nil, err
	}
	part, err := message.New(message.Header{Header: h}, bytes.NewReader(body))
	if err != nil {
		return nil, nil, err
	}
	return msgMeta, part, nil
}

// GetMessagePartRaw answers the part's header and body as they are stored.
func (p *Provider) GetMessagePartRaw(mailbox string, id provider.MessageID, partPath []int, limit int64) (*provider.Message, []byte, []byte, error) {
	msgMeta, _, header, body, err := p.readPart(mailbox, id.String(), partPath, limit)
	if err != nil {
		return nil, nil, nil, err
	}
	return msgMeta, header, body, nil
}

// GetMessagePartWithData answers both: the part as an entity, its body
// decoded, and its header and body as they are stored, as the IMAP provider
// does.
func (p *Provider) GetMessagePartWithData(mailbox string, id provider.MessageID, partPath []int) (*provider.Message, *message.Entity, []byte, []byte, error) {
	msgMeta, h, header, body, err := p.readPart(mailbox, id.String(), partPath, 0)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	part, err := message.New(message.Header{Header: h}, bytes.NewReader(body))
	if err != nil {
		return nil, nil, nil, nil, err
	}
	return msgMeta, part, header, body, nil
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
	// The adapter passes an empty mailbox and selects the destination by type
	// (Sent/Drafts/...), matching the IMAP backend. Resolve it here — the old
	// code ignored mboxType entirely and delivered everything to INBOX.
	if mailbox == "" {
		if mbox, err := p.FindMailboxByType(mboxType); err == nil && mbox != nil {
			mailbox = mbox.Name
		} else {
			name, nerr := mailboxNameForType(mboxType)
			if nerr != nil {
				return nil, nil, 0, nerr
			}
			mailbox = name
		}
	}

	dir := p.getDir(mailbox)
	// Ensure the destination maildir exists (creates tmp/new/cur); a Sent or
	// Drafts folder may not have been created yet.
	if err := dir.Init(); err != nil {
		return nil, nil, 0, fmt.Errorf("failed to initialize maildir %q: %w", mailbox, err)
	}

	// Create, unlike a Delivery, says the key it stores the message under,
	// which is the message's ID: a draft save answers it, and the next save
	// replaces the draft by it. The message is written in tmp, under a key
	// no other writer can choose, and moved into cur once it is whole.
	stored, w, err := dir.Create(nil)
	if err != nil {
		return nil, nil, 0, err
	}

	size, err := msg.WriteTo(w)
	if err != nil {
		abandon(stored, w)
		return nil, nil, 0, err
	}

	if err := w.Close(); err != nil {
		return nil, nil, 0, err
	}

	// The mailbox is non-nil: the adapter dereferences it, which previously
	// panicked.
	return &provider.Mailbox{Name: mailbox, Delimiter: '.', Subscribed: true}, MaildirMessageID(stored.Key()), uint32(size), nil
}

// abandon drops a message Create was writing, which closing w would move
// into cur as it is. The file is removed from tmp first, so that the move
// finds nothing to move; and should it move the file all the same, the file
// is removed from cur.
func abandon(stored *maildir.Message, w io.WriteCloser) {
	if f, ok := w.(interface{ Name() string }); ok {
		os.Remove(f.Name())
	}
	w.Close()
	os.Remove(stored.Filename())
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
