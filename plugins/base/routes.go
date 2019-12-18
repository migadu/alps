package koushinbase

import (
	"fmt"
	"io/ioutil"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"git.sr.ht/~emersion/koushin"
	"github.com/emersion/go-imap"
	imapmove "github.com/emersion/go-imap-move"
	imapclient "github.com/emersion/go-imap/client"
	"github.com/emersion/go-message"
	"github.com/emersion/go-smtp"
	"github.com/labstack/echo/v4"
)

func registerRoutes(p *koushin.GoPlugin) {
	p.GET("/", func(ctx *koushin.Context) error {
		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	})

	p.GET("/mailbox/:mbox", handleGetMailbox)
	p.POST("/mailbox/:mbox", handleGetMailbox)

	p.GET("/message/:mbox/:uid", func(ctx *koushin.Context) error {
		return handleGetPart(ctx, false)
	})
	p.GET("/message/:mbox/:uid/raw", func(ctx *koushin.Context) error {
		return handleGetPart(ctx, true)
	})

	p.GET("/login", handleLogin)
	p.POST("/login", handleLogin)

	p.GET("/logout", handleLogout)

	p.GET("/compose", handleCompose)
	p.POST("/compose", handleCompose)

	p.GET("/message/:mbox/:uid/reply", handleCompose)
	p.POST("/message/:mbox/:uid/reply", handleCompose)

	p.POST("/message/:mbox/:uid/move", handleMove)

	p.POST("/message/:mbox/:uid/delete", handleDelete)

	p.POST("/message/:mbox/:uid/flag", handleSetFlags)
}

type MailboxRenderData struct {
	koushin.BaseRenderData
	Mailbox            *imap.MailboxStatus
	Mailboxes          []*imap.MailboxInfo
	Messages           []IMAPMessage
	PrevPage, NextPage int
	Query              string
}

func handleGetMailbox(ctx *koushin.Context) error {
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

	query := ctx.QueryParam("query")

	var mailboxes []*imap.MailboxInfo
	var msgs []IMAPMessage
	var mbox *imap.MailboxStatus
	var total int
	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		var err error
		if mailboxes, err = listMailboxes(c); err != nil {
			return err
		}
		if query != "" {
			msgs, total, err = searchMessages(c, mboxName, query, page)
		} else {
			msgs, err = listMessages(c, mboxName, page)
		}
		if err != nil {
			return err
		}
		mbox = c.Mailbox()
		return nil
	})
	if err != nil {
		return err
	}

	prevPage, nextPage := -1, -1
	if query != "" {
		if page > 0 {
			prevPage = page - 1
		}
		if (page+1)*messagesPerPage <= total {
			nextPage = page + 1
		}
	} else {
		if page > 0 {
			prevPage = page - 1
		}
		if (page+1)*messagesPerPage < int(mbox.Messages) {
			nextPage = page + 1
		}
	}

	return ctx.Render(http.StatusOK, "mailbox.html", &MailboxRenderData{
		BaseRenderData: *koushin.NewBaseRenderData(ctx),
		Mailbox:        mbox,
		Mailboxes:      mailboxes,
		Messages:       msgs,
		PrevPage:       prevPage,
		NextPage:       nextPage,
		Query:          query,
	})
}

func handleLogin(ctx *koushin.Context) error {
	username := ctx.FormValue("username")
	password := ctx.FormValue("password")
	if username != "" && password != "" {
		s, err := ctx.Server.Sessions.Put(username, password)
		if err != nil {
			if _, ok := err.(koushin.AuthError); ok {
				return ctx.Render(http.StatusOK, "login.html", nil)
			}
			return fmt.Errorf("failed to put connection in pool: %v", err)
		}
		ctx.SetSession(s)

		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "login.html", koushin.NewBaseRenderData(ctx))
}

func handleLogout(ctx *koushin.Context) error {
	ctx.Session.Close()
	ctx.SetSession(nil)
	return ctx.Redirect(http.StatusFound, "/login")
}

type MessageRenderData struct {
	koushin.BaseRenderData
	Mailboxes   []*imap.MailboxInfo
	Mailbox     *imap.MailboxStatus
	Message     *IMAPMessage
	Body        string
	PartPath    string
	MailboxPage int
	Flags       map[string]bool
}

