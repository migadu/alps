package alpsbase

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"git.sr.ht/~emersion/alps"
	"git.sr.ht/~sircmpwn/dowork"
	"github.com/emersion/go-imap"
	imapmove "github.com/emersion/go-imap-move"
	imapclient "github.com/emersion/go-imap/client"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
	"github.com/labstack/echo/v4"
)

func registerRoutes(p *alps.GoPlugin) {
	p.GET("/", func(ctx *alps.Context) error {
		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	})

	p.GET("/mailbox/:mbox", handleGetMailbox)
	p.POST("/mailbox/:mbox", handleGetMailbox)

	p.GET("/new-mailbox", handleNewMailbox)
	p.POST("/new-mailbox", handleNewMailbox)

	p.GET("/delete-mailbox/:mbox", handleDeleteMailbox)
	p.POST("/delete-mailbox/:mbox", handleDeleteMailbox)

	p.GET("/message/:mbox/:uid", func(ctx *alps.Context) error {
		return handleGetPart(ctx, false)
	})
	p.GET("/message/:mbox/:uid/raw", func(ctx *alps.Context) error {
		return handleGetPart(ctx, true)
	})

	p.GET("/login", handleLogin)
	p.POST("/login", handleLogin)

	p.GET("/logout", handleLogout)

	p.GET("/compose", handleComposeNew)
	p.POST("/compose", handleComposeNew)

	p.POST("/compose/attachment", handleComposeAttachment)

	p.GET("/message/:mbox/:uid/reply", handleReply)
	p.POST("/message/:mbox/:uid/reply", handleReply)

	p.GET("/message/:mbox/:uid/forward", handleForward)
	p.POST("/message/:mbox/:uid/forward", handleForward)

	p.GET("/message/:mbox/:uid/edit", handleEdit)
	p.POST("/message/:mbox/:uid/edit", handleEdit)

	p.POST("/message/:mbox/move", handleMove)

	p.POST("/message/:mbox/delete", handleDelete)

	p.POST("/message/:mbox/flag", handleSetFlags)

	p.GET("/settings", handleSettings)
	p.POST("/settings", handleSettings)
}

type IMAPBaseRenderData struct {
	alps.BaseRenderData
	CategorizedMailboxes CategorizedMailboxes
	Mailboxes            []MailboxInfo
	Mailbox              *MailboxStatus
	Inbox                *MailboxStatus
	Outbox               *MailboxStatus
}

type MailboxRenderData struct {
	IMAPBaseRenderData
	Messages             []IMAPMessage
	PrevPage, NextPage   int
	Query                string
}

// Organizes mailboxes into common/uncommon categories
type CategorizedMailboxes struct {
	Common struct {
		Inbox   *MailboxInfo
		Drafts  *MailboxInfo
		Outbox  *MailboxInfo
		Sent    *MailboxInfo
		Junk    *MailboxInfo
		Trash   *MailboxInfo
		Archive *MailboxInfo
	}
	Additional []*MailboxInfo
}

