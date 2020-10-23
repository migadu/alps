package alpsbase

import (
	"bufio"
	"bytes"
	"net/textproto"
	"strings"

	"github.com/emersion/go-imap"
)

func searchCriteriaHeader(k, v string) *imap.SearchCriteria {
	return &imap.SearchCriteria{
		Header: map[string][]string{
			k: []string{v},
		},
	}
}

func searchCriteriaOr(criteria ...*imap.SearchCriteria) *imap.SearchCriteria {
	if criteria[0] == nil {
		criteria = criteria[1:]
	}
	or := criteria[0]
	for _, c := range criteria[1:] {
		or = &imap.SearchCriteria{
			Or: [][2]*imap.SearchCriteria{{or, c}},
		}
	}
	return or
}

func searchCriteriaAnd(criteria ...*imap.SearchCriteria) *imap.SearchCriteria {
	if criteria[0] == nil {
		criteria = criteria[1:]
	}
	and := criteria[0]
	for _, c := range criteria[1:] {
		// TODO: Maybe pitch the AND and OR functions to go-imap upstream
		if c.Header != nil {
			if and.Header == nil {
				and.Header = make(textproto.MIMEHeader)
			}

			for key, value := range c.Header {
				if _, ok := and.Header[key]; !ok {
					and.Header[key] = nil
				}
				and.Header[key] = append(and.Header[key], value...)
			}
		}
		and.Body = append(and.Body, c.Body...)
		and.Text = append(and.Text, c.Text...)
		and.WithFlags = append(and.WithFlags, c.WithFlags...)
		and.WithoutFlags = append(and.WithoutFlags, c.WithoutFlags...)
		// TODO: Merge more things
	}
	return and
}

// Splits search up into the longest string of non-functional parts and
// functional parts
//
// Input: hello world foo:bar baz trains:"are cool"
// Output: ["hello world", "foo:bar", "baz", "trains:are cool"]
func splitSearchTokens(buf []byte, eof bool) (int, []byte, error) {
	if len(buf) == 0 {
		return 0, nil, nil
	}

	if buf[0] == ' ' {
		return 1, nil, nil
	}

	colon := bytes.IndexByte(buf, byte(':'))
	if colon == -1 && eof {
		return len(buf), buf, nil
	} else if colon == -1 {
		return 0, nil, nil
	} else {
		space := bytes.LastIndexByte(buf[:colon], byte(' '))
		if space != -1 {
			return space, buf[:space], nil
		}

		var (
			terminator int
			quoted     bool
		)
		if colon + 1 < len(buf) && buf[colon+1] == byte('"') {
			terminator = bytes.IndexByte(buf[colon+2:], byte('"'))
			terminator += colon + 3
			quoted = true
		} else {
			terminator = bytes.IndexByte(buf[colon:], byte(' '))
			terminator += colon
		}

		if terminator == -1 {
			return 0, nil, nil
		} else if terminator == -1 && eof {
			terminator = len(buf)
		}

		if quoted {
			trimmed := append(buf[:colon+1], buf[colon+2:terminator-1]...)
			return terminator, trimmed, nil
		}

		return terminator, buf[:terminator], nil
	}
}

// TODO: Document search functionality somewhere
func PrepareSearch(terms string) *imap.SearchCriteria {
	// XXX: If Migadu's IMAP servers can learn a better Full-Text Search then
	// we can probably start matching on the message bodies by default (gated
	// behind some kind of flag, perhaps)
	var criteria *imap.SearchCriteria

	scanner := bufio.NewScanner(strings.NewReader(terms))
	scanner.Split(splitSearchTokens)

	for scanner.Scan() {
		term := scanner.Text()
		if !strings.ContainsRune(term, ':') {
			criteria = searchCriteriaAnd(
				criteria,
				searchCriteriaOr(
					searchCriteriaHeader("From", term),
					searchCriteriaHeader("To", term),
					searchCriteriaHeader("Cc", term),
					searchCriteriaHeader("Subject", term),
				),
			)
		} else {
			parts := strings.SplitN(term, ":", 2)
			key, value := parts[0], parts[1]
			switch strings.ToLower(key) {
			case "from":
				criteria = searchCriteriaAnd(
					criteria, searchCriteriaHeader("From", value))
			case "to":
				criteria = searchCriteriaAnd(
					criteria, searchCriteriaHeader("To", value))
			case "cc":
				criteria = searchCriteriaAnd(
					criteria, searchCriteriaHeader("Cc", value))
			case "subject":
				criteria = searchCriteriaAnd(
					criteria, searchCriteriaHeader("Subject", value))
			case "body":
				criteria = searchCriteriaAnd(
					criteria, &imap.SearchCriteria{Body: []string{value}})
			default:
				continue
			}
		}
	}

	return criteria
}
