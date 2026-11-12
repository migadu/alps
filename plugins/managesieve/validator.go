package managesieve

import (
	"strings"

	"github.com/migadu/go-sieve"
)

// ValidateScript parses the language supported by the local go-sieve version.
func ValidateScript(scriptContent string, allowedExtensions []string) error {
	opts := sieve.DefaultOptions()

	if len(allowedExtensions) > 0 {
		opts.EnabledExtensions = allowedExtensions
	}

	_, err := sieve.Load(strings.NewReader(scriptContent), opts)
	return err
}

// validateForServer retains local syntax diagnostics unless the parser stops at
// a require for an extension it does not implement but the server advertises.
// That script must be judged by the server, including anything after require.
func validateForServer(content string, allowedExtensions []string) error {
	err := ValidateScript(content, allowedExtensions)
	if err == nil {
		return nil
	}
	_, extension, unknown := strings.Cut(err.Error(), "loadRequire: unsupported extension: ")
	if unknown {
		for _, advertised := range allowedExtensions {
			if extension == advertised {
				return nil
			}
		}
	}
	return err
}
