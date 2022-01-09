package alpsbase

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/emersion/go-message/mail"
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

func parseUidList(values []string) ([]uint32, error) {
	var uids []uint32
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

func parseStringList(s string) []string {
	if s == "" {
		return nil
	}

	l := strings.Split(s, ",")
	for i, s := range l {
		l[i] = strings.TrimSpace(s)
	}
	return l
}

func parseAddressList(values []string) ([]*mail.Address, error) {
	var addrs []*mail.Address
	for _, v := range values {
		addr, err := mail.ParseAddress(v)
		if err != nil {
			return nil, err
		}
		addrs = append(addrs, addr)
	}
	return addrs, nil
}
