package koushin

import (
	"fmt"
	"io/ioutil"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/emersion/go-imap"
	imapclient "github.com/emersion/go-imap/client"
	"github.com/emersion/go-message"
	"github.com/emersion/go-sasl"
	"github.com/labstack/echo/v4"
)

type MailboxRenderData struct {
	Mailbox            *imap.MailboxStatus
	Mailboxes          []*imap.MailboxInfo
	Messages           []imapMessage
	PrevPage, NextPage int
	Extra              map[string]interface{}
}

func handleGetMailbox(ectx echo.Context) error {
	ctx := ectx.(*context)

	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	page := 0
	if pageStr := ctx.QueryParam("page"); pageStr != "" {
		var err error
		if page, err = strconv.Atoi(pageStr); err != nil || page < 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid page index")
		}
	}

	var mailboxes []*imap.MailboxInfo
	var msgs []imapMessage
	var mbox *imap.MailboxStatus
	err = ctx.session.Do(func(c *imapclient.Client) error {
		var err error
		if mailboxes, err = listMailboxes(c); err != nil {
			return err
		}
		if msgs, err = listMessages(c, mboxName, page); err != nil {
			return err
		}
		mbox = c.Mailbox()
		return nil
	})
	if err != nil {
		return err
	}

	prevPage, nextPage := -1, -1
	if page > 0 {
		prevPage = page - 1
	}
	if (page+1)*messagesPerPage < int(mbox.Messages) {
		nextPage = page + 1
	}

	return ctx.Render(http.StatusOK, "mailbox.html", &MailboxRenderData{
		Mailbox:   mbox,
		Mailboxes: mailboxes,
		Messages:  msgs,
		PrevPage:  prevPage,
		NextPage:  nextPage,
		Extra:     make(map[string]interface{}),
	})
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

		token, err := ctx.server.sessions.Put(conn, username, password)
		if err != nil {
			return fmt.Errorf("failed to put connection in pool: %v", err)
		}
		ctx.setToken(token)

		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "login.html", nil)
}

func handleLogout(ectx echo.Context) error {
	ctx := ectx.(*context)

	err := ctx.session.Do(func(c *imapclient.Client) error {
		return c.Logout()
	})
	if err != nil {
		return fmt.Errorf("failed to logout: %v", err)
	}

	ctx.setToken("")
	return ctx.Redirect(http.StatusFound, "/login")
}

type MessageRenderData struct {
	Mailbox     *imap.MailboxStatus
	Message     *imapMessage
	Body        string
	PartPath    string
	MailboxPage int
	Extra       map[string]interface{}
}

func handleGetPart(ctx *context, raw bool) error {
	mboxName, uid, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	partPathString := ctx.QueryParam("part")
	partPath, err := parsePartPath(partPathString)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	var msg *imapMessage
	var part *message.Entity
	var mbox *imap.MailboxStatus
	err = ctx.session.Do(func(c *imapclient.Client) error {
		var err error
		msg, part, err = getMessagePart(c, mboxName, uid, partPath)
		mbox = c.Mailbox()
		return err
	})
	if err != nil {
		return err
	}

	mimeType, _, err := part.Header.ContentType()
	if err != nil {
		return fmt.Errorf("failed to parse part Content-Type: %v", err)
	}
	if len(partPath) == 0 {
		mimeType = "message/rfc822"
	}

	if raw {
		disp, dispParams, _ := part.Header.ContentDisposition()
		filename := dispParams["filename"]

		// TODO: set Content-Length if possible

		if !strings.EqualFold(mimeType, "text/plain") || strings.EqualFold(disp, "attachment") {
			dispParams := make(map[string]string)
			if filename != "" {
				dispParams["filename"] = filename
			}
			disp := mime.FormatMediaType("attachment", dispParams)
			ctx.Response().Header().Set("Content-Disposition", disp)
		}
		return ctx.Stream(http.StatusOK, mimeType, part.Body)
	}

	var body string
	if strings.HasPrefix(strings.ToLower(mimeType), "text/") {
		b, err := ioutil.ReadAll(part.Body)
		if err != nil {
			return fmt.Errorf("failed to read part body: %v", err)
		}
		body = string(b)
	}

	return ctx.Render(http.StatusOK, "message.html", &MessageRenderData{
		Mailbox:     mbox,
		Message:     msg,
		Body:        body,
		PartPath:    partPathString,
		MailboxPage: int(mbox.Messages-msg.SeqNum) / messagesPerPage,
		Extra:       make(map[string]interface{}),
	})
}

type ComposeRenderData struct {
	Message *OutgoingMessage
	Extra   map[string]interface{}
}

func handleCompose(ectx echo.Context) error {
	ctx := ectx.(*context)

	var msg OutgoingMessage
	if strings.ContainsRune(ctx.session.username, '@') {
		msg.From = ctx.session.username
	}

	if ctx.Request().Method == http.MethodGet && ctx.Param("uid") != "" {
		// This is a reply
		mboxName, uid, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}
		partPath, err := parsePartPath(ctx.QueryParam("part"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		var inReplyTo *imapMessage
		var part *message.Entity
		err = ctx.session.Do(func(c *imapclient.Client) error {
			var err error
			inReplyTo, part, err = getMessagePart(c, mboxName, uid, partPath)
			return err
		})
		if err != nil {
			return err
		}

		mimeType, _, err := part.Header.ContentType()
		if err != nil {
			return fmt.Errorf("failed to parse part Content-Type: %v", err)
		}

		if !strings.HasPrefix(strings.ToLower(mimeType), "text/") {
			err := fmt.Errorf("cannot reply to \"%v\" part", mimeType)
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		msg.Text, err = quote(part.Body)
		if err != nil {
			return err
		}

		msg.InReplyTo = inReplyTo.Envelope.MessageId
		// TODO: populate From from known user addresses and inReplyTo.Envelope.To
		replyTo := inReplyTo.Envelope.ReplyTo
		if len(replyTo) == 0 {
			replyTo = inReplyTo.Envelope.From
		}
		if len(replyTo) > 0 {
			msg.To = make([]string, len(replyTo))
			for i, to := range replyTo {
				msg.To[i] = to.Address()
			}
		}
		msg.Subject = inReplyTo.Envelope.Subject
		if !strings.HasPrefix(strings.ToLower(msg.Subject), "re:") {
			msg.Subject = "Re: " + msg.Subject
		}
	}

	if ctx.Request().Method == http.MethodPost {
		msg.From = ctx.FormValue("from")
		msg.To = parseAddressList(ctx.FormValue("to"))
		msg.Subject = ctx.FormValue("subject")
		msg.Text = ctx.FormValue("text")
		msg.InReplyTo = ctx.FormValue("in_reply_to")

		c, err := ctx.server.connectSMTP()
		if err != nil {
			return err
		}
		defer c.Close()

		auth := sasl.NewPlainClient("", ctx.session.username, ctx.session.password)
		if err := c.Auth(auth); err != nil {
			return echo.NewHTTPError(http.StatusForbidden, err)
		}

		if err := sendMessage(c, &msg); err != nil {
			return err
		}

		if err := c.Quit(); err != nil {
			return fmt.Errorf("QUIT failed: %v", err)
		}

		// TODO: append to IMAP Sent mailbox

		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "compose.html", &ComposeRenderData{
		Message: &msg,
		Extra:   make(map[string]interface{}),
	})
}
