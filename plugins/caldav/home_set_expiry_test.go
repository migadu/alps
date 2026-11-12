package alpscaldav

import (
	"net/http"
	"path"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// The old collection still answers successfully, so error-driven eviction
// cannot discover the account's new home. Warm reads must stay cached until
// the TTL, then discover again using the same independent DAV credentials.
func TestLiveButMovedHomeSetExpires(t *testing.T) {
	oldClock := homeSetClock
	var now atomic.Int64
	now.Store(time.Now().UnixNano())
	homeSetClock = func() time.Time { return time.Unix(0, now.Load()) }
	t.Cleanup(func() { homeSetClock = oldClock })
	var moved atomic.Bool
	var staleReads atomic.Int64
	var mu sync.Mutex
	var targets []string
	wrap := func(next http.Handler) http.Handler {
		movedHandler := homeSetMoves(&moved, &mu, &targets)(next)
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if moved.Load() && r.Method == "PROPFIND" && r.URL.Path == testHome {
				staleReads.Add(1)
				w.Header().Set("Content-Type", "application/xml; charset=utf-8")
				w.WriteHeader(http.StatusMultiStatus)
				w.Write([]byte(`<D:multistatus xmlns:D="DAV:"/>`))
				return
			}
			movedHandler.ServeHTTP(w, r)
		})
	}
	h := startHarness(t, harnessOptions{wrap: wrap})
	h.expect(h.do("PUT", "/settings/dav/caldav", map[string]any{"username": "independent-dav-user", "password": "independent-secret"}), http.StatusOK)
	h.expect(h.do("GET", "/calendar/calendars", nil), http.StatusOK)
	moved.Store(true)
	for i := 0; i < 2; i++ {
		h.do("GET", "/calendar/calendars", nil)
	}
	if staleReads.Load() != 2 {
		t.Fatalf("warm reads did not use the cached home: %d", staleReads.Load())
	}
	now.Add(int64(homeSetTTL))
	r := h.do("GET", "/calendar/calendars", nil)
	h.expect(r, http.StatusOK)
	var listed struct{ Calendars []CalendarData }
	h.decode(r, &listed)
	if len(listed.Calendars) != 1 || listed.Calendars[0].Path != movedHome+"work/" {
		t.Fatalf("new home not discovered: %s", r.body)
	}
	h.expect(h.do("POST", "/calendar/calendars", map[string]any{"name": "Holidays"}), http.StatusOK)
	mu.Lock()
	defer mu.Unlock()
	if len(targets) != 1 || path.Dir(strings.TrimSuffix(targets[0], "/"))+"/" != movedHome {
		t.Fatalf("new calendar created at stale home: %q", targets)
	}
	if staleReads.Load() != 2 {
		t.Fatalf("expired home was queried again instead of rediscovered: %d", staleReads.Load())
	}
}
