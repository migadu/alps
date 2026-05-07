package alps

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// RateLimitConfig holds configuration for rate limiting
type RateLimitConfig struct {
	// Per-IP limits
	IPRequestsPerMinute int
	IPRequestsPerHour   int

	// Per-username limits (failed attempts only)
	UsernameFailsPerQuarter int // Per 15 minutes
	UsernameFailsPerHour    int

	// Global limits
	GlobalRequestsPerSecond int

	// Lockout settings
	LockoutDuration time.Duration // How long to lock out after max failures
}

// DefaultRateLimitConfig returns sensible defaults
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		IPRequestsPerMinute:     5,
		IPRequestsPerHour:       20,
		UsernameFailsPerQuarter: 5,
		UsernameFailsPerHour:    10,
		GlobalRequestsPerSecond: 100,
		LockoutDuration:         15 * time.Minute,
	}
}

// rateLimitEntry tracks requests in a time window
type rateLimitEntry struct {
	timestamps  []time.Time
	lockedUntil time.Time
}

// ClusterBroadcaster defines the interface for broadcasting messages across the cluster
type ClusterBroadcaster interface {
	Broadcast(msg []byte)
}

// RateLimitEvent is the payload broadcasted over the gossip network
type RateLimitEvent struct {
	IP        string    `json:"ip,omitempty"`
	Username  string    `json:"username,omitempty"`
	Success   bool      `json:"success"`
	Timestamp time.Time `json:"timestamp"`
}

// RateLimiter implements multi-tier rate limiting for login attempts
type RateLimiter struct {
	config      RateLimitConfig
	logger      Logger
	broadcaster ClusterBroadcaster

	mu       sync.RWMutex
	ipMap    map[string]*rateLimitEntry // IP address -> attempts
	userMap  map[string]*rateLimitEntry // username -> failed attempts
	globalTS []time.Time                // Global request timestamps

	// Cleanup ticker
	cleanupTicker *time.Ticker
	cleanupDone   chan struct{}
}

// NewRateLimiter creates a new rate limiter with the given configuration
func NewRateLimiter(config RateLimitConfig, logger Logger, broadcaster ClusterBroadcaster) *RateLimiter {
	rl := &RateLimiter{
		config:        config,
		logger:        logger,
		broadcaster:   broadcaster,
		ipMap:         make(map[string]*rateLimitEntry),
		userMap:       make(map[string]*rateLimitEntry),
		globalTS:      make([]time.Time, 0),
		cleanupTicker: time.NewTicker(5 * time.Minute),
		cleanupDone:   make(chan struct{}),
	}

	// Start cleanup goroutine
	go rl.cleanupLoop()

	return rl
}

// Close stops the rate limiter cleanup goroutine
func (rl *RateLimiter) Close() {
	close(rl.cleanupDone)
	rl.cleanupTicker.Stop()
}

// cleanupLoop periodically removes old entries to prevent memory leaks
func (rl *RateLimiter) cleanupLoop() {
	for {
		select {
		case <-rl.cleanupTicker.C:
			rl.cleanup()
		case <-rl.cleanupDone:
			return
		}
	}
}

// cleanup removes expired entries from all maps
func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-2 * time.Hour) // Keep entries for 2 hours max

	// Clean IP map
	for ip, entry := range rl.ipMap {
		if len(entry.timestamps) == 0 && entry.lockedUntil.Before(now) {
			delete(rl.ipMap, ip)
		} else if len(entry.timestamps) > 0 && entry.timestamps[len(entry.timestamps)-1].Before(cutoff) {
			delete(rl.ipMap, ip)
		} else {
			entry.timestamps = filterTimestamps(entry.timestamps, cutoff)
		}
	}

	// Clean username map
	for username, entry := range rl.userMap {
		if len(entry.timestamps) == 0 && entry.lockedUntil.Before(now) {
			delete(rl.userMap, username)
		} else if len(entry.timestamps) > 0 && entry.timestamps[len(entry.timestamps)-1].Before(cutoff) {
			delete(rl.userMap, username)
		} else {
			entry.timestamps = filterTimestamps(entry.timestamps, cutoff)
		}
	}

	// Clean global timestamps
	filtered := make([]time.Time, 0, len(rl.globalTS))
	for _, ts := range rl.globalTS {
		if ts.After(cutoff) {
			filtered = append(filtered, ts)
		}
	}
	rl.globalTS = filtered
}

