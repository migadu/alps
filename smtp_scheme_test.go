package alps

import (
	"strings"
	"testing"
)

func TestSMTPMissingSchemeExplainsRequiredSchemes(t *testing.T) {
	for _, raw := range []string{"smtp.example.test", "smtp.example.test:465", "127.0.0.1:587", "[::1]:587"} {
		_, _, _, err := parseSMTPURL(raw, false)
		if err == nil || !strings.Contains(err.Error(), "SMTP server requires a scheme (smtps://, smtp://, smtp+insecure://)") {
			t.Errorf("%q: %v", raw, err)
		}
	}
}
