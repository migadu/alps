package alpsbase

import (
	"testing"

	"github.com/emersion/go-imap/v2"
)

func TestPrepareSearch(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		validate func(*testing.T, *imap.SearchCriteria)
	}{
		{
			name:  "simple term searches text",
			input: "alice",
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				// Should search via Text
				if len(c.Text) == 0 {
					t.Error("expected Text criteria")
				}
			},
		},
		{
			name:  "from search",
			input: "from:alice@example.com",
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				if len(c.Header) == 0 {
					t.Fatal("expected Header criteria")
				}
				if c.Header[0].Key != "From" || c.Header[0].Value != "alice@example.com" {
					t.Errorf("expected From:alice@example.com, got %s:%s", c.Header[0].Key, c.Header[0].Value)
				}
			},
		},
		{
			name:  "body search",
			input: "body:godspeed",
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				if len(c.Body) == 0 {
					t.Fatal("expected Body criteria")
				}
				if c.Body[0] != "godspeed" {
					t.Errorf("expected body:godspeed, got %s", c.Body[0])
				}
			},
		},
		{
			name:  "quoted body search",
			input: `body:"godspeed"`,
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				if len(c.Body) == 0 {
					t.Fatal("expected Body criteria")
				}
				if c.Body[0] != "godspeed" {
					t.Errorf("expected body:godspeed, got %s", c.Body[0])
				}
			},
		},
		{
			name:  "quoted body with spaces",
			input: `body:"hello world"`,
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				if len(c.Body) == 0 {
					t.Fatal("expected Body criteria")
				}
				if c.Body[0] != "hello world" {
					t.Errorf("expected body:hello world, got %s", c.Body[0])
				}
			},
		},
		{
			name:  "subject search",
			input: "subject:urgent",
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				if len(c.Header) == 0 {
					t.Fatal("expected Header criteria")
				}
				if c.Header[0].Key != "Subject" || c.Header[0].Value != "urgent" {
					t.Errorf("expected Subject:urgent, got %s:%s", c.Header[0].Key, c.Header[0].Value)
				}
			},
		},
		{
			name:  "quoted subject search",
			input: `subject:"meeting notes"`,
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				if len(c.Header) == 0 {
					t.Fatal("expected Header criteria")
				}
				if c.Header[0].Key != "Subject" || c.Header[0].Value != "meeting notes" {
					t.Errorf("expected Subject:meeting notes, got %s:%s", c.Header[0].Key, c.Header[0].Value)
				}
			},
		},
		{
			name:  "multiple terms",
			input: "from:alice subject:urgent",
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				// Should have both criteria AND'd together
				if len(c.Header) == 0 {
					t.Fatal("expected Header criteria")
				}
			},
		},
		{
			name:  "mixed quoted and unquoted",
			input: `from:alice body:"hello world" urgent`,
			validate: func(t *testing.T, c *imap.SearchCriteria) {
				if c == nil {
					t.Fatal("expected criteria, got nil")
				}
				// Should have all criteria
				if len(c.Body) == 0 {
					t.Fatal("expected Body criteria")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := PrepareSearch(tt.input)
			tt.validate(t, result)
		})
	}
}
