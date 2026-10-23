package alpscarddav

import (
	"net/http"
	"reflect"
	"strings"
	"testing"
)

// rawGrace is a card as a client stored it, with these further lines.
func rawGrace(lines ...string) *rawCard {
	return &rawCard{path: testBook + "grace.vcf", text: strings.Join(append(append([]string{
		"BEGIN:VCARD",
		"VERSION:3.0",
		"UID:urn:uuid:grace",
		"FN:Grace Hopper",
		"EMAIL:grace@example.com",
	}, lines...), "END:VCARD", ""), "\r\n")}
}

// line is the line of the card's text that holds property, or "".
func line(text, property string) string {
	for _, l := range strings.Split(text, "\r\n") {
		if strings.HasPrefix(l, property+":") || strings.HasPrefix(l, property+";") {
			return l
		}
	}
	return ""
}

func star(t *testing.T, h *harness, card *rawCard, categories ...string) {
	t.Helper()
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/categories", map[string]any{"categories": categories}), http.StatusOK)
}

// In CATEGORIES a comma separates two categories (RFC 6350, 6.7.1); escaped,
// it is part of one. Every write escaped them all, so a star turned
// CATEGORIES:Navy,Work into one category, "Navy,Work,Favorites", for every
// other client.
func TestCategoriesAreWrittenAsAList(t *testing.T) {
	card := rawGrace("CATEGORIES:Navy,Work")
	h := newHarnessWrapping(t, card.wrap)
	if got := h.opened(card.path).Categories; !reflect.DeepEqual(got, []string{"Navy", "Work"}) {
		t.Fatalf("categories read as %q", got)
	}
	star(t, h, card, "Navy", "Work", "Favorites")
	if got := line(card.text, "CATEGORIES"); got != "CATEGORIES:Navy,Work,Favorites" {
		t.Fatalf("written as %q, want CATEGORIES:Navy,Work,Favorites", got)
	}
	if got := h.opened(card.path).Categories; !reflect.DeepEqual(got, []string{"Navy", "Work", "Favorites"}) {
		t.Fatalf("read back as %q", got)
	}
}

// A comma escaped in a category's name is part of the name: it is read as
// one category, and written back escaped.
func TestACategoryNameKeepsItsComma(t *testing.T) {
	card := rawGrace(`CATEGORIES:Clients\, EMEA,Navy`)
	h := newHarnessWrapping(t, card.wrap)
	if got := h.opened(card.path).Categories; !reflect.DeepEqual(got, []string{"Clients, EMEA", "Navy"}) {
		t.Fatalf("categories read as %q, want [\"Clients, EMEA\" \"Navy\"]", got)
	}
	star(t, h, card, "Clients, EMEA", "Navy", "Favorites")
	if got := line(card.text, "CATEGORIES"); got != `CATEGORIES:Clients\, EMEA,Navy,Favorites` {
		t.Fatalf(`written as %q, want CATEGORIES:Clients\, EMEA,Navy,Favorites`, got)
	}
	if got := h.opened(card.path).Categories; !reflect.DeepEqual(got, []string{"Clients, EMEA", "Navy", "Favorites"}) {
		t.Fatalf("read back as %q", got)
	}
}

// go-webdav's own server, and anything else that writes with go-vcard,
// escapes every comma, separators too: such a list is still a list.
func TestCategoriesAllEscapedAreStillAList(t *testing.T) {
	card := rawGrace(`CATEGORIES:Navy\,Work`)
	h := newHarnessWrapping(t, card.wrap)
	if got := h.opened(card.path).Categories; !reflect.DeepEqual(got, []string{"Navy", "Work"}) {
		t.Fatalf("categories read as %q", got)
	}
}

