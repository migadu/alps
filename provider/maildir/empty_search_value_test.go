package maildir

import "testing"

func TestMaildirEmptySearchValuesAreRefused(t *testing.T) {
	p := NewProvider(t.TempDir(), "alice@example.com")
	putMessages(t, p, "Invoice")
	for _, query := range []string{"from:", `body:""`, `subject:""`, `header:X-Custom:`, `header:X-Custom:""`, `is:""`} {
		ids, err := p.SearchMessageIDs("INBOX", query)
		if err == nil || len(ids) != 0 {
			t.Errorf("bulk %q: %d IDs, %v; want refusal", query, len(ids), err)
		}
		messages, _, err := p.SearchMessages("INBOX", query, "desc", 0, 50)
		if err == nil || len(messages) != 0 {
			t.Errorf("listing %q: %d messages, %v; want refusal", query, len(messages), err)
		}
	}
}
