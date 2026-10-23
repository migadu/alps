package alpscarddav

import (
	"net/http"
	"testing"

	"github.com/emersion/go-vcard"
)

// The page shows one copy of a field, the preferred one. Clearing it removes
// that copy, and the next one becomes the preferred copy on the server, but
// the page still shows the field empty. A value typed there then took the
// place of that copy, which the page had never shown: the card lost it.
// Each changed field now says what the page last held for it, and a value
// typed over a copy the page did not show is added beside it.
func TestTypingAfterAClearKeepsTheCopyThePageDidNotShow(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	card := grace("+1 555 0100")
	card[vcard.FieldURL] = []*vcard.Field{
		{Value: "https://work.example", Params: vcard.Params{"PREF": []string{"1"}}},
		{Value: "https://home.example"},
	}
	card[vcard.FieldAddress] = []*vcard.Field{
		{Value: ";;1 Main St;Springfield;;;", Params: vcard.Params{"PREF": []string{"1"}}},
		{Value: ";;20 Market Sq;Chicago;;;"},
	}
	h.dav.save(objectPath, card)
	contact := h.opened(objectPath)

	// The first autosave clears both fields.
	save := func(url, address string, from map[string]string) {
		t.Helper()
		contact.URL, contact.Address = url, address
		r := h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", map[string]any{
			"name": contact.Name, "email": contact.Email, "phone": contact.Phone,
			"url": url, "address": address, "categories": contact.Categories, "etag": contact.ETag,
			"changed_fields": []string{"url", "address"}, "changed_from": from,
		})
		h.expect(r, http.StatusOK)
		var saved struct{ ETag string }
		h.decode(r, &saved)
		contact.ETag = saved.ETag
	}
	save("", "", map[string]string{"url": "https://work.example", "address": "1 Main St, Springfield"})
	// The second types new values into the fields the page shows empty.
	save("https://new.example", "742 Evergreen Terrace", map[string]string{"url": "", "address": ""})

	stored := h.dav.get(t, objectPath).Card
	if got, want := fieldsOf(stored, vcard.FieldURL), "  \"https://new.example\" map[]\n  \"https://home.example\" map[]\n"; got != want {
		t.Errorf("stored URL\n%swant\n%s", got, want)
	}
	if got, want := fieldsOf(stored, vcard.FieldAddress), "  \";;742 Evergreen Terrace;;;;\" map[]\n  \";;20 Market Sq;Chicago;;;\" map[]\n"; got != want {
		t.Errorf("stored ADR\n%swant\n%s", got, want)
	}

	// The value typed is the copy the page shows from then on, so changing
	// it again changes that copy.
	if got := h.opened(objectPath); got.URL != "https://new.example" || got.Address != "742 Evergreen Terrace" {
		t.Fatalf("the page reads URL %q and address %q", got.URL, got.Address)
	}
	save("https://newer.example", "742 Evergreen Terrace", map[string]string{"url": "https://new.example"})
	if got, want := fieldsOf(h.dav.get(t, objectPath).Card, vcard.FieldURL), "  \"https://newer.example\" map[]\n  \"https://home.example\" map[]\n"; got != want {
		t.Errorf("stored URL\n%swant\n%s", got, want)
	}
}

// A copy typed in beside a preferred one is preferred too, so the page reads
// it back.
func TestTypedCopyIsPreferredBesideAPreferredOne(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	card := grace("+1 555 0100")
	card[vcard.FieldURL] = []*vcard.Field{
		{Value: "https://work.example", Params: vcard.Params{"PREF": []string{"1"}}},
		{Value: "https://home.example", Params: vcard.Params{"PREF": []string{"2"}}},
	}
	h.dav.save(objectPath, card)
	contact := h.opened(objectPath)
	for _, step := range []struct{ url, from string }{{"", "https://work.example"}, {"https://new.example", ""}} {
		r := h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", map[string]any{
			"name": contact.Name, "email": contact.Email, "phone": contact.Phone, "url": step.url, "etag": contact.ETag,
			"changed_fields": []string{"url"}, "changed_from": map[string]string{"url": step.from},
		})
		h.expect(r, http.StatusOK)
		h.decode(r, &contact)
	}
	if got := h.opened(objectPath).URL; got != "https://new.example" {
		t.Fatalf("the page reads URL %q, want the one typed", got)
	}
	if got, want := fieldsOf(h.dav.get(t, objectPath).Card, vcard.FieldURL), "  \"https://new.example\" map[PREF:[1]]\n  \"https://home.example\" map[PREF:[2]]\n"; got != want {
		t.Errorf("stored URL\n%swant\n%s", got, want)
	}
}

// An edit that says nothing about the categories leaves them as stored: the
// editor has no field for them, and the toolbar's star and category picker
// write them on their own. The form's copy, taken when editing began, put back
// what a star made while editing had changed.
func TestEditWithoutCategoriesKeepsThem(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("+1 555 0100", "Navy", "Favorites"))
	contact := h.opened(objectPath)

	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", map[string]any{
		"name": contact.Name, "email": contact.Email, "phone": contact.Phone,
		"nickname": "Amazing Grace", "etag": contact.ETag, "changed_fields": []string{"nickname"},
	}), http.StatusOK)

	stored := h.dav.get(t, objectPath).Card
	if got := valueOf(stored, vcard.FieldCategories); got != "Navy,Favorites" {
		t.Fatalf("categories %q, want them kept", got)
	}
	if got := valueOf(stored, vcard.FieldNickname); got != "Amazing Grace" {
		t.Fatalf("nickname %q", got)
	}
}
