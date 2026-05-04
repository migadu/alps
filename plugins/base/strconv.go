package alpsbase

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/emersion/go-imap/v2"
)

func parseUid(s string) (imap.UID, error) {
	uid, err := strconv.ParseUint(s, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid UID: %v", err)
	}
	if uid == 0 {
		return 0, fmt.Errorf("UID must be non-zero")
	}
	return imap.UID(uid), nil
}

func parseMboxAndUid(mboxString, uidString string) (string, imap.UID, error) {
	mboxName, err := url.PathUnescape(mboxString)
	if err != nil {
		return "", 0, fmt.Errorf("invalid mailbox name: %v", err)
	}
	uid, err := parseUid(uidString)
	return mboxName, uid, err
}

func parseUidList(values []string) ([]imap.UID, error) {
	var uids []imap.UID
	for _, v := range values {
		uid, err := parseUid(v)
		if err != nil {
			return nil, err
		}
		uids = append(uids, uid)
	}
	return uids, nil
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
		if addr == "" {
			continue
		}

		ret = append(ret, strings.TrimSpace(addr))
	}

	return ret
}
