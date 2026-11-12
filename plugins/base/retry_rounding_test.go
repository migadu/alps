package alpsbase

import (
	"github.com/migadu/alps"
	"net/http"
	"testing"
	"time"
)

func TestHTTP_SubsecondLoginLockoutRoundsUp(t *testing.T) {
	cfg := alps.DefaultRateLimitConfig()
	cfg.IPRequestsPerMinute = 0
	cfg.IPRequestsPerHour = 0
	cfg.UsernameFailsPerQuarter = 0
	cfg.UsernameFailsPerHour = 1
	cfg.GlobalRequestsPerSecond = 0
	cfg.LockoutDuration = 900 * time.Millisecond
	s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) { o.RateLimitEnabled = true; o.RateLimitConfig = &cfg })
	s.expect(s.do("POST", "/session", map[string]string{"username": testUser, "password": "wrong"}), http.StatusUnauthorized)
	r := s.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword})
	s.expect(r, http.StatusTooManyRequests)
	var body struct {
		RetryAfter int `json:"retry_after"`
	}
	r.json(t, &body)
	if body.RetryAfter != 1 || r.header.Get("Retry-After") != "1" {
		t.Fatalf("subsecond lockout: body=%s header=%s; want one second", r.body, r.header.Get("Retry-After"))
	}
}