func newIMAPBaseRenderData(ctx *alps.Context,
	base *alps.BaseRenderData) (*IMAPBaseRenderData, error) {

	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusBadRequest, err)
	}

	var mailboxes []MailboxInfo
	var active, inbox, outbox *MailboxStatus
	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		var err error
		if mailboxes, err = listMailboxes(c); err != nil {
			return err
		}
		if mboxName != "" {
			if active, err = getMailboxStatus(c, mboxName); err != nil {
				return err
			}
		}
		if mboxName == "INBOX" {
			inbox = active
		} else {
			if inbox, err = getMailboxStatus(c, "INBOX"); err != nil {
				return err
			}
		}
		if mboxName == "Outbox" {
			outbox = active
		} else {
			outbox, _ = getMailboxStatus(c, "Outbox")
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	var categorized CategorizedMailboxes
	mmap := map[string]**MailboxInfo{
		"INBOX": &categorized.Common.Inbox,
		"Drafts": &categorized.Common.Drafts,
		"Outbox": &categorized.Common.Outbox,
		"Sent": &categorized.Common.Sent,
		"Junk": &categorized.Common.Junk,
		"Trash": &categorized.Common.Trash,
		"Archive": &categorized.Common.Archive,
	}

	for i, _ := range mailboxes {
		// Populate unseen & active states
		if active != nil && mailboxes[i].Name == active.Name {
			mailboxes[i].Unseen = int(active.Unseen)
			mailboxes[i].Total = int(active.Messages)
			mailboxes[i].Active = true
		}
		if mailboxes[i].Name == inbox.Name {
			mailboxes[i].Unseen = int(inbox.Unseen)
			mailboxes[i].Total = int(inbox.Messages)
		}
		if outbox != nil && mailboxes[i].Name == outbox.Name {
			mailboxes[i].Unseen = int(outbox.Unseen)
			mailboxes[i].Total = int(outbox.Messages)
		}

		if ptr, ok := mmap[mailboxes[i].Name]; ok {
			*ptr = &mailboxes[i]
		} else {
			categorized.Additional = append(
				categorized.Additional, &mailboxes[i])
		}
	}

	return &IMAPBaseRenderData{
		BaseRenderData:       *base,
		CategorizedMailboxes: categorized,
		Mailboxes:            mailboxes,
		Inbox:                inbox,
		Mailbox:              active,
	}, nil
}

func handleGetMailbox(ctx *alps.Context) error {
	ibase, err := newIMAPBaseRenderData(ctx, alps.NewBaseRenderData(ctx))
	if err != nil {
		return err
	}

	mbox := ibase.Mailbox
	title := mbox.Name
	if title == "INBOX" {
		title = "Inbox"
	}
	if mbox.Unseen > 0 {
		title = fmt.Sprintf("(%d) %s", mbox.Unseen, title)
	}
	ibase.BaseRenderData.WithTitle(title)

	page := 0
	if pageStr := ctx.QueryParam("page"); pageStr != "" {
		var err error
		if page, err = strconv.Atoi(pageStr); err != nil || page < 0 {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid page index")
		}
	}

	settings, err := loadSettings(ctx.Session.Store())
	if err != nil {
		return err
	}
	messagesPerPage := settings.MessagesPerPage

	query := ctx.QueryParam("query")

	var (
		msgs  []IMAPMessage
		total int
	)
	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		var err  error
		if query != "" {
			msgs, total, err = searchMessages(c, mbox.Name, query, page, messagesPerPage)
		} else {
			msgs, err = listMessages(c, mbox, page, messagesPerPage)
		}
		if err != nil {
			return err
		}
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
		IMAPBaseRenderData:  *ibase,
		Messages:             msgs,
		PrevPage:             prevPage,
		NextPage:             nextPage,
		Query:                query,
	})
}

type NewMailboxRenderData struct {
	IMAPBaseRenderData
	Error string
}

func handleNewMailbox(ctx *alps.Context) error {
	ibase, err := newIMAPBaseRenderData(ctx, alps.NewBaseRenderData(ctx))
	if err != nil {
		return err
	}
	ibase.BaseRenderData.WithTitle("Create new folder")

	if ctx.Request().Method == http.MethodPost {
		name := ctx.FormValue("name")
		if name == "" {
			return ctx.Render(http.StatusOK, "new-mailbox.html", &NewMailboxRenderData{
				IMAPBaseRenderData: *ibase,
				Error: "Name is required",
			})
		}

		err := ctx.Session.DoIMAP(func(c *imapclient.Client) error {
			return c.Create(name)
		})

		if err != nil {
			return ctx.Render(http.StatusOK, "new-mailbox.html", &NewMailboxRenderData{
				IMAPBaseRenderData: *ibase,
				Error: err.Error(),
			})
		}

		return ctx.Redirect(http.StatusFound, fmt.Sprintf("/mailbox/%s", url.PathEscape(name)))
	}

	return ctx.Render(http.StatusOK, "new-mailbox.html", &NewMailboxRenderData{
		IMAPBaseRenderData: *ibase,
		Error: "",
	})
}

