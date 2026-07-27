package alps

import (
	"crypto/tls"
	"encoding/json"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/fernet/fernet-go"
	"github.com/stretchr/testify/assert"
)

// TestContext_CookieSecureReflectsForwardedProto verifies that the cookie Secure
// flag reflects the browser-facing scheme: HTTPS directly, or HTTP forwarded as
// https by a trusted proxy — but never a spoofed X-Forwarded-Proto from an
// untrusted peer.
func TestContext_CookieSecureReflectsForwardedProto(t *testing.T) {
	_, privateNet, _ := net.ParseCIDR("10.0.0.0/8")
	trustedServer := &Server{Options: &Options{TrustedProxies: []*net.IPNet{privateNet}}}
	noProxyServer := &Server{Options: &Options{}}

	newCtx := func(server *Server, isTLS bool, remoteAddr, xfp string) *Context {
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = remoteAddr
		if isTLS {
			req.TLS = &tls.ConnectionState{}
		}
		if xfp != "" {
			req.Header.Set("X-Forwarded-Proto", xfp)
		}
		return NewContext(httptest.NewRecorder(), req, server)
	}

	cases := []struct {
		name       string
		ctx        *Context
		wantSecure bool
	}{
		{"direct TLS", newCtx(noProxyServer, true, "1.2.3.4:9", ""), true},
		{"plain HTTP, no proxy", newCtx(noProxyServer, false, "1.2.3.4:9", ""), false},
		{"trusted proxy forwards https", newCtx(trustedServer, false, "10.0.0.5:9", "https"), true},
		{"trusted proxy forwards http", newCtx(trustedServer, false, "10.0.0.5:9", "http"), false},
		{"untrusted peer spoofs https", newCtx(trustedServer, false, "203.0.113.9:9", "https"), false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.wantSecure, tc.ctx.isEffectiveHTTPS())
		})
	}

	// End-to-end: the session cookie must carry Secure behind a trusted https proxy.
	c := newCtx(trustedServer, false, "10.0.0.5:9", "https")
	c.SetSession(&Session{token: "tok"})
	for _, ck := range c.Response.(*httptest.ResponseRecorder).Result().Cookies() {
		if ck.Name == cookieName {
			assert.True(t, ck.Secure, "session cookie must be Secure behind an https-terminating trusted proxy")
		}
	}
}

func TestContextSetGet(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	c.Set("key1", "value1")
	c.Set("key2", 123)

	assert.Equal(t, "value1", c.Get("key1"))
	assert.Equal(t, 123, c.Get("key2"))
	assert.Nil(t, c.Get("nonexistent"))
}

func TestContextPathValue(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	c.SetPathValue("id", "42")
	assert.Equal(t, "42", c.PathValue("id"))
}

func TestContextQueryParam(t *testing.T) {
	req := httptest.NewRequest("GET", "/?foo=bar&baz=qux", nil)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	assert.Equal(t, "bar", c.QueryParam("foo"))
	assert.Equal(t, "qux", c.QueryParam("baz"))
	assert.Equal(t, "", c.QueryParam("nonexistent"))
}

func TestContextJSON(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	data := map[string]string{"message": "hello"}
	err := c.JSON(http.StatusCreated, data)

	assert.NoError(t, err)
	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Equal(t, "application/json; charset=UTF-8", w.Header().Get("Content-Type"))

	var result map[string]string
	err = json.Unmarshal(w.Body.Bytes(), &result)
	assert.NoError(t, err)
	assert.Equal(t, "hello", result["message"])
}

func TestContextString(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	err := c.String(http.StatusOK, "hello world")

	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "text/plain; charset=UTF-8", w.Header().Get("Content-Type"))
	assert.Equal(t, "hello world", w.Body.String())
}

func TestContextBindJSON(t *testing.T) {
	body := strings.NewReader(`{"name":"test"}`)
	req := httptest.NewRequest("POST", "/", body)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	var payload struct {
		Name string `json:"name"`
	}
	err := c.BindJSON(&payload)

	assert.NoError(t, err)
	assert.Equal(t, "test", payload.Name)
}

func TestContextRedirect(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	server := &Server{
		logger: &NilLogger{},
	}
	c := NewContext(w, req, server)

	err := c.Redirect(http.StatusFound, "/login")
	assert.Equal(t, ErrRedirect, err)
	assert.Equal(t, http.StatusFound, w.Code)
	assert.Equal(t, "/login", w.Header().Get("Location"))
}

func TestContextSetCookie(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	cookie := &http.Cookie{
		Name:  "mycookie",
		Value: "myvalue",
	}
	c.SetCookie(cookie)

	assert.Equal(t, "mycookie=myvalue", w.Header().Get("Set-Cookie"))
}

func TestContextSetSession(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()
	server := &Server{}
	c := NewContext(w, req, server)

	s := &Session{token: "test-token"}
	c.SetSession(s)

	cookies := w.Result().Cookies()
	assert.Len(t, cookies, 2)

	var sessionCookie, loggedInCookie *http.Cookie
	for _, cookie := range cookies {
		switch cookie.Name {
		case "alps_session":
			sessionCookie = cookie
		case "alps_logged_in":
			loggedInCookie = cookie
		}
	}

	assert.NotNil(t, sessionCookie)
	assert.Equal(t, "test-token", sessionCookie.Value)
	assert.Equal(t, "/", sessionCookie.Path)
	assert.True(t, sessionCookie.HttpOnly)

	assert.NotNil(t, loggedInCookie)
	assert.Equal(t, "1", loggedInCookie.Value)
	assert.False(t, loggedInCookie.HttpOnly)
}

func TestContextSetLoginToken(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)
	w := httptest.NewRecorder()

	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}

	server := &Server{
		Options: &Options{
			LoginKey: &key,
		},
	}
	c := NewContext(w, req, server)

	c.SetLoginToken("user", "pass", true, true)

	cookies := w.Result().Cookies()
	assert.Len(t, cookies, 2)

	var tokenCookie *http.Cookie
	for _, cookie := range cookies {
		if cookie.Name == "alps_login_token" {
			tokenCookie = cookie
		}
	}

	assert.NotNil(t, tokenCookie)
	assert.True(t, tokenCookie.HttpOnly)
	assert.NotEmpty(t, tokenCookie.Value)

	// Now try getting it back
	req2 := httptest.NewRequest("GET", "/", nil)
	req2.AddCookie(tokenCookie)
	c2 := NewContext(w, req2, server)

	username, password, verified2FA, persistent := c2.GetLoginToken()

	assert.Equal(t, "user", username)
	assert.Equal(t, "pass", password)
	assert.True(t, verified2FA)
	assert.True(t, persistent)
}

// Dummy logger for tests
type NilLogger struct{}

func (l *NilLogger) Print(i ...interface{})                 {}
func (l *NilLogger) Printf(format string, v ...interface{}) {}
func (l *NilLogger) Debug(i ...interface{})                 {}
func (l *NilLogger) Debugf(format string, v ...interface{}) {}
func (l *NilLogger) Info(i ...interface{})                  {}
func (l *NilLogger) Infof(format string, v ...interface{})  {}
func (l *NilLogger) Error(i ...interface{})                 {}
func (l *NilLogger) Errorf(format string, v ...interface{}) {}
func (l *NilLogger) Fatal(i ...interface{})                 {}
func (l *NilLogger) Fatalf(format string, v ...interface{}) {}
func (l *NilLogger) Warn(i ...interface{})                  {}
func (l *NilLogger) Warnf(format string, v ...interface{})  {}
func (l *NilLogger) SetLevel(level slog.Level)              {}
