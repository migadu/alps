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
