package alps

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strings"
	"time"

	"github.com/fernet/fernet-go"
)

// Context is the context used by HTTP handlers.
type Context struct {
	Request  *http.Request
	Response http.ResponseWriter
	Server   *Server
	Session  *Session // nil if user isn't logged in

	// path values extracted from URL pattern
	pathValues map[string]string
	// store for arbitrary values
	store map[string]interface{}
}

// NewContext creates a new Context.
func NewContext(w http.ResponseWriter, r *http.Request, server *Server) *Context {
	return &Context{
		Request:    r,
		Response:   w,
		Server:     server,
		pathValues: make(map[string]string),
		store:      make(map[string]interface{}),
	}
}

// Set stores a value in the context.
func (c *Context) Set(key string, value interface{}) {
	c.store[key] = value
}

// Get retrieves a value from the context.
func (c *Context) Get(key string) interface{} {
	return c.store[key]
}

// PathValue returns the value of the named path parameter.
func (c *Context) PathValue(name string) string {
	if v, ok := c.pathValues[name]; ok {
		return v
	}
	return c.Request.PathValue(name)
}

// SetPathValue sets a path parameter value.
func (c *Context) SetPathValue(name, value string) {
	c.pathValues[name] = value
}

// QueryParam returns the query parameter value.
func (c *Context) QueryParam(name string) string {
	return c.Request.URL.Query().Get(name)
}

// FormValue returns the form field value.
func (c *Context) FormValue(name string) string {
	return c.Request.FormValue(name)
}

// Cookie returns the named cookie.
func (c *Context) Cookie(name string) (*http.Cookie, error) {
	return c.Request.Cookie(name)
}

// SetCookie adds a Set-Cookie header.
func (c *Context) SetCookie(cookie *http.Cookie) {
	http.SetCookie(c.Response, cookie)
}

// ErrRedirect is a special error to signal a redirect has been sent.
var ErrRedirect = &HTTPError{Code: 0, Message: "redirect"}

// Redirect sends a redirect response.
func (c *Context) Redirect(code int, url string) error {
	c.Server.logger.Debugf("REDIRECT: %s -> %s (code=%d)", c.Request.URL.Path, url, code)
	http.Redirect(c.Response, c.Request, url, code)
	return ErrRedirect // Signal that redirect was sent
}

// JSON sends a JSON response.
func (c *Context) JSON(code int, i interface{}) error {
	c.Response.Header().Set("Content-Type", "application/json; charset=UTF-8")
	c.Response.WriteHeader(code)
	enc := json.NewEncoder(c.Response)
	return enc.Encode(i)
}

// MaxJSONBodyBytes caps a JSON request body.
//
// Generous for every shape that actually arrives here — a WebAuthn attestation
// and a settings blob are kilobytes; the largest is a carddav ContactData whose
// Avatar is a base64 data URI — and small enough that sixteen endpoints cannot
// be used to exhaust memory.
const MaxJSONBodyBytes = 1 << 20 // 1 MiB

// ErrBodyTooLarge reports whether err came from a body exceeding its cap,
// rather than from malformed JSON. The two deserve different status codes.
func ErrBodyTooLarge(err error) bool {
	var maxErr *http.MaxBytesError
	return errors.As(err, &maxErr)
}

// BindJSON parses the request body as JSON into the provided interface, reading
// at most MaxJSONBodyBytes.
//
// The cap is HERE rather than at the call sites because this is the only place
// every JSON endpoint passes through, and none of the sixteen had one: each
// decoded straight off an unbounded Request.Body, so a single POST of a
// multi-gigabyte body was an out-of-memory on any of them. The attachment and
// managesieve paths were bounded individually; the generic path never was.
//
// MaxBytesReader rather than a Content-Length check: a chunked request carries
// no declared length, so the header is a hint and only a capped READ is a gate.
func (c *Context) BindJSON(v interface{}) error {
	return c.BindJSONLimit(v, MaxJSONBodyBytes)
}

