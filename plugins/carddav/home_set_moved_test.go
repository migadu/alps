package alpscarddav

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

// movedHome is where the address book home set is once the server has moved
// it.
const movedHome = "/ada/moved/"

// homeSetMoves stands in front of the CardDAV server as one that, once moved
// is set, keeps the user's address books under movedHome: the principal names
// it as the address book home set, and the old home answers 404, as it does
// when an account is provisioned again or another server takes over the same
// URL.
func homeSetMoves(moved *atomic.Bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !moved.Load() {
				next.ServeHTTP(w, r)
				return
			}
			switch {
			case strings.HasPrefix(r.URL.Path, testHome):
				http.NotFound(w, r)
				return
			case strings.HasPrefix(r.URL.Path, movedHome):
				r.URL.Path = testHome + strings.TrimPrefix(r.URL.Path, movedHome)
			}
			rec := httptest.NewRecorder()
			next.ServeHTTP(rec, r)
			for k, v := range rec.Header() {
				if k != "Content-Length" {
					w.Header()[k] = v
				}
			}
			w.WriteHeader(rec.Code)
			w.Write(bytes.ReplaceAll(rec.Body.Bytes(), []byte(testHome), []byte(movedHome)))
		})
	}
}

// Alps keeps each resolved connection's address book home set once it has looked it up.
// When the server moved it, listing the address books from the old one
// failed, and the old one was kept: every contacts request for that login
// failed until alps restarted. A home set that fails to list is dropped, so
// the next request looks it up again, and reads the cards in the new one.
func TestAMovedAddressBookHomeIsLookedUpAgain(t *testing.T) {
	var moved atomic.Bool
	h := newHarnessWrapping(t, homeSetMoves(&moved))
	h.dav.save(testBook+"grace.vcf", grace("+1 555 0100"))
	h.expect(h.do("PUT", "/settings/dav/carddav", map[string]any{"username": "independent-dav-user", "password": "independent-secret"}), http.StatusOK)
	h.expect(h.do("GET", "/contacts", nil), http.StatusOK)

	moved.Store(true)
	// The request that finds the old home gone may still fail with it.
	h.do("GET", "/contacts", nil)

	r := h.do("GET", "/contacts", nil)
	h.expect(r, http.StatusOK)
	var list struct{ Contacts []ContactData }
	h.decode(r, &list)
	if want := movedHome + "default/grace.vcf"; len(list.Contacts) != 1 || list.Contacts[0].Path != want {
		t.Fatalf("listed %+v, want the one card at %s", list.Contacts, want)
	}
}

// A request whose listing failed drops the home set it listed from, and only
// that one: another request may already have looked up the new one, and that
// one stays.
func TestOnlyTheAddressBookHomeThatFailedIsForgotten(t *testing.T) {
	const connectionKey = "resolved-connection-key"
	p := &plugin{homeSetCache: map[string]string{connectionKey: movedHome, "another-connection": testHome}}
	p.forgetHomeSet(connectionKey, testHome)
	if got, ok := p.homeSetCache[connectionKey]; !ok || got != movedHome {
		t.Errorf("the new home set was dropped for a failure of the old one: cached %q, %v", got, ok)
	}
	p.forgetHomeSet(connectionKey, movedHome)
	if got, ok := p.homeSetCache[connectionKey]; ok {
		t.Errorf("the home set that failed is still cached: %q", got)
	}
}
