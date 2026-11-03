package alpscarddav

import (
	"net/http"
	"testing"

	"github.com/emersion/go-vcard"
)

// partsEdit is the edit the contact editor sends: the address part by part,
// with what it last held of it.
type partsEdit struct {
	ContactData
	ChangedFields    []string       `json:"changed_fields"`
	AddressPartsFrom *PostalAddress `json:"address_parts_from"`
}

// editParts opens the card at objectPath, lets edit change the parts it was
// given, and saves them as the editor does.
func editParts(t *testing.T, h *harness, objectPath string, edit func(*PostalAddress)) {
	t.Helper()
	contact := h.opened(objectPath)
	var from PostalAddress
	if contact.AddressParts != nil {
		from = *contact.AddressParts
	}
	parts := from
	edit(&parts)
	contact.AddressParts = &parts
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", partsEdit{contact, []string{"address"}, &from}), http.StatusOK)
}

// saveParts is editParts on card, and the ADR fields it then holds.
func saveParts(t *testing.T, card vcard.Card, edit func(*PostalAddress)) []*vcard.Field {
	t.Helper()
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, card)
	editParts(t, h, objectPath, edit)
	return h.dav.get(t, objectPath).Card[vcard.FieldAddress]
}

// rawParts is editParts on a card held as written, and its ADR line then.
func rawParts(t *testing.T, adr string, edit func(*PostalAddress)) string {
	t.Helper()
	card := rawGrace(adr)
	editParts(t, newHarnessWrapping(t, card.wrap), card.path, edit)
	return line(card.text, "ADR")
}

// The page is given the preferred address part by part, the post office box
// among them, which its one line leaves out.
func TestContactCarriesTheAddressParts(t *testing.T) {
	card := rawGrace(`ADR;TYPE=WORK:PO Box 7;Floor 3;20 Market Sq\, Unit 2;Chicago;IL;60601;USA`, "ADR;TYPE=HOME:;;1 Main St;Springfield;IL;62701;USA")
	got := newHarnessWrapping(t, card.wrap).opened(card.path).AddressParts
	want := PostalAddress{POBox: "PO Box 7", Extended: "Floor 3", Street: "20 Market Sq, Unit 2", Locality: "Chicago", Region: "IL", PostalCode: "60601", Country: "USA"}
	if got == nil || *got != want {
		t.Fatalf("address parts %+v, want %+v", got, want)
	}

	h := newHarness(t)
	h.dav.save(testBook+"grace.vcf", grace("+1 555 0100"))
	if got := h.opened(testBook + "grace.vcf").AddressParts; got != nil {
		t.Fatalf("address parts %+v for a card without an address", got)
	}
}

// Each part is written into its own component, whatever else changed. Sent
// as one line, a reshaped address became the street: here the line lost a
// part and gained one, and the city, region, postal code and country went
// into the street.
func TestSaveWritesEachAddressPart(t *testing.T) {
	stored := saveParts(t, withAddresses(home(), work()), func(a *PostalAddress) {
		a.Region = ""
		a.POBox = "PO Box 12"
		a.Locality = "Shelbyville"
	})
	moved := home()
	moved.Value = "PO Box 12;;1 Main St;Shelbyville;;62701;USA"
	expectAddresses(t, stored, moved, work())
}

// Only the parts that changed are written. One sent back as given stays as
// written: here a street of two lines, a list, which a part written from
// the page would make one value. So does the label of an address none of
// whose parts changed.
func TestSaveKeepsTheAddressPartsItDidNotChange(t *testing.T) {
	twoLines := home()
	twoLines.Value = "PO Box 7;;1 Main St,Apt 4;Springfield;IL;62701;USA"
	twoLines.Params["LABEL"] = []string{"1 Main St\nSpringfield IL"}
	expectAddresses(t, saveParts(t, withAddresses(twoLines), func(*PostalAddress) {}), twoLines)

	stored := saveParts(t, withAddresses(twoLines), func(a *PostalAddress) { a.PostalCode = "62702" })
	want := home()
	want.Value = "PO Box 7;;1 Main St,Apt 4;Springfield;IL;62702;USA"
	expectAddresses(t, stored, want)

	// A part typed with a comma or a semicolon is that one value, and one
	// sent back as given keeps its escapes.
	got := rawParts(t, `ADR;TYPE=HOME:;;1 Main St\, Apt 4;Springfield;IL;62701;USA`, func(a *PostalAddress) { a.Extended = "Floor 2; rear" })
	if want := `ADR;TYPE=HOME:;Floor 2\; rear;1 Main St\, Apt 4;Springfield;IL;62701;USA`; got != want {
		t.Fatalf("address written as %q, want %q", got, want)
	}
}

// Every part cleared removes the address the page showed; a card without
// one gets the parts as its address.
func TestSaveClearsOrAddsTheAddressParts(t *testing.T) {
	expectAddresses(t, saveParts(t, withAddresses(home(), work()), func(a *PostalAddress) { *a = PostalAddress{} }), work())
	expectAddresses(t, saveParts(t, grace("+1 555 0100"), func(a *PostalAddress) {
		*a = PostalAddress{Street: "1 Main St", Locality: "Springfield", Country: "USA"}
	}), &vcard.Field{Value: ";;1 Main St;Springfield;;;USA"})
}

// Once the page has cleared the address it showed, the card's next address
// is the preferred one, which the page never showed. What is typed then is
// an address of its own, beside it, and not written over its parts.
func TestAddressPartsTypedAfterClearingAreANewAddress(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, withAddresses(home(), work()))
	contact := h.opened(objectPath)
	from := *contact.AddressParts
	save := func(parts PostalAddress) {
		t.Helper()
		contact.AddressParts = &parts
		r := h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", partsEdit{contact, []string{"address"}, &from})
		h.expect(r, http.StatusOK)
		var saved struct {
			ETag string `json:"etag"`
		}
		h.decode(r, &saved)
		contact.ETag = saved.ETag
		from = parts
	}

	save(PostalAddress{})
	expectAddresses(t, h.dav.get(t, objectPath).Card[vcard.FieldAddress], work())
	save(PostalAddress{Locality: "Paris"})
	expectAddresses(t, h.dav.get(t, objectPath).Card[vcard.FieldAddress], &vcard.Field{Value: ";;;Paris;;;"}, work())
}

// A page that sends the parts it was given back with the card, and does not
// edit them, is heard by its line, as before.
func TestAddressLineStillEditsWithoutTheParts(t *testing.T) {
	stored := saveAddress(t, withAddresses(home()), address("1 Main St, Shelbyville, IL, 62701, USA"))
	moved := home()
	moved.Value = ";;1 Main St;Shelbyville;IL;62701;USA"
	expectAddresses(t, stored, moved)
}
