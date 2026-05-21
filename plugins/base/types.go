package alpsbase

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/dustin/go-humanize"
	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
)

// MailboxInfo represents UI-level mailbox information
type MailboxInfo struct {
	*imap.ListData

	Active     bool
	Total      int
	Unseen     int
	Subscribed bool
}

func (mbox *MailboxInfo) Name() string {
	return mbox.Mailbox
}

func (mbox *MailboxInfo) URL() *url.URL {
	return &url.URL{
		Path: fmt.Sprintf("/mailbox/%v", url.PathEscape(mbox.Name())),
	}
}

func (mbox *MailboxInfo) HasAttr(flag string) bool {
	for _, attr := range mbox.Attrs {
		if string(attr) == flag {
			return true
		}
	}
	return false
}

// MailboxStatus represents UI-level mailbox status
type MailboxStatus struct {
	*imap.StatusData
}

func (mbox *MailboxStatus) Name() string {
	return mbox.Mailbox
}

func (mbox *MailboxStatus) URL() *url.URL {
	return &url.URL{
		Path: fmt.Sprintf("/mailbox/%v", url.PathEscape(mbox.Name())),
	}
}

// IMAPMessage represents a UI-level message wrapper
// Note: Despite the name, this is now provider-agnostic and gets populated
// from provider.Message via the adapter layer
type IMAPMessage struct {
	*imapclient.FetchMessageBuffer

	AlpsUID          string `json:"UID"`
	Mailbox          string
	HasAttachments   bool
	HasBimiPotential bool
	HasBimiFailed    bool
	References       []string `json:"References"`
}

func (msg *IMAPMessage) URL() *url.URL {
	return &url.URL{
		Path: fmt.Sprintf("/message/%v/%v", url.PathEscape(msg.Mailbox), msg.AlpsUID),
	}
}

func (msg *IMAPMessage) TextPart() *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	var best *IMAPPartNode
	isTextPlain := false
	msg.BodyStructure.Walk(func(path []int, part imap.BodyStructure) bool {
		singlePart, ok := part.(*imap.BodyStructureSinglePart)
		if !ok {
			return true
		}

		if !strings.EqualFold(singlePart.Type, "text") {
			return true
		}
		if disp := singlePart.Disposition(); disp != nil && !strings.EqualFold(disp.Value, "inline") {
			return true
		}

		switch strings.ToLower(singlePart.Subtype) {
		case "plain":
			isTextPlain = true
			best = newIMAPPartNode(msg, path, singlePart)
		case "html":
			if !isTextPlain {
				best = newIMAPPartNode(msg, path, singlePart)
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
	msg.BodyStructure.Walk(func(path []int, part imap.BodyStructure) bool {
		singlePart, ok := part.(*imap.BodyStructureSinglePart)
		if !ok {
			return true
		}

		if !strings.EqualFold(singlePart.Type, "text") {
			return true
		}
		if disp := singlePart.Disposition(); disp != nil && !strings.EqualFold(disp.Value, "inline") {
			return true
		}

		if singlePart.Subtype == "html" {
			best = newIMAPPartNode(msg, path, singlePart)
		}
		return true
	})

	return best
}

func (msg *IMAPMessage) Attachments() []IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	// Get the text and HTML part paths so we can exclude them from attachments
	textPart := msg.TextPart()
	htmlPart := msg.HTMLPart()

	var attachments []IMAPPartNode
	msg.BodyStructure.Walk(func(path []int, part imap.BodyStructure) bool {
		singlePart, ok := part.(*imap.BodyStructureSinglePart)
		if !ok {
			return true
		}

		disp := singlePart.Disposition()

		// Explicit attachment disposition — always include
		if disp != nil && strings.EqualFold(disp.Value, "attachment") {
			attachments = append(attachments, *newIMAPPartNode(msg, path, singlePart))
			return true
		}

		// Skip parts that are the primary text or HTML body
		if textPart != nil && pathsEqual(path, textPart.Path) {
			return true
		}
		if htmlPart != nil && pathsEqual(path, htmlPart.Path) {
			return true
		}

		// Skip inline parts that have a Content-ID, as they are embedded in the HTML body
		if disp != nil && strings.EqualFold(disp.Value, "inline") && singlePart.ID != "" {
			return true
		}

		// Include if it has a filename (from Content-Disposition or Content-Type params)
		if singlePart.Filename() != "" {
			attachments = append(attachments, *newIMAPPartNode(msg, path, singlePart))
			return true
		}

		// Include non-text types that aren't explicitly inline
		// (e.g. application/pdf, image/png without disposition)
		mimeType := strings.ToLower(singlePart.Type)
		if mimeType != "text" && (disp == nil || !strings.EqualFold(disp.Value, "inline")) {
			attachments = append(attachments, *newIMAPPartNode(msg, path, singlePart))
			return true
		}

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
	msg.BodyStructure.Walk(func(p []int, part imap.BodyStructure) bool {
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
	msg.BodyStructure.Walk(func(path []int, part imap.BodyStructure) bool {
		singlePart, ok := part.(*imap.BodyStructureSinglePart)
		if !ok {
			return result == nil
		}
		if result == nil && singlePart.ID == "<"+id+">" {
			result = newIMAPPartNode(msg, path, singlePart)
		}
		return result == nil
	})
	return result
}

func (msg *IMAPMessage) PartTree() *IMAPPartNode {
	if msg.BodyStructure == nil {
		return nil
	}

	return imapPartTree(msg, msg.BodyStructure, nil)
}

func (msg *IMAPMessage) HasFlag(flag imap.Flag) bool {
	for _, f := range msg.Flags {
		if f == flag {
			return true
		}
	}
	return false
}

// IMAPPartNode represents a MIME part of a message
type IMAPPartNode struct {
	Path     []int
	MIMEType string
	Params   map[string]string
	Filename string
	Children []IMAPPartNode
	Message  *IMAPMessage
	Size     uint32
	IsInline bool
}

func newIMAPPartNode(msg *IMAPMessage, path []int, part imap.BodyStructure) *IMAPPartNode {
	node := &IMAPPartNode{
		Path:     path,
		MIMEType: part.MediaType(),
		Message:  msg,
	}
	if singlePart, ok := part.(*imap.BodyStructureSinglePart); ok {
		node.Filename = singlePart.Filename()
		node.Params = singlePart.Params
		node.Size = singlePart.Size
		if strings.EqualFold(singlePart.Encoding, "base64") {
			node.Size = (node.Size * 3) / 4
		}
		disp := singlePart.Disposition()
		if disp != nil && strings.EqualFold(disp.Value, "inline") {
			node.IsInline = true
		}
	}
	return node
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

func imapPartTree(msg *IMAPMessage, bs imap.BodyStructure, path []int) *IMAPPartNode {
	node := &IMAPPartNode{
		Path:     path,
		MIMEType: bs.MediaType(),
		Message:  msg,
	}

	switch bs := bs.(type) {
	case *imap.BodyStructureMultiPart:
		for i, part := range bs.Children {
			num := i + 1

			partPath := append([]int(nil), path...)
			partPath = append(partPath, num)

			node.Children = append(node.Children, *imapPartTree(msg, part, partPath))
		}
	case *imap.BodyStructureSinglePart:
		if len(path) == 0 {
			node.Path = []int{1}
		}
		node.Filename = bs.Filename()
		node.Params = bs.Params
		node.Size = bs.Size
	}

	return node
}
