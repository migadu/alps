package main

import (
	"context"
	"net/http"
	"path"
	"sort"
	"strings"
	"testing"

	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav"
	"github.com/emersion/go-webdav/carddav"
)

// Query through the real REPORT encoder/handler, with no name containing an
// address search term. The projection and limit are applied after matching.
func TestCardDAVQueryFilterCombinationsAndProjection(t *testing.T) {
	srv, _ := davTestServer(t)
	const user = "a@example.test"
	book := cardDAVPrefix + "/" + user + "/contacts/default/"
	for uid, body := range map[string]string{
		"ada": vcardBody("ada", "Ada", "first@else.test", "Bob@Remote.Test"),
		"bob": vcardBody("bob", "Bob", "carol@remote.test"),
		"cy":  vcardBody("cy", "Cy"),
	} {
		if got := davDo(t, srv, user, http.MethodPut, book+uid+".vcf", "text/vcard", body); got != http.StatusCreated {
			t.Fatalf("PUT %s: %d", uid, got)
		}
	}
	client, err := carddav.NewClient(webdav.HTTPClientWithBasicAuth(srv.Client(), user, davTestPasswords[user]), srv.URL+cardDAVPrefix+"/")
	if err != nil {
		t.Fatal(err)
	}
	text := func(property, value string, mode carddav.MatchType) carddav.PropFilter {
		return carddav.PropFilter{Name: property, TextMatches: []carddav.TextMatch{{Text: value, MatchType: mode}}}
	}
	for _, tc := range []struct {
		name  string
		query carddav.AddressBookQuery
		want  []string
	}{
		{"any property", carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{text(vcard.FieldFormattedName, "CY", ""), text(vcard.FieldEmail, "BOB@", carddav.MatchStartsWith)}}, []string{"ada", "cy"}},
		{"all properties", carddav.AddressBookQuery{FilterTest: carddav.FilterAllOf, PropFilters: []carddav.PropFilter{text(vcard.FieldFormattedName, "ADA", carddav.MatchEquals), text(vcard.FieldEmail, "@REMOTE.TEST", carddav.MatchEndsWith)}}, []string{"ada"}},
		{"all text matches on one repeated value", carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{{Name: vcard.FieldEmail, Test: carddav.FilterAllOf, TextMatches: []carddav.TextMatch{{Text: "BOB@", MatchType: carddav.MatchStartsWith}, {Text: "@REMOTE.TEST", MatchType: carddav.MatchEndsWith}}}}}, []string{"ada"}},
		{"all text matches cannot join different values", carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{{Name: vcard.FieldEmail, Test: carddav.FilterAllOf, TextMatches: []carddav.TextMatch{{Text: "FIRST@", MatchType: carddav.MatchStartsWith}, {Text: "@REMOTE.TEST", MatchType: carddav.MatchEndsWith}}}}}, nil},
		{"any text match", carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{{Name: vcard.FieldEmail, TextMatches: []carddav.TextMatch{{Text: "absent"}, {Text: "CAROL@", MatchType: carddav.MatchStartsWith}}}}}, []string{"bob"}},
		{"negated text", carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{{Name: vcard.FieldFormattedName, TextMatches: []carddav.TextMatch{{Text: "ADA", MatchType: carddav.MatchEquals, NegateCondition: true}}}}}, []string{"bob", "cy"}},
		{"missing property", carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{{Name: vcard.FieldEmail, IsNotDefined: true}}}, []string{"cy"}},
		{"project after matching and limit", carddav.AddressBookQuery{Limit: 1, DataRequest: carddav.AddressDataRequest{Props: []string{vcard.FieldEmail}}, PropFilters: []carddav.PropFilter{text(vcard.FieldEmail, "REMOTE.TEST", carddav.MatchEndsWith)}}, []string{"ada"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			objects, err := client.QueryAddressBook(context.Background(), book, &tc.query)
			if err != nil {
				t.Fatal(err)
			}
			var got []string
			for _, object := range objects {
				got = append(got, strings.TrimSuffix(path.Base(object.Path), ".vcf"))
				if len(tc.query.DataRequest.Props) > 0 {
					if object.Card.Value(vcard.FieldFormattedName) != "" {
						t.Error("projected response retained FN")
					}
					if len(object.Card[vcard.FieldEmail]) != 2 {
						t.Errorf("projection lost repeated addresses: %+v", object.Card)
					}
				}
			}
			sort.Strings(got)
			sameLines(t, tc.name, got, tc.want)
		})
	}
}

// CardDAV's default collation also matches non-ASCII case pairs and canonical
// decompositions. Lowercasing alone loses final sigma and composed accents.
func TestCardDAVQueryUsesUnicodeCasemap(t *testing.T) {
	srv, _ := davTestServer(t)
	const user = "a@example.test"
	book := cardDAVPrefix + "/" + user + "/contacts/default/"
	for uid, name := range map[string]string{"sigma": "ος", "accent": "Café", "wide": "ａｄａ", "title": "ǆ"} {
		if got := davDo(t, srv, user, http.MethodPut, book+uid+".vcf", "text/vcard", vcardBody(uid, name)); got != http.StatusCreated {
			t.Fatalf("PUT %s: %d", uid, got)
		}
	}
	client, err := carddav.NewClient(webdav.HTTPClientWithBasicAuth(srv.Client(), user, davTestPasswords[user]), srv.URL+cardDAVPrefix+"/")
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct{ text, want string }{{"ΟΣ", "sigma"}, {"CAFE\u0301", "accent"}, {"ADA", "wide"}, {"Ǆ", "title"}} {
		t.Run(tc.want, func(t *testing.T) {
			objects, err := client.QueryAddressBook(context.Background(), book, &carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{{Name: vcard.FieldFormattedName, TextMatches: []carddav.TextMatch{{Text: tc.text, MatchType: carddav.MatchEquals}}}}})
			if err != nil {
				t.Fatal(err)
			}
			if len(objects) != 1 || strings.TrimSuffix(path.Base(objects[0].Path), ".vcf") != tc.want {
				t.Fatalf("query %q returned %+v, want %s", tc.text, objects, tc.want)
			}
		})
	}
}

// Unlike full casefolding, the collation uses UnicodeData titlecase mappings.
// It retains malformed UTF-8 as original octets instead of replacement runes.
func TestCardDAVUnicodeCasemapRetainsOctetFallback(t *testing.T) {
	for _, tc := range []struct {
		value, text string
		want        bool
	}{
		{"Straße", "STRASSE", false},
		{"caf\xff", "CAF\xff", false},
		{"caf\xff", "caf\xff", true},
	} {
		got, err := matchText(carddav.TextMatch{Text: tc.text, MatchType: carddav.MatchEquals}, tc.value)
		if err != nil || got != tc.want {
			t.Errorf("compare %q and %q: %v %v; want %v", tc.value, tc.text, got, err, tc.want)
		}
	}
}
