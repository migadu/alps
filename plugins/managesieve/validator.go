package managesieve

import (
	"strings"

	"github.com/migadu/go-sieve"
)

// ValidateScript provides optional local parsing for consumers. HTTP saves and
// validation use the ManageSieve server, whose extension support is authoritative.
func ValidateScript(scriptContent string, allowedExtensions []string) error {
	opts := sieve.DefaultOptions()

	if len(allowedExtensions) > 0 {
		opts.EnabledExtensions = allowedExtensions
	}

	_, err := sieve.Load(strings.NewReader(scriptContent), opts)
	return err
}
