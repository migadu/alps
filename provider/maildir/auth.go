package maildir

import (
	"bufio"
	"crypto/md5"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// ErrInvalidCredentials is returned when password verification fails
var ErrInvalidCredentials = fmt.Errorf("invalid credentials")

// Authenticate verifies the username and password against a Dovecot passwd file.
// Returns the parsed user home directory if successful, or an error.
func authenticate(passwdFile, username, password string) (string, error) {
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
			var format *unsupportedPasswordFormat
			if errors.As(err, &format) {
				log.Printf("alps/provider/maildir: warning: user %q has unsupported password scheme %q", username, format.scheme)
			}
			return "", ErrInvalidCredentials
		}

		return homeDir, nil
	}

	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("error reading passwd file: %w", err)
	}

	return "", ErrInvalidCredentials
}

type unsupportedPasswordFormat struct{ scheme string }

func (e *unsupportedPasswordFormat) Error() string {
	return "unsupported password scheme or digest format: " + e.scheme
}

func validPasswordScheme(name string) bool {
	for _, c := range name {
		if !((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' || c == '.' || c == '_') {
			return false
		}
	}
	return name != "" && len(name) <= 32
}

func verifyHash(password, hash string) error {
	scheme := "{PLAIN}"
	if strings.HasPrefix(hash, "{") {
		endIdx := strings.Index(hash, "}")
		if endIdx > 1 && endIdx <= 33 && validPasswordScheme(hash[1:endIdx]) {
			scheme = strings.ToUpper(hash[:endIdx+1])
			hash = hash[endIdx+1:]
		}
	}

	switch scheme {
	case "{PLAIN}":
		if subtle.ConstantTimeCompare([]byte(password), []byte(hash)) != 1 {
			return fmt.Errorf("password mismatch")
		}
		return nil
	case "{CRYPT}":
		// Only bcrypt is implemented for now.
		if strings.HasPrefix(hash, "$2a$") || strings.HasPrefix(hash, "$2b$") || strings.HasPrefix(hash, "$2y$") || strings.HasPrefix(hash, "$2x$") {
			return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
		}
		return &unsupportedPasswordFormat{scheme: scheme}
	case "{MD5}":
		if digest, err := hex.DecodeString(hash); err != nil || len(digest) != 16 {
			return &unsupportedPasswordFormat{scheme: scheme}
		}
		sum := md5.Sum([]byte(password))
		got := hex.EncodeToString(sum[:])
		if subtle.ConstantTimeCompare([]byte(got), []byte(strings.ToLower(hash))) != 1 {
			return fmt.Errorf("password mismatch")
		}
		return nil
	case "{SHA256}":
		if digest, err := hex.DecodeString(hash); err != nil || len(digest) != 32 {
			return &unsupportedPasswordFormat{scheme: scheme}
		}
		sum := sha256.Sum256([]byte(password))
		got := hex.EncodeToString(sum[:])
		if subtle.ConstantTimeCompare([]byte(got), []byte(strings.ToLower(hash))) != 1 {
			return fmt.Errorf("password mismatch")
		}
		return nil
	case "{SHA512}":
		if digest, err := hex.DecodeString(hash); err != nil || len(digest) != 64 {
			return &unsupportedPasswordFormat{scheme: scheme}
		}
		sum := sha512.Sum512([]byte(password))
		got := hex.EncodeToString(sum[:])
		if subtle.ConstantTimeCompare([]byte(got), []byte(strings.ToLower(hash))) != 1 {
			return fmt.Errorf("password mismatch")
		}
		return nil
	default:
		return &unsupportedPasswordFormat{scheme: scheme}
	}
}
