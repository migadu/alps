package alpscarddav

import (
	"net/http"
	"testing"
)

// The page edits one line of text, not raw structured-property separators.
// Its literal semicolon must survive just like a comma or backslash.
func TestAddressEditsKeepLiteralSemicolons(t *testing.T) {
	for _, existing := range []bool{false, true} {
		name := "new address"
		lines := []string{}
		want := `ADR:;;1 Main St\; Building B\, Shelbyville;;;;`
		if existing {
			name = "edit city keeping existing components"
			lines = append(lines, `ADR:;;1 Main St\; Building B;Springfield;IL;62701;USA`)
			want = `ADR:;;1 Main St\; Building B;Shelbyville;IL;62701;USA`
		}
		t.Run(name, func(t *testing.T) {
			card := rawGrace(lines...)
			h := newHarnessWrapping(t, card.wrap)
			contact := h.opened(card.path)
			address := "1 Main St; Building B, Shelbyville"
			if existing {
				if contact.Address != "1 Main St; Building B, Springfield, IL, 62701, USA" {
					t.Fatalf("stored address shown as %q", contact.Address)
				}
				address += ", IL, 62701, USA"
			}
			h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/edit", map[string]any{
				"name": contact.Name, "email": contact.Email, "address": address,
				"etag": contact.ETag, "changed_fields": []string{"address"}, "changed_from": map[string]string{"address": contact.Address},
			}), http.StatusOK)
			if got := line(card.text, "ADR"); got != want {
				t.Fatalf("address written as %q, want %q", got, want)
			}
		})
	}
}
