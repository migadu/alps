package provider

import (
	"strings"
	"unicode"
)

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
