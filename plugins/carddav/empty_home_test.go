package alpscarddav

import (
	"context"
	"errors"
	"github.com/migadu/alps"
	"net/http"
	"testing"
)

func TestEmptyAddressBookHomeIsListedEmptyAndWritesConflict(t *testing.T) {
	h := newHarness(t)
	h.dav.empty = true
	r := h.do("GET", "/contacts", nil)
	h.expect(r, http.StatusOK)
	var data struct{ Contacts []ContactData }
	h.decode(r, &data)
	if data.Contacts == nil || len(data.Contacts) != 0 {
		t.Fatalf("contacts not an empty array: %s", r.body)
	}
	r = h.do("POST", "/contacts/create", map[string]string{"name": "Ada", "email": "ada@example.com"})
	h.expect(r, http.StatusConflict)
	var refusal struct{ Error string }
	h.decode(r, &refusal)
	if refusal.Error != "no_address_book" {
		t.Fatalf("refusal: %s", r.body)
	}
}
func TestUnconfiguredCardDAVHasAStableStatus(t *testing.T) {
	p := &plugin{}
	_, _, err := p.clientWithAddressBook(context.Background(), nil)
	var status *alps.HTTPError
	if !errors.As(err, &status) || status.Code != http.StatusConflict || status.Message != "carddav_not_configured" {
		t.Fatalf("unconfigured: %v", err)
	}
}
