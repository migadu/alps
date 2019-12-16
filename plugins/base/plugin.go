package koushinbase

import (
	"html/template"
	"net/url"

	"git.sr.ht/~emersion/koushin"
	"github.com/labstack/echo/v4"
)

const messagesPerPage = 50

func init() {
	p := koushin.GoPlugin{Name: "base"}

	p.TemplateFuncs(template.FuncMap{
		"tuple": func(values ...interface{}) []interface{} {
			return values
		},
		"pathescape": func(s string) string {
			return url.PathEscape(s)
		},
	})

	p.GET("/mailbox/:mbox", handleGetMailbox)

	p.GET("/message/:mbox/:uid", func(ectx echo.Context) error {
		ctx := ectx.(*koushin.Context)
		return handleGetPart(ctx, false)
	})
	p.GET("/message/:mbox/:uid/raw", func(ectx echo.Context) error {
		ctx := ectx.(*koushin.Context)
		return handleGetPart(ctx, true)
	})

	p.GET("/login", handleLogin)
	p.POST("/login", handleLogin)

	p.GET("/logout", handleLogout)

	p.GET("/compose", handleCompose)
	p.POST("/compose", handleCompose)

	p.GET("/message/:mbox/:uid/reply", handleCompose)
	p.POST("/message/:mbox/:uid/reply", handleCompose)

	koushin.RegisterPlugin(p.Plugin())
}
