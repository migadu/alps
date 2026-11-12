package alpsbase

import (
	"github.com/migadu/alps"
	"net/http"
	"testing"
	"time"
)

func TestHTTP_SubsecondDAVPasswordLockoutRoundsUp(t *testing.T) {
	cfg := alps.DefaultRateLimitConfig()
	cfg.IPRequestsPerMinute = 0
	cfg.IPRequestsPerHour = 0
	cfg.UsernameFailsPerQuarter = 0
	cfg.UsernameFailsPerHour = 1
	cfg.GlobalRequestsPerSecond = 0
	cfg.LockoutDuration = 900 * time.Millisecond
	s := newDAVSettingsServer(t, func(o *alps.Options) { o.RateLimitEnabled = true; o.RateLimitConfig = &cfg })
	s.login()
	input := alps.DAVConnectionInput{Server: "https://dav.example/", UseMailCredentials: true, MailPassword: "incorrect"}
	s.expect(s.do(http.MethodPut, "/settings/dav/caldav", input), http.StatusForbidden)
	input.MailPassword = testPassword
	r := s.do(http.MethodPut, "/settings/dav/caldav", input)
	s.expect(r, http.StatusTooManyRequests)
	var answer struct {
		RetryAfter int `json:"retry_after"`
	}
	r.json(t, &answer)
	if answer.RetryAfter != 1 || r.header.Get("Retry-After") != "1" {
		t.Fatalf("subsecond DAV lockout body=%s header=%q", r.body, r.header.Get("Retry-After"))
	}
}
