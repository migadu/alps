package maildir

import (
	"bufio"
	"crypto/md5"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// ErrInvalidCredentials is returned when password verification fails
var ErrInvalidCredentials = fmt.Errorf("invalid credentials")

// Authenticate verifies the username and password against a Dovecot passwd file.
// Returns the parsed user home directory if successful, or an error.
func Authenticate(passwdFile, username, password string) (string, error) {
	file, err := os.Open(passwdFile)
	if err != nil {
		return "", fmt.Errorf("failed to open passwd file: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.Split(line, ":")
		if len(parts) < 2 {
			continue
		}

		fileUser := parts[0]
		if fileUser != username {
			continue
		}

		hash := parts[1]
		homeDir := ""
		if len(parts) >= 6 {
			homeDir = parts[5]
		}

		if err := verifyHash(password, hash); err != nil {
			return "", ErrInvalidCredentials
		}

		return homeDir, nil
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("error reading passwd file: %w", err)
	}

	return "", ErrInvalidCredentials
}

func verifyHash(password, hash string) error {
	scheme := "{PLAIN}"
	if strings.HasPrefix(hash, "{") {
		endIdx := strings.Index(hash, "}")
		if endIdx > 0 {
			scheme = hash[:endIdx+1]
			hash = hash[endIdx+1:]
		}
	}

	switch scheme {
	case "{PLAIN}":
		if password != hash {
			return fmt.Errorf("password mismatch")
		}
		return nil
	case "{CRYPT}":
		// Only bcrypt is implemented for now.
		if strings.HasPrefix(hash, "$2a$") || strings.HasPrefix(hash, "$2b$") || strings.HasPrefix(hash, "$2y$") || strings.HasPrefix(hash, "$2x$") {
			return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
		}
		return fmt.Errorf("unsupported crypt scheme: %s", hash)
	case "{MD5}":
		sum := md5.Sum([]byte(password))
		if hex.EncodeToString(sum[:]) != hash {
			return fmt.Errorf("password mismatch")
		}
		return nil
	case "{SHA256}":
		sum := sha256.Sum256([]byte(password))
		if hex.EncodeToString(sum[:]) != hash {
			return fmt.Errorf("password mismatch")
		}
		return nil
	case "{SHA512}":
		sum := sha512.Sum512([]byte(password))
		if hex.EncodeToString(sum[:]) != hash {
			return fmt.Errorf("password mismatch")
		}
		return nil
	default:
		return fmt.Errorf("unsupported hash scheme: %s", scheme)
	}
}