// NICKNAME is a list too (RFC 6350, 6.2.3). An edit of another field writes
// it back as it was: a list with plain commas, a comma escaped in a nickname
// still escaped. A nickname the user types is written with its commas as the
// separators they were shown as.
func TestNicknamesAreWrittenAsAList(t *testing.T) {
	card := rawGrace(`NICKNAME:Gracie,Amazing\, Grace`)
	h := newHarnessWrapping(t, card.wrap)
	contact := h.opened(card.path)
	if contact.Nickname != "Gracie,Amazing, Grace" {
		t.Fatalf("nickname shown as %q", contact.Nickname)
	}
	contact.Note = "Met at the conference"
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/edit", contact), http.StatusOK)
	if got := line(card.text, "NICKNAME"); got != `NICKNAME:Gracie,Amazing\, Grace` {
		t.Fatalf(`written as %q, want NICKNAME:Gracie,Amazing\, Grace`, got)
	}

	contact = h.opened(card.path)
	contact.Nickname = "Gracie,Admiral"
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/edit", map[string]any{
		"name": contact.Name, "email": contact.Email, "nickname": contact.Nickname, "note": contact.Note,
		"etag": contact.ETag, "changed_fields": []string{"nickname"},
	}), http.StatusOK)
	if got := line(card.text, "NICKNAME"); got != "NICKNAME:Gracie,Admiral" {
		t.Fatalf("written as %q, want NICKNAME:Gracie,Admiral", got)
	}
}

// keepListEscapes doubles the backslashes of a list property's value, and of
// nothing else, in a card or in the address data of a multistatus, wherever
// its line breaks are written as character references or its lines folded.
func TestKeepListEscapes(t *testing.T) {
	for _, tc := range []struct{ name, in, want string }{
		{"a card",
			"BEGIN:VCARD\r\nNOTE:a\\, b\r\nCATEGORIES:Clients\\, EMEA,Navy\r\nitem1.NICKNAME;X-A=\"x:y\\\";z\":Amazing\\, Grace\r\nEND:VCARD\r\n",
			"BEGIN:VCARD\r\nNOTE:a\\, b\r\nCATEGORIES:Clients\\\\, EMEA,Navy\r\nitem1.NICKNAME;X-A=\"x:y\\\";z\":Amazing\\\\, Grace\r\nEND:VCARD\r\n"},
		{"a folded line",
			"BEGIN:VCARD\r\nCATEGORIES:Clients\\\r\n , EMEA\r\nEND:VCARD\r\n",
			"BEGIN:VCARD\r\nCATEGORIES:Clients\\\\\r\n , EMEA\r\nEND:VCARD\r\n"},
		{"a multistatus",
			"<d:multistatus><card:address-data>BEGIN:VCARD&#13;\nCATEGORIES:A\\,B&#13;\nEND:VCARD&#13;\n</card:address-data></d:multistatus>",
			"<d:multistatus><card:address-data>BEGIN:VCARD&#13;\nCATEGORIES:A\\\\,B&#13;\nEND:VCARD&#13;\n</card:address-data></d:multistatus>"},
		{"line breaks as references",
			"<x>BEGIN:VCARD&#13;&#10;CATEGORIES:A\\,B&#13;&#10;NOTE:c\\,d&#13;&#10;END:VCARD</x>",
			"<x>BEGIN:VCARD&#13;&#10;CATEGORIES:A\\\\,B&#13;&#10;NOTE:c\\,d&#13;&#10;END:VCARD</x>"},
		{"no list property", "BEGIN:VCARD\r\nNOTE:a\\,b\r\nEND:VCARD\r\n", "BEGIN:VCARD\r\nNOTE:a\\,b\r\nEND:VCARD\r\n"},
	} {
		if got := string(keepListEscapes([]byte(tc.in))); got != tc.want {
			t.Errorf("%s:\n got %q\nwant %q", tc.name, got, tc.want)
		}
	}
}

func TestListElements(t *testing.T) {
	for raw, want := range map[string][]string{
		"Navy,Work":             {"Navy", "Work"},
		`Clients\, EMEA,Navy`:   {"Clients, EMEA", "Navy"},
		`Navy\,Work`:            {"Navy", "Work"},
		`back\\,slash`:          {`back\`, "slash"},
		"Navy, Work ,,":         {"Navy", "Work"},
		`semi\;colon,new\nline`: {"semi;colon", "new\nline"},
		"":                      nil,
	} {
		if got := listElements(raw); !reflect.DeepEqual(got, want) {
			t.Errorf("listElements(%q) = %q, want %q", raw, got, want)
		}
	}
	if got := listValue([]string{"Clients, EMEA", `back\`, "Navy"}); got != `Clients\, EMEA,back\\,Navy` {
		t.Errorf("listValue = %q", got)
	}
}
