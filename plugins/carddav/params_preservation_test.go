package alpscarddav

import (
	"github.com/emersion/go-vcard"
	"net/http"
	"reflect"
	"strings"
	"testing"
)

func TestWritesKeepGenericParameterLists(t *testing.T) {
	card := &rawCard{path: testBook + "grace.vcf", text: "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Grace\r\nUID:grace\r\nEMAIL;X-CHANNEL=work,home:grace@example.test\r\nEND:VCARD\r\n"}
	h := newHarnessWrapping(t, card.wrap)
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/categories", map[string]any{"categories": []string{"Favorites"}}), http.StatusOK)
	// RFC6350 any-param allows comma-separated parameter values. Quoting the
	// joined string changes these two generic values into one comma-containing value.
	if strings.Contains(card.text, `X-CHANNEL="work,home"`) {
		t.Fatalf("generic parameter list became one value: %s", card.text)
	}
}

func TestWritesKeepStandardParameterListsAndQuotedExtensions(t *testing.T) {
	card := &rawCard{path: testBook + "grace.vcf", text: strings.Join([]string{
		"BEGIN:VCARD", "VERSION:4.0", "FN:Grace", "UID:grace",
		"EMAIL;TYPE=work,internet;PID=1.1,2.2:grace@example.test",
		"N;SORT-AS=Hopper,Grace:Hopper;Grace;;;",
		`X-SOCIALPROFILE;X-USER="grace;navy":https://example.test/grace`,
		"END:VCARD", "",
	}, "\r\n")}
	h := newHarnessWrapping(t, card.wrap)
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/categories", map[string]any{"categories": []string{"Favorites"}}), http.StatusOK)
	stored, err := vcard.NewDecoder(strings.NewReader(card.text)).Decode()
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		field, name string
		values      []string
	}{
		{vcard.FieldEmail, "TYPE", []string{"work", "internet"}},
		{vcard.FieldEmail, "PID", []string{"1.1", "2.2"}},
		{vcard.FieldName, "SORT-AS", []string{"Hopper", "Grace"}},
		{"X-SOCIALPROFILE", "X-USER", []string{"grace;navy"}},
	} {
		if f := stored.Preferred(tc.field); f == nil || !reflect.DeepEqual(f.Params[tc.name], tc.values) {
			t.Fatalf("lost %s/%s from %s", tc.field, tc.name, card.text)
		}
	}
	if !strings.Contains(card.text, `X-USER="grace;navy"`) {
		t.Fatalf("unknown scalar no longer quoted: %s", card.text)
	}
}
func TestWritesKeepCaretEncodedParameterValues(t *testing.T) {
	card := &rawCard{path: testBook + "grace.vcf", text: "BEGIN:VCARD\r\nVERSION:4.0\r\nFN:Grace\r\nUID:grace\r\nEMAIL:grace@example.test\r\nADR;GEO=\"geo:39.78,-89.65\";LABEL=\"Summer ^'house^'^nSpringfield, IL\":;;1 Main St;;;;\r\nEND:VCARD\r\n"}
	h := newHarnessWrapping(t, card.wrap)
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/categories", map[string]any{"categories": []string{"Favorites"}}), http.StatusOK)
	for _, want := range []string{`GEO="geo:39.78,-89.65"`, `LABEL="Summer ^'house^'^nSpringfield, IL"`} {
		if !strings.Contains(card.text, want) {
			t.Fatalf("lost %s in %s", want, card.text)
		}
	}
}
