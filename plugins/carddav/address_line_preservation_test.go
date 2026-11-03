package alpscarddav

import (
	"net/http"
	"testing"

	"github.com/emersion/go-vcard"
)

func TestAddressLineIncludesThePostOfficeBox(t *testing.T) {
	card := rawGrace(`ADR;TYPE=WORK:PO Box 7;Floor 3;20 Market Sq\, Unit 2;Chicago;IL;60601;USA`)
	got := newHarnessWrapping(t, card.wrap).opened(card.path).Address
	want := "20 Market Sq, Unit 2, Floor 3, PO Box 7, Chicago, IL, 60601, USA"
	if got != want {
		t.Fatalf("address line %q, want %q", got, want)
	}
}

func TestAmbiguousAddressLineKeepsTheOriginalAddress(t *testing.T) {
	card := rawGrace(`ADR;TYPE=HOME;GEO="geo:39.8,-89.6";LABEL="1 Main St\nSpringfield IL 62701":PO Box 7;;1 Main St;Springfield;IL;62701;USA`,
		`ADR;TYPE=WORK:;Floor 3;20 Market Sq;Chicago;IL;60601;USA`)
	original := decodeCard(t, card.text)[vcard.FieldAddress]
	h := newHarnessWrapping(t, card.wrap)
	contact := h.opened(card.path)
	contact.Address = "742 Evergreen Terrace, Springfield"
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/edit", contact), http.StatusOK)
	got := decodeCard(t, card.text)[vcard.FieldAddress]
	expectAddresses(t, got, &vcard.Field{Value: ";;742 Evergreen Terrace, Springfield;;;;"}, original[0], original[1])
}

func TestLaterLineEditsUpdateOnlyTheUnstructuredCopy(t *testing.T) {
	h := newHarness(t)
	path := testBook + "grace.vcf"
	h.dav.save(path, withAddresses(home(), work()))
	for _, line := range []string{"742 Evergreen Terrace, Springfield", "742 Evergreen Terrace, Shelbyville"} {
		contact := h.opened(path)
		contact.Address = line
		h.expect(h.do("POST", "/contacts/"+pathParam(path)+"/edit", contact), http.StatusOK)
	}
	expectAddresses(t, h.dav.get(t, path).Card[vcard.FieldAddress],
		&vcard.Field{Value: ";;742 Evergreen Terrace, Shelbyville;;;;"}, home(), work())
}
