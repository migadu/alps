package koushin

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
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

		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "login.html", nil)
}

func parseUid(s string) (uint32, error) {
	uid, err := strconv.ParseUint(s, 10, 32)
	if err != nil {
		return 0, err
	}
	if uid == 0 {
		return 0, fmt.Errorf("UID must be non-zero")
	}
	return uint32(uid), nil
}

func parsePartPath(s string) ([]int, error) {
	l := strings.Split(s, ".")
	path := make([]int, len(l))
	for i, s := range l {
		var err error
		path[i], err = strconv.Atoi(s)
		if err != nil {
			return nil, err
		}

		if path[i] <= 0 {
			return nil, fmt.Errorf("part num must be strictly positive")
		}
	}
	return path, nil
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
				// Require auth for all pages except /login
				if ctx.Path() == "/login" {
					return next(ctx)
				} else {
					return ctx.Redirect(http.StatusFound, "/login")
				}
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

	e.GET("/mailbox/:mbox", func(ectx echo.Context) error {
		ctx := ectx.(*context)

		mailboxes, err := listMailboxes(ctx.conn)
		if err != nil {
			return err
		}

		msgs, err := listMessages(ctx.conn, ctx.Param("mbox"))
		if err != nil {
			return err
		}

		return ctx.Render(http.StatusOK, "mailbox.html", map[string]interface{}{
			"Mailbox": ctx.conn.Mailbox(),
			"Mailboxes": mailboxes,
			"Messages": msgs,
		})
	})

	e.GET("/message/:mbox/:uid", func(ectx echo.Context) error {
		ctx := ectx.(*context)

		uid, err := parseUid(ctx.Param("uid"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}
		// TODO: handle messages without a text part
		part, err := parsePartPath(ctx.QueryParam("part"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		msg, body, err := getMessage(ctx.conn, ctx.Param("mbox"), uid, part)
		if err != nil {
			return err
		}

		return ctx.Render(http.StatusOK, "message.html", map[string]interface{}{
			"Mailbox": ctx.conn.Mailbox(),
			"Message": msg,
			"Body": body,
		})
	})

	e.GET("/login", handleLogin)
	e.POST("/login", handleLogin)

	e.Static("/assets", "public/assets")

	return e
}
