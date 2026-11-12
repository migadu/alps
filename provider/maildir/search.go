package maildir

import (
	"bytes"
	"io"
	"mime"
	"slices"
	"strings"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/charset"
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
	decoder := mime.WordDecoder{CharsetReader: charset.Reader}
	for fields := entity.Header.Fields(); fields.Next(); {
		if !all && (body || !strings.EqualFold(fields.Key(), field)) {
			continue
		}
		value, err := decoder.DecodeHeader(fields.Value())
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
	buf := make([]byte, 32*1024)
	var tail []byte
	for {
		n, err := reader.Read(buf)
		if n > 0 {
			chunk := bytes.ToLower(append(tail, buf[:n]...))
			if bytes.Contains(chunk, wanted) {
				return true
			}
			if len(chunk) > len(wanted) {
				tail = chunk[len(chunk)-len(wanted):]
			} else {
				tail = chunk
			}
		}
		if err != nil {
			return false
		}
	}
}
