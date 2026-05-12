package alps

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestParseUpstreamURL(t *testing.T) {
	u, err := ParseUpstreamURL("imap.example.com")
	assert.NoError(t, err)
	assert.Equal(t, "imap.example.com", u.Host)
	assert.Equal(t, "", u.Scheme)

	u, err = ParseUpstreamURL("imaps://imap.example.com:993")
	assert.NoError(t, err)
	assert.Equal(t, "imap.example.com:993", u.Host)
	assert.Equal(t, "imaps", u.Scheme)
}

func TestServerUpstreamConfig(t *testing.T) {
	logger := &NilLogger{}

	// Test 1: Only domain name with scheme
	opts := &Options{
		Provider: ProviderOptions{
			Type: "imap",
			IMAP: IMAPProviderOptions{Server: "imaps://example.com"},
		},
		SMTP: SMTPOptions{Server: "smtps://example.com"},
	}
	s, err := newServer(logger, opts)
	assert.NoError(t, err)
	assert.Equal(t, "example.com:993", s.imap.host)

	// Test 2: Specific schemes
	opts = &Options{
		Provider: ProviderOptions{
			Type: "imap",
			IMAP: IMAPProviderOptions{Server: "imaps://imap.example.com:993"},
		},
		SMTP: SMTPOptions{Server: "smtps://smtp.example.com:465"},
	}
	s, err = newServer(logger, opts)
	assert.NoError(t, err)
	assert.True(t, s.imap.tls)
	assert.Equal(t, "imap.example.com:993", s.imap.host)
	assert.True(t, s.smtp.tls)
	assert.Equal(t, "smtp.example.com:465", s.smtp.host)
}

func TestSanitizeError(t *testing.T) {
	// Generic errors
	assert.Equal(t, "An internal error occurred", sanitizeError(errors.New("db disconnect"), http.StatusInternalServerError))
	assert.Equal(t, "Authentication required", sanitizeError(errors.New("bad user"), http.StatusUnauthorized))
	assert.Equal(t, "Resource not found", sanitizeError(errors.New("missing"), http.StatusNotFound))

	// HTTPError instances should expose their message
	httpErr := NewHTTPError(http.StatusForbidden, "Custom forbidden message")
	assert.Equal(t, "Custom forbidden message", sanitizeError(httpErr, http.StatusForbidden))
}

func TestIsPublic(t *testing.T) {
	assert.True(t, isPublic("/session"))
	assert.True(t, isPublic("/plugins/caldav/assets/style.css"))
	assert.True(t, isPublic("/webauthn/verify"))

	assert.False(t, isPublic("/api/messages"))
	assert.False(t, isPublic("/"))
	assert.False(t, isPublic("/plugins/caldav/events"))
}

func TestHandleUnauthenticated(t *testing.T) {
	server := &Server{logger: &NilLogger{}}

	nextHandler := func(ctx *Context) error {
		return ctx.String(http.StatusOK, "success")
	}

	// Test Public Path
	reqPublic := httptest.NewRequest(http.MethodGet, "/session", nil)
	wPublic := httptest.NewRecorder()
	ctxPublic := NewContext(wPublic, reqPublic, server)
	err := handleUnauthenticated(nextHandler, ctxPublic)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, wPublic.Code)

	// Test Private Path
	reqPrivate := httptest.NewRequest(http.MethodGet, "/api/messages", nil)
	wPrivate := httptest.NewRecorder()
	ctxPrivate := NewContext(wPrivate, reqPrivate, server)
	err = handleUnauthenticated(nextHandler, ctxPrivate)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, wPrivate.Code)
}

func TestServerHandleError(t *testing.T) {
	server := &Server{
		logger: &NilLogger{},
	}
	// Give it a dummy session manager so we can test session closure on auth error
	server.Sessions = newSessionManager(nil, nil, &NilLogger{}, 0, false, nil, 30*time.Minute, 0, 0, 0, 0, 0, 0)

	// Auth error test
	req1 := httptest.NewRequest(http.MethodGet, "/api", nil)
	w1 := httptest.NewRecorder()
	ctx1 := NewContext(w1, req1, server)

	authErr := AuthError{cause: errors.New("invalid credentials")}
	server.handleError(authErr, ctx1)
	assert.Equal(t, http.StatusUnauthorized, w1.Code)
	assert.Contains(t, w1.Body.String(), "Authentication required")

	// Standard error test
	req2 := httptest.NewRequest(http.MethodGet, "/api", nil)
	w2 := httptest.NewRecorder()
	ctx2 := NewContext(w2, req2, server)

	stdErr := errors.New("database unreachable")
	server.handleError(stdErr, ctx2)
	assert.Equal(t, http.StatusInternalServerError, w2.Code)
	// Internal message is NOT exposed
	assert.NotContains(t, w2.Body.String(), "database unreachable")
	assert.Contains(t, w2.Body.String(), "An internal error occurred")
}
