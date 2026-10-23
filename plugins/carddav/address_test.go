package alpscarddav

import (
	"fmt"
	"net/http"
	"reflect"
	"testing"

	"github.com/emersion/go-vcard"
)

// withAddresses is grace with ADR fields as another client wrote them.
func withAddresses(addresses ...*vcard.Field) vcard.Card {
	card := grace("+1 555 0100")
	card[vcard.FieldAddress] = addresses
	return card
}

func home() *vcard.Field {
	return &vcard.Field{
		Value:  ";;1 Main St;Springfield;IL;62701;USA",
		Params: vcard.Params{"TYPE": []string{"HOME"}},
	}
}

func work() *vcard.Field {
	return &vcard.Field{
		Value:  ";Floor 3;20 Market Sq;Chicago;IL;60601;USA",
		Params: vcard.Params{"TYPE": []string{"WORK"}},
	}
}

// saveAddress opens the card, sets the address the page shows (or leaves it
// as it was, for nil), changes the note, saves, and returns the ADR fields
// stored.
func saveAddress(t *testing.T, card vcard.Card, address *string) []*vcard.Field {
	t.Helper()
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, card)
	contact := h.opened(objectPath)
	if address != nil {
		contact.Address = *address
	}
	contact.Note = "Met at the conference"
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusOK)
	stored := h.dav.get(t, objectPath).Card
	if got := valueOf(stored, vcard.FieldNote); got != "Met at the conference" {
		t.Fatalf("note %q, the edit was not saved", got)
	}
	return stored[vcard.FieldAddress]
}

func expectAddresses(t *testing.T, got []*vcard.Field, want ...*vcard.Field) {
	t.Helper()
	same := len(got) == len(want)
	for i := 0; same && i < len(want); i++ {
		same = got[i].Value == want[i].Value && reflect.DeepEqual(map[string][]string(got[i].Params), map[string][]string(want[i].Params))
	}
	if !same {
		t.Fatalf("stored addresses\n%s\nwant\n%s", describe(got), describe(want))
	}
}

func describe(fields []*vcard.Field) string {
	s := ""
	for _, f := range fields {
		s += fmt.Sprintf("  %q %v\n", f.Value, f.Params)
	}
	return s
}

func address(s string) *string { return &s }

// The editor shows an address as one line, and every save wrote that line
// back as the street of a bare ADR, whatever was edited: the city, region,
// postal code and country became part of the street, the type was dropped,
// and so was every other address the card held.
func TestSaveKeepsTheAddressItDidNotChange(t *testing.T) {
	expectAddresses(t, saveAddress(t, withAddresses(home(), work()), nil), home(), work())
}

// An edit that keeps the line's shape, one part per part the card holds,
// changes those parts, and the address keeps its type; the other addresses
// stay.
func TestSaveWritesAnEditedAddressIntoItsParts(t *testing.T) {
	stored := saveAddress(t, withAddresses(home(), work()), address("1 Main St, Shelbyville, IL, 62701, USA"))
	moved := home()
	moved.Value = ";;1 Main St;Shelbyville;IL;62701;USA"
	expectAddresses(t, stored, moved, work())

	// The post office box, which the line does not show, stays as well.
	box := work()
	box.Value = "PO Box 7;Floor 3;20 Market Sq;Chicago;IL;60601;USA"
	stored = saveAddress(t, withAddresses(box), address("20 Market Sq, Floor 4, Chicago, IL, 60601, USA"))
	box.Value = "PO Box 7;Floor 4;20 Market Sq;Chicago;IL;60601;USA"
	expectAddresses(t, stored, box)
}

// A line of another shape cannot be told apart into parts, so it is the
// street, as before, but of the same address: its type stays, and so do the
// other addresses. Its label, which describes the old address, does not.
func TestSaveWritesAReshapedAddressAsItsStreet(t *testing.T) {
	labelled := home()
	labelled.Params["LABEL"] = []string{"1 Main St\nSpringfield IL 62701"}
	stored := saveAddress(t, withAddresses(labelled, work()), address("742 Evergreen Terrace, Springfield"))
	want := home()
	want.Value = ";;742 Evergreen Terrace, Springfield;;;;"
	expectAddresses(t, stored, want, work())

	// A part that holds a comma makes the line's commas no guide to its parts.
	comma := home()
	comma.Value = ";;1 Main St, Apt 4;Springfield;IL;62701;USA"
	stored = saveAddress(t, withAddresses(comma), address("1 Main St, Apt 4, Shelbyville, IL, 62701"))
	want.Value = ";;1 Main St, Apt 4, Shelbyville, IL, 62701;;;;"
	expectAddresses(t, stored, want)
}

// Clearing the address removes the one the page showed; a card without one
// gets the line as its street, as before.
func TestSaveClearsOrAddsTheAddress(t *testing.T) {
	expectAddresses(t, saveAddress(t, withAddresses(home(), work()), address("")), work())
	expectAddresses(t, saveAddress(t, grace("+1 555 0100"), address("1 Main St, Springfield")),
		&vcard.Field{Value: ";;1 Main St, Springfield;;;;"})
}
