package alpscarddav

import (
	"net/http"
	"testing"
)

// A component of ADR or N may hold a list (RFC 6350, 5, 6.2.2, 6.3.1): a
// plain comma separates two values, an escaped one is part of a value. Every
// write escaped them all, so a street of two lines became one value with a
// comma in it, and middle names one name, for every other client.
func TestComponentListsAreWrittenBackAsLists(t *testing.T) {
	card := rawGrace(
		"ADR;TYPE=home:;;123 Main St,Apt 4;Springfield;IL;62701;USA",
		`N:Hopper;Grace;Brewster,Murray;Rear Admiral;`,
		`ORG:ABC\, Inc.;Marketing`,
	)
	h := newHarnessWrapping(t, card.wrap)
	contact := h.opened(card.path)
	if contact.Address != "123 Main St,Apt 4, Springfield, IL, 62701, USA" {
		t.Fatalf("address shown as %q", contact.Address)
	}
	// A star writes the whole card, and so does an edit of another field.
	star(t, h, card, "Favorites")
	contact = h.opened(card.path)
	contact.Note = "Met at the conference"
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/edit", contact), http.StatusOK)

	for property, want := range map[string]string{
		"ADR": "ADR;TYPE=home:;;123 Main St,Apt 4;Springfield;IL;62701;USA",
		"N":   "N:Hopper;Grace;Brewster,Murray;Rear Admiral;",
		// ORG's components are texts, not lists: a comma in one is escaped.
		"ORG": `ORG:ABC\, Inc.;Marketing`,
	} {
		if got := line(card.text, property); got != want {
			t.Errorf("written as %q, want %q", got, want)
		}
	}
}

// A comma escaped in a component's value stays escaped, and an address the
// user retypes is written as before, its line a street with its commas
// escaped.
func TestComponentCommasInAValueStayEscaped(t *testing.T) {
	card := rawGrace(`ADR:;Suite 4\, Floor 2;1 Main St;Springfield;;;`)
	h := newHarnessWrapping(t, card.wrap)
	contact := h.opened(card.path)
	if contact.Address != "1 Main St, Suite 4, Floor 2, Springfield" {
		t.Fatalf("address shown as %q", contact.Address)
	}
	star(t, h, card, "Favorites")
	if got := line(card.text, "ADR"); got != `ADR:;Suite 4\, Floor 2;1 Main St;Springfield;;;` {
		t.Fatalf(`written as %q, want ADR:;Suite 4\, Floor 2;1 Main St;Springfield;;;`, got)
	}

	contact = h.opened(card.path)
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/edit", map[string]any{
		"name": contact.Name, "email": contact.Email, "address": "742 Evergreen Terrace, Springfield",
		"etag": contact.ETag, "changed_fields": []string{"address"},
	}), http.StatusOK)
	if got := line(card.text, "ADR"); got != `ADR:;;742 Evergreen Terrace\, Springfield;;;;` {
		t.Fatalf(`written as %q, want ADR:;;742 Evergreen Terrace\, Springfield;;;;`, got)
	}
}

// The transport keeps the escapes of ADR and N as of the list properties, and
// leaves ORG's to go-vcard.
func TestKeepComponentEscapes(t *testing.T) {
	in := "BEGIN:VCARD\r\nN:Hopper;Grace;Brewster\\,Murray;;\r\nitem1.ADR;TYPE=home:;Suite 4\\, Floor 2;1 Main St;;;;\r\nORG:ABC\\, Inc.\r\nEND:VCARD\r\n"
	want := "BEGIN:VCARD\r\nN:Hopper;Grace;Brewster\\\\,Murray;;\r\nitem1.ADR;TYPE=home:;Suite 4\\\\, Floor 2;1 Main St;;;;\r\nORG:ABC\\, Inc.\r\nEND:VCARD\r\n"
	if got := string(keepListEscapes([]byte(in))); got != want {
		t.Errorf("\n got %q\nwant %q", got, want)
	}
}