func handleDeleteMailbox(ctx *alps.Context) error {
	ibase, err := newIMAPBaseRenderData(ctx, alps.NewBaseRenderData(ctx))
	if err != nil {
		return err
	}

	mbox := ibase.Mailbox
	ibase.BaseRenderData.WithTitle("Delete folder '" + mbox.Name + "'")

	if ctx.Request().Method == http.MethodPost {
		ctx.Session.DoIMAP(func(c *imapclient.Client) error {
			return c.Delete(mbox.Name)
		})
		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "delete-mailbox.html", ibase)
}

func handleLogin(ctx *alps.Context) error {
	username := ctx.FormValue("username")
	password := ctx.FormValue("password")
	remember := ctx.FormValue("remember-me")

	renderData := struct {
		alps.BaseRenderData
		CanRememberMe bool
	}{
		BaseRenderData: *alps.NewBaseRenderData(ctx),
		CanRememberMe:  ctx.Server.Options.LoginKey != nil,
	}

	if username == "" && password == "" {
		username, password = ctx.GetLoginToken()
	}

	if username != "" && password != "" {
		s, err := ctx.Server.Sessions.Put(username, password)
		if err != nil {
			if _, ok := err.(alps.AuthError); ok {
				return ctx.Render(http.StatusOK, "login.html", &renderData)
			}
			return fmt.Errorf("failed to put connection in pool: %v", err)
		}
		ctx.SetSession(s)

		if remember == "on" {
			ctx.SetLoginToken(username, password)
		}

		if path := ctx.QueryParam("next"); path != "" && path[0] == '/' && path != "/login" {
			return ctx.Redirect(http.StatusFound, path)
		}
		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "login.html", &renderData)
}

func handleLogout(ctx *alps.Context) error {
	ctx.Session.Close()
	ctx.SetSession(nil)
	ctx.SetLoginToken("", "")
	return ctx.Redirect(http.StatusFound, "/login")
}

type MessageRenderData struct {
	IMAPBaseRenderData
	Message     *IMAPMessage
	Part        *IMAPPartNode
	View        interface{}
	MailboxPage int
	Flags       map[string]bool
}

