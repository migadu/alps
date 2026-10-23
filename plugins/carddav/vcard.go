package alpscarddav

import (
	"errors"
	"io"
	"sort"
	"strings"

	"github.com/emersion/go-vcard"
)

// Only known scalar parameters can safely be rejoined after go-vcard split
// their quoted commas. Generic parameters may be lists too (RFC 6350, 3.3);
// joining an unknown list would turn several values into one. The decoder
// loses that distinction for unknown quoted values, so keep their prior
// multi-value representation rather than inventing new cardinality.
var scalarParams = map[string]bool{
	"LANGUAGE": true, "VALUE": true, "PREF": true, "ALTID": true,
	"MEDIATYPE": true, "CALSCALE": true, "GEO": true, "TZ": true, "LABEL": true,
	"ENCODING": true, "CHARSET": true, "X-APPLE-OMIT-YEAR": true,
}

// encodeCard writes card as go-vcard's encoder does, but for its parameters.
//
// go-vcard writes each value of a parameter as NAME=value, a comma escaped
// with a backslash, and never quotes one. A value that holds a colon or a
// semicolon must be quoted (RFC 6350, 3.3): written bare, as in
// GEO=geo:39.78,-89.65, its colon ends the parameters, and the next read
// takes the rest for the field's value. Clients put such values on an
// address (GEO, LABEL), so every write of a card that had one, a star
// among them, lost the address. Its decoder reads a quoted value but splits
// it at its commas: alps holds GEO="geo:39.78,-89.65" as two values, which
// are joined again here.
func encodeCard(w io.Writer, card vcard.Card) error {
	version := card.Get(vcard.FieldVersion)
	if version == nil {
		return errors.New("vcard: VERSION field missing")
	}
	lines := []string{"BEGIN:VCARD", formatLine(vcard.FieldVersion, version)}
	var keys []string
	for k := range card {
		if !strings.EqualFold(k, vcard.FieldVersion) {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)
	for _, k := range keys {
		for _, f := range card[k] {
			lines = append(lines, formatLine(k, f))
		}
	}
	lines = append(lines, "END:VCARD", "")
	_, err := io.WriteString(w, strings.Join(lines, "\r\n"))
	return err
}

func formatLine(key string, f *vcard.Field) string {
	s := key
	if f.Group != "" {
		s = f.Group + "." + key
	}
	var names []string
	for name := range f.Params {
		names = append(names, name)
	}
	sort.Strings(names)
	for _, name := range names {
		values := f.Params[name]
		if scalarParams[strings.ToUpper(name)] {
			// One value, which the decoder may have split at its commas.
			values = []string{strings.Join(values, ",")}
		}
		for _, v := range values {
			s += ";" + name + "=" + formatParamValue(v)
		}
	}
	return s + ":" + valueEscaper.Replace(f.Value)
}

// valueEscaper escapes a field's value as go-vcard does, and its decoder
// reads it back.
var valueEscaper = strings.NewReplacer(`\`, `\\`, "\n", `\n`, ",", `\,`)

// paramEscaper escapes a bare parameter value, and quotedEscaper a quoted
// one, in the forms go-vcard's decoder reads back; RFC 6350's own example
// LABEL writes a line break in a quoted value as \n too.
var (
	paramEscaper  = strings.NewReplacer(`\`, `\\`, "\n", `\n`)
	quotedEscaper = strings.NewReplacer(`\`, `\\`, "\n", `\n`, `"`, `\"`)
)

func formatParamValue(v string) string {
	if strings.ContainsAny(v, `:;,"`) {
		return `"` + quotedEscaper.Replace(v) + `"`
	}
	return paramEscaper.Replace(v)
}