// BindJSONLimit is BindJSON with an explicit cap, for an endpoint that has
// reason to accept more or less than the default.
func (c *Context) BindJSONLimit(v interface{}, limit int64) error {
	defer c.Request.Body.Close()
	c.Request.Body = http.MaxBytesReader(c.Response, c.Request.Body, limit)
	return json.NewDecoder(c.Request.Body).Decode(v)
}

// RespondBindError writes the refusal a BindJSON failure deserves.
//
// One helper because the sixteen call sites answered the same failure four
// different ways — `{"error": "Invalid JSON payload"}`, `{"error": "invalid
// json"}`, `{"error": "invalid request"}`, and a bare HTTPError wrapping the
// decoder's own message — so a client could not recognise the condition it was
// in. Nothing in the frontend read any of those strings, which is what makes
// unifying them safe.
func (c *Context) RespondBindError(err error) error {
	if ErrBodyTooLarge(err) {
		return c.JSON(http.StatusRequestEntityTooLarge, map[string]string{"error": "payload_too_large"})
	}
	return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_json"})
}

// String sends a string response.
func (c *Context) String(code int, s string) error {
	c.Response.Header().Set("Content-Type", "text/plain; charset=UTF-8")
	c.Response.WriteHeader(code)
	_, err := io.WriteString(c.Response, s)
	return err
}

// Stream sends a streaming response.
func (c *Context) Stream(code int, contentType string, r io.Reader) error {
	c.Response.Header().Set("Content-Type", contentType)
	c.Response.WriteHeader(code)
	_, err := io.Copy(c.Response, r)
	return err
}

// FormParams returns form parameters.
func (c *Context) FormParams() (map[string][]string, error) {
	if err := c.Request.ParseForm(); err != nil {
		return nil, err
	}
	return c.Request.Form, nil
}

// Param returns the URL path parameter value.
func (c *Context) Param(name string) string {
	return c.PathValue(name)
}

// MultipartForm parses the multipart form.
func (c *Context) MultipartForm() (*multipart.Form, error) {
	if err := c.Request.ParseMultipartForm(32 << 20); err != nil { // 32 MB
		return nil, err
	}
	return c.Request.MultipartForm, nil
}

// NoContent sends a response with no body.
func (c *Context) NoContent(code int) error {
	c.Response.WriteHeader(code)
	return nil
}

// IsTLS returns whether the request is over TLS.
func (c *Context) IsTLS() bool {
	return c.Request.TLS != nil
}

// IsEffectiveHTTPS reports whether the browser's connection is HTTPS, accounting
// for a trusted TLS-terminating reverse proxy that forwards plain HTTP with
// X-Forwarded-Proto. Cookie Secure flags must reflect the browser-facing scheme,
// not the (possibly plaintext) hop between the proxy and alps — otherwise the
// session cookie, the login-token cookie (which carries the fernet-encrypted
// password) and the 2FA cookies would be set without Secure in the recommended
// proxy deployment. Forwarded headers are only honored when the immediate peer is
// a configured trusted proxy, mirroring the CSRF middleware.
//
// Always prefer this over IsTLS when deciding a cookie's Secure flag.
func (c *Context) IsEffectiveHTTPS() bool {
	if c.IsTLS() {
		return true
	}
	if isRequestFromTrustedProxy(c) {
		if proto := firstForwardedValue(c.Request.Header.Get("X-Forwarded-Proto")); proto != "" {
			return strings.EqualFold(proto, "https")
		}
	}
	return false
}

// Logger returns the server logger.
func (c *Context) Logger() Logger {
	return c.Server.logger
}

var aLongTimeAgo = time.Unix(233431200, 0)

// SetSession sets a cookie for the provided session. Passing a nil session
// unsets the cookie.
func (c *Context) SetSession(s *Session) {
	c.SetSessionWithExpiry(s, false)
}

