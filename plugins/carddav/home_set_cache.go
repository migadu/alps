package alpscarddav

import "time"

const homeSetTTL = 10 * time.Minute

// homeSetClock keeps expiry tests deterministic without sleeping.
var homeSetClock = time.Now

type homeSetEntry struct {
	path    string
	fetched time.Time
}
