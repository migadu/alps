package provider

import (
	"reflect"
	"testing"
)

func TestMessageIDs(t *testing.T) {
	cases := []struct {
		value string
		want  []string
	}{
		{"<a@example.com>", []string{"a@example.com"}},
		{"<a@example.com> <b@example.com>", []string{"a@example.com", "b@example.com"}},
		{"<a@example.com>\r\n <b@example.com>", []string{"a@example.com", "b@example.com"}},
		// Bare, as some senders write In-Reply-To.
		{"a@example.com", []string{"a@example.com"}},
		{"a@example.com b@example.com", []string{"a@example.com", "b@example.com"}},
		{"a@example.com, b@example.com", []string{"a@example.com", "b@example.com"}},
		// Not an ID: no @, or something that could start a header when written back.
		{"", nil},
		{"hello", nil},
		{"<a@example.com\r\nBcc: victim@example.net>", nil},
		{"<a b@example.com>", nil},
		{"<a<b@example.com>", nil},
	}
	for _, c := range cases {
		if got := MessageIDs(c.value); !reflect.DeepEqual(got, c.want) {
			t.Errorf("MessageIDs(%q) = %q, want %q", c.value, got, c.want)
		}
	}
}