func (c *Context) SetSessionWithExpiry(s *Session, persistent bool) {
	cookie := http.Cookie{
		Name:     cookieName,
		Path:     "/", // Important: cookie must be valid for all paths
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		Secure:   c.IsEffectiveHTTPS(),
	}
	frontendCookie := http.Cookie{
		Name:     "alps_logged_in",
		Path:     "/",
		HttpOnly: false,
		SameSite: http.SameSiteStrictMode,
		Secure:   c.IsEffectiveHTTPS(),
	}

	if s != nil {
		cookie.Value = s.token
		frontendCookie.Value = "1"
		if persistent {
			expires := time.Now().Add(30 * 24 * time.Hour)
			cookie.Expires = expires
			frontendCookie.Expires = expires
		}
		// If not persistent, no Expires set → browser session cookie
	} else {
		cookie.Expires = aLongTimeAgo // unset the cookie
		cookie.MaxAge = -1
		frontendCookie.Expires = aLongTimeAgo
		frontendCookie.MaxAge = -1
	}
	c.SetCookie(&cookie)
	c.SetCookie(&frontendCookie)
}

type loginToken struct {
	Username    string
	Password    string
	Verified2FA bool
	Persistent  bool
}

func (c *Context) SetLoginToken(username, password string, verified2FA bool, persistent bool) {
	cookie := http.Cookie{
		Name:     loginTokenCookieName,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		Secure:   c.IsEffectiveHTTPS(),
		Path:     "/",
	}
	frontendCookie := http.Cookie{
		Name:     "alps_has_login_token",
		Path:     "/",
		HttpOnly: false,
		SameSite: http.SameSiteStrictMode,
		Secure:   c.IsEffectiveHTTPS(),
	}

	if persistent {
		expires := time.Now().Add(30 * 24 * time.Hour)
		cookie.Expires = expires
		frontendCookie.Expires = expires
	}
	if username == "" {
		cookie.Expires = aLongTimeAgo // unset the cookie
		cookie.MaxAge = -1
		frontendCookie.Expires = aLongTimeAgo
		frontendCookie.MaxAge = -1

		c.SetCookie(&cookie)
		c.SetCookie(&frontendCookie)
		return
	}

	frontendCookie.Value = "1"
	c.SetCookie(&frontendCookie)

	loginToken := loginToken{username, password, verified2FA, persistent}
	payload, err := json.Marshal(loginToken)
	if err != nil {
		panic(err) // Should never happen
	}
	fkey := c.Server.Options.LoginKey
	if fkey == nil {
		return
	}

	bytes, err := fernet.EncryptAndSign(payload, fkey)
	if err != nil {
		log.Printf("Warning: login token encryption failed: %v", err)
		return
	}

	cookie.Value = string(bytes)
	c.SetCookie(&cookie)
}

func (c *Context) GetLoginToken() (string, string, bool, bool) {
	cookie, err := c.Cookie(loginTokenCookieName)
	if err != nil || cookie == nil {
		return "", "", false, false
	}

	fkey := c.Server.Options.LoginKey
	if fkey == nil {
		return "", "", false, false
	}

	bytes := fernet.VerifyAndDecrypt([]byte(cookie.Value), 24*time.Hour*30, []*fernet.Key{fkey})
	if bytes == nil {
		// Decryption failed - login key was rotated, token expired, or cookie tampered with
		// This is expected behavior when admin rotates the login_key (security feature)
		c.Server.logger.Debugf("Failed to decrypt login token cookie (key rotation, expiry, or invalid token)")
		// Clear the invalid cookie
		c.SetLoginToken("", "", false, false)
		return "", "", false, false
	}

	var token loginToken
	err = json.Unmarshal(bytes, &token)
	if err != nil {
		// This should never happen unless cookie was corrupted
		c.Server.logger.Printf("Warning: login token cookie unmarshal failed: %v", err)
		c.SetLoginToken("", "", false, false)
		return "", "", false, false
	}

	return token.Username, token.Password, token.Verified2FA, token.Persistent
}
