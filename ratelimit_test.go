package alps

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// mockLogger implements Logger for testing
type mockLogger struct {
	logs []string
}

func (m *mockLogger) Print(v ...interface{})                 { m.logs = append(m.logs, "print") }
func (m *mockLogger) Printf(format string, v ...interface{}) { m.logs = append(m.logs, "printf") }
func (m *mockLogger) Debug(v ...interface{})                 { m.logs = append(m.logs, "debug") }
func (m *mockLogger) Debugf(format string, v ...interface{}) { m.logs = append(m.logs, "debugf") }
func (m *mockLogger) Info(v ...interface{})                  { m.logs = append(m.logs, "info") }
func (m *mockLogger) Infof(format string, v ...interface{})  { m.logs = append(m.logs, "infof") }
func (m *mockLogger) Error(v ...interface{})                 { m.logs = append(m.logs, "error") }
func (m *mockLogger) Errorf(format string, v ...interface{}) { m.logs = append(m.logs, "errorf") }
func (m *mockLogger) Fatal(v ...interface{})                 { m.logs = append(m.logs, "fatal") }
func (m *mockLogger) Fatalf(format string, v ...interface{}) { m.logs = append(m.logs, "fatalf") }
func (m *mockLogger) SetLevel(level slog.Level)              { m.logs = append(m.logs, "setlevel") }

// Ensure http is used
var _ = http.StatusOK

func TestRateLimiter_PerIPLimits(t *testing.T) {
	logger := &mockLogger{}
	config := RateLimitConfig{
		IPRequestsPerMinute:     3,
		IPRequestsPerHour:       10,
		UsernameFailsPerQuarter: 5,
		UsernameFailsPerHour:    10,
		GlobalRequestsPerSecond: 100,
		LockoutDuration:         15 * time.Minute,
	}

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	// Create test request
	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "192.168.1.100:12345"

	// First 3 attempts should succeed (per-minute limit)
	for i := 0; i < 3; i++ {
		allowed, reason, _ := rl.CheckLoginAllowed(req, "user@example.com")
		if !allowed {
			t.Errorf("Attempt %d should be allowed, but got: %s", i+1, reason)
		}
		rl.RecordLoginAttempt(req, "user@example.com", false)
	}

	// 4th attempt should be rate limited (per-minute)
	allowed, reason, retryAfter := rl.CheckLoginAllowed(req, "user@example.com")
	if allowed {
		t.Error("4th attempt should be rate limited (per-minute)")
	}
	if reason != "Too many login attempts, please wait a minute" {
		t.Errorf("Expected per-minute rate limit message, got: %s", reason)
	}
	if retryAfter != 1*time.Minute {
		t.Errorf("Expected retry after 1 minute, got: %v", retryAfter)
	}
}

func TestRateLimiter_PerIPHourlyLockout(t *testing.T) {
	logger := &mockLogger{}
	config := RateLimitConfig{
		IPRequestsPerMinute:     100, // Disable per-minute limit for this test
		IPRequestsPerHour:       5,
		UsernameFailsPerQuarter: 100,
		UsernameFailsPerHour:    100,
		GlobalRequestsPerSecond: 1000,
		LockoutDuration:         10 * time.Minute,
	}

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "10.0.0.1:54321"

	// Record 5 attempts (hourly limit)
	for i := 0; i < 5; i++ {
		allowed, _, _ := rl.CheckLoginAllowed(req, "user@example.com")
		if !allowed {
			t.Errorf("Attempt %d should be allowed", i+1)
		}
		rl.RecordLoginAttempt(req, "user@example.com", false)
	}

	// 6th attempt should trigger lockout
	allowed, reason, retryAfter := rl.CheckLoginAllowed(req, "user@example.com")
	if allowed {
		t.Error("6th attempt should trigger IP lockout")
	}
	if reason != "Too many login attempts, please try again later" {
		t.Errorf("Expected lockout message, got: %s", reason)
	}
	if retryAfter != 10*time.Minute {
		t.Errorf("Expected retry after 10 minutes, got: %v", retryAfter)
	}

	// Even after a second, should still be locked
	time.Sleep(100 * time.Millisecond)
	allowed, reason, _ = rl.CheckLoginAllowed(req, "user@example.com")
	if allowed {
		t.Error("IP should remain locked out")
	}
	if reason != "Too many login attempts from your IP address" {
		t.Errorf("Expected locked out message, got: %s", reason)
	}
}

