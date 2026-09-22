package maildir

import (
	"os"
	"path/filepath"
	"testing"
)

func TestAuthenticate(t *testing.T) {
	tmpDir := t.TempDir()
	passwdPath := filepath.Join(tmpDir, "passwd")

	// Create a mock Dovecot passwd file
	content := `
# This is a comment
plainuser@example.com:{PLAIN}password123:1000:1000::/var/vmail/plainuser::
bcryptuser@example.com:{CRYPT}$2a$10$AtHqzAkW6RDNEHJo2VI7Yug6GLQp/WHDWrPGpUkTtENE5woXCIf0W:1001:1001::/var/vmail/bcryptuser::
sha256user@example.com:{SHA256}EF92B778BAFE771E89245B89ECBC08A44A4E166C06659911881F383D4473E94F:1002:1002::/var/vmail/sha256user::
md5user@example.com:{md5}5f4dcc3b5aa765d61d8327deb882cf99:1003:1003::/var/vmail/md5user::
`
	err := os.WriteFile(passwdPath, []byte(content), 0644)
	if err != nil {
		t.Fatalf("failed to write passwd file: %v", err)
	}

	tests := []struct {
		name        string
		username    string
		password    string
		expectError bool
		expectHome  string
	}{
		{
			name:        "Valid PLAIN password",
			username:    "plainuser@example.com",
			password:    "password123",
			expectError: false,
			expectHome:  "/var/vmail/plainuser",
		},
		{
			name:        "Invalid PLAIN password",
			username:    "plainuser@example.com",
			password:    "wrongpass",
			expectError: true,
		},
		{
			name:        "Valid BCRYPT password",
			username:    "bcryptuser@example.com",
			password:    "bcryptpass", // Note: The hash in the mock is for 'bcryptpass'
			expectError: false,
			expectHome:  "/var/vmail/bcryptuser",
		},
		{
			name:        "Invalid BCRYPT password",
			username:    "bcryptuser@example.com",
			password:    "wrongpass",
			expectError: true,
		},
		{
			name:        "Valid SHA256 with uppercase hex",
			username:    "sha256user@example.com",
			password:    "password123",
			expectError: false,
			expectHome:  "/var/vmail/sha256user",
		},
		{
			name:        "Valid MD5 with lowercase scheme tag",
			username:    "md5user@example.com",
			password:    "password",
			expectError: false,
			expectHome:  "/var/vmail/md5user",
		},
		{
			name:        "Unknown user",
			username:    "unknown@example.com",
			password:    "password123",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			homeDir, err := authenticate(passwdPath, tt.username, tt.password)
			if (err != nil) != tt.expectError {
				t.Errorf("Authenticate() error = %v, expectError %v", err, tt.expectError)
				return
			}
			if !tt.expectError && homeDir != tt.expectHome {
				t.Errorf("Authenticate() got homeDir = %v, want %v", homeDir, tt.expectHome)
			}
		})
	}
}
