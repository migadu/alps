package alpsbase

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
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

func parseAddressList(s string) []string {
	l := strings.Split(s, ",")
	ret := make([]string, 0, len(l))
	for _, addr := range l {
		// Trimmed BEFORE the empty check: "a@example.com, " splits into a
		// second entry of one space, which used to be kept as an empty
		// recipient.
		addr = strings.TrimSpace(addr)
		if addr == "" {
			continue
		}

		ret = append(ret, addr)
	}

	return ret
}
