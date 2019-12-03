package koushin

import (
	"fmt"
	"strconv"
	"strings"
	"net/url"
)

func parseUid(s string) (uint32, error) {
	uid, err := strconv.ParseUint(s, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid UID: %v", err)
	}
	if uid == 0 {
		return 0, fmt.Errorf("UID must be non-zero")
	}
	return uint32(uid), nil
}

func parseMboxAndUid(mboxString, uidString string) (string, uint32, error) {
	mboxName, err := url.PathUnescape(mboxString)
	if err != nil {
		return "", 0, fmt.Errorf("invalid mailbox name: %v", err)
	}
	uid, err := parseUid(uidString)
	return mboxName, uid, err
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

func parseAddressList(s string) []string {
	l := strings.Split(s, ",")
	for i, addr := range l {
		l[i] = strings.TrimSpace(addr)
	}
	return l
}
