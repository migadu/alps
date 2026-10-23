package alpscarddav

import (
	"bytes"
	"strings"

	"github.com/emersion/go-vcard"
)

// listProperties are the properties alps writes whose value is a list of
// texts (RFC 6350, 6.7.1 and 6.2.3; RFC 2426 likewise): a plain comma
// separates two elements, an escaped one is part of an element.
//
// go-vcard escapes every comma it writes and unescapes every comma it reads,
// so through it a list of categories went out as one escaped name, which
// every other client showed as a single category, and a name holding a comma
// could not be told from two. alps holds these values as written instead:
// keepListEscapes keeps their escapes through go-vcard's decoder, encodeCard
// writes them back as they are, and listElements and listValue read and make
// them.
var listProperties = map[string]bool{vcard.FieldCategories: true, vcard.FieldNickname: true}

// structuredProperties are the properties alps writes whose components, split
// by semicolons, may each hold a list (RFC 6350, 5, 6.2.2 and 6.3.1): N and
// ADR. Escaped, the commas between a street's two lines, or between two
// middle names, made one value of them for every other client. They are held
// as written too. ORG is not among them: its components are texts, and a
// comma in one is part of it.
var structuredProperties = map[string]bool{vcard.FieldName: true, vcard.FieldAddress: true}

// heldAsWritten reports whether alps holds a property's value as it was
// written, its escapes in place: a list property's, or a structured one's.
func heldAsWritten(name string) bool {
	name = strings.ToUpper(name)
	return listProperties[name] || structuredProperties[name]
}