// CheckLoginAllowed checks if a login attempt is allowed based on all rate limits
// Returns (allowed bool, reason string, retryAfter duration)
func (rl *RateLimiter) CheckLoginAllowed(r *http.Request, username string) (bool, string, time.Duration) {
	if rl == nil {
		return true, "", 0 // Rate limiting disabled
	}

	ip := getClientIP(r)
	now := time.Now()

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Check 1: Global rate limit
	if rl.config.GlobalRequestsPerSecond > 0 {
		rl.globalTS = filterTimestamps(rl.globalTS, now.Add(-1*time.Second))
		if len(rl.globalTS) >= rl.config.GlobalRequestsPerSecond {
			return false, "Server is experiencing high load, please try again later", 1 * time.Second
		}
	}

	// Check 2: IP-based rate limiting
	ipEntry := rl.getOrCreateEntry(rl.ipMap, ip)

	// Debug logging
	rl.logger.Printf("Rate limit check: IP=%s, username=%s, total_attempts=%d", ip, username, len(ipEntry.timestamps))

	// Check if IP is locked out
	if now.Before(ipEntry.lockedUntil) {
		retryAfter := ipEntry.lockedUntil.Sub(now)
		return false, "Too many login attempts from your IP address", retryAfter
	}

	// Check per-minute limit
	if rl.config.IPRequestsPerMinute > 0 {
		recentMinute := filterTimestamps(ipEntry.timestamps, now.Add(-1*time.Minute))
		rl.logger.Printf("Rate limit check: IP=%s, recent_minute=%d/%d", ip, len(recentMinute), rl.config.IPRequestsPerMinute)
		if len(recentMinute) >= rl.config.IPRequestsPerMinute {
			rl.logger.Printf("Rate limit: IP %s exceeded per-minute limit (%d/%d)", ip, len(recentMinute), rl.config.IPRequestsPerMinute)
			return false, "Too many login attempts, please wait a minute", 1 * time.Minute
		}
	}

	// Check per-hour limit
	if rl.config.IPRequestsPerHour > 0 {
		recentHour := filterTimestamps(ipEntry.timestamps, now.Add(-1*time.Hour))
		if len(recentHour) >= rl.config.IPRequestsPerHour {
			// Lock out for configured duration
			ipEntry.lockedUntil = now.Add(rl.config.LockoutDuration)
			ipEntry.timestamps = nil
			rl.logger.Printf("IP %s locked out for %v after %d attempts in 1 hour", ip, rl.config.LockoutDuration, len(recentHour))
			return false, "Too many login attempts, please try again later", rl.config.LockoutDuration
		}
	}

	// Check 3: Username-based rate limiting (if username provided)
	if username != "" {
		userEntry := rl.getOrCreateEntry(rl.userMap, username)

		// Check if username is locked out
		if now.Before(userEntry.lockedUntil) {
			retryAfter := userEntry.lockedUntil.Sub(now)
			return false, "Account temporarily locked due to too many failed login attempts", retryAfter
		}

		// Check per-15-minute limit
		if rl.config.UsernameFailsPerQuarter > 0 {
			recentQuarter := filterTimestamps(userEntry.timestamps, now.Add(-15*time.Minute))
			if len(recentQuarter) >= rl.config.UsernameFailsPerQuarter {
				return false, "Too many failed login attempts for this account", 15 * time.Minute
			}
		}

		// Check per-hour limit
		if rl.config.UsernameFailsPerHour > 0 {
			recentHour := filterTimestamps(userEntry.timestamps, now.Add(-1*time.Hour))
			if len(recentHour) >= rl.config.UsernameFailsPerHour {
				// Lock out account for configured duration
				userEntry.lockedUntil = now.Add(rl.config.LockoutDuration)
				userEntry.timestamps = nil
				rl.logger.Printf("Username %s locked out for %v after %d failed attempts in 1 hour", username, rl.config.LockoutDuration, len(recentHour))
				return false, "Account temporarily locked due to too many failed login attempts", rl.config.LockoutDuration
			}
		}
	}

	return true, "", 0
}

