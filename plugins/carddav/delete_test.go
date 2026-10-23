package alpscarddav

import (
	"net/http"
	"strconv"
	"testing"
)

// A card already gone, deleted from another device or by a second click, is
// what a delete asks for. The CardDAV server's 404 used to come back as 500,
// so the page said the delete had failed.
func TestContactDeleteOfACardAlreadyGoneSucceeds(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("555-0100"))

	h.expect(h.do("DELETE", "/contacts/"+pathParam(objectPath), nil), http.StatusOK)
	h.dav.mu.Lock()
	_, stored := h.dav.objects[objectPath]
	h.dav.mu.Unlock()
	if stored {
		t.Fatal("the card is still stored")
	}
	h.expect(h.do("DELETE", "/contacts/"+pathParam(objectPath), nil), http.StatusOK)
}

// A delete the server refuses keeps the server's reason: a read-only address
// book or a version conflict is not an outage, and the page tells a refusal
// from a failure that may have deleted the card anyway by the status. Any
// other failure is still an internal error.
func TestContactDeleteRefusalsKeepTheirStatus(t *testing.T) {
	for refused, want := range map[int]int{
		http.StatusForbidden:           http.StatusForbidden,
		http.StatusConflict:            http.StatusConflict,
		http.StatusPreconditionFailed:  http.StatusPreconditionFailed,
		http.StatusInternalServerError: http.StatusInternalServerError,
	} {
		t.Run(strconv.Itoa(refused), func(t *testing.T) {
			h := newHarness(t)
			objectPath := testBook + "grace.vcf"
			h.dav.save(objectPath, grace("555-0100"))
			h.dav.refuseDelete = refused

			h.expect(h.do("DELETE", "/contacts/"+pathParam(objectPath), nil), want)
			h.dav.get(t, objectPath)
		})
	}
}
