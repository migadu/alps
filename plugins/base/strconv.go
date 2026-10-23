package alpsbase

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/emersion/go-message/mail"
)

func parseMboxAndUidStr(mboxString, uidString string) (string, string, error) {
	mboxName, err := url.PathUnescape(mboxString)
	if err != nil {
		return "", "", fmt.Errorf("invalid mailbox name: %v", err)
	}
	if uidString == "" {
		return "", "", fmt.Errorf("UID must be non-empty")
	}
	return mboxName, uidString, nil
}

func parsePartPath(s string) ([]int, error) {
	if s == "" {
		return nil, nil
	}

	l := strings.Split(s, ".")
	path := make([]int, len(l))
	for i, s := range l {
		var err error
		path[i], err = strconv.Atoi(s)
		if err != nil {
			return nil, err
		}

		if path[i] <= 0 {
			return nil, fmt.Errorf("part num must be strictly positive")
		}
	}
	return path, nil
}

func formatPartPath(path []int) string {
	var parts []string
	for _, p := range path {
		parts = append(parts, strconv.Itoa(p))
	}
	return strings.Join(parts, ".")
}

// parseAddressList reads a recipient field, its addresses separated by
// commas, into one string per address. The field is parsed as an address
// list, not split at every comma: a comma in a quoted display name
// ("Lovelace, Ada" <ada@example.com>) belongs to the name, and split there,
// neither half was an address and the message could be neither sent nor
// saved. Each address is formatted again, as From is, so a name, or a local
// part like "a;b", stays quoted where it needs to be; one without a name is
// written without the angle brackets.
func parseAddressList(s string) ([]string, error) {
	ret := []string{}
	// Separators and spaces alone name nobody, as an empty field does, but
	// the list parser refuses them.
	if strings.Trim(s, ", \t\r\n") == "" {
		return ret, nil
	}
	list, err := mail.ParseAddressList(s)
	if err != nil {
		return nil, err
	}
	for _, addr := range list {
		formatted := addr.String()
		if addr.Name == "" {
			formatted = strings.TrimSuffix(strings.TrimPrefix(formatted, "<"), ">")
		}
		ret = append(ret, formatted)
	}
	return ret, nil
}

// readableAddresses is what can be read of a recipient field that
// parseAddressList refuses: each entry that reads as an address, in order,
// formatted as parseAddressList formats it. The rest are left out. An entry
// is what lies between two commas that are not inside a quoted string, a
// comment or angle brackets, so a comma in a quoted name stays in it.
func readableAddresses(s string) []string {
	ret := []string{}
	for _, entry := range splitAddressList(s) {
		if list, err := parseAddressList(entry); err == nil {
			ret = append(ret, list...)
		}
	}
	return ret
}

// splitAddressList splits a recipient field at the commas that separate its
// entries, and nowhere else.
func splitAddressList(s string) []string {
	var entries []string
	var quoted, escaped, angle bool
	comment, start := 0, 0
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch {
		case escaped:
			escaped = false
		case c == '\\' && (quoted || comment > 0):
			escaped = true
		case quoted:
			quoted = c != '"'
		case comment > 0:
			if c == '(' {
				comment++
			} else if c == ')' {
				comment--
			}
		case c == '"':
			quoted = true
		case c == '(':
			comment++
		case c == '<':
			angle = true
		case c == '>':
			angle = false
		case c == ',' && !angle:
			entries = append(entries, s[start:i])
			start = i + 1
		}
	}
	return append(entries, s[start:])
}
