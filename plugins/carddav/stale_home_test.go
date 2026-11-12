package alpscarddav

import (
	"net/http"
	"sync/atomic"
	"testing"
)

func TestFailedCachedHomeListingRediscoversTheHome(t *testing.T) {
	var fail atomic.Bool
	var discoveries atomic.Int32
	wrap := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method == "PROPFIND" && r.URL.Path == "/" {
				discoveries.Add(1)
			}
			if r.Method == "PROPFIND" && r.URL.Path == testHome && fail.Swap(false) {
				w.WriteHeader(http.StatusNotFound)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
	h := newHarnessWrapping(t, wrap)
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
	before := discoveries.Load()
	if before == 0 {
		t.Fatal("initial listing did not discover principal")
	}
	fail.Store(true)
	h.expect(h.do("GET", "/contacts", nil), http.StatusInternalServerError)
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)
	if discoveries.Load() <= before {
		t.Fatal("retried stale cached home without rediscovery")
	}
}