// keepListEscapes doubles every backslash in the value of a property held as
// written in body, a vCard or a multistatus whose address data holds vCards,
// so that go-vcard's decoder, which unescapes every value, leaves the value
// as it was written: `\\,` reads back as `\,`. Nothing else in body changes.
func keepListEscapes(body []byte) []byte {
	var out []byte
	start := 0
	for i := 0; i < len(body); {
		n := lineStart(body, i)
		if n < 0 {
			i++
			continue
		}
		// i is the first byte of a line. Is it a property held as written?
		valueAt := listValueStart(body, n)
		if valueAt < 0 {
			i = n
			continue
		}
		end := logicalLineEnd(body, valueAt)
		if bytes.IndexByte(body[valueAt:end], '\\') >= 0 {
			out = append(out, body[start:valueAt]...)
			out = append(out, bytes.ReplaceAll(body[valueAt:end], []byte(`\`), []byte(`\\`))...)
			start = end
		}
		i = end
	}
	if out == nil {
		return body
	}
	return append(out, body[start:]...)
}

// lineBreak is the length of the line break at body[i]: a line feed, or one
// written as an XML character reference; 0 for anything else.
func lineBreak(body []byte, i int) int {
	if body[i] == '\n' {
		return 1
	}
	for _, ref := range []string{"&#10;", "&#xA;", "&#xa;"} {
		if bytes.HasPrefix(body[i:], []byte(ref)) {
			return len(ref)
		}
	}
	return 0
}

// lineStart is where the line after a line break at body[i] starts, when
// that line is not a continuation of the one before; -1 otherwise.
func lineStart(body []byte, i int) int {
	n := lineBreak(body, i)
	if n == 0 || i+n >= len(body) || body[i+n] == ' ' || body[i+n] == '\t' {
		return -1
	}
	return i + n
}

// listValueStart is where the value begins of a property held as written
// whose line starts at body[i], after its group, name and parameters; -1 for
// a line of any other property.
func listValueStart(body []byte, i int) int {
	j := i
	var property strings.Builder
	for j < len(body) {
		if n := foldedBreak(body, j); n > 0 {
			j += n
			continue
		}
		if !isNameByte(body[j]) && body[j] != '.' {
			break
		}
		property.WriteByte(body[j])
		j++
	}
	name := property.String()
	if dot := strings.LastIndexByte(name, '.'); dot >= 0 {
		name = name[dot+1:]
	}
	if j >= len(body) || !heldAsWritten(name) || (body[j] != ':' && body[j] != ';') {
		return -1
	}
	quoted := false
	for ; j < len(body); j++ {
		if n := foldedBreak(body, j); n > 0 {
			j += n - 1
			continue
		}
		switch {
		case body[j] == '\\' && quoted:
			// A quote escaped in a quoted value, as encodeCard writes it.
			j++
		case body[j] == '"':
			quoted = !quoted
		case body[j] == ':' && !quoted:
			return j + 1
		case lineBreak(body, j) > 0 && lineStart(body, j) >= 0:
			return -1
		}
	}
	return -1
}

// foldedBreak is the physical line break and one whitespace byte removed
// when unfolding a vCard line, including XML's carriage-return spelling.
// Keep offsets in the original response so only the value is rewritten.
func foldedBreak(body []byte, i int) int {
	j := i
	for _, cr := range []string{"\r", "&#13;", "&#xD;", "&#xd;"} {
		if bytes.HasPrefix(body[j:], []byte(cr)) {
			j += len(cr)
			break
		}
	}
	if j >= len(body) {
		return 0
	}
	n := lineBreak(body, j)
	if n > 0 && j+n < len(body) && (body[j+n] == ' ' || body[j+n] == '\t') {
		return j + n + 1 - i
	}
	return 0
}

func isNameByte(b byte) bool {
	return b == '-' || b >= '0' && b <= '9' || b >= 'A' && b <= 'Z' || b >= 'a' && b <= 'z'
}

// logicalLineEnd is where the line that holds body[i] ends, its folded
// continuations included.
func logicalLineEnd(body []byte, i int) int {
	for ; i < len(body); i++ {
		if lineBreak(body, i) > 0 && lineStart(body, i) >= 0 {
			// A carriage return, or its reference, belongs to the break.
			for _, cr := range []string{"\r", "&#13;", "&#xD;", "&#xd;"} {
				if bytes.HasSuffix(body[:i], []byte(cr)) {
					return i - len(cr)
				}
			}
			return i
		}
	}
	return i
}

// listElements reads the elements of a list property's value as written.
//
// A plain comma separates two elements and an escaped one is part of an
// element. But go-vcard's encoder, which go-webdav's server answers with,
// escapes every comma, separators too: a value with escaped commas and no
// plain one is read as such a list, and its commas all separate.
func listElements(raw string) []string {
	parts := splitUnescaped(raw)
	if len(parts) == 1 && strings.Contains(raw, `\,`) {
		parts = strings.Split(unescapeText(raw), ",")
	} else {
		for i, part := range parts {
			parts[i] = unescapeText(part)
		}
	}
	var elements []string
	for _, part := range parts {
		if part = strings.TrimSpace(part); part != "" {
			elements = append(elements, part)
		}
	}
	return elements
}

// listValue is the value written for elements: each escaped, a comma in one
// among them, and joined with plain commas.
func listValue(elements []string) string {
	escaped := make([]string, len(elements))
	for i, element := range elements {
		escaped[i] = elementEscaper.Replace(element)
	}
	return strings.Join(escaped, ",")
}

var elementEscaper = strings.NewReplacer(`\`, `\\`, "\n", `\n`, ",", `\,`)

// shownListValue is a list property's value as the page shows and sends it,
// one line of text: its escapes undone, its separators commas.
func shownListValue(raw string) string {
	return unescapeText(raw)
}

// writtenListValue is the value written for text the page sent for a list
// property: its commas separate elements, as in the text the page was given.
func writtenListValue(text string) string {
	return strings.NewReplacer(`\`, `\\`, "\n", `\n`).Replace(text)
}

// splitUnescaped splits a list value at its plain commas.
func splitUnescaped(raw string) []string {
	return splitAt(raw, ',')
}

// splitAt splits a value as written at each sep that is not escaped.
func splitAt(raw string, sep byte) []string {
	var parts []string
	start := 0
	for i := 0; i < len(raw); i++ {
		switch raw[i] {
		case '\\':
			i++
		case sep:
			parts = append(parts, raw[start:i])
			start = i + 1
		}
	}
	return append(parts, raw[start:])
}

// unescapeText undoes a text value's escapes: \\, \, \; and \n (or \N).
func unescapeText(raw string) string {
	if !strings.Contains(raw, `\`) {
		return raw
	}
	var b strings.Builder
	for i := 0; i < len(raw); i++ {
		if raw[i] == '\\' && i+1 < len(raw) {
			i++
			if raw[i] == 'n' || raw[i] == 'N' {
				b.WriteByte('\n')
			} else {
				b.WriteByte(raw[i])
			}
			continue
		}
		b.WriteByte(raw[i])
	}
	return b.String()
}
