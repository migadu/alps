package alps

import (
	"strconv"
	"time"
)

// RetryAfter sets the whole-second delay a client must wait, rounding upward
// so that a positive lockout never asks the client to retry before it ends.
func (c *Context) RetryAfter(delay time.Duration) int {
	if delay <= 0 {
		return 0
	}
	seconds := int(delay / time.Second)
	if delay%time.Second != 0 {
		seconds++
	}
	c.Response.Header().Set("Retry-After", strconv.Itoa(seconds))
	return seconds
}
