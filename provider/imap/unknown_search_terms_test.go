package imap

import "testing"

func TestUnknownSearchTermsAreNotDropped(t *testing.T) {
	for _, query := range []string{"is:read", "is:seen", "is:answered", "header:X-Spam", "header:", "is:"} {
		c := prepareIMAPSearch(query)
		if len(c.Text) != 1 || c.Text[0] != query {
			t.Errorf("%q: Text = %q; want literal term", query, c.Text)
		}
		c = prepareIMAPSearch(query + " invoice")
		if len(c.Text) != 2 || c.Text[0] != query || c.Text[1] != "invoice" {
			t.Errorf("%q combined: Text = %q", query, c.Text)
		}
	}
}