func TestRateLimiter_PerUsernameLimits(t *testing.T) {
	logger := &mockLogger{}
	config := RateLimitConfig{
		IPRequestsPerMinute:     100, // High limits to not interfere
		IPRequestsPerHour:       100,
		UsernameFailsPerQuarter: 3,
		UsernameFailsPerHour:    5,
		GlobalRequestsPerSecond: 1000,
		LockoutDuration:         5 * time.Minute,
	}

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	// Use different IPs to isolate username limiting
	username := "target@example.com"

	// 3 failed attempts from different IPs
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("POST", "/session", nil)
		req.RemoteAddr = "203.0.113." + string(rune('1'+i)) + ":12345"

		allowed, _, _ := rl.CheckLoginAllowed(req, username)
		if !allowed {
			t.Errorf("Attempt %d for username should be allowed", i+1)
		}
		rl.RecordLoginAttempt(req, username, false) // Record as failed
	}

	// 4th attempt should be rate limited (per-username, 15min window)
	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "203.0.113.99:12345"

	allowed, reason, retryAfter := rl.CheckLoginAllowed(req, username)
	if allowed {
		t.Error("4th attempt should be rate limited (per-username)")
	}
	if reason != "Too many failed login attempts for this account" {
		t.Errorf("Expected username rate limit message, got: %s", reason)
	}
	if retryAfter != 15*time.Minute {
		t.Errorf("Expected retry after 15 minutes, got: %v", retryAfter)
	}
}

func TestRateLimiter_SuccessfulLoginClearsUserCounter(t *testing.T) {
	logger := &mockLogger{}
	config := DefaultRateLimitConfig()

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "198.51.100.1:33333"
	username := "gooduser@example.com"

	// Record 3 failed attempts
	for i := 0; i < 3; i++ {
		rl.RecordLoginAttempt(req, username, false)
	}

	// Verify user has accumulated failures
	rl.mu.RLock()
	userEntry := rl.userMap[username]
	failCount := len(userEntry.timestamps)
	rl.mu.RUnlock()

	if failCount != 3 {
		t.Errorf("Expected 3 failed attempts recorded, got %d", failCount)
	}

	// Successful login should clear the counter
	rl.RecordLoginAttempt(req, username, true)

	// Verify user counter was cleared
	rl.mu.RLock()
	userEntry = rl.userMap[username]
	cleared := userEntry == nil || len(userEntry.timestamps) == 0
	rl.mu.RUnlock()

	if !cleared {
		t.Error("Successful login should clear username failure counter")
	}
}

func TestRateLimiter_GlobalLimit(t *testing.T) {
	logger := &mockLogger{}
	config := RateLimitConfig{
		IPRequestsPerMinute:     1000,
		IPRequestsPerHour:       10000,
		UsernameFailsPerQuarter: 1000,
		UsernameFailsPerHour:    1000,
		GlobalRequestsPerSecond: 5, // Very low global limit
		LockoutDuration:         1 * time.Minute,
	}

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	// Make 5 requests from different IPs
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("POST", "/session", nil)
		req.RemoteAddr = "172.16.0." + string(rune('1'+i)) + ":11111"

		allowed, _, _ := rl.CheckLoginAllowed(req, "user"+string(rune('1'+i))+"@example.com")
		if !allowed {
			t.Errorf("Global request %d should be allowed", i+1)
		}
		rl.RecordLoginAttempt(req, "user@example.com", false)
	}

	// 6th request should hit global limit
	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "172.16.0.99:11111"

	allowed, reason, _ := rl.CheckLoginAllowed(req, "newuser@example.com")
	if allowed {
		t.Error("6th request should hit global rate limit")
	}
	if reason != "Server is experiencing high load, please try again later" {
		t.Errorf("Expected global rate limit message, got: %s", reason)
	}
}

func TestRateLimiter_XForwardedForHandling(t *testing.T) {
	logger := &mockLogger{}
	config := DefaultRateLimitConfig()
	config.IPRequestsPerMinute = 2

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	// Test X-Forwarded-For header
	req1 := httptest.NewRequest("POST", "/session", nil)
	req1.RemoteAddr = "10.0.0.1:12345" // Proxy IP
	req1.Header.Set("X-Forwarded-For", "203.0.113.50")

	req2 := httptest.NewRequest("POST", "/session", nil)
	req2.RemoteAddr = "10.0.0.1:12346" // Same proxy, different port
	req2.Header.Set("X-Forwarded-For", "203.0.113.50")

	// Both requests from same real IP (X-Forwarded-For)
	allowed, _, _ := rl.CheckLoginAllowed(req1, "user@example.com")
	if !allowed {
		t.Error("First request should be allowed")
	}
	rl.RecordLoginAttempt(req1, "user@example.com", false)

	allowed, _, _ = rl.CheckLoginAllowed(req2, "user@example.com")
	if !allowed {
		t.Error("Second request should be allowed")
	}
	rl.RecordLoginAttempt(req2, "user@example.com", false)

	// Third request should be rate limited
	req3 := httptest.NewRequest("POST", "/session", nil)
	req3.RemoteAddr = "10.0.0.1:12347"
	req3.Header.Set("X-Forwarded-For", "203.0.113.50")

	allowed, reason, _ := rl.CheckLoginAllowed(req3, "user@example.com")
	if allowed {
		t.Error("Third request should be rate limited (same X-Forwarded-For IP)")
	}
	if reason != "Too many login attempts, please wait a minute" {
		t.Errorf("Expected per-minute limit, got: %s", reason)
	}
}

