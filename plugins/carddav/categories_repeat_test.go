package alpscarddav

import (
	"reflect"
	"testing"
)

func TestCategoryAdditionKeepsSharedNamesInTheirOriginalCopies(t *testing.T) {
	card := rawGrace("item1.CATEGORIES;ALTID=1;LANGUAGE=en:Work,Navy", "item2.CATEGORIES;ALTID=1;LANGUAGE=de:Work,Kunden", "item1.X-ABLABEL:English", "item2.X-ABLABEL:German")
	h := newHarnessWrapping(t, card.wrap)
	star(t, h, card, "Work", "Navy", "Kunden", "Favorites")
	want := []string{"item1.CATEGORIES;ALTID=1;LANGUAGE=en:Work,Navy,Favorites", "item2.CATEGORIES;ALTID=1;LANGUAGE=de:Work,Kunden"}
	if got := lines(card.text, "CATEGORIES"); !reflect.DeepEqual(got, want) {
		t.Errorf("adding Favorites changed retained category copies: got %q want %q", got, want)
	}
	star(t, h, card, "Navy", "Kunden", "Favorites")
	want = []string{"item1.CATEGORIES;ALTID=1;LANGUAGE=en:Navy,Favorites", "item2.CATEGORIES;ALTID=1;LANGUAGE=de:Kunden"}
	if got := lines(card.text, "CATEGORIES"); !reflect.DeepEqual(got, want) {
		t.Errorf("removing a shared category must remove every copy: got %q want %q", got, want)
	}
}

func TestUnchangedCategoriesKeepRepeatedPropertyMetadata(t *testing.T) {
	card := rawGrace("item1.CATEGORIES;PID=1:Work", "item2.CATEGORIES;PID=2:Work", "item1.X-ABLABEL:First", "item2.X-ABLABEL:Second")
	h := newHarnessWrapping(t, card.wrap)
	star(t, h, card, "Work")
	want := []string{"item1.CATEGORIES;PID=1:Work", "item2.CATEGORIES;PID=2:Work"}
	if got := lines(card.text, "CATEGORIES"); !reflect.DeepEqual(got, want) {
		t.Errorf("unchanged category set dropped its stored property: got %q want %q", got, want)
	}
}
