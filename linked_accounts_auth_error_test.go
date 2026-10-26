package alps

import (
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/fernet/fernet-go"
	"github.com/migadu/alps/provider"
)

func TestLinkedAccounts_TargetCredentialRefusalKeepsItsCause(t *testing.T) {
	cause := errors.New("LOGIN refused")
	for _, refused := range []bool{false, true} {
		t.Run(fmt.Sprintf("refused=%v", refused), func(t *testing.T) {
			var key fernet.Key
			if err := key.Generate(); err != nil {
				t.Fatal(err)
			}
			connectError := fmt.Errorf("dial: %w", cause)
			if refused {
				connectError = fmt.Errorf("LOGIN: %w", provider.AuthError{Cause: cause})
			}
			sm := newSessionManager(func(username, password string) (provider.MailProvider, error) {
				if username != "target@example.com" || password != "provided password" {
					t.Errorf("unexpected credentials %q/%q", username, password)
				}
				return nil, connectError
			}, nil, &NilLogger{}, 0, false, &key, time.Minute, 0, 0, 0, 0, 0, 0)
			s := &Session{manager: sm, username: "primary@example.com"}
			err := s.AddLinkedAccount("target@example.com", "provided password", "Target")
			if errors.Is(err, ErrLinkedCredentialsRefused) != refused {
				t.Errorf("credential-refusal marker on %v, want %v", err, refused)
			}
			var authErr provider.AuthError
			if errors.As(err, &authErr) != refused {
				t.Errorf("AuthError chain on %v, want %v", err, refused)
			}
			if !errors.Is(err, cause) {
				t.Errorf("underlying cause lost: %v", err)
			}
		})
	}
}
