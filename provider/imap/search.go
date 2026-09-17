package imap

import (
	"strings"
	"unicode"

	"github.com/emersion/go-imap/v2"
)

func searchCriteriaHeader(k, v string) *imap.SearchCriteria {
	return &imap.SearchCriteria{
		Header: []imap.SearchCriteriaHeaderField{
			{Key: k, Value: v},
		},
	}
}

func searchCriteriaAnd(criteria ...*imap.SearchCriteria) *imap.SearchCriteria {
	if criteria[0] == nil {
		criteria = criteria[1:]
	}
	and := criteria[0]
	for _, c := range criteria[1:] {
		and.And(c)
	}
	return and
}

// searchPrefixes are the prefixes a query term may carry; see docs/SEARCH.md.
// Any other "word:" is ordinary text, such as a time or a URL.
var searchPrefixes = map[string]bool{
	"from": true, "to": true, "cc": true, "subject": true, "body": true, "is": true, "header": true,
}

// searchTerm is one term of a query: text to find, or a prefix and its value.
type searchTerm struct {
	prefix, value string
}

// searchTokens splits a query into its terms. A prefixed term is "key:value",
// its value held together by quotes if it has spaces, and read without them.
// Plain words between prefixed terms make one text term, and a quoted phrase
// makes one of its own.
//
// Input: hello world from:bar baz subject:"are cool" "big deal"
// Terms: text "hello world", from "bar", text "baz", subject "are cool", text "big deal"
func searchTokens(query string) []searchTerm {
	var terms []searchTerm
	var plain []string
	flush := func() {
		if len(plain) > 0 {
			terms = append(terms, searchTerm{value: strings.Join(plain, " ")})
			plain = nil
		}
	}
	rest := query
	for {
		rest = strings.TrimLeftFunc(rest, unicode.IsSpace)
		if rest == "" {
			break
		}
		if rest[0] == '"' {
			phrase, after := quoted(rest)
			flush()
			if phrase = strings.TrimSpace(phrase); phrase != "" {
				terms = append(terms, searchTerm{value: phrase})
			}
			rest = after
			continue
		}
		word, after := searchWord(rest)
		rest = after
		key, value, ok := strings.Cut(word, ":")
		if !ok || !searchPrefixes[strings.ToLower(key)] {
			plain = append(plain, word)
			continue
		}
		flush()
		if len(value) >= 2 && value[0] == '"' && value[len(value)-1] == '"' {
			value = value[1 : len(value)-1]
		}
		terms = append(terms, searchTerm{prefix: strings.ToLower(key), value: value})
	}
	flush()
	return terms
}

// quoted reads a phrase that starts with a quote, up to the closing quote or
// the end of the query.
func quoted(s string) (phrase, rest string) {
	if end := strings.IndexByte(s[1:], '"'); end >= 0 {
		return s[1 : end+1], s[end+2:]
	}
	return s[1:], ""
}

// searchWord reads up to the next space outside quotes.
func searchWord(s string) (word, rest string) {
	inQuotes := false
	for i, r := range s {
		switch {
		case r == '"':
			inQuotes = !inQuotes
		case unicode.IsSpace(r) && !inQuotes:
			return s[:i], s[i:]
		}
	}
	return s, ""
}

// prepareIMAPSearch parses search terms into IMAP search criteria
func prepareIMAPSearch(terms string) *imap.SearchCriteria {
	var criteria *imap.SearchCriteria

	for _, term := range searchTokens(terms) {
		value := term.value
		if term.prefix == "" {
			// TEXT is the header and the body, as the search help says. It
			// used to be From, To, Cc and Subject only, so a word in the body
			// was found only with body:.
			criteria = searchCriteriaAnd(criteria, &imap.SearchCriteria{Text: []string{value}})
		} else {
			switch term.prefix {
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
			case "is":
				if strings.ToLower(value) == "starred" || strings.ToLower(value) == "flagged" {
					if criteria == nil {
						criteria = &imap.SearchCriteria{Flag: []imap.Flag{imap.FlagFlagged}}
					} else {
						criteria.Flag = append(criteria.Flag, imap.FlagFlagged)
					}
				} else if strings.ToLower(value) == "unread" {
					if criteria == nil {
						criteria = &imap.SearchCriteria{NotFlag: []imap.Flag{imap.FlagSeen}}
					} else {
						criteria.NotFlag = append(criteria.NotFlag, imap.FlagSeen)
					}
				}
			case "header":
				hParts := strings.SplitN(value, ":", 2)
				if len(hParts) == 2 {
					hVal := hParts[1]
					if len(hVal) >= 2 && hVal[0] == '"' && hVal[len(hVal)-1] == '"' {
						hVal = hVal[1 : len(hVal)-1]
					}
					criteria = searchCriteriaAnd(
						criteria, searchCriteriaHeader(hParts[0], hVal))
				}
			default:
				continue
			}
		}
	}

	if criteria == nil {
		criteria = &imap.SearchCriteria{}
	}

	return criteria
}