func handleGetPart(ctx *koushin.Context, raw bool) error {
	mboxName, uid, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	partPathString := ctx.QueryParam("part")
	partPath, err := parsePartPath(partPathString)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	var mailboxes []*imap.MailboxInfo
	var msg *IMAPMessage
	var part *message.Entity
	var mbox *imap.MailboxStatus
	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		var err error
		if mailboxes, err = listMailboxes(c); err != nil {
			return err
		}
		if msg, part, err = getMessagePart(c, mboxName, uid, partPath); err != nil {
			return err
		}
		mbox = c.Mailbox()
		return nil
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
		ctx.Response().Header().Set("Content-Type", mimeType)

		disp, dispParams, _ := part.Header.ContentDisposition()
		filename := dispParams["filename"]
		if len(partPath) == 0 {
			filename = msg.Envelope.Subject + ".eml"
		}

		// TODO: set Content-Length if possible

		if !strings.EqualFold(mimeType, "text/plain") || strings.EqualFold(disp, "attachment") {
			dispParams := make(map[string]string)
			if filename != "" {
				dispParams["filename"] = filename
			}
			disp := mime.FormatMediaType("attachment", dispParams)
			ctx.Response().Header().Set("Content-Disposition", disp)
		}

		if len(partPath) == 0 {
			return part.WriteTo(ctx.Response())
		} else {
			return ctx.Stream(http.StatusOK, mimeType, part.Body)
		}
	}

	var body string
	if strings.HasPrefix(strings.ToLower(mimeType), "text/") {
		b, err := ioutil.ReadAll(part.Body)
		if err != nil {
			return fmt.Errorf("failed to read part body: %v", err)
		}
		body = string(b)
	}

	flags := make(map[string]bool)
	for _, f := range mbox.PermanentFlags {
		f = imap.CanonicalFlag(f)
		if f == imap.TryCreateFlag {
			continue
		}
		flags[f] = msg.HasFlag(f)
	}

	return ctx.Render(http.StatusOK, "message.html", &MessageRenderData{
		BaseRenderData: *koushin.NewBaseRenderData(ctx),
		Mailboxes:      mailboxes,
		Mailbox:        mbox,
		Message:        msg,
		Body:           body,
		PartPath:       partPathString,
		MailboxPage:    int(mbox.Messages-msg.SeqNum) / messagesPerPage,
		Flags:          flags,
	})
}

type ComposeRenderData struct {
	koushin.BaseRenderData
	Message *OutgoingMessage
}

func handleCompose(ctx *koushin.Context) error {
	var msg OutgoingMessage
	if strings.ContainsRune(ctx.Session.Username(), '@') {
		msg.From = ctx.Session.Username()
	}

	msg.To = strings.Split(ctx.QueryParam("to"), ",")
	msg.Subject = ctx.QueryParam("subject")
	msg.Text = ctx.QueryParam("body")
	msg.InReplyTo = ctx.QueryParam("in-reply-to")

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

		var inReplyTo *IMAPMessage
		var part *message.Entity
		err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
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

		form, err := ctx.MultipartForm()
		if err != nil {
			return fmt.Errorf("failed to get multipart form: %v", err)
		}
		msg.Attachments = form.File["attachments"]

		err = ctx.Session.DoSMTP(func(c *smtp.Client) error {
			return sendMessage(c, &msg)
		})
		if err != nil {
			if _, ok := err.(koushin.AuthError); ok {
				return echo.NewHTTPError(http.StatusForbidden, err)
			}
			return err
		}

		// TODO: append to IMAP Sent mailbox
		// TODO: add \Answered flag to original IMAP message

		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "compose.html", &ComposeRenderData{
		BaseRenderData: *koushin.NewBaseRenderData(ctx),
		Message:        &msg,
	})
}

func handleMove(ctx *koushin.Context) error {
	mboxName, uid, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	to := ctx.FormValue("to")

	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		mc := imapmove.NewClient(c)

		if err := ensureMailboxSelected(c, mboxName); err != nil {
			return err
		}

		var seqSet imap.SeqSet
		seqSet.AddNum(uid)
		if err := mc.UidMoveWithFallback(&seqSet, to); err != nil {
			return fmt.Errorf("failed to move message: %v", err)
		}

		// TODO: get the UID of the message in the destination mailbox with UIDPLUS
		return nil
	})
	if err != nil {
		return err
	}

	return ctx.Redirect(http.StatusFound, fmt.Sprintf("/mailbox/%v", url.PathEscape(to)))
}

func handleDelete(ctx *koushin.Context) error {
	mboxName, uid, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		if err := ensureMailboxSelected(c, mboxName); err != nil {
			return err
		}

		var seqSet imap.SeqSet
		seqSet.AddNum(uid)

		item := imap.FormatFlagsOp(imap.AddFlags, true)
		flags := []interface{}{imap.DeletedFlag}
		if err := c.UidStore(&seqSet, item, flags, nil); err != nil {
			return fmt.Errorf("failed to add deleted flag: %v", err)
		}

		if err := c.Expunge(nil); err != nil {
			return fmt.Errorf("failed to expunge mailbox: %v", err)
		}

		// Deleting a message invalidates our cached message count
		// TODO: listen to async updates instead
		if _, err := c.Select(mboxName, false); err != nil {
			return fmt.Errorf("failed to select mailbox: %v", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	return ctx.Redirect(http.StatusFound, fmt.Sprintf("/mailbox/%v", url.PathEscape(mboxName)))
}

func handleSetFlags(ctx *koushin.Context) error {
	mboxName, uid, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	form, err := ctx.FormParams()
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	flags, ok := form["flags"]
	if !ok {
		return echo.NewHTTPError(http.StatusBadRequest, "missing 'flags' form values")
	}

	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		if err := ensureMailboxSelected(c, mboxName); err != nil {
			return err
		}

		var seqSet imap.SeqSet
		seqSet.AddNum(uid)

		storeItems := make([]interface{}, len(flags))
		for i, f := range flags {
			storeItems[i] = f
		}

		item := imap.FormatFlagsOp(imap.SetFlags, true)
		if err := c.UidStore(&seqSet, item, storeItems, nil); err != nil {
			return fmt.Errorf("failed to add deleted flag: %v", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	return ctx.Redirect(http.StatusFound, fmt.Sprintf("/message/%v/%v", url.PathEscape(mboxName), uid))
}
