package alpscarddav

import (
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-vcard"
)

// The contact editor's create says it wants the card it is creating: a create
// answered with another card's path, without that card's version or fields,
// made the editor edit the other card, and every later autosave of the new
// contact was refused for want of a version. The composer's create of each
// recipient, which says nothing, still leaves a known address alone.
func TestCreateFromTheEditorMakesTheCardWhoeverHasItsAddress(t *testing.T) {
	h := newHarness(t)
	existing := testBook + "grace.vcf"
	h.dav.save(existing, grace("+1 555 0100"))

	r := h.do("POST", "/contacts/create", map[string]any{"name": "Grace Hopper", "email": "grace@example.com"})
	h.expect(r, http.StatusOK)
	var known struct{ Path, ETag string }
	h.decode(r, &known)
	if known.Path != existing {
		t.Fatalf("the composer's create answered %q, want the known card %q", known.Path, existing)
	}

	r = h.do("POST", "/contacts/create", map[string]any{
		"name":            "Grace B. Hopper",
		"emails":          []map[string]string{{"value": "grace@example.com"}},
		"allow_duplicate": true,
	})
	h.expect(r, http.StatusOK)
	var created struct{ Path, ETag string }
	h.decode(r, &created)
	if created.Path == existing || !strings.HasPrefix(created.Path, testBook) || created.ETag == "" {
		t.Fatalf("the editor's create answered path %q, version %q; want a new card with its version", created.Path, created.ETag)
	}
	stored := h.dav.get(t, created.Path)
	if valueOf(stored.Card, vcard.FieldFormattedName) != "Grace B. Hopper" || stored.ETag != created.ETag {
		t.Fatalf("stored %v at version %q", stored.Card, stored.ETag)
	}
	if got := valueOf(h.dav.get(t, existing).Card, vcard.FieldFormattedName); got != "Grace Hopper" {
		t.Fatalf("the known card's name is now %q", got)
	}
}

func TestCreateRetryUsesTheSameIdentityAndNeverOverwrites(t *testing.T) {
	h := newHarness(t)
	id := "c389f7f5-7fbd-4f16-8940-cc506d9b298a"
	payload := map[string]any{"name": "First", "allow_duplicate": true, "creation_id": id}
	r := h.do("POST", "/contacts/create", payload)
	h.expect(r, http.StatusOK)
	var made struct{ Path, ETag string }
	h.decode(r, &made)
	if made.Path != testBook+id+".vcf" {
		t.Fatalf("created at %q", made.Path)
	}
	payload["name"] = "Retry"
	h.expect(h.do("POST", "/contacts/create", payload), http.StatusPreconditionFailed)
	if got := valueOf(h.dav.get(t, made.Path).Card, vcard.FieldFormattedName); got != "First" {
		t.Fatalf("retry overwrote %q", got)
	}
	h.expect(h.do("POST", "/contacts/create", map[string]any{"creation_id": "../bad"}), http.StatusBadRequest)
}
