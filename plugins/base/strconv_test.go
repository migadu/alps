package alpsbase

import (
	"reflect"
	"testing"
)

func TestParseMboxAndUidStr(t *testing.T) {
	mbox, uid, err := parseMboxAndUidStr("%5BGmail%5D%2FAll%20Mail", "7")
	if err != nil || mbox != "[Gmail]/All Mail" || uid != "7" {
		t.Fatalf("got %q %q %v", mbox, uid, err)
	}
	if _, _, err := parseMboxAndUidStr("INBOX", ""); err == nil {
		t.Error("an empty UID was accepted")
	}
	if _, _, err := parseMboxAndUidStr("%zz", "1"); err == nil {
		t.Error("a malformed escape in the mailbox name was accepted")
	}
}

func TestParsePartPath(t *testing.T) {
	valid := map[string][]int{"": nil, "1": {1}, "2.1.3": {2, 1, 3}}
	for in, want := range valid {
		got, err := parsePartPath(in)
		if err != nil || !reflect.DeepEqual(got, want) {
			t.Errorf("parsePartPath(%q) = %v, %v; want %v", in, got, err, want)
		}
	}
	// Part numbers are 1-based; zero, negatives, gaps and words are refused
	// rather than addressing some other part.
	for _, in := range []string{"0", "1.0", "1.-2", "a", "1..2", "1.", ".1", "1.2x"} {
		if got, err := parsePartPath(in); err == nil {
			t.Errorf("parsePartPath(%q) = %v, want an error", in, got)
		}
	}
}

func TestFormatPartPath(t *testing.T) {
	if got := formatPartPath(nil); got != "" {
		t.Errorf("formatPartPath(nil) = %q", got)
	}
	for _, in := range []string{"1", "2.1.3", "10.20"} {
		path, err := parsePartPath(in)
		if err != nil {
			t.Fatal(err)
		}
		if got := formatPartPath(path); got != in {
			t.Errorf("round trip of %q gave %q", in, got)
		}
	}
}

func TestParseAddressList(t *testing.T) {
	cases := map[string][]string{
		"a@example.com":                    {"a@example.com"},
		"a@example.com, b@example.com":     {"a@example.com", "b@example.com"},
		" a@example.com ,,b@example.com  ": {"a@example.com", "b@example.com"},
		"":                                 {},
		// A trailing separator, as a recipient field often has, must not add
		// an empty recipient for the SMTP transaction to refuse.
		"a@example.com, ": {"a@example.com"},
		" , ":             {},
		// A comma inside a quoted name is part of the name.
		`"Lovelace, Ada" <ada@example.com>, b@example.com`: {`"Lovelace, Ada" <ada@example.com>`, "b@example.com"},
		`"Jane \"JJ\" Doe" <jj@example.com>`:               {`"Jane \"JJ\" Doe" <jj@example.com>`},
		`Ada Lovelace <ada@example.com>`:                   {`"Ada Lovelace" <ada@example.com>`},
		// A quoted local part stays quoted, or it no longer reads back.
		`"a;b"@example.com, <c@example.com>`: {`"a;b"@example.com`, "c@example.com"},
	}
	for in, want := range cases {
		if got, err := parseAddressList(in); err != nil || !reflect.DeepEqual(got, want) {
			t.Errorf("parseAddressList(%q) = %q, %v, want %q", in, got, err, want)
		}
	}
	// Written bare, as an earlier composer wrote a reply's recipients, the
	// comma ends the first address, which has no address part.
	for _, in := range []string{"Lovelace, Ada <ada@example.com>", "ada", "a@example.com; b@example.com"} {
		if got, err := parseAddressList(in); err == nil {
			t.Errorf("parseAddressList(%q) = %q, want an error", in, got)
		}
	}
}
