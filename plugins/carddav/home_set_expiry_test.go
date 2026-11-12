package alpscarddav

import (
	"net/http"
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
	wrap := func(next http.Handler) http.Handler {
		movedHandler := homeSetMoves(&moved)(next)
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
	h := newHarnessWrapping(t, wrap)
	h.dav.save(testBook+"grace.vcf", grace("+1 555 0100"))
	h.expect(h.do("PUT", "/settings/dav/carddav", map[string]any{"username": "independent-dav-user", "password": "independent-secret"}), http.StatusOK)
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
	moved.Store(true)
	for i := 0; i < 2; i++ {
		h.do("GET", "/contacts", nil)
	}
	if staleReads.Load() != 2 {
		t.Fatalf("warm reads did not use the cached home: %d", staleReads.Load())
	}
	now.Add(int64(homeSetTTL))
	r := h.do("GET", "/contacts", nil)
	h.expect(r, http.StatusOK)
	var listed struct{ Contacts []ContactData }
	h.decode(r, &listed)
	if len(listed.Contacts) != 1 || listed.Contacts[0].Path != movedHome+"default/grace.vcf" {
		t.Fatalf("new home not discovered: %s", r.body)
	}
	if staleReads.Load() != 2 {
		t.Fatalf("expired home was queried again instead of rediscovered: %d", staleReads.Load())
	}
}
