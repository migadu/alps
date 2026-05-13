package managesieve

import (
	"strings"

	"github.com/migadu/go-sieve"
)

// ValidateScript uses the internal go-sieve library to parse the script and
// check for syntax and extension support errors.
func ValidateScript(scriptContent string, allowedExtensions []string) error {
	opts := sieve.DefaultOptions()

	if len(allowedExtensions) > 0 {
		opts.EnabledExtensions = allowedExtensions
	}

	_, err := sieve.Load(strings.NewReader(scriptContent), opts)
	return err
}
