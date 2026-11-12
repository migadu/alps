package maildir

import (
	"bytes"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUnsupportedPasswordFormatsAreLoggedWithoutSecrets(t *testing.T) {
	for _, hash := range []string{"{SHA512-CRYPT}$6$salt$secret", "{CRYPT}$6$salt$secret", "{SHA256}base64digest==", "{SHA512}base64digest=="} {
		t.Run(hash[:strings.IndexByte(hash, '}')+1], func(t *testing.T) {
			dir := t.TempDir()
			path := filepath.Join(dir, "passwd")
			if err := os.WriteFile(path, []byte("alice:"+hash+"\n"), 0600); err != nil {
				t.Fatal(err)
			}
			var output bytes.Buffer
			previous := log.Writer()
			log.SetOutput(&output)
			defer log.SetOutput(previous)
			_, err := authenticate(path, "alice", "private-password")
			if err != ErrInvalidCredentials {
				t.Fatalf("got %v", err)
			}
			if !strings.Contains(output.String(), "alice") || !strings.Contains(output.String(), "scheme") {
				t.Errorf("missing scheme warning: %q", output.String())
			}
			for _, secret := range []string{"salt", "secret", "base64digest", "private-password"} {
				if strings.Contains(output.String(), secret) {
					t.Errorf("warning exposed secret %q", secret)
				}
			}
		})
	}
}
