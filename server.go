package koushin

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

const cookieName = "koushin_session"

// Server holds all the koushin server state.
type Server struct {
	e        *echo.Echo
	Sessions *SessionManager

	mutex      sync.RWMutex // used for server reload
	plugins    []Plugin
	luaPlugins []Plugin

	imap struct {
		host     string
		tls      bool
		insecure bool
	}
	smtp struct {
		host     string
		tls      bool
		insecure bool
	}
	defaultTheme string
}

func (s *Server) parseIMAPURL(imapURL string) error {
	u, err := url.Parse(imapURL)
	if err != nil {
		return fmt.Errorf("failed to parse IMAP server URL: %v", err)
	}

	s.imap.host = u.Host
	switch u.Scheme {
	case "imap":
		// This space is intentionally left blank
	case "imaps":
		s.imap.tls = true
	case "imap+insecure":
		s.imap.insecure = true
	default:
		return fmt.Errorf("unrecognized IMAP URL scheme: %s", u.Scheme)
	}

	return nil
}

func (s *Server) parseSMTPURL(smtpURL string) error {
	u, err := url.Parse(smtpURL)
	if err != nil {
		return fmt.Errorf("failed to parse SMTP server URL: %v", err)
	}

	s.smtp.host = u.Host
	switch u.Scheme {
	case "smtp":
		// This space is intentionally left blank
	case "smtps":
		s.smtp.tls = true
	case "smtp+insecure":
		s.smtp.insecure = true
	default:
		return fmt.Errorf("unrecognized SMTP URL scheme: %s", u.Scheme)
	}

	return nil
}

func (s *Server) load() error {
	plugins := append([]Plugin(nil), plugins...)
	for _, p := range plugins {
		s.e.Logger.Printf("Registered plugin '%v'", p.Name())
	}

	luaPlugins, err := loadAllLuaPlugins(s.e.Logger)
	if err != nil {
		return fmt.Errorf("failed to load plugins: %v", err)
	}
	plugins = append(plugins, luaPlugins...)

	renderer := newRenderer(s.e.Logger, s.defaultTheme)
	if err := renderer.Load(plugins); err != nil {
		return fmt.Errorf("failed to load templates: %v", err)
	}

	// Once we've loaded plugins and templates from disk (which can take time),
	// swap them in the Server struct
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Close previous Lua plugins
	for _, p := range s.luaPlugins {
		if err := p.Close(); err != nil {
			s.e.Logger.Printf("Failed to unload plugin '%v': %v", p.Name(), err)
		}
	}

	s.plugins = plugins
	s.luaPlugins = luaPlugins
	s.e.Renderer = renderer

	for _, p := range plugins {
		p.SetRoutes(s.e.Group(""))
	}

	return nil
}

// Reload loads Lua plugins and templates from disk.
func (s *Server) Reload() error {
	s.e.Logger.Printf("Reloading server")
	return s.load()
}

func newServer(e *echo.Echo, options *Options) (*Server, error) {
	s := &Server{e: e, defaultTheme: options.Theme}

	if err := s.parseIMAPURL(options.IMAPURL); err != nil {
		return nil, err
	}

	if options.SMTPURL != "" {
		if err := s.parseSMTPURL(options.SMTPURL); err != nil {
			return nil, err
		}
	}

	s.Sessions = newSessionManager(s.dialIMAP, s.dialSMTP)

	return s, nil
}

// Context is the context used by HTTP handlers.
//
// Use a type assertion to get it from a echo.Context:
//
//     ctx := ectx.(*koushin.Context)
type Context struct {
	echo.Context
	Server  *Server
	Session *Session // nil if user isn't logged in
}

var aLongTimeAgo = time.Unix(233431200, 0)

// SetSession sets a cookie for the provided session. Passing a nil session
// unsets the cookie.
func (ctx *Context) SetSession(s *Session) {
	cookie := http.Cookie{
		Name:     cookieName,
		HttpOnly: true,
		// TODO: domain, secure
	}
	if s != nil {
		cookie.Value = s.token
	} else {
		cookie.Expires = aLongTimeAgo // unset the cookie
	}
	ctx.SetCookie(&cookie)
}

func isPublic(path string) bool {
	if strings.HasPrefix(path, "/plugins/") {
		parts := strings.Split(path, "/")
		return len(parts) >= 4 && parts[3] == "assets"
	}
	return path == "/login" || strings.HasPrefix(path, "/themes/")
}

type Options struct {
	IMAPURL, SMTPURL string
	Theme            string
}

// New creates a new server.
func New(e *echo.Echo, options *Options) (*Server, error) {
	s, err := newServer(e, options)
	if err != nil {
		return nil, err
	}

	if err := s.load(); err != nil {
		return nil, err
	}

	e.HTTPErrorHandler = func(err error, c echo.Context) {
		code := http.StatusInternalServerError
		if he, ok := err.(*echo.HTTPError); ok {
			code = he.Code
		} else {
			c.Logger().Error(err)
		}
		// TODO: hide internal errors
		c.String(code, err.Error())
	}

	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ectx echo.Context) error {
			s.mutex.RLock()
			err := next(ectx)
			s.mutex.RUnlock()
			return err
		}
	})

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ectx echo.Context) error {
			ectx.Response().Header().Set("Content-Security-Policy", "default-src 'self'")
			return next(ectx)
		}
	})

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ectx echo.Context) error {
			ctx := &Context{Context: ectx, Server: s}
			ctx.Set("context", ctx)

			cookie, err := ctx.Cookie(cookieName)
			if err == http.ErrNoCookie {
				// Require auth for all pages except /login
				if isPublic(ctx.Path()) {
					return next(ctx)
				} else {
					return ctx.Redirect(http.StatusFound, "/login")
				}
			} else if err != nil {
				return err
			}

			ctx.Session, err = ctx.Server.Sessions.get(cookie.Value)
			if err == errSessionExpired {
				ctx.SetSession(nil)
				return ctx.Redirect(http.StatusFound, "/login")
			} else if err != nil {
				return err
			}
			ctx.Session.ping()

			return next(ctx)
		}
	})

	e.Static("/themes", "themes")

	return s, nil
}
