package alpscarddav

import (
	"net/http"
	"reflect"
	"testing"

	"github.com/emersion/go-vcard"
)

// The listing is read by more than the list's rows: the sidebar counts the
// cards' categories, Favorites is a category, the rows show a nickname, an
// organisation, a photo and a date, and the composer's encryption looks a
// recipient's key up through a search. The test server, as go-webdav's does,
// answers a query with only the properties asked for, as RFC 6352 allows; the
// listing asked for four, so every card came back without the rest.
func TestListingCarriesWhatThePageReads(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	card := grace("+1 555 0100", "Navy", "Favorites")
	card.SetValue(vcard.FieldNickname, "Amazing Grace")
	card.SetValue(vcard.FieldOrganization, "US Navy")
	card.SetValue(vcard.FieldRevision, "20261023T120000Z")
	card.SetValue(vcard.FieldPhoto, "data:image/png;base64,iVBORw0KGgo=")
	card.SetValue(vcard.FieldKey, "-----BEGIN PGP PUBLIC KEY BLOCK-----")
	h.dav.save(objectPath, card)

	for _, query := range []string{"", "?query=grace"} {
		r := h.do("GET", "/contacts"+query, nil)
		h.expect(r, http.StatusOK)
		var list struct{ Contacts []ContactData }
		h.decode(r, &list)
		if len(list.Contacts) != 1 {
			t.Fatalf("listing%s: %d cards, want 1: %s", query, len(list.Contacts), r.body)
		}
		// The fields only the card's other properties give.
		got := list.Contacts[0]
		got = ContactData{Categories: got.Categories, Nickname: got.Nickname, Organization: got.Organization,
			Revision: got.Revision, Avatar: got.Avatar, PublicKey: got.PublicKey}
		want := ContactData{
			Categories:   []string{"Navy", "Favorites"},
			Nickname:     "Amazing Grace",
			Organization: "US Navy",
			Revision:     "20261023T120000Z",
			Avatar:       "data:image/png;base64,iVBORw0KGgo=",
			PublicKey:    "-----BEGIN PGP PUBLIC KEY BLOCK-----",
		}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("listing%s:\n got %+v\nwant %+v", query, got, want)
		}
	}
}
