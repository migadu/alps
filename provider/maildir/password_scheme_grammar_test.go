package maildir

import (
	"bytes"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestMalformedPasswordSchemePrefixesRemainPlainPasswords(t *testing.T) {
	for _, password := range []string{"{}secret", "{bad space}secret", "{bad\ttab}secret", "{bad\nline}secret", "{bad:colon}secret", "{bad/slash}secret", "{é}secret", "{" + strings.Repeat("A", 33) + "}secret"} {
		if err := verifyHash(password, password); err != nil {
			t.Errorf("literal password %q was treated as a scheme: %v", password, err)
		}
	}
}

func TestUnsupportedPasswordSchemeNamesAreQuotedInLogs(t *testing.T) {
	var output bytes.Buffer
	previous := log.Writer()
	log.SetOutput(&output)
	defer log.SetOutput(previous)
	file := filepath.Join(t.TempDir(), "passwd")
	if err := os.WriteFile(file, []byte("alice:{unknown-._7}hash\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if _, err := authenticate(file, "alice", "password"); err != ErrInvalidCredentials {
		t.Fatalf("got %v", err)
	}
	if !strings.Contains(output.String(), `scheme "{UNKNOWN-._7}"`) {
		t.Fatalf("scheme was not quoted: %q", output.String())
	}
}
