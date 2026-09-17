package imap

import (
	"bufio"
	"bytes"
	"fmt"
	"sort"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-message/textproto"
	"github.com/migadu/alps/provider"
)

// Bounds on FindByReferences: how many searches it makes, and how many IDs one
// search names. Each ID is three header keys under a tree of ORs, about six
// criteria nodes, and servers refuse a search past a few hundred: Sora at 256.
const (
	maxReferenceSearches = 4
	maxReferenceIDs      = 25
)

var referenceHeaders = []string{"Message-ID", "In-Reply-To", "References"}

func referenceSection() *imap.FetchItemBodySection {
	return &imap.FetchItemBodySection{
		Specifier:    imap.PartSpecifierHeader,
		HeaderFields: referenceHeaders,
		Peek:         true,
	}
}

// FindByReferences implements provider.ReferenceFinder with header searches.
//
// Each ID is searched bare. Servers match HEADER as a substring, so a bare ID
// also finds its bracketed form, and a server that indexes these fields stores
// them bare. A substring can match more than the ID, so each hit is checked
// against the IDs its own headers name before it is kept.
func (p *IMAPProvider) FindByReferences(mailbox string, ids []string) ([]provider.Message, error) {
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return nil, err
	}

	known := make(map[string]bool)
	var pending []string
	learn := func(ids []string) {
		for _, id := range ids {
			if !known[id] {
				known[id] = true
				pending = append(pending, id)
			}
		}
	}
	for _, id := range ids {
		learn(provider.MessageIDs(id))
	}

	found := make(map[imap.UID]provider.Message)
	for search := 0; search < maxReferenceSearches && len(pending) > 0; search++ {
		batch := pending
		if len(batch) > maxReferenceIDs {
			batch = batch[:maxReferenceIDs]
		}
		pending = pending[len(batch):]

		data, err := p.client.UIDSearch(referenceCriteria(batch), nil).Wait()
		if err != nil {
			return nil, fmt.Errorf("searching %s for the conversation: %w", mailbox, err)
		}
		var uids imap.UIDSet
		for _, uid := range data.AllUIDs() {
			if _, ok := found[uid]; !ok {
				uids.AddNum(uid)
			}
		}
		if len(uids) == 0 {
			continue
		}

		msgs, err := p.client.Fetch(uids, &imap.FetchOptions{
			Envelope:      true,
			Flags:         true,
			UID:           true,
			RFC822Size:    true,
			BodyStructure: &imap.FetchItemBodyStructure{Extended: true},
			BodySection:   []*imap.FetchItemBodySection{referenceSection()},
		}).Collect()
		if err != nil {
			return nil, fmt.Errorf("fetching the conversation from %s: %w", mailbox, err)
		}
		for _, msg := range msgs {
			own, inReplyTo, references := readReferenceHeaders(msg.FindBodySection(referenceSection()))
			if !namesAny(known, own, inReplyTo, references) {
				continue
			}
			converted := p.convertIMAPMessage(msg, mailbox)
			converted.References = references
			if converted.Envelope != nil && converted.Envelope.InReplyTo == "" && len(inReplyTo) > 0 {
				// The envelope drops an In-Reply-To that is not a msg-id.
				converted.Envelope.InReplyTo = inReplyTo[0]
			}
			found[msg.UID] = converted
			learn(own)
			learn(inReplyTo)
			learn(references)
		}
	}

	uids := make([]imap.UID, 0, len(found))
	for uid := range found {
		uids = append(uids, uid)
	}
	sort.Slice(uids, func(i, j int) bool { return uids[i] < uids[j] })
	result := make([]provider.Message, len(uids))
	for i, uid := range uids {
		result[i] = found[uid]
	}
	return result, nil
}

// referenceCriteria matches a message that is, or names, any of ids. The ORs
// are nested as a balanced tree: each one is parenthesised, and a chain would
// nest as deep as there are keys.
func referenceCriteria(ids []string) *imap.SearchCriteria {
	var keys []imap.SearchCriteria
	for _, id := range ids {
		for _, header := range referenceHeaders {
			keys = append(keys, *searchCriteriaHeader(header, id))
		}
	}
	criteria := anyOf(keys)
	return &criteria
}

func anyOf(keys []imap.SearchCriteria) imap.SearchCriteria {
	if len(keys) == 1 {
		return keys[0]
	}
	mid := len(keys) / 2
	return imap.SearchCriteria{Or: [][2]imap.SearchCriteria{{anyOf(keys[:mid]), anyOf(keys[mid:])}}}
}

// readReferenceHeaders reads the IDs in a fetched Message-ID, In-Reply-To and
// References, bare IDs included.
func readReferenceHeaders(raw []byte) (own, inReplyTo, references []string) {
	if raw == nil {
		return nil, nil, nil
	}
	h, err := textproto.ReadHeader(bufio.NewReader(bytes.NewReader(raw)))
	if err != nil {
		return nil, nil, nil
	}
	return provider.MessageIDs(h.Get("Message-Id")),
		provider.MessageIDs(h.Get("In-Reply-To")),
		provider.MessageIDs(h.Get("References"))
}

func namesAny(known map[string]bool, lists ...[]string) bool {
	for _, ids := range lists {
		for _, id := range ids {
			if known[id] {
				return true
			}
		}
	}
	return false
}
