package alpscarddav

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/emersion/go-vcard"
)

// withFields is grace with fields as another client wrote them: two typed
// URLs, a note and a title in a language, a typed nickname, an organisation
// with its sort name, and two keys.
func withFields() vcard.Card {
	card := grace("+1 555 0100")
	card[vcard.FieldURL] = []*vcard.Field{
		{Value: "https://work.example", Params: vcard.Params{"TYPE": []string{"WORK"}}},
		{Value: "https://home.example", Params: vcard.Params{"TYPE": []string{"HOME"}}},
	}
	card[vcard.FieldNote] = []*vcard.Field{{Value: "Wrote the first compiler", Params: vcard.Params{"LANGUAGE": []string{"en"}}}}
	card[vcard.FieldTitle] = []*vcard.Field{{Value: "Rear Admiral", Params: vcard.Params{"LANGUAGE": []string{"en"}}}}
	card[vcard.FieldNickname] = []*vcard.Field{{Value: "Amazing Grace", Params: vcard.Params{"TYPE": []string{"WORK"}}}}
	card[vcard.FieldOrganization] = []*vcard.Field{{Value: "US Navy", Params: vcard.Params{"SORT-AS": []string{"Navy"}}}}
	card[vcard.FieldKey] = []*vcard.Field{
		{Value: "-----BEGIN PGP PUBLIC KEY BLOCK-----", Params: vcard.Params{"TYPE": []string{"PGP"}}},
		{Value: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A", Params: vcard.Params{"TYPE": []string{"X509"}}},
	}
	return card
}

var shownFields = []string{vcard.FieldOrganization, vcard.FieldTitle, vcard.FieldNote, vcard.FieldURL, vcard.FieldNickname, vcard.FieldKey}

// saveFields opens the card, lets edit change what the page shows, changes
// the phone number, saves, and returns the card stored.
func saveFields(t *testing.T, card vcard.Card, edit func(*ContactData)) vcard.Card {
	t.Helper()
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, card)
	contact := h.opened(objectPath)
	if edit != nil {
		edit(&contact)
	}
	contact.Phones = []ContactProperty{{Value: "+1 555 0199"}}
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusOK)
	stored := h.dav.get(t, objectPath).Card
	if got := valueOf(stored, vcard.FieldTelephone); got != "+1 555 0199" {
		t.Fatalf("telephone %q, the edit was not saved", got)
	}
	return stored
}

func fieldsOf(card vcard.Card, field string) string {
	s := ""
	for _, f := range card[field] {
		s += fmt.Sprintf("  %q %v\n", f.Value, map[string][]string(f.Params))
	}
	return s
}

func expectFields(t *testing.T, stored, want vcard.Card, fields ...string) {
	t.Helper()
	for _, field := range fields {
		if got, want := fieldsOf(stored, field), fieldsOf(want, field); got != want {
			t.Errorf("stored %s\n%swant\n%s", field, got, want)
		}
	}
}

// A save wrote one bare copy of each of these fields, whatever was edited:
// the card's second URL and second key were dropped, and so were the types,
// languages and sort names of the rest.
func TestSaveKeepsTheFieldsItDidNotChange(t *testing.T) {
	expectFields(t, saveFields(t, withFields(), nil), withFields(), shownFields...)
}

// A field the user changes takes the new value in place of the copy the page
// showed, with that copy's parameters; the other copies stay.
func TestSaveWritesAChangedFieldInPlace(t *testing.T) {
	stored := saveFields(t, withFields(), func(c *ContactData) {
		c.URL = "https://navy.example"
		c.Note = "Found the first bug"
	})
	want := withFields()
	want[vcard.FieldURL][0].Value = "https://navy.example"
	want[vcard.FieldNote][0].Value = "Found the first bug"
	expectFields(t, stored, want, shownFields...)
}

// Cleared, the copy the page showed goes and the others stay; a field the
// card did not have is added bare.
func TestSaveClearsTheShownCopyAndAddsANewField(t *testing.T) {
	stored := saveFields(t, withFields(), func(c *ContactData) {
		c.URL = ""
		c.Nickname = ""
	})
	want := withFields()
	want[vcard.FieldURL] = want[vcard.FieldURL][1:]
	delete(want, vcard.FieldNickname)
	expectFields(t, stored, want, shownFields...)

	stored = saveFields(t, grace("+1 555 0100"), func(c *ContactData) { c.Title = "Commodore" })
	want = grace("+1 555 0100")
	want[vcard.FieldTitle] = []*vcard.Field{{Value: "Commodore"}}
	expectFields(t, stored, want, vcard.FieldTitle)
}
