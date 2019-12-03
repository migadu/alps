package koushin

import (
	"fmt"
	"strconv"
	"strings"
)

func parseUid(s string) (uint32, error) {
	uid, err := strconv.ParseUint(s, 10, 32)
	if err != nil {
		return 0, err
	}
	if uid == 0 {
		return 0, fmt.Errorf("UID must be non-zero")
	}
	return uint32(uid), nil
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
