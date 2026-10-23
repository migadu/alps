package alpscarddav

import (
	"net/http"
	"testing"

	"github.com/emersion/go-vcard"
)

// withBirthday is grace with a BDAY field as another client wrote it.
func withBirthday(value string, params vcard.Params) vcard.Card {
	card := grace("+1 555 0100")
	card[vcard.FieldBirthday] = []*vcard.Field{{Value: value, Params: params}}
	return card
}

// appleNoYear is how Apple's apps write a birthday entered without a year.
var appleNoYear = vcard.Params{"X-APPLE-OMIT-YEAR": []string{"1604"}}

// Apple writes a birthday without a year as one in 1604, and says in a
// parameter that the year is not one. The page is given the vCard form of a
// day and a month, which it shows as such, not a date in 1604.
func TestAppleBirthdayWithoutAYearIsADayAndAMonth(t *testing.T) {
	for value, want := range map[string]string{
		"1604-10-31": "--1031",
		"16041031":   "--1031",
		// A year other than the one the parameter names is a year.
		"1985-10-31": "1985-10-31",
	} {
		t.Run(value, func(t *testing.T) {
			h := newHarness(t)
			objectPath := testBook + "grace.vcf"
			h.dav.save(objectPath, withBirthday(value, appleNoYear))
			if got := h.opened(objectPath).Birthday; got != want {
				t.Fatalf("birthday %q, want %q", got, want)
			}
		})
	}
}

// A save that leaves the birthday as it was given keeps the stored field, its
// parameters with it: written back bare, Apple's yearless birthday became a
// birthday in 1604 in Apple's own apps after any edit made here.
func TestSaveKeepsTheBirthdayItDidNotChange(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, withBirthday("1604-10-31", appleNoYear))

	contact := h.opened(objectPath)
	contact.Phones = []ContactProperty{{Value: "+1 555 0199"}}
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusOK)

	stored := h.dav.get(t, objectPath).Card
	if got := valueOf(stored, vcard.FieldTelephone); got != "+1 555 0199" {
		t.Fatalf("telephone %q, the edit was not saved", got)
	}
	f := stored.Preferred(vcard.FieldBirthday)
	if f == nil || f.Value != "1604-10-31" || f.Params.Get("X-APPLE-OMIT-YEAR") != "1604" {
		t.Fatalf("stored birthday %+v, want 1604-10-31 with X-APPLE-OMIT-YEAR=1604", f)
	}
}

// A birthday the user changes, or clears, is written as the user gave it.
func TestSaveWritesTheBirthdayItChanged(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, withBirthday("1604-10-31", appleNoYear))

	contact := h.opened(objectPath)
	contact.Birthday = "1985-11-05"
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusOK)
	f := h.dav.get(t, objectPath).Card.Preferred(vcard.FieldBirthday)
	if f == nil || f.Value != "1985-11-05" || len(f.Params) != 0 {
		t.Fatalf("stored birthday %+v, want a bare 1985-11-05", f)
	}

	contact = h.opened(objectPath)
	contact.Birthday = ""
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusOK)
	if f := h.dav.get(t, objectPath).Card.Preferred(vcard.FieldBirthday); f != nil {
		t.Fatalf("stored birthday %+v, want none", f)
	}
}

// The editor writes a birthday without a year as `--1031`. vCard 3.0 has no
// such form, so a 3.0 card gets the one Apple's apps write, which reads back
// as the same day and month; a 4.0 card gets `--1031` as it is.
func TestBirthdayWithoutAYearIsWrittenInTheCardsVersion(t *testing.T) {
	for version, want := range map[string]*vcard.Field{
		"3.0": {Value: "1604-11-05", Params: appleNoYear},
		"4.0": {Value: "--1105"},
	} {
		t.Run(version, func(t *testing.T) {
			h := newHarness(t)
			objectPath := testBook + "grace.vcf"
			card := withBirthday("1985-10-31", nil)
			card.SetValue(vcard.FieldVersion, version)
			h.dav.save(objectPath, card)

			contact := h.opened(objectPath)
			contact.Birthday = "--1105"
			h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusOK)

			f := h.dav.get(t, objectPath).Card.Preferred(vcard.FieldBirthday)
			if f == nil || f.Value != want.Value || f.Params.Get("X-APPLE-OMIT-YEAR") != want.Params.Get("X-APPLE-OMIT-YEAR") {
				t.Fatalf("stored birthday %+v, want %+v", f, want)
			}
			if got := h.opened(objectPath).Birthday; got != "--1105" {
				t.Fatalf("birthday read back as %q, want --1105", got)
			}
		})
	}
}
