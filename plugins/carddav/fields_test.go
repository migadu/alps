package alpscarddav

import (
	"fmt"
	"net/http"
	"reflect"
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

func TestLaterAutosaveKeepsOtherCopiesAfterClearing(t *testing.T) {
	h := newHarness(t)
	p := testBook + "grace.vcf"
	h.dav.save(p, withFields())
	c := h.opened(p)
	c.URL, c.PublicKey = "", ""
	for _, fields := range [][]string{{"url", "public_key"}, {"note"}, {}} {
		c.Note = "Later unrelated edit"
		r := h.do("POST", "/contacts/"+pathParam(p)+"/edit", struct {
			ContactData
			ChangedFields []string `json:"changed_fields"`
		}{c, fields})
		h.expect(r, http.StatusOK)
		var saved struct {
			ETag string `json:"etag"`
		}
		h.decode(r, &saved)
		c.ETag = saved.ETag
		want := withFields()
		want[vcard.FieldURL] = want[vcard.FieldURL][1:]
		want[vcard.FieldKey] = want[vcard.FieldKey][1:]
		expectFields(t, h.dav.get(t, p).Card, want, vcard.FieldURL, vcard.FieldKey)
	}
}

func TestChangedKeyRepresentationKeepsIdentityAndOtherKeys(t *testing.T) {
	const armor = "-----BEGIN PGP PUBLIC KEY BLOCK-----\nnew\n-----END PGP PUBLIC KEY BLOCK-----"
	for _, tc := range []struct {
		name, version, old, value, oldType, oldEncoding, wantType, wantEncoding string
	}{
		{"v3 binary to armor", "3.0", "aGVsbG8=", armor, "binary", "b", "text", ""},
		{"v3 binary edit", "3.0", "aGVsbG8=", "d29ybGQ=", "binary", "b", "", "b"},
		{"v3 text edit", "3.0", "old text", armor, "text", "", "text", ""},
		{"v4 text to URI", "4.0", "old text", "data:application/pgp-keys;base64,aGVsbG8=", "text", "", "uri", ""},
		{"v4 URI to armor", "4.0", "https://example.test/old.asc", armor, "uri", "", "text", ""},
		{"v4 URI edit", "4.0", "https://example.test/old.asc", "https://example.test/new.asc", "uri", "", "uri", ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			card := withFields()
			card.SetValue(vcard.FieldVersion, tc.version)
			f := card[vcard.FieldKey][0]
			f.Group, f.Value = "item1", tc.old
			f.Params = vcard.Params{"TYPE": {"PGP"}, "PREF": {"1"}, "X-OWNER": {"Ada"}, "VALUE": {tc.oldType}, "MEDIATYPE": {"application/pgp-keys"}}
			if tc.oldEncoding != "" {
				f.Params.Set("ENCODING", tc.oldEncoding)
			}
			stored := saveFields(t, card, func(c *ContactData) { c.PublicKey = tc.value })
			got := stored[vcard.FieldKey][0]
			if got.Value != tc.value || got.Params.Get("VALUE") != tc.wantType || got.Params.Get("ENCODING") != tc.wantEncoding || got.Params.Get("MEDIATYPE") != "" {
				t.Fatalf("value %q params %v", got.Value, got.Params)
			}
			if got.Group != "item1" || got.Params.Get("TYPE") != "PGP" || got.Params.Get("PREF") != "1" || got.Params.Get("X-OWNER") != "Ada" {
				t.Fatalf("key identity changed: %#v", got)
			}
			if len(stored[vcard.FieldKey]) != 2 || !reflect.DeepEqual(stored[vcard.FieldKey][1], card[vcard.FieldKey][1]) {
				t.Fatal("hidden key changed")
			}
		})
	}
}