func handleGetPart(ctx *alps.Context, raw bool) error {
	_, uid, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	ibase, err := newIMAPBaseRenderData(ctx, alps.NewBaseRenderData(ctx))
	if err != nil {
		return err
	}
	mbox := ibase.Mailbox

	partPath, err := parsePartPath(ctx.QueryParam("part"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	settings, err := loadSettings(ctx.Session.Store())
	if err != nil {
		return err
	}
	messagesPerPage := settings.MessagesPerPage

	var msg *IMAPMessage
	var part *message.Entity
	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		var err error
		if msg, part, err = getMessagePart(c, mbox.Name, uid, partPath); err != nil {
			return err
		}
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
		if ctx.QueryParam("plain") == "1" {
			mimeType = "text/plain"
		} else {
			mimeType = "message/rfc822"
		}
	}

	if raw {
		ctx.Response().Header().Set("Content-Type", mimeType)

		disp, dispParams, _ := part.Header.ContentDisposition()
		filename := dispParams["filename"]
		if len(partPath) == 0 {
			filename = msg.Envelope.Subject + ".eml"
		}

		// TODO: set Content-Length if possible

		// Be careful not to serve types like text/html as inline
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

	view, err := viewMessagePart(ctx, msg, part)
	if err == ErrViewUnsupported {
		view = nil
	}

	flags := make(map[string]bool)
	for _, f := range mbox.PermanentFlags {
		f = imap.CanonicalFlag(f)
		if f == imap.TryCreateFlag {
			continue
		}
		flags[f] = msg.HasFlag(f)
	}

	ibase.BaseRenderData.WithTitle(msg.Envelope.Subject)

	return ctx.Render(http.StatusOK, "message.html", &MessageRenderData{
		IMAPBaseRenderData: *ibase,
		Message:            msg,
		Part:               msg.PartByPath(partPath),
		View:               view,
		MailboxPage:        int(mbox.Messages-msg.SeqNum) / messagesPerPage,
		Flags:              flags,
	})
}

type ComposeRenderData struct {
	IMAPBaseRenderData
	Message *OutgoingMessage
}

type messagePath struct {
	Mailbox string
	Uid     uint32
}

type composeOptions struct {
	Draft     *messagePath
	Forward   *messagePath
	InReplyTo *messagePath
}

// Send message, append it to the Sent mailbox, mark the original message as
// answered
func submitCompose(ctx *alps.Context, msg *OutgoingMessage, options *composeOptions) error {
	msg.Ref(3)

	err := ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		// (disregard error, we don't care if Outbox already existed)
		c.Create("Outbox")

		if _, err := appendMessage(c, msg, mailboxOutbox); err != nil {
			return err
		}

		msg.Unref()
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to save message to outbox: %v", err)
	}

	task := work.NewTask(func(_ context.Context) error {
		err := ctx.Session.DoSMTP(func (c *smtp.Client) error {
			return sendMessage(c, msg)
		})
		if err != nil {
			ctx.Logger().Printf("Error sending email: %v\n", err)
		}
		return err
	}).Retries(5).After(func(_ context.Context, task *work.Task) {
		ctx.Logger().Printf("email sent: %v", task.Result())
		if task.Result() == nil {
			// Remove from outbox
			err := ctx.Session.DoIMAP(func(c *imapclient.Client) error {
				ctx.Logger().Printf("DoIMAP")
				if err := ensureMailboxSelected(c, "Outbox"); err != nil {
					return err
				}
				uids, err := c.UidSearch(&imap.SearchCriteria{
					Header: map[string][]string{
						"Message-Id": []string{msg.MessageID},
					},
				})
				if err != nil {
					return fmt.Errorf("UID SEARCH failed: %v", err)
				}
				if len(uids) == 1 {
					if err = deleteMessage(c, "Outbox", uids[0]); err != nil {
						return err
					}
				} else {
					ctx.Logger().Errorf(
						"Unexpectedly found multiple results in outbox for message ID %s",
						msg.MessageID)
				}
				return nil
			})
			if err != nil {
				ctx.Logger().Errorf("Error removing message from outbox: %v", err)
			}
		} else {
			ctx.Logger().Errorf("Message delivery failed with error %v", err)
		}

		msg.Unref()
	})
	err = ctx.Server.Queue.Enqueue(task)
	if err != nil {
		if _, ok := err.(alps.AuthError); ok {
			return echo.NewHTTPError(http.StatusForbidden, err)
		}
		return fmt.Errorf("failed to send message: %v", err)
	}

	if inReplyTo := options.InReplyTo; inReplyTo != nil {
		err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
			return markMessageAnswered(c, inReplyTo.Mailbox, inReplyTo.Uid)
		})
		if err != nil {
			return fmt.Errorf("failed to mark original message as answered: %v", err)
		}
	}

	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		if _, err := appendMessage(c, msg, mailboxSent); err != nil {
			return err
		}
		msg.Unref()

		if draft := options.Draft; draft != nil {
			if err := deleteMessage(c, draft.Mailbox, draft.Uid); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to save message to Sent mailbox: %v", err)
	}

	return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
}