// RecordLoginAttempt records a login attempt (successful or failed)
func (rl *RateLimiter) RecordLoginAttempt(r *http.Request, username string, success bool) {
	if rl == nil {
		return
	}

	ip := getClientIP(r)
	now := time.Now()

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Always record global attempt
	rl.globalTS = append(rl.globalTS, now)

	// Always record IP attempt
	ipEntry := rl.getOrCreateEntry(rl.ipMap, ip)
	ipEntry.timestamps = append(ipEntry.timestamps, now)
	rl.logger.Printf("Rate limit: Recorded login attempt for IP=%s, success=%v, total_attempts=%d", ip, success, len(ipEntry.timestamps))

	// Only record failed attempts for username rate limiting
	if !success && username != "" {
		userEntry := rl.getOrCreateEntry(rl.userMap, username)
		userEntry.timestamps = append(userEntry.timestamps, now)
	}

	// If login succeeded, clear the username's failed attempts
	if success && username != "" {
		if userEntry, exists := rl.userMap[username]; exists {
			userEntry.timestamps = nil
			userEntry.lockedUntil = time.Time{}
		}
	}

	// Broadcast the event to the cluster
	if rl.broadcaster != nil {
		event := RateLimitEvent{
			IP:        ip,
			Username:  username,
			Success:   success,
			Timestamp: now,
		}
		if data, err := json.Marshal(event); err == nil {
			// We only want to broadcast prefix 0x01 to distinguish rate limit events if we had multiple types,
			// but for now we just marshal JSON
			rl.broadcaster.Broadcast(data)
		} else {
			rl.logger.Printf("Failed to marshal rate limit event for broadcast: %v", err)
		}
	}
}

// HandleClusterMessage processes a rate limit event received from another cluster node
func (rl *RateLimiter) HandleClusterMessage(data []byte) {
	if rl == nil {
		return
	}

	var event RateLimitEvent
	if err := json.Unmarshal(data, &event); err != nil {
		rl.logger.Printf("Failed to unmarshal rate limit cluster event: %v", err)
		return
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Record global attempt
	rl.globalTS = append(rl.globalTS, event.Timestamp)

	// Record IP attempt
	if event.IP != "" {
		ipEntry := rl.getOrCreateEntry(rl.ipMap, event.IP)
		ipEntry.timestamps = append(ipEntry.timestamps, event.Timestamp)
	}

	// Record or clear username attempt
	if event.Username != "" {
		userEntry := rl.getOrCreateEntry(rl.userMap, event.Username)
		if event.Success {
			// If login succeeded on another node, clear failures locally too
			userEntry.timestamps = nil
			userEntry.lockedUntil = time.Time{}
		} else {
			userEntry.timestamps = append(userEntry.timestamps, event.Timestamp)
		}
	}
}

// getOrCreateEntry gets or creates an entry in the map
func (rl *RateLimiter) getOrCreateEntry(m map[string]*rateLimitEntry, key string) *rateLimitEntry {
	entry, exists := m[key]
	if !exists {
		entry = &rateLimitEntry{
			timestamps: make([]time.Time, 0),
		}
		m[key] = entry
	}
	return entry
}

// filterTimestamps returns timestamps that are after the cutoff time
func filterTimestamps(timestamps []time.Time, cutoff time.Time) []time.Time {
	filtered := make([]time.Time, 0, len(timestamps))
	for _, ts := range timestamps {
		if ts.After(cutoff) {
			filtered = append(filtered, ts)
		}
	}
	return filtered
}

// getClientIP extracts the real client IP from the request
// Handles X-Forwarded-For, X-Real-IP headers for proxy scenarios
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header (comma-separated list, first is client)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		ip := strings.TrimSpace(parts[0])
		if ipWithoutPort, _, err := net.SplitHostPort(ip); err == nil {
			return ipWithoutPort
		}
		return ip
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return ip
}
