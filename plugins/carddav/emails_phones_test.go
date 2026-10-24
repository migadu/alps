package alpscarddav

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/emersion/go-vcard"
)

// withEmailsAndPhones is grace with addresses and numbers as other clients
// write them: two types on one address, a preferred one in an Apple group
// with its label, and a preferred number of two types.
func withEmailsAndPhones() vcard.Card {
	card := grace("+1 555 0100")
	card[vcard.FieldEmail] = []*vcard.Field{
		{Value: "grace@navy.example", Params: vcard.Params{"TYPE": []string{"INTERNET", "WORK"}}},
		{Value: "grace@home.example", Params: vcard.Params{"TYPE": []string{"HOME"}, "PREF": []string{"1"}}, Group: "item1"},
	}
	card["X-ABLABEL"] = []*vcard.Field{{Value: "Summer house", Group: "item1"}}
	card[vcard.FieldTelephone] = []*vcard.Field{
		{Value: "+1 555 0100", Params: vcard.Params{"TYPE": []string{"CELL", "VOICE", "pref"}}},
	}
	return card
}

// saveEmailsAndPhones opens the card, lets edit change what the page holds,
// changes the note, saves, and returns the card stored.
func saveEmailsAndPhones(t *testing.T, edit func(*ContactData)) vcard.Card {
	t.Helper()
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, withEmailsAndPhones())
	contact := h.opened(objectPath)
	if edit != nil {
		edit(&contact)
	}
	contact.Note = "Met at the conference"
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusOK)
	stored := h.dav.get(t, objectPath).Card
	if got := valueOf(stored, vcard.FieldNote); got != "Met at the conference" {
		t.Fatalf("note %q, the edit was not saved", got)
	}
	return stored
}

// groupedFieldsOf is a field's copies, each with its group and parameters.
func groupedFieldsOf(card vcard.Card, field string) string {
	s := ""
	for _, f := range card[field] {
		s += fmt.Sprintf("  %s.%q %v\n", f.Group, f.Value, map[string][]string(f.Params))
	}
	return s
}

func expectEmailsAndPhones(t *testing.T, stored, want vcard.Card) {
	t.Helper()
	for _, field := range []string{vcard.FieldEmail, vcard.FieldTelephone} {
		if got, want := groupedFieldsOf(stored, field), groupedFieldsOf(want, field); got != want {
			t.Errorf("stored %s\n%swant\n%s", field, got, want)
		}
	}
}

// A save rebuilt every address and number from the page's value and one
// type: a second type, a preference and an Apple group were dropped, the
// group's label left behind, whatever had been edited.
func TestSaveKeepsTheEmailsAndPhonesItDidNotChange(t *testing.T) {
	expectEmailsAndPhones(t, saveEmailsAndPhones(t, nil), withEmailsAndPhones())
}

// An edited address takes the place of the copy it replaces, with that copy's
// group and parameters; a new type replaces the types the page could not
// show, but not the preference.
func TestSaveWritesAChangedEmailOrPhoneInPlace(t *testing.T) {
	stored := saveEmailsAndPhones(t, func(c *ContactData) {
		c.Emails[1].Value = "grace@summer.example"
		c.Phones[0].Type = "work"
	})
	want := withEmailsAndPhones()
	want[vcard.FieldEmail][1].Value = "grace@summer.example"
	want[vcard.FieldTelephone][0].Params = vcard.Params{"TYPE": []string{"pref", "WORK"}}
	expectEmailsAndPhones(t, stored, want)
}

// A removed address goes and the others stay as they were; an added one is
// written as before.
func TestSaveRemovesAndAddsEmails(t *testing.T) {
	stored := saveEmailsAndPhones(t, func(c *ContactData) {
		c.Emails = append(c.Emails[1:], ContactProperty{Value: "grace@harvard.example", Type: "other"})
	})
	want := withEmailsAndPhones()
	want[vcard.FieldEmail] = append(want[vcard.FieldEmail][1:],
		&vcard.Field{Value: "grace@harvard.example", Params: vcard.Params{"TYPE": []string{"OTHER"}}})
	expectEmailsAndPhones(t, stored, want)
}

// A client that sends one address rather than the list changes the copy the
// page would show, as for the single-value fields, and the others stay.
func TestSaveOfOneAddressChangesTheShownCopy(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, withEmailsAndPhones())
	opened := h.opened(objectPath)
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", map[string]any{
		"name":  "Grace Hopper",
		"email": "grace@fleet.example",
		"phone": "+1 555 0100",
		"etag":  opened.ETag,
	}), http.StatusOK)

	want := withEmailsAndPhones()
	want[vcard.FieldEmail][1].Value = "grace@fleet.example"
	expectEmailsAndPhones(t, h.dav.get(t, objectPath).Card, want)
}
