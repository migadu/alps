package alpscarddav

import (
	"net/http"
	"testing"
)

// A card deleted from another device after the page read it is not there to
// write. An edit and a category change each read the card first, and answered
// the CardDAV server's 404 as 500: the page took a contact that is simply
// gone for a backend outage, and said the save had failed or might have
// happened.
func TestWritingACardGoneIsNotFound(t *testing.T) {
	objectPath := testBook + "grace.vcf"
	for what, req := range map[string]struct {
		route string
		body  any
	}{
		"edited": {"/edit", ContactData{Name: "Grace Hopper", Email: "grace@example.test"}},
		"filed":  {"/categories", map[string][]string{"categories": {"Friends"}}},
	} {
		t.Run(what, func(t *testing.T) {
			h := newHarness(t)
			h.dav.save(objectPath, grace("555-0100"))
			h.expect(h.do("GET", "/contacts/"+pathParam(objectPath), nil), http.StatusOK)

			h.dav.mu.Lock()
			delete(h.dav.objects, objectPath)
			h.dav.mu.Unlock()
			h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+req.route, req.body), http.StatusNotFound)
		})
	}
}
