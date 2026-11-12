package multi

import (
	"strings"
	"testing"
)

func TestFullLoginPlaceholderIsRefusedBeforeRouting(t *testing.T) {
	for _, template := range []string{"imaps://mail.%n:993", "imaps://%n:993", "imaps://mail.%d/%n"} {
		_, err := (&Config{Template: template, TemplateDomains: []string{"*"}}).ToOptions()
		if err == nil || !strings.Contains(err.Error(), "%n") {
			t.Errorf("unsafe or ineffective full-login template accepted: %q, %v", template, err)
		}
	}
}
