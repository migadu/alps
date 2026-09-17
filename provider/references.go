package provider

import (
	"strings"
	"unicode"
)

// ReferenceFinder is implemented by providers that can find the messages of a
// conversation in another mailbox. Threading sees one mailbox at a time, and
// the replies a user sends are filed in Sent, away from what they answer.
type ReferenceFinder interface {
	// FindByReferences returns the messages in mailbox whose Message-ID is one
	// of ids, or whose In-Reply-To or References names one. It follows what it
	// finds, within a bound, so a reply to a found message is found as well.
	// IDs are given, and compared, without their angle brackets.
	FindByReferences(mailbox string, ids []string) ([]Message, error)
}

// MessageIDs reads the message IDs in a Message-ID, In-Reply-To or References
// value, without their angle brackets. A value with no bracketed ID is read as
// bare IDs, which is how some senders write In-Reply-To. An ID with a space or
// a control character in it is dropped: it is malformed, and it must not be
// written back into a header.
func MessageIDs(value string) []string {
	candidates := ParseReferences(value)
	if len(candidates) == 0 {
		candidates = strings.FieldsFunc(value, func(r rune) bool {
			return unicode.IsSpace(r) || r == ','
		})
	}
	var ids []string
	for _, id := range candidates {
		if wellFormedMessageID(id) {
			ids = append(ids, id)
		}
	}
	return ids
}

func wellFormedMessageID(id string) bool {
	if !strings.Contains(id, "@") {
		return false
	}
	for _, r := range id {
		if unicode.IsSpace(r) || unicode.IsControl(r) || r == '<' || r == '>' {
			return false
		}
	}
	return true
}

// ConversationIDs collects the message IDs that tie msgs together: each one's
// own, and the ones it names in In-Reply-To and References.
func ConversationIDs(msgs []Message) []string {
	seen := make(map[string]bool)
	var ids []string
	add := func(values []string) {
		for _, id := range values {
			if !seen[id] {
				seen[id] = true
				ids = append(ids, id)
			}
		}
	}
	for _, m := range msgs {
		if m.Envelope != nil {
			add(MessageIDs(m.Envelope.MessageID))
			add(MessageIDs(m.Envelope.InReplyTo))
		}
		add(MessageIDs(strings.Join(m.References, " ")))
	}
	return ids
}