func handleCompose(ctx *alps.Context, msg *OutgoingMessage, options *composeOptions) error {
	ibase, err := newIMAPBaseRenderData(ctx, alps.NewBaseRenderData(ctx))
	if err != nil {
		return err
	}

	if msg.From == "" && strings.ContainsRune(ctx.Session.Username(), '@') {
		msg.From = ctx.Session.Username()
	}

	if ctx.Request().Method == http.MethodPost {
		formParams, err := ctx.FormParams()
		if err != nil {
			return fmt.Errorf("failed to parse form: %v", err)
		}
		_, saveAsDraft := formParams["save_as_draft"]

		msg.From = ctx.FormValue("from")
		msg.To = parseAddressList(ctx.FormValue("to"))
		msg.Subject = ctx.FormValue("subject")
		msg.Text = ctx.FormValue("text")
		msg.InReplyTo = ctx.FormValue("in_reply_to")

		form, err := ctx.MultipartForm()
		if err != nil {
			return fmt.Errorf("failed to get multipart form: %v", err)
		}

		// Fetch previous attachments from original message
		var original *messagePath
		if options.Draft != nil {
			original = options.Draft
		} else if options.Forward != nil {
			original = options.Forward
		}
		if original != nil {
			for _, s := range form.Value["prev_attachments"] {
				path, err := parsePartPath(s)
				if err != nil {
					return fmt.Errorf("failed to parse original attachment path: %v", err)
				}

				var part *message.Entity
				err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
					var err error
					_, part, err = getMessagePart(c, original.Mailbox, original.Uid, path)
					return err
				})
				if err != nil {
					return fmt.Errorf("failed to fetch attachment from original message: %v", err)
				}

				var buf bytes.Buffer
				if _, err := io.Copy(&buf, part.Body); err != nil {
					return fmt.Errorf("failed to copy attachment from original message: %v", err)
				}

				h := mail.AttachmentHeader{part.Header}
				mimeType, _, _ := h.ContentType()
				filename, _ := h.Filename()
				msg.Attachments = append(msg.Attachments, &imapAttachment{
					Mailbox: original.Mailbox,
					Uid:     original.Uid,
					Node: &IMAPPartNode{
						Path:     path,
						MIMEType: mimeType,
						Filename: filename,
					},
					Body: buf.Bytes(),
				})
			}
		} else if len(form.Value["prev_attachments"]) > 0 {
			return fmt.Errorf("previous attachments specified but no original message available")
		}

		for _, fh := range form.File["attachments"] {
			msg.Attachments = append(msg.Attachments, &formAttachment{fh})
		}

		uuids := ctx.FormValue("attachment-uuids")
		for _, uuid := range strings.Split(uuids, ",") {
			if uuid == "" {
				continue
			}

			attachment := ctx.Session.PopAttachment(uuid)
			if attachment == nil {
				return fmt.Errorf("Unable to retrieve message attachment %s from session", uuid)
			}
			msg.Attachments = append(msg.Attachments, &refcountedAttachment{
				attachment.File,
				attachment.Form,
				0,
			})
		}

		if saveAsDraft {
			err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
				copied, err := appendMessage(c, msg, mailboxDrafts)
				if err != nil {
					return err
				}
				if !copied {
					return fmt.Errorf("no Draft mailbox found")
				}
				if draft := options.Draft; draft != nil {
					if err := deleteMessage(c, draft.Mailbox, draft.Uid); err != nil {
						return err
					}
				}
				return nil
			})
			if err != nil {
				return fmt.Errorf("failed to save message to Draft mailbox: %v", err)
			}
			return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
		} else {
			return submitCompose(ctx, msg, options)
		}
	}

	return ctx.Render(http.StatusOK, "compose.html", &ComposeRenderData{
		IMAPBaseRenderData: *ibase,
		Message:            msg,
	})
}

func handleComposeNew(ctx *alps.Context) error {
	// These are common mailto URL query parameters
	// TODO: cc, bcc
	return handleCompose(ctx, &OutgoingMessage{
		To:        strings.Split(ctx.QueryParam("to"), ","),
		Subject:   ctx.QueryParam("subject"),
		Text:      ctx.QueryParam("body"),
		MessageID: mail.GenerateMessageID(),
		InReplyTo: ctx.QueryParam("in-reply-to"),
	}, &composeOptions{})
}

