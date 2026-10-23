package alpscarddav

import (
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-vcard"
)

// rawCard is one card held as the text a client stored, served as it is and
// replaced by each PUT's text. go-webdav's own server would decode the card
// and encode it with go-vcard on every GET, so what alps writes would not be
// what the next read gets.
type rawCard struct {
	mu   sync.Mutex
	path string
	text string
	puts int
}

func (c *rawCard) wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if path.Clean(r.URL.Path) != path.Clean(c.path) || (r.Method != http.MethodGet && r.Method != http.MethodPut) {
			next.ServeHTTP(w, r)
			return
		}
		c.mu.Lock()
		defer c.mu.Unlock()
		if r.Method == http.MethodPut {
			body, _ := io.ReadAll(r.Body)
			c.text = string(body)
			c.puts++
			w.Header().Set("ETag", fmt.Sprintf(`"v%d"`, c.puts))
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.Header().Set("Content-Type", vcard.MIMEType)
		w.Header().Set("ETag", fmt.Sprintf(`"v%d"`, c.puts))
		io.WriteString(w, c.text)
	})
}

// A parameter value holding a colon, a semicolon or a comma is quoted (RFC
// 6350, 3.3), as clients write a position or a label on an address. Every
// write of the card wrote it back unquoted, `GEO=geo:39.78;GEO=-89.65`, and
// the next read took everything after its colon for the field's value: a
// star was enough to lose the address.
func TestWritesKeepQuotedParameters(t *testing.T) {
	card := &rawCard{path: testBook + "grace.vcf", text: strings.Join([]string{
		"BEGIN:VCARD",
		"VERSION:4.0",
		"UID:urn:uuid:grace",
		"FN:Grace Hopper",
		"EMAIL:grace@example.com",
		`ADR;TYPE=home;GEO="geo:39.78,-89.65";LABEL="1 Main St\nSpringfield, IL 62701":;;1 Main St;Springfield;IL;62701;USA`,
		"TEL;TYPE=cell,voice:+1 555 0100",
		"END:VCARD",
		"",
	}, "\r\n")}
	h := newHarnessWrapping(t, card.wrap)

	// A star writes the whole card, its address untouched.
	h.expect(h.do("POST", "/contacts/"+pathParam(card.path)+"/categories", map[string]any{"categories": []string{"Favorites"}}), http.StatusOK)

	// Read again as alps reads it.
	saved := card.text
	stored, err := vcard.NewDecoder(strings.NewReader(saved)).Decode()
	if err != nil {
		t.Fatalf("the saved card does not read: %v\n%s", err, saved)
	}
	adr := stored.Preferred(vcard.FieldAddress)
	if adr == nil || adr.Value != ";;1 Main St;Springfield;IL;62701;USA" ||
		strings.Join(adr.Params["GEO"], ",") != "geo:39.78,-89.65" ||
		strings.Join(adr.Params["LABEL"], ",") != "1 Main St\nSpringfield, IL 62701" ||
		strings.Join(adr.Params.Types(), ",") != "home" {
		t.Fatalf("the saved address reads as %+v, from\n%s", adr, saved)
	}
	if tel := stored.Preferred(vcard.FieldTelephone); tel == nil || strings.Join(tel.Params.Types(), ",") != "cell,voice" {
		t.Fatalf("the saved number reads as %+v, from\n%s", tel, saved)
	}
	if got := valueOf(stored, vcard.FieldCategories); got != "Favorites" {
		t.Fatalf("categories %q, from\n%s", got, saved)
	}
}
