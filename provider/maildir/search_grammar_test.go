package maildir

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMaildirSearchUsesQueryGrammar(t *testing.T) {
	dir := t.TempDir()
	p := NewProvider(dir, "alice@example.com")
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	for _, m := range []struct{ name, raw string }{
		{"1700000000.a:2,F", "From: Alice <alice@example.com>\r\nTo: Bob <bob@example.com>\r\nCc: Carol <carol@example.com>\r\nSubject: =?utf-8?Q?weekly_r=C3=A9sum=C3=A9?=\r\nX-Project: engines\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\ninvoice r=C3=A9sum=C3=A9"},
		{"1700000001.b:2,S", "From: Dave <dave@example.com>\r\nSubject: invoice\r\n\r\nmeeting notes"},
	} {
		if err := os.WriteFile(filepath.Join(dir, "cur", m.name), []byte(m.raw), 0600); err != nil {
			t.Fatal(err)
		}
	}
	for query, want := range map[string]int{
		"is:starred": 1, "is:flagged": 1, "is:unread": 1, "from:alice": 1, "to:bob": 1, "cc:carol": 1,
		`subject:"weekly résumé"`: 1, `body:"invoice résumé"`: 1, "body:weekly": 0, "header:X-Project:engines": 1,
		`from:alice is:unread body:invoice`: 1, `from:alice is:unread body:meeting`: 0, `"meeting notes"`: 1,
	} {
		messages, page, err := p.SearchMessages("INBOX", query, "desc", 0, 50)
		if err != nil || len(messages) != want || page.Total != want {
			t.Errorf("%q: messages %d total %d err %v; want %d", query, len(messages), page.Total, err, want)
		}
		ids, err := p.SearchMessageIDs("INBOX", query)
		if err != nil || len(ids) != want {
			t.Errorf("%q bulk IDs: %d err %v; want %d", query, len(ids), err, want)
		}
	}
}
