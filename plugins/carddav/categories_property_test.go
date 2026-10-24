package alpscarddav

import (
	"reflect"
	"strings"
	"testing"
)

// lines is every line of the card's text that holds property, in order.
func lines(text, property string) []string {
	var out []string
	for _, l := range strings.Split(text, "\r\n") {
		name := l
		if i := strings.IndexAny(l, ";:"); i >= 0 {
			name = l[:i]
		}
		if dot := strings.LastIndexByte(name, '.'); dot >= 0 {
			name = name[dot+1:]
		}
		if name == property {
			out = append(out, l)
		}
	}
	return out
}

// A category change rewrote the card's categories as one bare CATEGORIES:
// Apple's group, which ties the property to its label, and the property's
// parameters were dropped, and so was every other CATEGORIES line, merged
// into one. The stored property is now changed in place.
func TestACategoryChangeKeepsThePropertysGroupAndParameters(t *testing.T) {
	card := rawGrace("item1.CATEGORIES;PID=1:Navy,Work", "item1.X-ABLABEL:Tags")
	h := newHarnessWrapping(t, card.wrap)
	star(t, h, card, "Navy", "Work", "Favorites")
	if got, want := lines(card.text, "CATEGORIES"), []string{"item1.CATEGORIES;PID=1:Navy,Work,Favorites"}; !reflect.DeepEqual(got, want) {
		t.Errorf("written as %q, want %q", got, want)
	}
	if got := line(card.text, "item1.X-ABLABEL"); got != "item1.X-ABLABEL:Tags" {
		t.Errorf("label written as %q", got)
	}
}

// Every CATEGORIES line counts (RFC 6350 allows several): the page is given
// them all, a category added goes into the first line, the others stay as
// they are, and a category removed is taken out of the line that held it.
func TestCategoriesOnSeveralLines(t *testing.T) {
	card := rawGrace("CATEGORIES:Navy,Work", "CATEGORIES;LANGUAGE=en:Clients,Harvard")
	h := newHarnessWrapping(t, card.wrap)
	if got, want := h.opened(card.path).Categories, []string{"Navy", "Work", "Clients", "Harvard"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("categories read as %q, want %q", got, want)
	}

	star(t, h, card, "Navy", "Work", "Clients", "Harvard", "Favorites")
	if got, want := lines(card.text, "CATEGORIES"), []string{"CATEGORIES:Navy,Work,Favorites", "CATEGORIES;LANGUAGE=en:Clients,Harvard"}; !reflect.DeepEqual(got, want) {
		t.Errorf("starred: written as %q, want %q", got, want)
	}

	star(t, h, card, "Navy", "Clients", "Favorites")
	if got, want := lines(card.text, "CATEGORIES"), []string{"CATEGORIES:Navy,Favorites", "CATEGORIES;LANGUAGE=en:Clients"}; !reflect.DeepEqual(got, want) {
		t.Errorf("two removed: written as %q, want %q", got, want)
	}

	star(t, h, card, "Navy", "Favorites")
	if got, want := lines(card.text, "CATEGORIES"), []string{"CATEGORIES:Navy,Favorites"}; !reflect.DeepEqual(got, want) {
		t.Errorf("a line emptied: written as %q, want %q", got, want)
	}

	star(t, h, card)
	if got := lines(card.text, "CATEGORIES"); got != nil {
		t.Errorf("all removed: written as %q, want none", got)
	}
}

// The preferred line is the one the categories added go into, wherever it is
// stored, and the lines keep their order.
func TestCategoriesGoIntoThePreferredLine(t *testing.T) {
	card := rawGrace("CATEGORIES:Clients", "CATEGORIES;PREF=1:Navy")
	h := newHarnessWrapping(t, card.wrap)
	star(t, h, card, "Clients", "Navy", "Favorites")
	if got, want := lines(card.text, "CATEGORIES"), []string{"CATEGORIES:Clients", "CATEGORIES;PREF=1:Navy,Favorites"}; !reflect.DeepEqual(got, want) {
		t.Errorf("written as %q, want %q", got, want)
	}
}
