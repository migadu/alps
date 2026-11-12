package multi

import (
	"strings"
	"testing"
)

func TestDynamicRulesAreValidatedAtStartup(t *testing.T) {
	for _, tc := range []struct {
		name string
		cfg  Config
		want string
	}{
		{"template allowlist absent", Config{Template: "imaps://mail.%d"}, "template_domains"},
		{"template allowlist blank", Config{Template: "imaps://mail.%d", TemplateDomains: []string{" "}}, "template_domains"},
		{"autodiscover allowlist absent", Config{Autodiscover: true}, "autodiscover_domains"},
		{"autodiscover allowlist blank", Config{Autodiscover: true, AutodiscoverDomains: []string{" "}}, "autodiscover_domains"},
		{"wrong scheme", Config{Template: "https://mail.%d", TemplateDomains: []string{"*"}}, "template"},
		{"missing scheme", Config{Template: "mail.%d:993", TemplateDomains: []string{"*"}}, "template"},
		{"missing host", Config{Template: "imaps:///mail", TemplateDomains: []string{"*"}}, "template"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := tc.cfg.ToOptions(); err == nil || !strings.Contains(err.Error(), tc.want) {
				t.Fatalf("unusable rule accepted or context lost: %v", err)
			}
		})
	}
	for _, template := range []string{"imaps://mail.%d:993", "imap://%u.%d", "imap+insecure://mail.%d"} {
		if _, err := (&Config{Template: template, TemplateDomains: []string{"*"}}).ToOptions(); err != nil {
			t.Fatalf("valid %q: %v", template, err)
		}
	}
}