func handleComposeAttachment(ctx *alps.Context) error {
	reader, err := ctx.Request().MultipartReader()
	if err != nil {
		return fmt.Errorf("failed to get multipart form: %v", err)
	}
	form, err := reader.ReadForm(32 << 20) // 32 MB
	if err != nil {
		return fmt.Errorf("failed to decode multipart form: %v", err)
	}

	var uuids []string
	for _, fh := range form.File["attachments"] {
		uuid, err := ctx.Session.PutAttachment(fh, form)
		if err != nil {
			return err
		}
		uuids = append(uuids, uuid)
	}

	return ctx.JSON(http.StatusOK, &uuids)
}

func unwrapIMAPAddressList(addrs []*imap.Address) []string {
	l := make([]string, len(addrs))
	for i, addr := range addrs {
		l[i] = addr.Address()
	}
	return l
}

func handleReply(ctx *alps.Context) error {
	var inReplyToPath messagePath
	var err error
	inReplyToPath.Mailbox, inReplyToPath.Uid, err = parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	var msg OutgoingMessage
	if ctx.Request().Method == http.MethodGet {
		// Populate fields from original message
		partPath, err := parsePartPath(ctx.QueryParam("part"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		var inReplyTo *IMAPMessage
		var part *message.Entity
		err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
			var err error
			inReplyTo, part, err = getMessagePart(c, inReplyToPath.Mailbox, inReplyToPath.Uid, partPath)
			return err
		})
		if err != nil {
			return err
		}

		mimeType, _, err := part.Header.ContentType()
		if err != nil {
			return fmt.Errorf("failed to parse part Content-Type: %v", err)
		}

		if !strings.EqualFold(mimeType, "text/plain") {
			err := fmt.Errorf("cannot reply to %q part", mimeType)
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		// TODO: strip HTML tags if text/html
		msg.Text, err = quote(part.Body)
		if err != nil {
			return err
		}

		msg.MessageID = mail.GenerateMessageID()
		msg.InReplyTo = inReplyTo.Envelope.MessageId
		// TODO: populate From from known user addresses and inReplyTo.Envelope.To
		replyTo := inReplyTo.Envelope.ReplyTo
		if len(replyTo) == 0 {
			replyTo = inReplyTo.Envelope.From
		}
		msg.To = unwrapIMAPAddressList(replyTo)
		msg.Subject = inReplyTo.Envelope.Subject
		if !strings.HasPrefix(strings.ToLower(msg.Subject), "re:") {
			msg.Subject = "Re: " + msg.Subject
		}
	}

	return handleCompose(ctx, &msg, &composeOptions{InReplyTo: &inReplyToPath})
}

func handleForward(ctx *alps.Context) error {
	var sourcePath messagePath
	var err error
	sourcePath.Mailbox, sourcePath.Uid, err = parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	var msg OutgoingMessage
	if ctx.Request().Method == http.MethodGet {
		// Populate fields from original message
		partPath, err := parsePartPath(ctx.QueryParam("part"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		var source *IMAPMessage
		var part *message.Entity
		err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
			var err error
			source, part, err = getMessagePart(c, sourcePath.Mailbox, sourcePath.Uid, partPath)
			return err
		})
		if err != nil {
			return err
		}

		mimeType, _, err := part.Header.ContentType()
		if err != nil {
			return fmt.Errorf("failed to parse part Content-Type: %v", err)
		}

		if !strings.EqualFold(mimeType, "text/plain") {
			err := fmt.Errorf("cannot forward %q part", mimeType)
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		msg.Text, err = quote(part.Body)
		if err != nil {
			return err
		}

		msg.MessageID = mail.GenerateMessageID()
		msg.Subject = source.Envelope.Subject
		if !strings.HasPrefix(strings.ToLower(msg.Subject), "fwd:") &&
			!strings.HasPrefix(strings.ToLower(msg.Subject), "fw:") {
			msg.Subject = "Fwd: " + msg.Subject
		}
		msg.InReplyTo = source.Envelope.InReplyTo

		attachments := source.Attachments()
		for i := range attachments {
			// No need to populate attachment body here, we just need the
			// metadata
			msg.Attachments = append(msg.Attachments, &imapAttachment{
				Mailbox: sourcePath.Mailbox,
				Uid:     sourcePath.Uid,
				Node:    &attachments[i],
			})
		}
	}

	return handleCompose(ctx, &msg, &composeOptions{Forward: &sourcePath})
}

func handleEdit(ctx *alps.Context) error {
	var sourcePath messagePath
	var err error
	sourcePath.Mailbox, sourcePath.Uid, err = parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	// TODO: somehow get the path to the In-Reply-To message (with a search?)

	var msg OutgoingMessage
	if ctx.Request().Method == http.MethodGet {
		// Populate fields from source message
		partPath, err := parsePartPath(ctx.QueryParam("part"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		var source *IMAPMessage
		var part *message.Entity
		err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
			var err error
			source, part, err = getMessagePart(c, sourcePath.Mailbox, sourcePath.Uid, partPath)
			return err
		})
		if err != nil {
			return err
		}

		mimeType, _, err := part.Header.ContentType()
		if err != nil {
			return fmt.Errorf("failed to parse part Content-Type: %v", err)
		}

		if !strings.EqualFold(mimeType, "text/plain") {
			err := fmt.Errorf("cannot edit %q part", mimeType)
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}

		b, err := ioutil.ReadAll(part.Body)
		if err != nil {
			return fmt.Errorf("failed to read part body: %v", err)
		}
		msg.Text = string(b)

		if len(source.Envelope.From) > 0 {
			msg.From = source.Envelope.From[0].Address()
		}
		msg.To = unwrapIMAPAddressList(source.Envelope.To)
		msg.Subject = source.Envelope.Subject
		msg.InReplyTo = source.Envelope.InReplyTo
		msg.MessageID = source.Envelope.MessageId

		attachments := source.Attachments()
		for i := range attachments {
			// No need to populate attachment body here, we just need the
			// metadata
			msg.Attachments = append(msg.Attachments, &imapAttachment{
				Mailbox: sourcePath.Mailbox,
				Uid:     sourcePath.Uid,
				Node:    &attachments[i],
			})
		}
	}

	return handleCompose(ctx, &msg, &composeOptions{Draft: &sourcePath})
}

func formOrQueryParam(ctx *alps.Context, k string) string {
	if v := ctx.FormValue(k); v != "" {
		return v
	}
	return ctx.QueryParam(k)
}

func handleMove(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	formParams, err := ctx.FormParams()
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	uids, err := parseUidList(formParams["uids"])
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	to := formOrQueryParam(ctx, "to")
	if to == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing 'to' form parameter")
	}

	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		mc := imapmove.NewClient(c)

		if err := ensureMailboxSelected(c, mboxName); err != nil {
			return err
		}

		var seqSet imap.SeqSet
		seqSet.AddNum(uids...)
		if err := mc.UidMoveWithFallback(&seqSet, to); err != nil {
			return fmt.Errorf("failed to move message: %v", err)
		}

		// TODO: get the UID of the message in the destination mailbox with UIDPLUS
		return nil
	})
	if err != nil {
		return err
	}

	if path := formOrQueryParam(ctx, "next"); path != "" {
		return ctx.Redirect(http.StatusFound, path)
	}
	return ctx.Redirect(http.StatusFound, fmt.Sprintf("/mailbox/%v", url.PathEscape(mboxName)))
}

