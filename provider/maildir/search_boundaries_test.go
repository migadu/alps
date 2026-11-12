package maildir

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"unicode/utf8"
)

func TestSearchReadsRepeatedHeaderFields(t *testing.T) {
	dir := t.TempDir()
	p := NewProvider(dir, "alice@example.com")
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	message := "Received: from first-hop\r\nReceived: from second-hop\r\nX-Label: Other\r\nX-Label: =?utf-8?Q?r=C3=A9sum=C3=A9?=\r\nSubject: Example\r\n\r\nbody\r\n"
	if err := os.WriteFile(filepath.Join(dir, "cur", "1700000000.message:2,S"), []byte(message), 0600); err != nil {
		t.Fatal(err)
	}
	for _, query := range []string{"header:Received:second-hop", `header:X-Label:"résumé"`, `résumé`} {
		messages, page, err := p.SearchMessages("INBOX", query, "desc", 0, 50)
		if err != nil || len(messages) != 1 || page.Total != 1 {
			t.Errorf("%q: got %d/%d, %v", query, len(messages), page.Total, err)
		}
		ids, err := p.SearchMessageIDs("INBOX", query)
		if err != nil || len(ids) != 1 {
			t.Errorf("bulk %q: %v, %v", query, ids, err)
		}
	}
}

func TestReaderContainsPreservesUTF8AcrossReadBoundaries(t *testing.T) {
	for _, value := range []string{"ÉLAN", "KELVIN", "𐐀OK", strings.Repeat("K", 10)} {
		width := utf8.RuneLen([]rune(value)[0])
		for split := 1; split < width; split++ {
			text := strings.Repeat("x", 32*1024-split) + value + " tail"
			if !readerContains(strings.NewReader(text), strings.ToLower(value)) {
				t.Errorf("lost %q split after %d bytes", value, split)
			}
		}
	}
}
