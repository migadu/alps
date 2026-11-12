package imap

import (
	"errors"
	"github.com/migadu/alps/provider"
	"testing"
)

func TestSearchValidationPreservesIntentAndReportsTypedErrors(t *testing.T) {
	for _, query := range []string{"from:", `body:""`, `body:"`, `body:"""`, `header:X-Custom:`, `header:X-Custom:""`, `subject:"" invoice`} {
		var invalid *provider.InvalidSearchError
		if err := ValidateSearch(query); !errors.As(err, &invalid) {
			t.Errorf("%q: got %T %v; want InvalidSearchError", query, err, err)
		}
	}
	for _, query := range []string{"", `""`, `"from:"`, `from:alice`, `body:"invoice"`, `header:X-Custom:yes`, `is:read`} {
		if err := ValidateSearch(query); err != nil {
			t.Errorf("valid %q refused: %v", query, err)
		}
	}
}
