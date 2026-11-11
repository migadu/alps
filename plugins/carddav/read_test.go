package alpscarddav

import (
	"net/http"
	"testing"
)

// A card deleted from another device while the page still lists it is not
// there to read. The CardDAV server's 404 came back as 500, so the page logged
// a failure for a contact that is simply gone.
func TestContactReadOfACardGoneIsNotFound(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("555-0100"))
	h.expect(h.do("GET", "/contacts/"+pathParam(objectPath), nil), http.StatusOK)

	h.dav.mu.Lock()
	delete(h.dav.objects, objectPath)
	h.dav.mu.Unlock()
	h.expect(h.do("GET", "/contacts/"+pathParam(objectPath), nil), http.StatusNotFound)
}
