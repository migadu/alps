package koushin

import (
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/labstack/echo/v4"
	imapclient "github.com/emersion/go-imap/client"
)

const cookieName = "koushin_session"

type Server struct {
	imap struct {
		host string
		tls bool
		insecure bool

		pool *ConnPool
	}
}

func NewServer(imapURL string) (*Server, error) {
	u, err := url.Parse(imapURL)
	if err != nil {
		return nil, err
	}

	s := &Server{}
	s.imap.host = u.Host
	switch u.Scheme {
	case "imap":
		// This space is intentionally left blank
	case "imaps":
		s.imap.tls = true
	case "imap+insecure":
		s.imap.insecure = true
	default:
		return nil, fmt.Errorf("unrecognized IMAP URL scheme: %s", u.Scheme)
	}

	s.imap.pool = NewConnPool()

	return s, nil
}

func (s *Server) connectIMAP() (*imapclient.Client, error) {
	var c *imapclient.Client
	var err error
	if s.imap.tls {
		c, err = imapclient.DialTLS(s.imap.host, nil)
		if err != nil {
			return nil, err
		}
	} else {
		c, err = imapclient.Dial(s.imap.host)
		if err != nil {
			return nil, err
		}
		if !s.imap.insecure {
			if err := c.StartTLS(nil); err != nil {
				c.Close()
				return nil, err
			}
		}
	}

	return c, err
}

type context struct {
	echo.Context
	server *Server
	conn *imapclient.Client
}

var aLongTimeAgo = time.Unix(233431200, 0)

func (c *context) setToken(token string) {
	cookie := http.Cookie{
		Name: cookieName,
		Value: token,
		HttpOnly: true,
		// TODO: domain, secure
	}
	if token == "" {
		cookie.Expires = aLongTimeAgo // unset the cookie
	}
	c.SetCookie(&cookie)
}

func handleLogin(ectx echo.Context) error {
	ctx := ectx.(*context)
	username := ctx.FormValue("username")
	password := ctx.FormValue("password")
	if username != "" && password != "" {
		conn, err := ctx.server.connectIMAP()
		if err != nil {
			return err
		}

		if err := conn.Login(username, password); err != nil {
			conn.Logout()
			return ctx.Render(http.StatusOK, "login.html", nil)
		}

		token, err := ctx.server.imap.pool.Put(conn)
		if err != nil {
			return err
		}
		ctx.setToken(token)

		return ctx.Redirect(http.StatusFound, "/")
	}

	return ctx.Render(http.StatusOK, "login.html", nil)
}

func New(imapURL string) *echo.Echo {
	e := echo.New()

	s, err := NewServer(imapURL)
	if err != nil {
		e.Logger.Fatal(err)
	}

	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ectx echo.Context) error {
			ctx := &context{Context: ectx, server: s}

			cookie, err := ctx.Cookie(cookieName)
			if err == http.ErrNoCookie {
				return next(ctx)
			} else if err != nil {
				return err
			}

			ctx.conn, err = ctx.server.imap.pool.Get(cookie.Value)
			if err == ErrSessionExpired {
				ctx.setToken("")
				return ctx.Redirect(http.StatusFound, "/login")
			} else if err != nil {
				return err
			}

			return next(ctx)
		}
	})

	e.Renderer, err = loadTemplates()
	if err != nil {
		e.Logger.Fatal("Failed to load templates:", err)
	}

	e.GET("/", func(ectx echo.Context) error {
		ctx := ectx.(*context)
		if ctx.conn == nil {
			return ctx.Redirect(http.StatusFound, "/login")
		}

		return ctx.Render(http.StatusOK, "index.html", nil)
	})

	e.GET("/login", handleLogin)
	e.POST("/login", handleLogin)

	e.Static("/assets", "public/assets")

	return e
}