func handleDelete(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	formParams, err := ctx.FormParams()
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}
	uids, err := parseUidList(formParams["uids"])
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		if err := ensureMailboxSelected(c, mboxName); err != nil {
			return err
		}

		var seqSet imap.SeqSet
		seqSet.AddNum(uids...)

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

	if path := formOrQueryParam(ctx, "next"); path != "" {
		return ctx.Redirect(http.StatusFound, path)
	}
	return ctx.Redirect(http.StatusFound, fmt.Sprintf("/mailbox/%v", url.PathEscape(mboxName)))
}

func handleSetFlags(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	formParams, err := ctx.FormParams()
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	uids, err := parseUidList(formParams["uids"])
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err)
	}

	flags, ok := formParams["flags"]
	if !ok {
		flagsStr := ctx.QueryParam("to")
		if flagsStr == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "missing 'flags' form parameter")
		}
		flags = strings.Fields(flagsStr)
	}

	actionStr := ctx.FormValue("action")
	if actionStr == "" {
		actionStr = ctx.QueryParam("action")
	}

	var op imap.FlagsOp
	switch actionStr {
	case "", "set":
		op = imap.SetFlags
	case "add":
		op = imap.AddFlags
	case "remove":
		op = imap.RemoveFlags
	default:
		return echo.NewHTTPError(http.StatusBadRequest, "invalid 'action' value")
	}

	err = ctx.Session.DoIMAP(func(c *imapclient.Client) error {
		if err := ensureMailboxSelected(c, mboxName); err != nil {
			return err
		}

		var seqSet imap.SeqSet
		seqSet.AddNum(uids...)

		storeItems := make([]interface{}, len(flags))
		for i, f := range flags {
			storeItems[i] = f
		}

		item := imap.FormatFlagsOp(op, true)
		if err := c.UidStore(&seqSet, item, storeItems, nil); err != nil {
			return fmt.Errorf("failed to add deleted flag: %v", err)
		}

		return nil
	})
	if err != nil {
		return err
	}

	if path := formOrQueryParam(ctx, "next"); path != "" {
		return ctx.Redirect(http.StatusFound, path)
	}
	if len(uids) != 1 || (op == imap.RemoveFlags && len(flags) == 1 && flags[0] == imap.SeenFlag) {
		// Redirecting to the message view would mark the message as read again
		return ctx.Redirect(http.StatusFound, fmt.Sprintf("/mailbox/%v", url.PathEscape(mboxName)))
	}
	return ctx.Redirect(http.StatusFound, fmt.Sprintf("/message/%v/%v", url.PathEscape(mboxName), uids[0]))
}

