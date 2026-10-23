package alpscarddav

import (
	"bytes"
	"reflect"
	"strings"
	"testing"

	"github.com/emersion/go-vcard"
)

func decodeCard(t *testing.T, text string) vcard.Card {
	t.Helper()
	card, err := vcard.NewDecoder(strings.NewReader(text)).Decode()
	if err != nil {
		t.Fatalf("decoding %q: %v", text, err)
	}
	return card
}

func encodedCard(t *testing.T, card vcard.Card) string {
	t.Helper()
	var buf bytes.Buffer
	if err := encodeCard(&buf, card); err != nil {
		t.Fatal(err)
	}
	return buf.String()
}

// A card whose parameters need no quotes is written byte for byte as
// go-vcard writes it.
func TestEncodeCardIsGoVcardsWithoutQuotes(t *testing.T) {
	card := decodeCard(t, strings.Join([]string{
		"BEGIN:VCARD",
		"VERSION:3.0",
		"FN:Grace Hopper",
		"item1.EMAIL;TYPE=INTERNET,HOME;PREF=1:grace@example.com",
		"item1.X-ABLABEL:Summer house",
		`NOTE;LANGUAGE=en:First line\nsecond\, with a comma\\`,
		"BDAY;X-APPLE-OMIT-YEAR=1604:1604-10-31",
		"END:VCARD",
		"",
	}, "\r\n"))
	var want bytes.Buffer
	if err := vcard.NewEncoder(&want).Encode(card); err != nil {
		t.Fatal(err)
	}
	if got := encodedCard(t, card); got != want.String() {
		t.Fatalf("encoded\n%s\nwant go-vcard's\n%s", got, want.String())
	}
}

// A value with a colon, a semicolon, a comma or a quote is quoted, joined
// again where the decoder split it, and reads back as it was read.
func TestEncodeCardQuotesParameterValues(t *testing.T) {
	for _, tc := range []struct{ in, line string }{
		{`ADR;GEO="geo:39.78,-89.65":;;1 Main St;;;;`, `ADR;GEO="geo:39.78,-89.65":;;1 Main St;;;;`},
		{`ADR;LABEL="1 Main St\nSpringfield, IL":;;1 Main St;;;;`, `ADR;LABEL="1 Main St\nSpringfield, IL":;;1 Main St;;;;`},
		{`X-SOCIALPROFILE;X-USER="grace;navy":https://example.com/grace`, `X-SOCIALPROFILE;X-USER="grace;navy":https://example.com/grace`},
		{`X-SOCIALPROFILE;X-USER="say \"hi\"":https://example.com/grace`, `X-SOCIALPROFILE;X-USER="say \"hi\"":https://example.com/grace`},
		// A list's values are written one by one, as go-vcard writes them.
		{`TEL;TYPE="cell,voice":+1 555 0100`, `TEL;TYPE=cell;TYPE=voice:+1 555 0100`},
	} {
		card := decodeCard(t, "BEGIN:VCARD\r\nVERSION:4.0\r\n"+tc.in+"\r\nEND:VCARD\r\n")
		encoded := encodedCard(t, card)
		if !strings.Contains(encoded, "\r\n"+tc.line+"\r\n") {
			t.Errorf("%s encoded as\n%s\nwant the line %s", tc.in, encoded, tc.line)
			continue
		}
		again := decodeCard(t, encoded)
		for key, fields := range card {
			if !reflect.DeepEqual(again[key], fields) {
				t.Errorf("%s reads back as %+v, want %+v", tc.in, again[key][0], fields[0])
			}
		}
	}
}
