package maildir

import (
	"bufio"
	"sort"

	"github.com/emersion/go-message/textproto"
	"github.com/migadu/alps/provider"
)

// maxReferenceRounds bounds how far FindByReferences follows what it found.
const maxReferenceRounds = 3

// FindByReferences implements provider.ReferenceFinder by reading the headers
// of every message in the mailbox, as listing it does.
func (p *Provider) FindByReferences(mailbox string, ids []string) ([]provider.Message, error) {
	dir := p.getDir(mailbox)
	msgs, err := getAllMessages(dir)
	if err != nil {
		return nil, err
	}

	type candidate struct {
		key                        string
		own, inReplyTo, references []string
	}
	var candidates []candidate
	for _, m := range msgs {
		f, err := m.Open()
		if err != nil {
			continue
		}
		h, err := textproto.ReadHeader(bufio.NewReader(f))
		f.Close()
		if err != nil {
			continue
		}
		candidates = append(candidates, candidate{
			key:        m.Key(),
			own:        provider.MessageIDs(h.Get("Message-Id")),
			inReplyTo:  provider.MessageIDs(h.Get("In-Reply-To")),
			references: provider.MessageIDs(h.Get("References")),
		})
	}

	known := make(map[string]bool)
	for _, id := range ids {
		for _, id := range provider.MessageIDs(id) {
			known[id] = true
		}
	}
	names := func(lists ...[]string) bool {
		for _, l := range lists {
			for _, id := range l {
				if known[id] {
					return true
				}
			}
		}
		return false
	}

	found := make(map[string]bool)
	for round := 0; round < maxReferenceRounds; round++ {
		var learned []string
		for _, c := range candidates {
			if found[c.key] || !names(c.own, c.inReplyTo, c.references) {
				continue
			}
			found[c.key] = true
			learned = append(learned, c.own...)
			learned = append(learned, c.inReplyTo...)
			learned = append(learned, c.references...)
		}
		grew := false
		for _, id := range learned {
			if !known[id] {
				known[id] = true
				grew = true
			}
		}
		if !grew {
			break
		}
	}

	keys := make([]string, 0, len(found))
	for key := range found {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	var result []provider.Message
	for _, key := range keys {
		msg, err := p.GetMessageMetadata(mailbox, MaildirMessageID(key))
		if err != nil {
			continue
		}
		result = append(result, *msg)
	}
	return result, nil
}