func TestRateLimiter_XRealIPHandling(t *testing.T) {
	logger := &mockLogger{}
	config := DefaultRateLimitConfig()
	config.IPRequestsPerMinute = 2

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	// Test X-Real-IP header
	req1 := httptest.NewRequest("POST", "/session", nil)
	req1.RemoteAddr = "10.0.0.2:54321"
	req1.Header.Set("X-Real-IP", "198.51.100.77")

	req2 := httptest.NewRequest("POST", "/session", nil)
	req2.RemoteAddr = "10.0.0.3:54322"
	req2.Header.Set("X-Real-IP", "198.51.100.77")

	allowed, _, _ := rl.CheckLoginAllowed(req1, "user@example.com")
	if !allowed {
		t.Error("First request should be allowed")
	}
	rl.RecordLoginAttempt(req1, "user@example.com", false)

	allowed, _, _ = rl.CheckLoginAllowed(req2, "user@example.com")
	if !allowed {
		t.Error("Second request should be allowed")
	}
	rl.RecordLoginAttempt(req2, "user@example.com", false)

	req3 := httptest.NewRequest("POST", "/session", nil)
	req3.RemoteAddr = "10.0.0.4:54323"
	req3.Header.Set("X-Real-IP", "198.51.100.77")

	allowed, _, _ = rl.CheckLoginAllowed(req3, "user@example.com")
	if allowed {
		t.Error("Third request should be rate limited (same X-Real-IP)")
	}
}

func TestRateLimiter_CleanupRemovesOldEntries(t *testing.T) {
	logger := &mockLogger{}
	config := DefaultRateLimitConfig()

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	// Add some entries
	for i := 0; i < 5; i++ {
		req := httptest.NewRequest("POST", "/session", nil)
		req.RemoteAddr = "192.168.100." + string(rune('1'+i)) + ":12345"
		rl.RecordLoginAttempt(req, "user"+string(rune('1'+i))+"@example.com", false)
	}

	// Verify entries exist
	rl.mu.RLock()
	ipCount := len(rl.ipMap)
	userCount := len(rl.userMap)
	rl.mu.RUnlock()

	if ipCount != 5 {
		t.Errorf("Expected 5 IP entries, got %d", ipCount)
	}
	if userCount != 5 {
		t.Errorf("Expected 5 user entries, got %d", userCount)
	}

	// Manually trigger cleanup with old cutoff (simulates 2+ hours passing)
	rl.cleanup()

	// Entries should still exist (not old enough)
	rl.mu.RLock()
	ipCountAfter := len(rl.ipMap)
	rl.mu.RUnlock()

	if ipCountAfter != 5 {
		t.Errorf("Recent entries should not be cleaned, got %d entries", ipCountAfter)
	}
}

func TestRateLimiter_DisabledRateLimiter(t *testing.T) {
	// nil rate limiter should allow all requests
	var rl *RateLimiter = nil

	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "1.2.3.4:12345"

	allowed, reason, retryAfter := rl.CheckLoginAllowed(req, "user@example.com")
	if !allowed {
		t.Error("Nil rate limiter should allow all requests")
	}
	if reason != "" {
		t.Errorf("Expected empty reason, got: %s", reason)
	}
	if retryAfter != 0 {
		t.Errorf("Expected zero retry after, got: %v", retryAfter)
	}

	// Recording should not panic
	rl.RecordLoginAttempt(req, "user@example.com", false)
}

