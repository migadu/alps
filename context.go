package alps

import (
	"encoding/json"
	"io"
	"log"
	"mime/multipart"
	"net/http"
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

// BindJSON parses the request body as JSON into the provided interface.
func (c *Context) BindJSON(v interface{}) error {
	defer c.Request.Body.Close()
	return json.NewDecoder(c.Request.Body).Decode(v)
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
		Secure:   c.IsTLS(),
	}
	frontendCookie := http.Cookie{
		Name:     "alps_logged_in",
		Path:     "/",
		HttpOnly: false,
		SameSite: http.SameSiteStrictMode,
		Secure:   c.IsTLS(),
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
		
		// Clear legacy orphaned cookies
		c.SetCookie(&http.Cookie{Name: cookieName, Value: "", Path: "/", HttpOnly: true, MaxAge: -1})
		c.SetCookie(&http.Cookie{Name: "alps_logged_in", Value: "", Path: "/", HttpOnly: false, MaxAge: -1})
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
		Secure:   c.IsTLS(),
		Path:     "/",
	}
	frontendCookie := http.Cookie{
		Name:     "alps_has_login_token",
		Path:     "/",
		HttpOnly: false,
		SameSite: http.SameSiteStrictMode,
		Secure:   c.IsTLS(),
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
		
		// Clear legacy orphaned cookies
		c.SetCookie(&http.Cookie{Name: loginTokenCookieName, Value: "", Path: "/", HttpOnly: true, MaxAge: -1})
		c.SetCookie(&http.Cookie{Name: "alps_has_login_token", Value: "", Path: "/", HttpOnly: false, MaxAge: -1})
		
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
