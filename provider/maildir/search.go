package maildir

import (
	"bytes"
	"io"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/emersion/go-message"
	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
)

func messageMatches(m *mailFile, criteria *imap.SearchCriteria) bool {
	flags := maildirFlagsToProviderFlags(m.Flags())
	for _, flag := range criteria.Flag {
		if !slices.Contains(flags, provider.Flag(flag)) {
			return false
		}
	}
	for _, flag := range criteria.NotFlag {
		if slices.Contains(flags, provider.Flag(flag)) {
			return false
		}
	}
	for _, field := range criteria.Header {
		if !messageFieldContains(m, field.Key, field.Value, false, false) {
			return false
		}
	}
	for _, value := range criteria.Body {
		if !messageFieldContains(m, "", value, true, false) {
			return false
		}
	}
	for _, value := range criteria.Text {
		if !messageContains(m, value) && !messageFieldContains(m, "", value, true, true) {
			return false
		}
	}
	return true
}

func messageFieldContains(m *mailFile, field, query string, body, all bool) bool {
	f, err := m.Open()
	if err != nil {
		return false
	}
	defer f.Close()
	entity, err := message.Read(f)
	if entity == nil || (err != nil && !message.IsUnknownCharset(err) && !message.IsUnknownEncoding(err)) {
		return false
	}
	fields := entity.Header.Fields()
	if !body && !all {
		fields = entity.Header.FieldsByKey(field)
	}
	for fields.Next() {
		if !all && (body || !strings.EqualFold(fields.Key(), field)) {
			continue
		}
		value, err := fields.Text()
		if err != nil {
			value = fields.Value()
		}
		if strings.Contains(strings.ToLower(value), strings.ToLower(query)) {
			return true
		}
	}
	if !body {
		return false
	}

	return entityContains(entity, query)
}

func entityContains(entity *message.Entity, query string) bool {
	if multi := entity.MultipartReader(); multi != nil {
		defer multi.Close()
		for {
			part, err := multi.NextPart()
			if part == nil || (err != nil && !message.IsUnknownCharset(err) && !message.IsUnknownEncoding(err)) {
				return false
			}
			if entityContains(part, query) {
				return true
			}
		}
	}
	return readerContains(entity.Body, query)
}

// readerContains keeps only one chunk and enough overlap for a split match.
func readerContains(reader io.Reader, query string) bool {
	wanted := []byte(strings.ToLower(query))
	if len(wanted) == 0 {
		return true
	}
	keep := (utf8.RuneCount(wanted) + 1) * utf8.UTFMax
	buf := make([]byte, 32*1024)
	var tail []byte
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			raw := append(tail, buf[:n]...)
			if bytes.Contains(bytes.ToLower(raw), wanted) {
				return true
			}
			// Keep raw bytes: lowercasing an incomplete rune corrupts a match
			// crossing the next read. Uppercase encodings can also be longer than
			// their lowercase forms (for example Kelvin sign -> k).
			if len(raw) > keep {
				raw = raw[len(raw)-keep:]
			}
			tail = bytes.Clone(raw)
		}
		if err != nil {
			return false
		}
	}
}
