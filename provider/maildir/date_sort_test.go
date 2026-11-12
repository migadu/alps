package maildir

import (
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"testing"
)

func TestDateSortUsesHeadersAndFallsBackToDeliveryTime(t *testing.T) {
	dir := t.TempDir()
	p := NewProvider(dir, "alice@example.com")
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	for _, m := range []struct{ key, subject, date string }{
		{"1700000000.a", "newest", "Fri, 01 Nov 2024 12:00:00 +0000"},
		{"1700000001.b", "oldest", "Tue, 01 Nov 2022 12:00:00 +0000"},
		{"1700000002.c", "no date", ""},
	} {
		raw := fmt.Sprintf("Subject: %s\r\nDate: %s\r\n\r\nbody", m.subject, m.date)
		if err := os.WriteFile(filepath.Join(dir, "cur", m.key+":2,S"), []byte(raw), 0600); err != nil {
			t.Fatal(err)
		}
	}
	subjects := func(order string) []string {
		t.Helper()
		msgs, _, err := p.SearchMessages("INBOX", "", order, 0, 50)
		if err != nil {
			t.Fatal(err)
		}
		var result []string
		for _, m := range msgs {
			result = append(result, m.Envelope.Subject)
		}
		return result
	}
	if got := subjects("asc"); !reflect.DeepEqual(got, []string{"oldest", "no date", "newest"}) {
		t.Errorf("date asc = %v", got)
	}
	if got := subjects("desc"); !reflect.DeepEqual(got, []string{"newest", "no date", "oldest"}) {
		t.Errorf("date desc = %v", got)
	}
	store, _ := p.GetStore()
	if err := store.Put("base.settings", map[string]string{"message_sort_criteria": "uid"}); err != nil {
		t.Fatal(err)
	}
	if got := subjects("asc"); !reflect.DeepEqual(got, []string{"newest", "oldest", "no date"}) {
		t.Errorf("uid asc = %v", got)
	}
}