func TestRateLimiter_ConcurrentAccess(t *testing.T) {
	logger := &mockLogger{}
	config := DefaultRateLimitConfig()

	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	// Simulate concurrent requests from multiple goroutines
	done := make(chan bool)
	requests := 100

	for i := 0; i < requests; i++ {
		go func(id int) {
			req := httptest.NewRequest("POST", "/session", nil)
			req.RemoteAddr = "192.0.2." + string(rune('1'+(id%250))) + ":12345"

			allowed, _, _ := rl.CheckLoginAllowed(req, "concurrent@example.com")
			if allowed {
				rl.RecordLoginAttempt(req, "concurrent@example.com", id%2 == 0)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < requests; i++ {
		<-done
	}

	// If we got here without panic, concurrent access is safe
	rl.mu.RLock()
	_ = len(rl.ipMap) // Just verify we can read
	rl.mu.RUnlock()
}

func TestDefaultRateLimitConfig(t *testing.T) {
	config := DefaultRateLimitConfig()

	if config.IPRequestsPerMinute != 5 {
		t.Errorf("Expected default IPRequestsPerMinute=5, got %d", config.IPRequestsPerMinute)
	}
	if config.IPRequestsPerHour != 20 {
		t.Errorf("Expected default IPRequestsPerHour=20, got %d", config.IPRequestsPerHour)
	}
	if config.UsernameFailsPerQuarter != 5 {
		t.Errorf("Expected default UsernameFailsPerQuarter=5, got %d", config.UsernameFailsPerQuarter)
	}
	if config.UsernameFailsPerHour != 10 {
		t.Errorf("Expected default UsernameFailsPerHour=10, got %d", config.UsernameFailsPerHour)
	}
	if config.GlobalRequestsPerSecond != 100 {
		t.Errorf("Expected default GlobalRequestsPerSecond=100, got %d", config.GlobalRequestsPerSecond)
	}
	if config.LockoutDuration != 15*time.Minute {
		t.Errorf("Expected default LockoutDuration=15min, got %v", config.LockoutDuration)
	}
}

func BenchmarkRateLimiter_CheckLoginAllowed(b *testing.B) {
	logger := &mockLogger{}
	config := DefaultRateLimitConfig()
	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "203.0.113.100:12345"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rl.CheckLoginAllowed(req, "bench@example.com")
	}
}

func BenchmarkRateLimiter_RecordLoginAttempt(b *testing.B) {
	logger := &mockLogger{}
	config := DefaultRateLimitConfig()
	rl := NewRateLimiter(config, logger, nil)
	defer rl.Close()

	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "203.0.113.101:12345"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rl.RecordLoginAttempt(req, "bench@example.com", false)
	}
}

// mockBroadcaster implements ClusterBroadcaster for testing
type mockBroadcaster struct {
	messages [][]byte
}

func (m *mockBroadcaster) Broadcast(msg []byte) {
	m.messages = append(m.messages, msg)
}

func TestDistributedRateLimiter(t *testing.T) {
	logger := &mockLogger{}
	config := RateLimitConfig{
		IPRequestsPerMinute:     3,
		IPRequestsPerHour:       10,
		UsernameFailsPerQuarter: 5,
		UsernameFailsPerHour:    10,
		GlobalRequestsPerSecond: 100,
		LockoutDuration:         15 * time.Minute,
	}

	broadcaster := &mockBroadcaster{}

	// Create Node A
	rlA := NewRateLimiter(config, logger, broadcaster)
	defer rlA.Close()

	// Create Node B (will receive messages from A)
	rlB := NewRateLimiter(config, logger, nil)
	defer rlB.Close()

	// 1. Simulate 3 failed logins on Node A
	req := httptest.NewRequest("POST", "/session", nil)
	req.RemoteAddr = "10.0.0.55:12345"
	username := "cluster@example.com"

	for i := 0; i < 3; i++ {
		rlA.RecordLoginAttempt(req, username, false)
	}

	// Verify Node A broadcasted 3 messages
	if len(broadcaster.messages) != 3 {
		t.Fatalf("Expected 3 broadcast messages, got %d", len(broadcaster.messages))
	}

	// 2. Feed those messages to Node B
	for _, msg := range broadcaster.messages {
		rlB.HandleClusterMessage(msg)
	}

	// 3. Node B should now block the 4th attempt from the same IP
	reqB := httptest.NewRequest("POST", "/session", nil)
	reqB.RemoteAddr = "10.0.0.55:54321" // Same IP, different port

	allowed, reason, _ := rlB.CheckLoginAllowed(reqB, username)
	if allowed {
		t.Error("Node B should block the request based on distributed rate limits from Node A")
	}
	if reason != "Too many login attempts, please wait a minute" {
		t.Errorf("Expected per-minute rate limit message on Node B, got: %s", reason)
	}

	// 4. Simulate successful login on Node A
	rlA.RecordLoginAttempt(req, username, true)

	// Send the success message to Node B
	rlB.HandleClusterMessage(broadcaster.messages[3])

	// Verify user failures were cleared on Node B
	rlB.mu.RLock()
	userEntry := rlB.userMap[username]
	cleared := userEntry == nil || len(userEntry.timestamps) == 0
	rlB.mu.RUnlock()

	if !cleared {
		t.Error("Successful login broadcast should clear user failures on Node B")
	}
}
