package alpscarddav

import "testing"

// Folding is removed before a vCard property is parsed. A fold inside the
// property name cannot turn a comma inside one nickname into a list separator
// when an unrelated toolbar change writes the card back.
func TestFoldedNicknameNameKeepsLiteralComma(t *testing.T) {
	for _, name := range []string{"NICKNAME", "NICK\r\n NAME", "item1.NICK\r\n\tNAME"} {
		t.Run(name, func(t *testing.T) {
			card := rawGrace(name + `:Amazing\, Grace`)
			h := newHarnessWrapping(t, card.wrap)
			if got := h.opened(card.path).Nickname; got != "Amazing, Grace" {
				t.Fatalf("nickname shown as %q", got)
			}
			star(t, h, card, "Navy", "Favorites")
			property := "NICKNAME"
			if name[:1] == "i" {
				property = "item1.NICKNAME"
			}
			if got := line(card.text, property); got != property+`:Amazing\, Grace` {
				t.Fatalf("nickname written as %q, want one nickname with its literal comma", got)
			}
		})
	}
}
