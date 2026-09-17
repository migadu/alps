package imap

import (
	"reflect"
	"testing"

	"github.com/emersion/go-imap/v2"
)

func TestPrepareIMAPSearch(t *testing.T) {
	tests := []struct {
		name     string
		terms    string
		expected *imap.SearchCriteria
	}{
		{
			name:  "Header search with quotes",
			terms: `header:In-Reply-To:"<test@example.com>"`,
			expected: &imap.SearchCriteria{
				Header: []imap.SearchCriteriaHeaderField{
					{Key: "In-Reply-To", Value: "<test@example.com>"},
				},
			},
		},
		{
			name:  "Header search without quotes",
			terms: `header:In-Reply-To:<test@example.com>`,
			expected: &imap.SearchCriteria{
				Header: []imap.SearchCriteriaHeaderField{
					{Key: "In-Reply-To", Value: "<test@example.com>"},
				},
			},
		},
		{
			name:  "From search with quotes",
			terms: `from:"Dejan Strbac"`,
			expected: &imap.SearchCriteria{
				Header: []imap.SearchCriteriaHeaderField{
					{Key: "From", Value: "Dejan Strbac"},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := prepareIMAPSearch(tt.terms)
			if !reflect.DeepEqual(result.Header, tt.expected.Header) {
				t.Errorf("expected header %+v, got %+v", tt.expected.Header, result.Header)
			}
		})
	}
}

func TestSearchTokens(t *testing.T) {
	text := func(v string) searchTerm { return searchTerm{value: v} }
	pre := func(p, v string) searchTerm { return searchTerm{prefix: p, value: v} }
	tests := []struct {
		query string
		want  []searchTerm
	}{
		{`urgent`, []searchTerm{text("urgent")}},
		{`hello world`, []searchTerm{text("hello world")}},
		{`  hello   world  `, []searchTerm{text("hello world")}},
		// Quotes keep a phrase together, and are not searched for.
		{`"urgent meeting"`, []searchTerm{text("urgent meeting")}},
		{`from:alice "big deal" later`, []searchTerm{pre("from", "alice"), text("big deal"), text("later")}},
		// The help's own example: the last word used to be dropped whenever a
		// space preceded it at the end of the query.
		{`from:alice@example.com subject:project urgent`, []searchTerm{pre("from", "alice@example.com"), pre("subject", "project"), text("urgent")}},
		{`urgent from:alice`, []searchTerm{text("urgent"), pre("from", "alice")}},
		{`subject:"urgent meeting notes" body:"hello world"`, []searchTerm{pre("subject", "urgent meeting notes"), pre("body", "hello world")}},
		{`FROM:Alice`, []searchTerm{pre("from", "Alice")}},
		// Not a prefix: searched as it is written.
		{`meeting 10:30`, []searchTerm{text("meeting 10:30")}},
		{`https://example.com/x`, []searchTerm{text("https://example.com/x")}},
		{`"from: bob"`, []searchTerm{text("from: bob")}},
		{`header:In-Reply-To:"<a b@example.com>"`, []searchTerm{pre("header", `In-Reply-To:"<a b@example.com>"`)}},
		{`"unclosed phrase`, []searchTerm{text("unclosed phrase")}},
		{``, nil},
		{`""`, nil},
	}
	for _, tt := range tests {
		if got := searchTokens(tt.query); !reflect.DeepEqual(got, tt.want) {
			t.Errorf("searchTokens(%q) = %+v, want %+v", tt.query, got, tt.want)
		}
	}
}

// A plain term searches the whole message, headers and body, as the search
// help says; it used to search From, To, Cc and Subject only (#55).
func TestPrepareIMAPSearchPlainTermsSearchTheWholeMessage(t *testing.T) {
	c := prepareIMAPSearch(`invoice from:alice "late fee"`)
	if !reflect.DeepEqual(c.Text, []string{"invoice", "late fee"}) {
		t.Errorf("Text = %q", c.Text)
	}
	if len(c.Header) != 1 || c.Header[0] != (imap.SearchCriteriaHeaderField{Key: "From", Value: "alice"}) {
		t.Errorf("Header = %+v", c.Header)
	}
	if len(c.Or) != 0 || len(c.Body) != 0 {
		t.Errorf("Or = %+v, Body = %q", c.Or, c.Body)
	}

	c = prepareIMAPSearch(`is:unread body:"hello world"`)
	if !reflect.DeepEqual(c.Body, []string{"hello world"}) || len(c.Text) != 0 || len(c.NotFlag) != 1 {
		t.Errorf("criteria = %+v", c)
	}
}

func TestSearchFindsAWordInTheBody(t *testing.T) {
	p := memIMAP(t, &memServer{},
		"From: Charles <charles@remote.test>\r\nSubject: Engines\r\n\r\nThe difference engine needs a zebra crossing.\r\n",
		"From: Ada <ada@remote.test>\r\nSubject: Zebra notes\r\n\r\nNothing here.\r\n",
		"From: Mary <mary@remote.test>\r\nSubject: Looms\r\n\r\nPunched cards.\r\n",
	)
	subjects := func(query string) []string {
		t.Helper()
		msgs, _, err := p.SearchMessages("INBOX", query, "asc", 0, 50)
		if err != nil {
			t.Fatalf("%q: %v", query, err)
		}
		var got []string
		for _, m := range msgs {
			got = append(got, m.Envelope.Subject)
		}
		return got
	}
	if got := subjects("zebra"); !reflect.DeepEqual(got, []string{"Engines", "Zebra notes"}) {
		t.Errorf("zebra found %q, want the body and the subject", got)
	}
	if got := subjects("from:charles zebra"); !reflect.DeepEqual(got, []string{"Engines"}) {
		t.Errorf("from:charles zebra found %q", got)
	}
	if got := subjects(`"punched cards"`); !reflect.DeepEqual(got, []string{"Looms"}) {
		t.Errorf(`"punched cards" found %q`, got)
	}
}