const settingsKey = "base.settings"
const maxMessagesPerPage = 100

type Settings struct {
	MessagesPerPage int
}

func loadSettings(s alps.Store) (*Settings, error) {
	settings := &Settings{
		MessagesPerPage: 50,
	}
	if err := s.Get(settingsKey, settings); err != nil && err != alps.ErrNoStoreEntry {
		return nil, err
	}
	if err := settings.check(); err != nil {
		return nil, err
	}
	return settings, nil
}

func (s *Settings) check() error {
	if s.MessagesPerPage <= 0 || s.MessagesPerPage > maxMessagesPerPage {
		return fmt.Errorf("messages per page out of bounds: %v", s.MessagesPerPage)
	}
	return nil
}

type SettingsRenderData struct {
	alps.BaseRenderData
	Settings *Settings
}

func handleSettings(ctx *alps.Context) error {
	settings, err := loadSettings(ctx.Session.Store())
	if err != nil {
		return fmt.Errorf("failed to load settings: %v", err)
	}

	if ctx.Request().Method == http.MethodPost {
		settings.MessagesPerPage, err = strconv.Atoi(ctx.FormValue("messages_per_page"))
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid messages per page: %v", err)
		}

		if err := settings.check(); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err)
		}
		if err := ctx.Session.Store().Put(settingsKey, settings); err != nil {
			return fmt.Errorf("failed to save settings: %v", err)
		}

		return ctx.Redirect(http.StatusFound, "/mailbox/INBOX")
	}

	return ctx.Render(http.StatusOK, "settings.html", &SettingsRenderData{
		BaseRenderData: *alps.NewBaseRenderData(ctx),
		Settings:       settings,
	})
}
