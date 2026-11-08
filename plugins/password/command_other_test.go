//go:build !unix

package password

import (
	"strings"
	"testing"
)

func TestCommandRequiresProcessGroupSupport(t *testing.T) {
	if _, err := parseConfig(commandBlock("/program")); err == nil || !strings.Contains(err.Error(), "Unix") {
		t.Fatalf("expected unsupported-platform error, got %v", err)
	}
	if _, err := parseConfig(map[string]interface{}{"endpoint": "https://admin.example/api"}); err != nil {
		t.Fatalf("HTTP backend must remain available: %v", err)
	}
}
