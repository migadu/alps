package imap

import (
	"bufio"
	"bytes"
	"strings"

	"github.com/emersion/go-imap/v2"
)

func searchCriteriaHeader(k, v string) *imap.SearchCriteria {
	return &imap.SearchCriteria{
		Header: []imap.SearchCriteriaHeaderField{
			{Key: k, Value: v},
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
			Or: [][2]imap.SearchCriteria{{*or, *c}},
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
		and.And(c)
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
		if colon+1 < len(buf) && buf[colon+1] == byte('"') {
			terminator = bytes.IndexByte(buf[colon+2:], byte('"'))
			if terminator != -1 {
				terminator += colon + 3
			}
			quoted = true
		} else {
			terminator = bytes.IndexByte(buf[colon:], byte(' '))
			if terminator != -1 {
				terminator += colon
			}
		}

		if terminator == -1 && eof {
			terminator = len(buf)
		} else if terminator == -1 {
			return 0, nil, nil
		}

		if quoted {
			trimmed := append(buf[:colon+1], buf[colon+2:terminator-1]...)
			return terminator, trimmed, nil
		}

		return terminator, buf[:terminator], nil
	}
}

// prepareIMAPSearch parses search terms into IMAP search criteria
func prepareIMAPSearch(terms string) *imap.SearchCriteria {
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
