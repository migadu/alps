package alpsbase

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-message/textproto"
	"github.com/emersion/go-smtp"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

func registerRoutes(p *alps.GoPlugin) {
	// Mailboxes
	p.GET("/mailboxes", handleListMailboxes)
	p.GET("/mailboxes/{mbox}", handleGetMailbox)
	p.GET("/mailboxes/{mbox}/status", handleMailboxStatus)
	p.POST("/mailboxes", handleNewMailbox)
	p.DELETE("/mailboxes/{mbox}", handleDeleteMailbox)
	p.PUT("/mailboxes/{mbox}/rename", handleRenameMailbox)
	p.PUT("/mailboxes/{mbox}/subscribe", handleSubscribeMailbox)
	p.PUT("/mailboxes/{mbox}/unsubscribe", handleUnsubscribeMailbox)

	// Messages
	p.GET("/mailboxes/{mbox}/messages/{uid}", func(ctx *alps.Context) error {
		return handleGetPart(ctx, false)
	})
	p.GET("/mailboxes/{mbox}/messages/{uid}/raw", func(ctx *alps.Context) error {
		return handleGetPart(ctx, true)
	})
	p.GET("/mailboxes/{mbox}/messages/{uid}/thread", handleGetThread)
	p.GET("/mailboxes/{mbox}/verdicts", handleAuthVerdicts)
	p.DELETE("/mailboxes/{mbox}/messages", handleDelete)
	p.POST("/mailboxes/{mbox}/empty", handleEmptyMailbox)
	p.PUT("/mailboxes/{mbox}/messages/move", handleMove)
	p.PUT("/mailboxes/{mbox}/messages/copy", handleCopy)
	p.PUT("/mailboxes/{mbox}/messages/flag", handleSetFlags)
	p.POST("/messages", handleComposeNew)

	// BIMI
	p.GET("/bimi/avatar", handleBIMIAvatar)

	// Attachments
	p.POST("/attachments", handleComposeAttachment)
	p.DELETE("/attachments/{uuid}", handleCancelAttachment)

	// Session
	p.POST("/session", handleLogin)
	p.GET("/session", handleGetSession)
	p.DELETE("/session", handleLogout)

	// Proxy
	p.GET("/proxy", handleProxy)

	// Settings & Accounts
	p.GET("/settings", handleSettings)
	p.PUT("/settings", handleSettings)

	// WebAuthn
	p.GET("/settings/2fa", handleSetupPage)
	p.POST("/settings/2fa/begin", handleSetupBegin)
	p.POST("/settings/2fa/finish", handleSetupFinish)
	p.POST("/settings/2fa/credential/{id}/delete", handleDeleteCredential)
	p.POST("/settings/2fa/trust-linked-accounts", handleLinkedAccountsTrust)
	p.POST("/webauthn/verify/begin", handleVerifyBegin)
	p.POST("/webauthn/verify/finish", handleVerifyFinish)

	p.GET("/accounts", handleSettingsAccounts)
	p.POST("/accounts", handleAddAccount)
	p.DELETE("/accounts/{id}", handleRemoveAccount)
	p.POST("/accounts/switch", handleSwitchAccount)

}

type BaseMailboxData struct {
	Mailboxes []MailboxInfo
	Inbox     *MailboxStatus
	Mailbox   *MailboxStatus
}

// mailboxInfoToStatus converts a MailboxInfo with status data to MailboxStatus
func mailboxInfoToStatus(mbox MailboxInfo) *MailboxStatus {
	numMessages := uint32(mbox.Total)
	numUnseen := uint32(mbox.Unseen)
	return &MailboxStatus{
		StatusData: &imap.StatusData{
			Mailbox:     mbox.Mailbox,
			NumMessages: &numMessages,
			NumUnseen:   &numUnseen,
			// UIDValidity not available from ListData
		},
	}
}

// invalidateMailboxCache clears cached mailbox data for a session.
// invalidateMailboxTree drops every cached entry for a mailbox AND anything
// beneath it, for operations that change which mailboxes exist.
//
// Create, delete and rename passed no names at all, so only the "mailboxes"
// list was cleared and every `status:`, `messages:` and `message:` entry for the
// affected folder survived. Keys are per NAME, so those stale entries are not
// merely wasted memory: delete `Work` and create a new `Work`, or rename one
// away and reuse the name, and `messages:Work:0` is served from the cache —
// the new, empty folder shows the old folder's mail.
//
// The whole message cache goes rather than a prefix, because a prefix over
// mailbox names is the `Archive`/`Arch` trap this review has now fixed three
// times, and getting it wrong HERE means serving one folder's mail under
// another's name. These three operations are rare and the cache refills on the
// next read, so precision buys nothing worth that risk.
func invalidateMailboxTree(ctx *alps.Context) {
	ctx.Session.Cache().Clear()
}

func invalidateMailboxCache(ctx *alps.Context, mailboxNames ...string) {
	cache := ctx.Session.Cache()

	// Clear mailbox list cache
	cache.Delete("mailboxes")

	// Clear specific mailbox status caches and message caches
	for _, name := range mailboxNames {
		// Clear mailbox status
		cache.Delete("status:" + name)

		// Clear all message pages for this mailbox
		cache.DeletePrefix("messages:" + name + ":")

		// Clear individual messages for this mailbox
		cache.DeletePrefix("message:" + name + ":")
	}
}

// CachedMessages holds cached message list data
type CachedMessages struct {
	Messages []provider.Message
	Total    int
}

// CachedMessagePart holds a cached individual message with optional body data
type CachedMessagePart struct {
	Message    *provider.Message
	HeaderData []byte // nil if only envelope/flags are cached
	BodyData   []byte // nil if only envelope/flags are cached
	Mailbox    string
}

// updateCachedMessageFlags updates flags for specific messages in cached message lists
func updateCachedMessageFlags(ctx *alps.Context, mailbox string, uid provider.MessageID, addFlags []imap.Flag, removeFlags []imap.Flag) {
	applyFlagsToCache(ctx.Session.Cache(), ctx.Server.Logger().Debugf, mailbox, uid, addFlags, removeFlags)
}

// applyFlagsToCache brings the session's cached copies of one message, and
// its mailbox's unseen count, in line with a flag change the server has made.
func applyFlagsToCache(cache *alps.Cache, debugf func(string, ...interface{}), mailbox string, uid provider.MessageID, addFlags []imap.Flag, removeFlags []imap.Flag) {
	// Convert IMAP flags to alps flags
	alpsAddFlags := make([]provider.Flag, len(addFlags))
	for i, f := range addFlags {
		alpsAddFlags[i] = provider.Flag(f)
	}
	alpsRemoveFlags := make([]provider.Flag, len(removeFlags))
	for i, f := range removeFlags {
		alpsRemoveFlags[i] = provider.Flag(f)
	}

	// What the cached copies said about \Seen BEFORE this change. The unseen
	// count may only move when the message really goes from unseen to seen or
	// back: reading a message adds \Seen twice (the body fetch sets it, and
	// so does the reader's mark-as-read), and a count that dropped on both
	// fell by two for one message.
	var cachedSeen, cachedUnseen bool
	noteSeen := func(flags []provider.Flag) {
		if slices.Contains(flags, provider.Flag(imap.FlagSeen)) {
			cachedSeen = true
		} else {
			cachedUnseen = true
		}
	}

	// Helper function to update flags
	updateFlags := func(flags []provider.Flag) []provider.Flag {
		// Add new flags
		for _, flag := range alpsAddFlags {
			if !slices.Contains(flags, flag) {
				flags = append(flags, flag)
			}
		}
		// Remove flags
		for _, flag := range alpsRemoveFlags {
			for j := len(flags) - 1; j >= 0; j-- {
				if flags[j] == flag {
					flags = append(flags[:j], flags[j+1:]...)
					break
				}
			}
		}
		return flags
	}

	// Update all cached message pages for this mailbox
	prefix := "messages:" + mailbox + ":"
	keys := cache.GetKeysWithPrefix(prefix)

	// Convert UID to MessageID for comparison
	uidStr := uid.String()

	messageUpdated := false
	for _, key := range keys {
		if cached, ok := cache.Get(key); ok {
			cachedData := cached.(CachedMessages)
			// Find and update the message in this page
			for i := range cachedData.Messages {
				if cachedData.Messages[i].ID.String() == uidStr {
					noteSeen(cachedData.Messages[i].Flags)
					cachedData.Messages[i].Flags = updateFlags(cachedData.Messages[i].Flags)
					cache.Set(key, cachedData)
					messageUpdated = true
					debugf("Updated flags for message %s in cache key %s", uidStr, key)
					break
				}
			}
		}
	}

	// Update individual message cache (metadata only)
	msgKey := fmt.Sprintf("message:%s:%s:[]", mailbox, uidStr)
	if cached, ok := cache.Get(msgKey); ok {
		cachedPart := cached.(CachedMessagePart)
		if cachedPart.Message != nil {
			noteSeen(cachedPart.Message.Flags)
			cachedPart.Message.Flags = updateFlags(cachedPart.Message.Flags)
			cache.Set(msgKey, cachedPart)
			debugf("Updated flags for message %s in individual cache", uidStr)
			messageUpdated = true
		}
	}

	if !messageUpdated {
		debugf("Message %s not found in cache, pages may need refresh", uidStr)
	}

	seenAdded := slices.Contains(addFlags, imap.FlagSeen)
	seenRemoved := slices.Contains(removeFlags, imap.FlagSeen)
	if !seenAdded && !seenRemoved {
		return
	}

	statusKey := "status:" + mailbox
	cached, ok := cache.Get(statusKey)
	if !ok {
		return
	}
	status := cached.(*MailboxStatus)
	if status.NumUnseen == nil {
		return
	}

	// Copies that disagree, or no copy at all, say nothing reliable about the
	// message's state before the change: drop the count and let the next
	// listing ask the server.
	if cachedSeen == cachedUnseen {
		cache.Delete(statusKey)
		debugf("Dropped cached status for %s: the message's previous \\Seen state is unknown", mailbox)
		return
	}

	switch {
	case seenAdded && cachedUnseen && *status.NumUnseen > 0:
		newCount := *status.NumUnseen - 1
		status.NumUnseen = &newCount
		cache.Set(statusKey, status)
		debugf("Decremented unseen count for %s to %d", mailbox, newCount)
	case seenRemoved && cachedSeen:
		newCount := *status.NumUnseen + 1
		status.NumUnseen = &newCount
		cache.Set(statusKey, status)
		debugf("Incremented unseen count for %s to %d", mailbox, newCount)
	}
}

// cachedMailboxList returns the session's folder list, going to IMAP only when
// the cache has none. The key is the one every mailbox verb already drops, so
// a list read straight after a create or a rename is the new tree.
func cachedMailboxList(ctx *alps.Context) ([]MailboxInfo, error) {
	const cacheKey = "mailboxes"
	if cached, ok := ctx.Session.Cache().Get(cacheKey); ok {
		return cached.([]MailboxInfo), nil
	}

	var mailboxes []MailboxInfo
	err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		var err error
		mailboxes, err = listMailboxesWithProvider(p)
		if err != nil {
			return err
		}
		ctx.Session.Cache().Set(cacheKey, mailboxes)
		return nil
	})
	if err != nil {
		return nil, err
	}
	return mailboxes, nil
}

func getBaseMailboxData(ctx *alps.Context) (*BaseMailboxData, error) {

	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return nil, alps.NewHTTPError(http.StatusBadRequest, err)
	}

	if mboxName == allMailboxes {
		active := &MailboxStatus{
			StatusData: &imap.StatusData{
				Mailbox: allMailboxes,
			},
		}

		mailboxes, err := cachedMailboxList(ctx)
		if err != nil {
			return nil, err
		}

		return &BaseMailboxData{
			Mailboxes: mailboxes,
			Inbox:     nil,
			Mailbox:   active,
		}, nil
	}

	statuses := make(map[string]*MailboxStatus)
	var mailboxes []MailboxInfo
	var active, inbox *MailboxStatus
	needsIMAP := false

	// Try to get mailboxes from cache first
	cacheKey := "mailboxes"
	if cached, ok := ctx.Session.Cache().Get(cacheKey); ok {
		mailboxes = cached.([]MailboxInfo)
		ctx.Server.Logger().Debugf("Cache HIT for mailboxes list")
	} else {
		needsIMAP = true
	}

	// Try to get all needed statuses from cache
	allStatusesCached := true
	if len(mailboxes) > 0 {
		// Try to get statuses from cache
		statusesToCheck := []string{"INBOX"}
		if mboxName != "" && mboxName != "INBOX" {
			statusesToCheck = append(statusesToCheck, mboxName)
		}

		for _, name := range statusesToCheck {
			statusKey := "status:" + name
			if cached, ok := ctx.Session.Cache().Get(statusKey); ok {
				statuses[name] = cached.(*MailboxStatus)
				ctx.Server.Logger().Debugf("Cache HIT for status:%s", name)
			} else {
				allStatusesCached = false
				break
			}
		}

		if allStatusesCached {
			inbox = statuses["INBOX"]
			if mboxName != "" {
				active = statuses[mboxName]
			}
			ctx.Server.Logger().Debugf("All data served from cache, skipping IMAP call")
		} else {
			needsIMAP = true
		}
	}

	if !needsIMAP && allStatusesCached {
		// Everything is cached, skip provider call entirely
		err = nil
	} else {
		err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			var err error
			var needsMailboxListFetch = len(mailboxes) == 0

			// Collect which statuses we need to fetch
			statusesToFetch := make(map[string]bool)
			if mboxName != "" {
				if _, ok := ctx.Session.Cache().Get("status:" + mboxName); !ok {
					statusesToFetch[mboxName] = true
				}
			}
			if mboxName != "INBOX" {
				if _, ok := ctx.Session.Cache().Get("status:INBOX"); !ok {
					statusesToFetch["INBOX"] = true
				}
			}

			// If we need mailbox list or any statuses, fetch with LIST-STATUS
			if needsMailboxListFetch || len(statusesToFetch) > 0 {
				// Fetch mailboxes with status info (uses LIST-STATUS if server supports it)
				mailboxes, err = listMailboxesWithProvider(p)
				if err != nil {
					return err
				}

				if needsMailboxListFetch {
					// Cache the mailbox list
					ctx.Session.Cache().Set(cacheKey, mailboxes)
					ctx.Server.Logger().Debugf("Cache MISS for mailboxes list, cached for future requests")
				}

				// Cache ALL statuses from the list (not just the ones we need)
				// This way, subsequent requests will be fully cached
				for _, mbox := range mailboxes {
					if mbox.Unseen >= 0 && mbox.Total >= 0 {
						// Status was included in LIST-STATUS - cache it
						status := mailboxInfoToStatus(mbox)
						ctx.Session.Cache().Set("status:"+mbox.Name(), status)

						// Also populate statuses map for folders we need now
						if statusesToFetch[mbox.Name()] || mbox.Subscribed {
							statuses[mbox.Name()] = status
							ctx.Server.Logger().Debugf("Cache MISS for status:%s (via LIST-STATUS)", mbox.Name())
						}
					} else if statusesToFetch[mbox.Name()] || mbox.Subscribed {
						// Non-selectable folders (e.g. Gmail's "[Gmail]"
						// container) never get a status via LIST-STATUS and
						// reject an explicit STATUS with NO [NONEXISTENT].
						if mbox.HasAttr(string(imap.MailboxAttrNoSelect)) ||
							mbox.HasAttr(string(imap.MailboxAttrNonExistent)) {
							continue
						}
						// Server doesn't support LIST-STATUS, need individual STATUS command
						status, err := getMailboxStatusWithProvider(p, mbox.Name())
						if err != nil {
							if statusesToFetch[mbox.Name()] {
								return err
							}
							// A sidebar folder's STATUS failure must not take
							// down the whole mailbox view.
							ctx.Server.Logger().Errorf("Failed to get status for mailbox %q: %v", mbox.Name(), err)
							continue
						}
						statuses[mbox.Name()] = status
						ctx.Session.Cache().Set("status:"+mbox.Name(), status)
						ctx.Server.Logger().Debugf("Cache MISS for status:%s (via STATUS)", mbox.Name())
					}
				}
			}

			// Get statuses from cache for ones we already have
			if mboxName != "" {
				statusKey := "status:" + mboxName
				if cached, ok := ctx.Session.Cache().Get(statusKey); ok {
					active = cached.(*MailboxStatus)
					ctx.Server.Logger().Debugf("Cache HIT for status:%s", mboxName)
				} else {
					active = statuses[mboxName]
				}
			}

			if mboxName == "INBOX" {
				inbox = active
			} else {
				statusKey := "status:INBOX"
				if cached, ok := ctx.Session.Cache().Get(statusKey); ok {
					inbox = cached.(*MailboxStatus)
					ctx.Server.Logger().Debugf("Cache HIT for status:INBOX")
				} else {
					inbox = statuses["INBOX"]
				}
			}

			return nil
		})
	}
	if err != nil {
		return nil, err
	}

	if mboxName != "" {
		statuses[mboxName] = active
	}
	statuses["INBOX"] = inbox

	for i := range mailboxes {
		// Populate unseen & active states
		// Always reset Active first (important when using cached mailboxes)
		mailboxes[i].Active = false
		if active != nil && mailboxes[i].Name() == active.Mailbox {
			mailboxes[i].Active = true
		}
		status := statuses[mailboxes[i].Name()]
		if status != nil {
			mailboxes[i].Unseen = int(*status.NumUnseen)
			mailboxes[i].Total = int(*status.NumMessages)
		}
	}

	return &BaseMailboxData{
		Mailboxes: mailboxes,
		Inbox:     inbox,
		Mailbox:   active,
	}, nil
}

// MailboxStatusResponse is the JSON response for the mailbox status polling endpoint.
type MailboxStatusResponse struct {
	Total  int `json:"total"`
	Unseen int `json:"unseen"`
}

// handleMailboxStatus returns a lightweight JSON response with the current
// mailbox message count and unseen count. It bypasses the status cache to
// get a fresh answer from the IMAP server (which triggers NOOP to pick up
// changes). When the counts differ from the previously cached values it
// also invalidates the message-page caches so the next full page fetch
// returns up-to-date data.
func handleMailboxStatus(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	cache := ctx.Session.Cache()

	// Remember the previously cached counts so we can detect changes.
	var prevTotal, prevUnseen uint32
	if cached, ok := cache.Get("status:" + mboxName); ok {
		prev := cached.(*MailboxStatus)
		if prev.NumMessages != nil {
			prevTotal = *prev.NumMessages
		}
		if prev.NumUnseen != nil {
			prevUnseen = *prev.NumUnseen
		}
	}

	// Clear cached status so the provider call goes to IMAP.
	cache.Delete("status:" + mboxName)

	var status *MailboxStatus
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		s, err := p.GetMailboxStatus(mboxName)
		if err != nil {
			return err
		}
		status = providerStatusToMailboxStatus(s)
		cache.Set("status:"+mboxName, status)
		return nil
	})
	if err != nil {
		return err
	}

	newTotal := *status.NumMessages
	newUnseen := *status.NumUnseen

	// If counts changed, invalidate message-page caches and mailbox list
	// so the next full-page fetch will return fresh data.
	if newTotal != prevTotal || newUnseen != prevUnseen {
		cache.DeletePrefix("messages:" + mboxName + ":")
		cache.Delete("mailboxes")
		// Also clear all status caches so sidebar counts refresh
		for _, key := range cache.GetKeysWithPrefix("status:") {
			cache.Delete(key)
		}
		ctx.Server.Logger().Debugf("Mailbox %s status changed: total %d→%d, unseen %d→%d — caches invalidated",
			mboxName, prevTotal, newTotal, prevUnseen, newUnseen)
	}

	return ctx.JSON(http.StatusOK, MailboxStatusResponse{
		Total:  int(newTotal),
		Unseen: int(newUnseen),
	})
}

func handleGetMailbox(ctx *alps.Context) error {
	if refresh := ctx.QueryParam("refresh"); refresh == "1" || refresh == "true" {
		cache := ctx.Session.Cache()
		cache.Delete("mailboxes")
		for _, key := range cache.GetKeysWithPrefix("status:") {
			cache.Delete(key)
		}

		mboxName, err := url.PathUnescape(ctx.Param("mbox"))
		if err == nil {
			cache.DeletePrefix("messages:" + mboxName + ":")
		}
	}

	ibase, err := getBaseMailboxData(ctx)
	if err != nil {
		return err
	}

	mbox := ibase.Mailbox
	if mbox == nil {
		return alps.NewHTTPError(http.StatusNotFound, "Mailbox not found")
	}
	title := mbox.Name()
	if title == "INBOX" {
		title = "Inbox"
	} else if title == "*" {
		title = "Search All Mailboxes"
	}
	if mbox.NumUnseen != nil && *mbox.NumUnseen > 0 {
		title = fmt.Sprintf("(%d) %s", *mbox.NumUnseen, title)
	}

	page := 0
	if pageStr := ctx.QueryParam("page"); pageStr != "" {
		var err error
		if page, err = strconv.Atoi(pageStr); err != nil || page < 0 {
			return alps.NewHTTPError(http.StatusBadRequest, "invalid page index")
		}
	}

	settings, err := readSettings(ctx)
	if err != nil {
		return err
	}
	messagesPerPage := settings.MessagesPerPage
	sortOrder := settings.SortOrder
	if sortOrder == "" {
		sortOrder = "desc"
	}

	query := ctx.QueryParam("query")

	var (
		msgs  []IMAPMessage
		total int
	)

	// Build cache key for messages
	enableThreading := false
	if settings.UI.EnableThreading != nil {
		enableThreading = *settings.UI.EnableThreading
	} else {
		if val, ok := ctx.Session.GetData("hasThreadCapability"); ok {
			if hasCap, ok := val.(bool); ok {
				enableThreading = hasCap
			}
		}
	}
	msgCacheKey := fmt.Sprintf("messages:%s:page%d:perpage%d:query%s:sort%s:criteria%s:thread%t", mbox.Name(), page, messagesPerPage, query, sortOrder, settings.MessageSortCriteria, enableThreading)

	// Try to get messages from cache
	if cached, ok := ctx.Session.Cache().Get(msgCacheKey); ok {
		cachedData := cached.(CachedMessages)
		total = cachedData.Total

		// Convert cached provider messages to IMAP messages for display
		msgs = make([]IMAPMessage, len(cachedData.Messages))
		for i, msg := range cachedData.Messages {
			msgs[i] = providerMessageToIMAP(msg)
		}

		ctx.Server.Logger().Debugf("Cache HIT for messages in %s page %d (query: %q)", mbox.Name(), page, query)
	} else {
		var providerMsgs []provider.Message
		err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			var err error
			if query != "" || settings.MessageSortCriteria == "date" {
				providerMsgs, total, err = p.SearchMessages(mbox.Name(), query, sortOrder, page, messagesPerPage)
			} else {
				providerMsgs, total, err = p.ListMessages(mbox.Name(), sortOrder, page, messagesPerPage)
			}
			if err != nil {
				return err
			}

			// Cache the message list using provider types
			ctx.Session.Cache().Set(msgCacheKey, CachedMessages{
				Messages: providerMsgs,
				Total:    total,
			})

			// Also cache individual message metadata (without body) for faster individual access
			for i := range providerMsgs {
				msgKey := fmt.Sprintf("message:%s:%s:[]", mbox.Name(), providerMsgs[i].ID.String())
				// Check if we already have a full message cached (with body)
				if cached, ok := ctx.Session.Cache().Get(msgKey); ok {
					if cachedPart, ok := cached.(CachedMessagePart); ok && cachedPart.BodyData != nil {
						// Already have full message, don't overwrite
						continue
					}
				}
				// Cache just the metadata (no body)
				ctx.Session.Cache().Set(msgKey, CachedMessagePart{
					Message:    &providerMsgs[i],
					HeaderData: nil, // No body data yet
					BodyData:   nil,
					Mailbox:    mbox.Name(),
				})
			}
			return nil
		})
		if err != nil {
			return err
		}

		// Convert provider messages to IMAP messages for display
		msgs = make([]IMAPMessage, len(providerMsgs))
		for i, msg := range providerMsgs {
			msgs[i] = providerMessageToIMAP(msg)
		}

		ctx.Server.Logger().Debugf("Cache MISS for messages in %s page %d (query: %q), fetched and cached %d messages", mbox.Name(), page, query, len(msgs))
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"Title":           title,
		"Username":        ctx.Session.Username(),
		"Mailboxes":       ibase.Mailboxes,
		"Mailbox":         ibase.Mailbox,
		"Inbox":           ibase.Inbox,
		"Messages":        msgs,
		"Total":           total,
		"Page":            page,
		"MessagesPerPage": messagesPerPage,
	})
}

// handleListMailboxes answers with the folder list and nothing else.
//
// `GET /mailboxes/{mbox}` carries one too, but only alongside a page of that
// folder's mail — a THREAD/SORT and a FETCH. The verbs that change which
// folders exist rather than what is inside one (create, rename, subscribe)
// move no mail, so the folder list is the whole of what they need to re-read,
// and this is how the frontend asks for it. See `messageSync.syncLabels`.
func handleListMailboxes(ctx *alps.Context) error {
	mailboxes, err := cachedMailboxList(ctx)
	if err != nil {
		return err
	}

	// Keyed as `GET /mailboxes/{mbox}` keys it, so the one consumer on the
	// frontend reads either answer the same way.
	return ctx.JSON(http.StatusOK, map[string]interface{}{"Mailboxes": mailboxes})
}

func handleNewMailbox(ctx *alps.Context) error {
	name := ctx.FormValue("name")
	if name == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Name is required"})
	}

	err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		return createMailboxWithProvider(p, name)
	})

	if err != nil {
		return respondMailboxError(ctx, "create mailbox", err)
	}

	// A brand-new mailbox may be reusing the name of one that was deleted or
	// renamed while this session's cache still holds its pages.
	invalidateMailboxTree(ctx)
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "mailbox": name})
}

func handleDeleteMailbox(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid mailbox name"})
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		_ = unsubscribeMailboxWithProvider(p, mboxName)
		return deleteMailboxWithProvider(p, mboxName)
	})
	if err != nil {
		return respondMailboxError(ctx, "delete mailbox", err)
	}

	invalidateMailboxTree(ctx)
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

func handleRenameMailbox(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid mailbox name"})
	}

	var req struct {
		NewName string `json:"new_name"`
	}
	if err := ctx.BindJSON(&req); err != nil {
		return ctx.RespondBindError(err)
	}
	if req.NewName == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "New name is required"})
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		// "Is this rename a move into Trash?" resolved by IMAP special-use,
		// not by testing whether the new name starts with the English word
		// "trash". The frontend already resolves the real Trash folder by
		// attribute — see findMailboxNameByRole and the issue #4 comment it
		// carries — so the two halves of one feature disagreed: on Gmail, where
		// Trash is `[Gmail]/Trash`, the unsubscribe that is supposed to
		// accompany the move never happened, and a user's own folder named
		// "Trash notes" got it when it should not have.
		if isMoveIntoTrash(p, req.NewName) {
			_ = unsubscribeMailboxWithProvider(p, mboxName)
		}
		return renameMailboxWithProvider(p, mboxName, req.NewName)
	})
	if err != nil {
		return respondMailboxError(ctx, "rename mailbox", err)
	}

	invalidateMailboxTree(ctx)
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

func handleSubscribeMailbox(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid mailbox name"})
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		return subscribeMailboxWithProvider(p, mboxName)
	})
	if err != nil {
		return respondMailboxError(ctx, "subscribe mailbox", err)
	}

	invalidateMailboxCache(ctx)
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

func handleUnsubscribeMailbox(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid mailbox name"})
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		return unsubscribeMailboxWithProvider(p, mboxName)
	})
	if err != nil {
		return respondMailboxError(ctx, "unsubscribe mailbox "+mboxName, err)
	}

	invalidateMailboxCache(ctx)
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

func handleLogin(ctx *alps.Context) error {
	var username, password, remember string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Username   string `json:"username"`
			Password   string `json:"password"`
			RememberMe string `json:"remember-me"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		username = req.Username
		password = req.Password
		remember = req.RememberMe
	} else {
		username = ctx.FormValue("username")
		password = ctx.FormValue("password")
		remember = ctx.FormValue("remember-me")
	}

	// Check if we're restoring from a login token (session restoration)
	restoredFromToken := false
	tokenVerified2FA := false
	if username == "" && password == "" {
		username, password, tokenVerified2FA, _ = ctx.GetLoginToken()
		restoredFromToken = username != "" && password != ""
	}

	// Check rate limiting before attempting login
	if ctx.Server.RateLimiter != nil {
		allowed, reason, retryAfter := ctx.Server.RateLimiter.CheckLoginAllowed(ctx.Request, username)
		if !allowed {
			ctx.Server.Logger().Printf("Rate limit exceeded for login attempt: username=%s, ip=%s, reason=%s",
				username, ctx.Request.RemoteAddr, reason)

			// Set Retry-After header
			if retryAfter > 0 {
				ctx.Response.Header().Set("Retry-After", fmt.Sprintf("%d", int(retryAfter.Seconds())))
			}

			return ctx.JSON(http.StatusTooManyRequests, map[string]interface{}{
				"error":       reason,
				"retry_after": int(retryAfter.Seconds()),
			})
		}
	}

	if username != "" && password != "" {
		// Create session to validate credentials and check 2FA status
		s, err := ctx.Server.Sessions.Put(username, password)
		loginSuccess := err == nil

		// Record login attempt for rate limiting (must happen regardless of success/failure)
		if ctx.Server.RateLimiter != nil {
			ctx.Server.RateLimiter.RecordLoginAttempt(ctx.Request, username, loginSuccess)
		}

		if err != nil {
			if _, ok := err.(alps.AuthError); ok {
				return ctx.JSON(http.StatusUnauthorized, map[string]interface{}{"error": "Failed to login"})
			}
			return fmt.Errorf("failed to put connection in pool: %v", err)
		}

		// The second factor is asked for when the account has one, unless the
		// token that restored the session says it was given.
		if restoredFromToken {
			s.SetAuthenticated2FA(tokenVerified2FA)
		}
		enabled := s.Requires2FA() && !s.IsAuthenticated2FA()
		if enabled {
			// 2FA required - store temporary session token and redirect to WebAuthn verification
			ctx.SetCookie(&http.Cookie{
				Name:     "alps_2fa_pending",
				Value:    s.Token(),
				Path:     "/",
				HttpOnly: true,
				SameSite: http.SameSiteStrictMode,
				Secure:   ctx.IsEffectiveHTTPS(),
				MaxAge:   300, // 5 minutes
			})

			// Store remember preference for after verification
			if remember == "on" {
				ctx.SetCookie(&http.Cookie{
					Name:     "alps_2fa_remember",
					Value:    "true",
					Path:     "/",
					HttpOnly: true,
					SameSite: http.SameSiteStrictMode,
					Secure:   ctx.IsEffectiveHTTPS(),
					MaxAge:   300, // 5 minutes
				})
			}

			// Store credentials temporarily in session memory for login token creation after 2FA verification
			// This enables session restoration after server restart for 2FA users
			// Using session memory instead of IMAP METADATA to avoid logging passwords
			s.SetData("2fa_login_credentials", map[string]string{
				"username": username,
				"password": password,
			})

			return ctx.JSON(http.StatusOK, map[string]interface{}{"requires_2fa": true})
		}

		// No 2FA - proceed with normal login
		// Always create encrypted login token to enable session restoration after server restart
		// The token says whether 2FA was done. It used to say yes here, and
		// restored a session past a second factor turned on later.
		persistent := remember == "on"
		ctx.SetLoginToken(username, password, s.IsAuthenticated2FA(), persistent)

		// Set session cookie: persistent if "remember me" checked, browser session otherwise
		ctx.SetSessionWithExpiry(s, persistent)

		return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
	}

	return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Missing credentials"})
}

func handleLogout(ctx *alps.Context) error {
	if ctx.Session != nil {
		ctx.Session.Close()
		ctx.SetSession(nil)
	}
	ctx.SetLoginToken("", "", false, false)
	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}

func handleGetThread(ctx *alps.Context) error {
	mboxName, uidStr, err := parseMboxAndUidStr(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return err
	}

	var msgs []IMAPMessage
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		uid, parseErr := p.ParseMessageID(uidStr)
		if parseErr != nil {
			return parseErr
		}

		threadMsgs, threadErr := getConversationWithProvider(p, mboxName, uid, ctx.Server.Logger().Printf)
		if threadErr != nil {
			return threadErr
		}
		msgs = threadMsgs
		return nil
	})
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"Messages": msgs,
	})
}

func handleGetPart(ctx *alps.Context, raw bool) error {
	_, uidStr, err := parseMboxAndUidStr(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return err
	}
	ibase, err := getBaseMailboxData(ctx)
	if err != nil {
		return err
	}
	mbox := ibase.Mailbox
	if mbox == nil {
		return alps.NewHTTPError(http.StatusNotFound, "Mailbox not found")
	}

	settings, err := readSettings(ctx)
	if err != nil {
		return err
	}

	partPathParam := ctx.QueryParam("part")
	partPath, err := parsePartPath(partPathParam)
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	// We need to briefly fetch the message structure to see what parts are available
	var tempMsg *IMAPMessage
	var uid provider.MessageID

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		var parseErr error
		uid, parseErr = p.ParseMessageID(uidStr)
		if parseErr != nil {
			return parseErr
		}

		// If no part specified and not raw, determine preferred part
		if partPathParam == "" && !raw {
			tempMsg, parseErr = getMessageMetadataWithProvider(p, mbox.Name(), uid)
			return parseErr
		}
		return nil
	})
	if err != nil {
		return err
	}

	if partPathParam == "" && !raw {
		// Determine preference: user setting overrides system default (true for HTML)
		preferHTML := true
		if settings.PreferredView != "" {
			preferHTML = (settings.PreferredView == "html")
		}

		viewParam := ctx.QueryParam("view")
		if viewParam == "html" {
			preferHTML = true
		} else if viewParam == "text" {
			preferHTML = false
		}

		// Select the preferred part
		var preferredPart *IMAPPartNode
		if preferHTML {
			preferredPart = tempMsg.HTMLPart()
			if preferredPart == nil {
				preferredPart = tempMsg.TextPart()
			}
		} else {
			preferredPart = tempMsg.TextPart()
			if preferredPart == nil {
				preferredPart = tempMsg.HTMLPart()
			}
		}

		// Use the preferred part path
		if preferredPart != nil {
			partPath = preferredPart.Path
		}
	}

	var msg *IMAPMessage
	var headerData, bodyData []byte

	limitStr := ctx.QueryParam("limit")
	var limit int64
	if limitStr != "" {
		parsedLimit, err := strconv.ParseInt(limitStr, 10, 64)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// Build cache key for individual message (without allow-remote-resources since it doesn't affect IMAP data)
	partPathStr := fmt.Sprintf("%v", partPath)
	msgCacheKey := fmt.Sprintf("message:%s:%s:%s:limit%d", mbox.Name(), uid.String(), partPathStr, limit)

	// Try to get message from cache
	if cached, ok := ctx.Session.Cache().Get(msgCacheKey); ok {
		cachedData := cached.(CachedMessagePart)

		// Check if we have the body data
		if cachedData.HeaderData != nil && cachedData.BodyData != nil {
			// Full message cached - convert from provider type to IMAP type
			imapMsg := providerMessageToIMAP(*cachedData.Message)
			if tempMsg != nil {
				imapMsg.HasBimiPotential = tempMsg.HasBimiPotential
				imapMsg.HasBimiFailed = tempMsg.HasBimiFailed
				if len(imapMsg.References) == 0 && len(tempMsg.References) > 0 {
					imapMsg.References = tempMsg.References
				}
			}
			msg = &imapMsg
			headerData = cachedData.HeaderData
			bodyData = cachedData.BodyData

			ctx.Server.Logger().Debugf("Cache HIT (full) for message %s/%v part %v", mbox.Name(), uid, partPath)
		} else {
			// Only metadata cached, need to fetch body
			var providerMsg *provider.Message
			err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
				var err error
				if raw {
					// For raw mode, don't parse - just get bytes
					providerMsg, headerData, bodyData, err = p.GetMessagePartRaw(mbox.Name(), uid, partPath, limit)
				} else {
					// For normal mode, parse the message
					providerMsg, _, headerData, bodyData, err = p.GetMessagePartWithData(mbox.Name(), uid, partPath)
					if err != nil {
						return err
					}

				}
				if err != nil {
					return err
				}

				// Update cache with body data using provider type
				ctx.Session.Cache().Set(msgCacheKey, CachedMessagePart{
					Message:    providerMsg,
					HeaderData: headerData,
					BodyData:   bodyData,
					Mailbox:    mbox.Name(),
				})
				ctx.Server.Logger().Debugf("Cache HIT (metadata only), fetched body for message %s/%s part %v", mbox.Name(), uid.String(), partPath)
				return nil
			})
			if err != nil {
				return err
			}

			// Convert provider message to IMAP message for display
			imapMsg := providerMessageToIMAP(*providerMsg)
			if tempMsg != nil {
				imapMsg.HasBimiPotential = tempMsg.HasBimiPotential
				imapMsg.HasBimiFailed = tempMsg.HasBimiFailed
				if len(imapMsg.References) == 0 && len(tempMsg.References) > 0 {
					imapMsg.References = tempMsg.References
				}
			}
			msg = &imapMsg

			// Fetching body without Peek marks message as \Seen, so update the cached flags
			updateCachedMessageFlags(ctx, mbox.Name(), uid, []imap.Flag{imap.FlagSeen}, nil)
		}
	} else {
		// Nothing cached, fetch everything
		var providerMsg *provider.Message
		err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			var err error
			if raw {
				// For raw mode, don't parse - just get bytes
				providerMsg, headerData, bodyData, err = p.GetMessagePartRaw(mbox.Name(), uid, partPath, limit)
			} else {
				// For normal mode, parse the message
				providerMsg, _, headerData, bodyData, err = p.GetMessagePartWithData(mbox.Name(), uid, partPath)
				if err != nil {
					return err
				}

			}
			if err != nil {
				return err
			}

			if tempMsg != nil {
				providerMsg.BimiPotential = tempMsg.HasBimiPotential
				providerMsg.BimiFailed = tempMsg.HasBimiFailed
				if len(providerMsg.References) == 0 && len(tempMsg.References) > 0 {
					providerMsg.References = tempMsg.References
				}
			}

			// Cache the raw bytes using provider type so we can recreate fresh readers
			ctx.Session.Cache().Set(msgCacheKey, CachedMessagePart{
				Message:    providerMsg,
				HeaderData: headerData,
				BodyData:   bodyData,
				Mailbox:    mbox.Name(),
			})
			ctx.Server.Logger().Debugf("Cache MISS for message %s/%s part %v, fetched and cached", mbox.Name(), uid.String(), partPath)
			return nil
		})
		if err != nil {
			return err
		}

		// Convert provider message to IMAP message for display
		imapMsg := providerMessageToIMAP(*providerMsg)
		if tempMsg != nil {
			ctx.Server.Logger().Debugf("BIMI debug routes: tempMsg.HasBimiPotential=%v for UID %v", tempMsg.HasBimiPotential, uid)
			imapMsg.HasBimiPotential = tempMsg.HasBimiPotential
			imapMsg.HasBimiFailed = tempMsg.HasBimiFailed
			if len(imapMsg.References) == 0 && len(tempMsg.References) > 0 {
				imapMsg.References = tempMsg.References
			}
		}
		msg = &imapMsg

		// Fetching body without Peek marks message as \Seen, so update the cached flags
		updateCachedMessageFlags(ctx, mbox.Name(), uid, []imap.Flag{imap.FlagSeen}, nil)
	}

	// Note: We no longer need selected mailbox info from IMAP
	// The provider abstraction doesn't expose this, and we use standard flags below

	if raw {
		// For raw mode, work directly with headerData and bodyData bytes
		// Parse the MIME header
		h, err := textproto.ReadHeader(bufio.NewReader(bytes.NewReader(headerData)))
		if err != nil {
			return fmt.Errorf("failed to read part header: %v", err)
		}

		if len(partPath) == 0 {
			// Full message download — serve as RFC822 (.eml)
			mimeType := "message/rfc822"
			if ctx.QueryParam("plain") == "1" {
				mimeType = "text/plain"
			}
			subject := msg.Envelope.Subject
			if subject == "" {
				subject = fmt.Sprintf("message_%s", msg.AlpsUID)
			}
			cleanSubject := strings.Map(func(r rune) rune {
				if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' || r == '.' {
					return r
				}
				return '_'
			}, subject)
			for strings.Contains(cleanSubject, "__") {
				cleanSubject = strings.ReplaceAll(cleanSubject, "__", "_")
			}
			cleanSubject = strings.Trim(cleanSubject, "_")
			if len(cleanSubject) > 100 {
				cleanSubject = cleanSubject[:100]
			}
			if cleanSubject == "" {
				cleanSubject = "message"
			}
			filename := cleanSubject + ".eml"

			ctx.Response.Header().Set("Content-Type", mimeType)
			ctx.Response.Header().Set("Content-Length", fmt.Sprintf("%d", len(headerData)+len(bodyData)))

			dispParams := map[string]string{"filename": filename}
			ctx.Response.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", dispParams))

			ctx.Response.WriteHeader(http.StatusOK)
			if _, err := ctx.Response.Write(headerData); err != nil {
				return err
			}
			_, err := ctx.Response.Write(bodyData)
			return err
		}

		// Specific part download — decode Content-Transfer-Encoding and
		// serve only the decoded body (not the MIME headers).
		msgHeader := message.Header{Header: h}
		entity, err := message.New(msgHeader, bytes.NewReader(bodyData))
		if err != nil {
			return fmt.Errorf("failed to create message reader: %v", err)
		}

		decodedBody, err := io.ReadAll(entity.Body)
		if err != nil {
			return fmt.Errorf("failed to decode message body: %v", err)
		}

		mimeType, _, _ := msgHeader.ContentType()
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
		ctx.Response.Header().Set("Content-Type", mimeType)
		ctx.Response.Header().Set("Content-Length", fmt.Sprintf("%d", len(decodedBody)))

		// Get filename from Content-Disposition or Content-Type params
		disp, dispParams, _ := msgHeader.ContentDisposition()
		filename := dispParams["filename"]
		if filename == "" {
			_, ctParams, _ := msgHeader.ContentType()
			filename = ctParams["name"]
		}

		// Serve as attachment download (be careful not to serve text/html inline)
		if !strings.HasPrefix(strings.ToLower(mimeType), "text/plain") || strings.EqualFold(disp, "attachment") {
			attParams := make(map[string]string)
			if filename != "" {
				attParams["filename"] = filename
			}
			ctx.Response.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", attParams))
		}

		ctx.Response.WriteHeader(http.StatusOK)
		_, err = ctx.Response.Write(decodedBody)
		return err
	}

	// Use standard IMAP flags
	standardFlags := []imap.Flag{
		imap.FlagSeen,
		imap.FlagAnswered,
		imap.FlagFlagged,
		imap.FlagDeleted,
		imap.FlagDraft,
	}
	flags := make(map[imap.Flag]bool)
	for _, f := range standardFlags {
		flags[f] = msg.HasFlag(f)
	}
	partNode := msg.PartByPath(partPath)
	if partNode != nil && !partNode.IsText() {
		partNode = nil
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"Mailboxes": ibase.Mailboxes,
		"Mailbox":   ibase.Mailbox,
		"Inbox":     ibase.Inbox,
		"Message":   msg,
		"Part":      partNode,

		"Flags":       flags,
		"Attachments": msg.Attachments(),
		"HasHTML":     msg.HTMLPart() != nil,
		"HasText":     func() bool { tp := msg.TextPart(); return tp != nil && strings.EqualFold(tp.MIMEType, "text/plain") }(),
	})
}

type messagePath struct {
	Mailbox string
	Uid     string
}

// The largest body POST /messages will read. Attachments do not travel in it —
// they are uploaded separately to /attachments and referenced here by UUID — so
// this bounds message text, HTML and headers, where 32 MiB is already far more
// than any real message. The number matches the one Context.FormParams passes to
// ParseMultipartForm, which is an in-MEMORY threshold rather than a limit: above
// it Go streams to a temp file and keeps going, so without this the intent
// expressed there was not actually enforced anywhere.
const maxComposeBodyBytes = 32 << 20

func handleComposeNew(ctx *alps.Context) error {
	// Before the first FormValue, which is what triggers parsing.
	ctx.Request.Body = http.MaxBytesReader(ctx.Response, ctx.Request.Body, maxComposeBodyBytes)

	saveAsDraft := ctx.FormValue("save_as_draft") != ""

	fromAddr := ctx.FormValue("from")
	if fromAddr == "" {
		fromAddr = ctx.Session.Username()
		if settings, err := readSettings(ctx); err == nil && settings.From != "" {
			fromAddr = fmt.Sprintf("%s <%s>", settings.From, ctx.Session.Username())
		}
	}

	msg := &OutgoingMessage{
		From:       fromAddr,
		To:         parseAddressList(ctx.FormValue("to")),
		Cc:         parseAddressList(ctx.FormValue("cc")),
		Bcc:        parseAddressList(ctx.FormValue("bcc")),
		Subject:    ctx.FormValue("subject"),
		Text:       ctx.FormValue("text"),
		HTML:       ctx.FormValue("html"),
		InReplyTo:  ctx.FormValue("in_reply_to"),
		References: ctx.FormValue("references"),
		ReplyTo:    ctx.FormValue("reply_to"),
		MessageID:  ctx.FormValue("message_id"),
	}

	if msg.MessageID == "" {
		var hdr mail.Header
		hdr.GenerateMessageID()
		mid, _ := hdr.MessageID()
		msg.MessageID = "<" + mid + ">"
	}

	uuids := ctx.FormValue("attachment-uuids")
	for _, uuid := range strings.Split(uuids, ",") {
		uuid = strings.TrimSpace(uuid)
		if uuid == "" {
			continue
		}

		attachment := ctx.Session.PopAttachment(uuid)
		if attachment == nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "unable to retrieve message attachment " + uuid})
		}
		msg.Attachments = append(msg.Attachments, &formAttachment{attachment.File})
		defer attachment.Form.RemoveAll()
	}

	var draftPath *messagePath
	if draftMbox := ctx.FormValue("draft_mailbox"); draftMbox != "" {
		if draftUidStr := ctx.FormValue("draft_uid"); draftUidStr != "" {
			draftPath = &messagePath{Mailbox: draftMbox, Uid: draftUidStr}
		}
	}

	var inReplyToPath *messagePath
	if replyMbox := ctx.FormValue("reply_mailbox"); replyMbox != "" {
		if replyUidStr := ctx.FormValue("reply_uid"); replyUidStr != "" {
			inReplyToPath = &messagePath{Mailbox: replyMbox, Uid: replyUidStr}
		}
	}

	// The message a reply or forward quotes, whose parts it carries. A forward
	// answers nothing, so without this its parts had nowhere to come from and
	// were dropped without a word: the chips on screen, the file not sent.
	var quotedPath *messagePath
	if sourceMbox := ctx.FormValue("source_mailbox"); sourceMbox != "" {
		if sourceUidStr := ctx.FormValue("source_uid"); sourceUidStr != "" {
			quotedPath = &messagePath{Mailbox: sourceMbox, Uid: sourceUidStr}
		}
	}

	prevAttachmentsRaw := ctx.FormValue("prev_attachments")
	var prevAttachments []string
	for _, p := range strings.Split(prevAttachmentsRaw, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			prevAttachments = append(prevAttachments, p)
		}
	}

	if len(prevAttachments) > 0 {
		// A saved draft holds every part the composer carries, renumbered, so
		// once there is one the parts are read from it.
		var sourcePath *messagePath
		switch {
		case draftPath != nil:
			sourcePath = draftPath
		case quotedPath != nil:
			sourcePath = quotedPath
		case inReplyToPath != nil:
			sourcePath = inReplyToPath
		}
		if sourcePath == nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "attachments name a message part, but no message to take it from"})
		}

		err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			for _, pathStr := range prevAttachments {
				partPath, err := parsePartPath(pathStr)
				if err != nil {
					return fmt.Errorf("invalid part path: %v", err)
				}
				parsedUid, err := p.ParseMessageID(sourcePath.Uid)
				if err != nil {
					return fmt.Errorf("invalid UID: %v", err)
				}
				_, entity, _, _, err := p.GetMessagePartWithData(sourcePath.Mailbox, parsedUid, partPath)
				if err != nil {
					return fmt.Errorf("failed to fetch attachment %s: %v", pathStr, err)
				}

				mimeType, _, _ := entity.Header.ContentType()
				disposition, dispParams, _ := entity.Header.ContentDisposition()
				filename := dispParams["filename"]
				if filename == "" {
					_, ctParams, _ := entity.Header.ContentType()
					filename = ctParams["name"]
				}
				if mimeType == "" {
					mimeType = "application/octet-stream"
				}
				contentID := strings.Trim(strings.TrimSpace(entity.Header.Get("Content-Id")), "<>")

				// We have to decode Content-Transfer-Encoding for the bodyData.
				// wait, entity.Body is an io.Reader that is ALREADY decoded!
				// We can just read from entity.Body!
				decodedBody, err := io.ReadAll(entity.Body)
				if err != nil {
					return fmt.Errorf("failed to decode attachment body: %v", err)
				}

				node := &IMAPPartNode{
					Path:     partPath,
					MIMEType: mimeType,
					Filename: filename,
				}
				msg.Attachments = append(msg.Attachments, &imapAttachment{
					Mailbox: sourcePath.Mailbox,
					Uid:     sourcePath.Uid,
					Node:    node,
					Body:    decodedBody,
					CID:     contentID,
					// A part with a Content-ID belongs to the body unless it says
					// it is an attachment; an image in multipart/related often
					// gives no disposition at all.
					Inline: contentID != "" && !strings.EqualFold(disposition, "attachment"),
				})
			}
			return nil
		})
		if err != nil {
			return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to fetch previous attachments: " + err.Error()})
		}
	}

	if saveAsDraft {
		var drafts *MailboxInfo
		var uid provider.MessageID
		var size uint32
		var respAttachments []map[string]interface{}

		err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			var err error
			drafts, uid, size, err = appendMessageWithProvider(p, msg, provider.MailboxTypeDrafts)
			if err != nil {
				return err
			}

			// Fetch the new attachments to get updated part paths BEFORE deleting the old draft!
			// This prevents IMAP EXPUNGE race conditions where the newly appended message might temporarily
			// be invisible to FETCH commands immediately following an EXPUNGE.
			newMsg, err := p.GetMessageMetadata(drafts.Name(), uid)
			if err != nil {
				ctx.Server.Logger().Errorf("Failed to fetch new attachments for draft %v: %v", uid, err)
			} else if newMsg != nil {
				msgIMAP := providerMessageToIMAP(*newMsg)
				for _, a := range msgIMAP.Attachments() {
					respAttachments = append(respAttachments, map[string]interface{}{
						"name":     a.Filename,
						"size":     a.Size,
						"type":     a.MIMEType,
						"partPath": formatPartPath(a.Path),
					})
				}
				// The body's images too, marked inline: the composer replaces
				// what it carries with this list, and left out they were not
				// carried by the next save or by the send.
				for _, a := range msgIMAP.EmbeddedParts() {
					respAttachments = append(respAttachments, map[string]interface{}{
						"name":     a.Filename,
						"size":     a.Size,
						"type":     a.MIMEType,
						"partPath": formatPartPath(a.Path),
						"inline":   true,
					})
				}
			}

			if draftPath != nil {
				parsedDraftUid, err := p.ParseMessageID(draftPath.Uid)
				if err != nil {
					return err
				}
				if err := deleteMessagesWithProvider(p, draftPath.Mailbox, []provider.MessageID{parsedDraftUid}); err != nil {
					return err
				}
			}

			return nil
		})
		if err != nil {
			return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		mailboxesToInvalidate := []string{drafts.Name()}
		if draftPath != nil && draftPath.Mailbox != drafts.Name() {
			mailboxesToInvalidate = append(mailboxesToInvalidate, draftPath.Mailbox)
		}
		invalidateMailboxCache(ctx, mailboxesToInvalidate...)

		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"ok":            true,
			"draft_uid":     uid.String(),
			"draft_mailbox": drafts.Name(),
			"draft_size":    size,
			"attachments":   respAttachments,
		})
	}

	err := ctx.Session.DoSMTP(func(c *smtp.Client) error {
		return sendMessage(c, msg)
	})
	if err != nil {
		if _, ok := err.(alps.AuthError); ok {
			return ctx.JSON(http.StatusForbidden, map[string]string{"error": "Forbidden"})
		}
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to send message: " + err.Error()})
	}

	answered := false
	if inReplyToPath != nil {
		err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			parsedReplyUid, err := p.ParseMessageID(inReplyToPath.Uid)
			if err != nil {
				return err
			}
			return markMessageAnsweredWithProvider(p, inReplyToPath.Mailbox, parsedReplyUid)
		})
		if err != nil {
			// The reply is sent; the mark is only a mark.
			ctx.Server.Logger().Printf("marking %s/%s answered failed: %v", inReplyToPath.Mailbox, inReplyToPath.Uid, err)
		}
		answered = err == nil
	}

	var sentName string
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		sent, _, _, err := appendMessageWithProvider(p, msg, provider.MailboxTypeSent)
		if err != nil {
			return err
		}
		sentName = sent.Name()
		if draftPath != nil {
			parsedDraftUid, err := p.ParseMessageID(draftPath.Uid)
			if err != nil {
				return err
			}
			if err := deleteMessagesWithProvider(p, draftPath.Mailbox, []provider.MessageID{parsedDraftUid}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to save message to Sent mailbox: " + err.Error()})
	}

	// The account's own Sent, which is not always named so, and the answered
	// message's mailbox, whose cached pages would still show it unanswered.
	mailboxesToInvalidate := []string{sentName}
	if draftPath != nil {
		mailboxesToInvalidate = append(mailboxesToInvalidate, draftPath.Mailbox)
	}
	if answered {
		mailboxesToInvalidate = append(mailboxesToInvalidate, inReplyToPath.Mailbox)
	}
	invalidateMailboxCache(ctx, mailboxesToInvalidate...)

	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}

func handleComposeAttachment(ctx *alps.Context) error {
	// Bound the REQUEST, not just what we keep.
	//
	// ReadForm's argument is the in-memory threshold, not a limit: everything
	// above 32 KiB streams to a temp file, with no ceiling. PutAttachment then
	// checks the per-composer, per-session and global budgets — but by then the
	// bytes are already on the server's disk, and only `form.RemoveAll()` takes
	// them off again. So an authenticated user could write an arbitrarily large
	// body into the temp directory before anything refused it, and several
	// concurrent uploads multiplied that: the limits this server advertises
	// governed retention and not intake.
	//
	// The cap is the per-composer budget plus a MiB of slack for multipart
	// framing and field names, since one request can legitimately carry several
	// files for a composer that is still empty. MaxBytesReader makes the read
	// itself fail once the body passes it.
	limit := ctx.Server.Sessions.MaxAttachmentSize() + (1 << 20)
	ctx.Request.Body = http.MaxBytesReader(ctx.Response, ctx.Request.Body, limit)

	reader, err := ctx.Request.MultipartReader()
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request",
		})
	}
	form, err := reader.ReadForm(32 << 10) // 32 KB - force attachments to temp dir on disk
	if err != nil {
		// A body over the cap lands here, as does a malformed one. The former is
		// the user's attachments being too large, which is what the client's own
		// over-budget message says, so answer with the size status rather than a
		// generic 400.
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			return ctx.JSON(http.StatusRequestEntityTooLarge, map[string]string{
				"error": "Your attachments exceed the maximum file size. Remove some and try again.",
			})
		}
		return ctx.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request",
		})
	}

	composerID := ctx.QueryParam("composer_id")

	var uuids []string
	for _, fh := range form.File["attachments"] {
		uuid, err := ctx.Session.PutAttachment(composerID, fh, form)
		if err == alps.ErrAttachmentCacheSize {
			form.RemoveAll()
			return ctx.JSON(http.StatusBadRequest, map[string]string{
				"error": "Your attachments exceed the maximum file size. Remove some and try again.",
			})
		} else if err != nil {
			form.RemoveAll()
			ctx.Logger().Printf("PutAttachment: %v\n", err)
			return ctx.JSON(http.StatusBadRequest, map[string]string{
				"error": "failed to store attachment",
			})
		}
		uuids = append(uuids, uuid)
	}

	return ctx.JSON(http.StatusOK, &uuids)
}

func handleCancelAttachment(ctx *alps.Context) error {
	uuid := ctx.Param("uuid")
	a := ctx.Session.PopAttachment(uuid)
	if a != nil {
		a.Form.RemoveAll()
	}
	return ctx.JSON(http.StatusOK, nil)
}

// allMailboxes is the name a search across every folder is viewed under. It
// is not a folder.
const allMailboxes = "*"

// refuseAllMailboxes answers a write addressed to allMailboxes. The write names
// its messages by UID, and a UID means nothing outside its own folder. Passed
// on, it reached the mail server as SELECT "*": an error on most servers, and on
// one that allows a folder called "*", a write to that folder's messages that
// happen to carry the same UIDs. The frontend writes to each message's own
// folder instead.
func refuseAllMailboxes(ctx *alps.Context) error {
	return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "not_a_folder"})
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
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}
	if mboxName == allMailboxes {
		return refuseAllMailboxes(ctx)
	}

	var uids []string
	var to string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Uids []string `json:"uids"`
			To   string   `json:"to"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		uids = req.Uids
		to = req.To
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		uids = formParams["uids"]
		to = formOrQueryParam(ctx, "to")
	}

	if len(uids) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "No messages selected."})
	}

	if to == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing 'to' parameter")
	}

	uidMapping := make(map[string]string)
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		alpsMsgIDs := make([]provider.MessageID, len(uids))
		for i, uidStr := range uids {
			uid, err := p.ParseMessageID(uidStr)
			if err != nil {
				return err
			}
			alpsMsgIDs[i] = uid
		}
		// Move messages in bulk
		mapping, err := moveMessagesWithProvider(p, mboxName, to, alpsMsgIDs)
		if err != nil {
			return fmt.Errorf("failed to move messages: %v", err)
		}
		for k, v := range mapping {
			uidMapping[k.String()] = v.String()
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Invalidate cache for affected mailboxes
	invalidateMailboxCache(ctx, mboxName, to)

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"ok":         true,
		"uidMapping": uidMapping,
	})
}

func handleCopy(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}
	if mboxName == allMailboxes {
		return refuseAllMailboxes(ctx)
	}

	var uids []string
	var to string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Uids []string `json:"uids"`
			To   string   `json:"to"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		uids = req.Uids
		to = req.To
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		uids = formParams["uids"]
		to = formOrQueryParam(ctx, "to")
	}

	if len(uids) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "No messages selected."})
	}

	if to == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing 'to' parameter")
	}

	uidMapping := make(map[string]string)
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		alpsMsgIDs := make([]provider.MessageID, len(uids))
		for i, uidStr := range uids {
			uid, err := p.ParseMessageID(uidStr)
			if err != nil {
				return err
			}
			alpsMsgIDs[i] = uid
		}
		// Copy messages in bulk
		mapping, err := copyMessagesWithProvider(p, mboxName, to, alpsMsgIDs)
		if err != nil {
			return fmt.Errorf("failed to copy messages: %v", err)
		}
		for k, v := range mapping {
			uidMapping[k.String()] = v.String()
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Invalidate cache for affected mailboxes
	invalidateMailboxCache(ctx, to)

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"ok":         true,
		"uidMapping": uidMapping,
	})
}

func handleDelete(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}
	if mboxName == allMailboxes {
		return refuseAllMailboxes(ctx)
	}

	var uids []string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Uids []string `json:"uids"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		uids = req.Uids
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		uids = formParams["uids"]
	}

	if len(uids) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "No messages selected."})
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		alpsMsgIDs := make([]provider.MessageID, len(uids))
		for i, uidStr := range uids {
			uid, err := p.ParseMessageID(uidStr)
			if err != nil {
				return err
			}
			alpsMsgIDs[i] = uid
		}
		// Delete messages in bulk
		if err := deleteMessagesWithProvider(p, mboxName, alpsMsgIDs); err != nil {
			return fmt.Errorf("failed to delete messages: %v", err)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Invalidate cache for the mailbox
	invalidateMailboxCache(ctx, mboxName)

	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

// mayEmptyMailbox reports whether name is a Trash or Junk mailbox, the only two
// this endpoint empties, and emptying is permanent.
//
// By special-use attribute first. The name fallback is for servers that
// advertise no roles, so it applies only to a role no mailbox has claimed: it
// used to accept any mailbox called trash, junk, spam or deleted items, so on a
// server whose \Trash is "Deleted Items" a user's own folder named "Trash" could
// be emptied. The frontend has offered Empty by role only since c5e0f81; this is
// the check that holds for a request that did not come from that button.
func mayEmptyMailbox(name string, mailboxes []provider.Mailbox) bool {
	trashClaimed, junkClaimed := false, false
	for _, mb := range mailboxes {
		for _, attr := range mb.Attributes {
			isTrash := strings.EqualFold(attr, string(imap.MailboxAttrTrash))
			isJunk := strings.EqualFold(attr, string(imap.MailboxAttrJunk))
			if mb.Name == name && (isTrash || isJunk) {
				return true
			}
			trashClaimed = trashClaimed || isTrash
			junkClaimed = junkClaimed || isJunk
		}
	}
	switch strings.ToLower(name) {
	case "trash", "deleted items":
		return !trashClaimed
	case "junk", "spam":
		return !junkClaimed
	}
	return false
}

func handleEmptyMailbox(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		// Security check: Only allow emptying Trash or Junk
		mailboxes, err := p.ListMailboxes()
		if err != nil {
			return fmt.Errorf("failed to list mailboxes for validation: %v", err)
		}

		if !mayEmptyMailbox(mboxName, mailboxes) {
			return errEmptyNotAllowed
		}

		return p.EmptyMailbox(mboxName)
	})
	if err != nil {
		// A refusal is the user asking for something this endpoint does not do,
		// not a server fault. It used to come back as a 500 whose body repeated
		// the internal message verbatim — the same shape the folder verbs were
		// corrected out of in 6cdf808.
		if errors.Is(err, errEmptyNotAllowed) {
			return ctx.JSON(http.StatusForbidden, map[string]string{"error": "not_discardable"})
		}
		return respondMailboxError(ctx, "empty mailbox", err)
	}

	// Invalidate cache for the mailbox
	invalidateMailboxCache(ctx, mboxName)

	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

func handleGetSession(ctx *alps.Context) error {
	passwordChangeEnabled := false
	enabledPlugins := ctx.Server.LoadedPluginNames()

	for _, name := range enabledPlugins {
		if name == "password" {
			passwordChangeEnabled = true
		}
	}

	maxAttachmentMiB := ctx.Server.Options.MaxAttachmentMiB
	if maxAttachmentMiB == 0 {
		maxAttachmentMiB = 32 // fallback to default
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"Username":              ctx.Session.Username(),
		"PasswordChangeEnabled": passwordChangeEnabled,
		"EnabledPlugins":        enabledPlugins,
		"MaxAttachmentMiB":      maxAttachmentMiB,
	})
}

func handleSetFlags(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}
	if mboxName == allMailboxes {
		return refuseAllMailboxes(ctx)
	}

	var uids []string
	var flags []string
	var actionStr string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Uids   []string `json:"uids"`
			Flags  []string `json:"flags"`
			Action string   `json:"action"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		uids = req.Uids
		flags = req.Flags
		actionStr = req.Action
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}

		uids = formParams["uids"]
		flags = formParams["flags"]
		if len(flags) == 0 {
			flagsStr := ctx.QueryParam("to")
			if flagsStr == "" {
				return alps.NewHTTPError(http.StatusBadRequest, "missing 'flags' parameter")
			}
			flags = strings.Fields(flagsStr)
		}

		actionStr = ctx.FormValue("action")
		if actionStr == "" {
			actionStr = ctx.QueryParam("action")
		}
	}

	if len(uids) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "No messages selected."})
	}

	var op imap.StoreFlagsOp
	switch actionStr {
	case "", "set":
		op = imap.StoreFlagsSet
	case "add":
		op = imap.StoreFlagsAdd
	case "remove":
		op = imap.StoreFlagsDel
	default:
		return alps.NewHTTPError(http.StatusBadRequest, "invalid 'action' value")
	}

	if len(uids) > maxFlagUIDs {
		// One STORE per gesture is the point of this endpoint, but an unbounded
		// list is a request the IMAP session may not survive — and the client
		// has no way to learn that from a timeout. Refuse with a number it can
		// chunk by; the frontend splits at the same constant.
		return ctx.JSON(http.StatusRequestEntityTooLarge, map[string]any{
			"error": "too_many_messages",
			"max":   maxFlagUIDs,
		})
	}

	// The whitelist governs CREATION, not removal.
	//
	// That is what the original comment on the default branch said — "restrict
	// creation of unsupported labels" — but the filter ran for every action,
	// removal included. So a message carrying a keyword this list does not know
	// (`Junk`, `NotJunk`, `$Phishing` — what other clients and spam filters
	// leave behind) could never have it taken off: the UI's "remove all tags"
	// sends exactly those, gathered by getRemovableTags, and they were dropped
	// on the floor. A mixed list was worse than useless, since the recognised
	// half succeeded and reported success for the whole request.
	//
	// Removing a keyword cannot create anything, so on a delete every
	// syntactically valid keyword is accepted.
	var l []imap.Flag
	var rejected []string
	for _, s := range flags {
		lower := strings.ToLower(s)
		switch lower {
		case strings.ToLower(string(imap.FlagSeen)),
			strings.ToLower(string(imap.FlagFlagged)),
			strings.ToLower(string(imap.FlagDraft)),
			strings.ToLower(string(imap.FlagDeleted)),
			strings.ToLower(string(imap.FlagAnswered)):
			l = append(l, imap.Flag(s))
		case "$label1", "$label2", "$label3", "$label4", "$label5":
			l = append(l, imap.Flag(lower)) // enforce lowercase for Thunderbird labels
		default:
			if op == imap.StoreFlagsDel && isValidIMAPKeyword(s) {
				l = append(l, imap.Flag(s))
				continue
			}
			rejected = append(rejected, s)
		}
	}

	// All or nothing on the recognised ones too. Filtering silently meant
	// "add $label1 and Junk" applied half the request and answered 200, so the
	// client had no way to learn that half of what it asked for did not happen.
	if len(rejected) > 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]any{
			"error":    "unsupported_flags",
			"rejected": rejected,
		})
	}

	// A request whose flags were ALL filtered out used to answer 200 OK.
	//
	// Nothing was written, and the client had just been told it succeeded — so
	// the UI kept whatever it painted optimistically until the next sync quietly
	// took it back, with no error anywhere in between. An unsupported keyword is
	// the caller's mistake and has to read as one.
	// Only reachable with an empty request now: anything unrecognised has
	// already been refused above.
	if len(l) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "missing_flags"})
	}

	// Convert IMAP flag op to alps flag op
	var alpsOp provider.FlagOp
	switch op {
	case imap.StoreFlagsSet:
		alpsOp = provider.FlagOpSet
	case imap.StoreFlagsAdd:
		alpsOp = provider.FlagOpAdd
	case imap.StoreFlagsDel:
		alpsOp = provider.FlagOpRemove
	}

	// Convert IMAP flags to alps flags
	alpsFlags := make([]provider.Flag, len(l))
	for i, f := range l {
		alpsFlags[i] = provider.Flag(f)
	}

	var alpsMsgIDs []provider.MessageID
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		alpsMsgIDs = make([]provider.MessageID, len(uids))
		for i, uidStr := range uids {
			uid, err := p.ParseMessageID(uidStr)
			if err != nil {
				return err
			}
			alpsMsgIDs[i] = uid
		}
		return setMessageFlagsWithProvider(p, mboxName, alpsMsgIDs, alpsOp, alpsFlags)
	})
	if err != nil {
		return err
	}

	// Update cached message flags instead of full invalidation
	for _, uid := range alpsMsgIDs {
		switch op {
		case imap.StoreFlagsAdd:
			updateCachedMessageFlags(ctx, mboxName, uid, l, nil)
		case imap.StoreFlagsDel:
			updateCachedMessageFlags(ctx, mboxName, uid, nil, l)
		default:
			// StoreFlagsSet is complex (replaces all flags), so invalidate
			invalidateMailboxCache(ctx, mboxName)
		}
	}

	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

// isValidIMAPKeyword reports whether s can be sent as an IMAP flag atom.
//
// Only consulted on removal, where the whitelist is deliberately not applied —
// but a keyword still travels into a STORE command, so anything carrying an
// atom-special or a control character is refused rather than escaped. RFC 3501
// ATOM-CHAR: printable ASCII minus (){ %*"\ and ].
// errEmptyNotAllowed marks the one refusal handleEmptyMailbox makes of its own
// accord, so the HTTP layer can answer 403 instead of relaying it as a 500.
var errEmptyNotAllowed = errors.New("emptying is only allowed for Trash and Junk mailboxes")

// isMoveIntoTrash reports whether `name` is the Trash mailbox or sits beneath
// it, with Trash identified by its \Trash special-use attribute and only
// falling back to the English name when the server advertises none.
func isMoveIntoTrash(p provider.MailProvider, name string) bool {
	mailboxes, err := p.ListMailboxes()
	if err != nil {
		// Unknown rather than false would be more honest, but the only
		// consequence of guessing wrong here is a missed unsubscribe, and the
		// English name is the best guess available.
		return strings.HasPrefix(strings.ToLower(name), "trash")
	}

	trash := ""
	for _, mb := range mailboxes {
		for _, attr := range mb.Attributes {
			if strings.EqualFold(attr, string(imap.MailboxAttrTrash)) {
				trash = mb.Name
				break
			}
		}
		if trash != "" {
			break
		}
	}
	if trash == "" {
		return strings.HasPrefix(strings.ToLower(name), "trash")
	}

	return isAtOrUnderMailbox(name, trash)
}

// isAtOrUnderMailbox reports whether `name` IS `parent` or sits beneath it.
//
// The child test requires a SEPARATOR after the prefix, so `Trashcan` does not
// count as being under `Trash` — the same prefix bug fixed on the frontend in
// abdc8bb. The IMAP hierarchy delimiter is per-mailbox (`.`, `/`, `[Gmail]/`),
// so rather than hardcode one, any non-alphanumeric character counts.
func isAtOrUnderMailbox(name, parent string) bool {
	if parent == "" || name == "" {
		return false
	}
	if strings.EqualFold(name, parent) {
		return true
	}
	if len(name) <= len(parent) || !strings.EqualFold(name[:len(parent)], parent) {
		return false
	}
	next := name[len(parent)]
	isAlnum := (next >= '0' && next <= '9') || (next >= 'A' && next <= 'Z') || (next >= 'a' && next <= 'z')
	return !isAlnum
}

func isValidIMAPKeyword(s string) bool {
	if s == "" || len(s) > 255 {
		return false
	}
	for _, r := range s {
		if r < 0x21 || r > 0x7e {
			return false
		}
		switch r {
		case '(', ')', '{', '}', '%', '*', '"', '\\', ']':
			return false
		}
	}
	return true
}

const settingsKey = "base.settings"
const maxMessagesPerPage = 100

// The largest UID list a single flag/delete/move/copy request may carry. The
// frontend chunks at the same number, so an ordinary selection is still one
// round trip and only a select-everything gesture is split.
const maxFlagUIDs = 500

type UIPreferences struct {
	ThemeMode          string   `json:"themeMode,omitempty"`
	ColorFamily        string   `json:"colorFamily,omitempty"`
	LayoutMode         string   `json:"layoutMode,omitempty"`
	DensityMode        string   `json:"densityMode,omitempty"`
	EnableThreading    *bool    `json:"enableThreading,omitempty"`
	ThemeIframeContent *bool    `json:"themeIframeContent,omitempty"`
	ShowSenderAvatars  *bool    `json:"showSenderAvatars,omitempty"`
	CustomMailboxOrder []string `json:"customMailboxOrder,omitempty"`
}

type Settings struct {
	MessagesPerPage int           `json:"messages_per_page,omitempty"`
	Signature       string        `json:"signature,omitempty"`
	From            string        `json:"from,omitempty"`
	PreferredView   string        `json:"preferred_view,omitempty"` // "html" or "text", defaults to "html"
	UI              UIPreferences `json:"ui,omitempty"`

	// General
	CheckMailInterval    int    `json:"check_mail_interval,omitempty"`
	AutoLogout           *int   `json:"auto_logout,omitempty"`
	DesktopNotifications bool   `json:"desktop_notifications"`
	SoundNotifications   bool   `json:"sound_notifications"`
	SortOrder            string `json:"sort_order,omitempty"`
	MessageSortCriteria  string `json:"message_sort_criteria,omitempty"`

	// Identity
	ReplyTo   string `json:"reply_to,omitempty"`
	BccMyself bool   `json:"bcc_myself"`

	// Reading & Composing
	MarkReadTimeout   int    `json:"mark_read_timeout,omitempty"`
	ShowRemoteContent string `json:"show_remote_content,omitempty"`
	ComposeFormat     string `json:"compose_format,omitempty"`
	UndoTimeout       int    `json:"undo_timeout,omitempty"`

	// Localization
	Language   string `json:"language,omitempty"`
	HourFormat string `json:"hour_format,omitempty"`
	DateFormat string `json:"date_format,omitempty"`
}

// errUnreadableSettings marks a saved settings record that does not decode.
var errUnreadableSettings = errors.New("the saved settings do not decode")

// loadSettings reads the account's settings over the defaults.
//
// A value of a type this version does not expect, as another version of alps
// may have written, keeps its default: encoding/json reads the rest, and the
// next save writes back a record this version can read. A record that does not
// decode at all is errUnreadableSettings, which readSettings removes.
func loadSettings(s provider.Store) (*Settings, error) {
	return loadSettingsWith(s.Get)
}

func loadSettingsWith(get func(key string, out interface{}) error) (*Settings, error) {
	autoLogoutDefault := 30
	settings := &Settings{
		MessagesPerPage:    50,
		PreferredView:      "html", // Default to HTML view
		AutoLogout:         &autoLogoutDefault,
		SoundNotifications: true,
	}
	err := get(settingsKey, settings)
	var typeErr *json.UnmarshalTypeError
	var syntaxErr *json.SyntaxError
	switch {
	case err == nil || err == provider.ErrNoStoreEntry:
	case errors.As(err, &typeErr) && typeErr.Field != "":
		// Read around the one value.
	case errors.As(err, &typeErr) || errors.As(err, &syntaxErr):
		return nil, fmt.Errorf("%w: %w", errUnreadableSettings, err)
	default:
		return nil, err
	}
	// Set default if empty
	if settings.PreferredView == "" {
		settings.PreferredView = "html"
	}
	if settings.ShowRemoteContent == "" {
		settings.ShowRemoteContent = "ask"
	}
	if settings.SortOrder == "" {
		settings.SortOrder = "desc"
	}
	if settings.MessageSortCriteria == "" {
		settings.MessageSortCriteria = "date"
	}
	if settings.UI.ThemeMode == "" {
		settings.UI.ThemeMode = "auto"
	}
	if settings.UI.ColorFamily == "" {
		settings.UI.ColorFamily = "default"
	}
	if settings.UI.LayoutMode == "" {
		settings.UI.LayoutMode = "vertical"
	}
	if settings.UI.DensityMode == "" {
		settings.UI.DensityMode = "compact"
	}
	if settings.UI.ThemeIframeContent == nil {
		falseVal := false
		settings.UI.ThemeIframeContent = &falseVal
	}
	if err := settings.check(); err != nil {
		return nil, err
	}
	return settings, nil
}

// readSettings is loadSettings for a request. A saved record that does not
// decode at all is removed, and the account starts again from the defaults:
// no version of alps can read it, and keeping it kept the account from ever
// saving its settings again.
func readSettings(ctx *alps.Context) (*Settings, error) {
	store := ctx.Session.Store()
	return settingsFrom(ctx, store, store.Get)
}

// readFreshSettings reads the record as the server holds it now. The settings
// page shows it, and saves a change by writing it back whole: from the
// session's copy, that showed a change made in another browser only once the
// session ended, and wrote the old values back over it.
func readFreshSettings(ctx *alps.Context) (*Settings, error) {
	store := ctx.Session.Store()
	return settingsFrom(ctx, store, func(key string, out interface{}) error {
		return provider.GetFresh(store, key, out)
	})
}

func settingsFrom(ctx *alps.Context, store provider.Store, get func(string, interface{}) error) (*Settings, error) {
	settings, err := loadSettingsWith(get)
	if !errors.Is(err, errUnreadableSettings) {
		return settings, err
	}
	if putErr := store.Put(settingsKey, nil); putErr != nil {
		return nil, fmt.Errorf("failed to remove unreadable settings: %v", putErr)
	}
	ctx.Server.Logger().Printf("Removed unreadable settings of %s: %v", ctx.Session.Username(), err)
	return loadSettings(noSettings{})
}

// noSettings is a store without a settings record, for the defaults.
type noSettings struct{}

func (noSettings) Get(string, interface{}) error { return provider.ErrNoStoreEntry }
func (noSettings) Put(string, interface{}) error { return errors.New("no store") }

func (s *Settings) check() error {
	if s.MessagesPerPage <= 0 || s.MessagesPerPage > maxMessagesPerPage {
		return fmt.Errorf("messages per page out of bounds: %v", s.MessagesPerPage)
	}
	if len(s.Signature) > 2048 {
		return fmt.Errorf("signature must be 2048 characters or fewer")
	}
	if len(s.From) > 512 {
		return fmt.Errorf("full name must be 512 characters or fewer")
	}
	if s.PreferredView != "" && s.PreferredView != "html" && s.PreferredView != "text" {
		return fmt.Errorf("preferred view must be 'html' or 'text'")
	}
	return nil
}

func handleSettings(ctx *alps.Context) error {
	settings, err := readFreshSettings(ctx)
	if err != nil {
		return fmt.Errorf("failed to load settings: %v", err)
	}

	if ctx.Request.Method == http.MethodPut {
		if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
			var req struct {
				MessagesPerPage *int           `json:"messages_per_page"`
				Signature       *string        `json:"signature"`
				From            *string        `json:"from"`
				PreferredView   *string        `json:"preferred_view"`
				UI              *UIPreferences `json:"ui"`

				CheckMailInterval    *int  `json:"check_mail_interval"`
				AutoLogout           *int  `json:"auto_logout"`
				DesktopNotifications *bool `json:"desktop_notifications"`
				SoundNotifications   *bool `json:"sound_notifications"`

				ReplyTo   *string `json:"reply_to"`
				BccMyself *bool   `json:"bcc_myself"`

				MarkReadTimeout   *int    `json:"mark_read_timeout"`
				ShowRemoteContent *string `json:"show_remote_content"`
				ComposeFormat     *string `json:"compose_format"`
				UndoTimeout       *int    `json:"undo_timeout"`

				Language            *string `json:"language"`
				HourFormat          *string `json:"hour_format"`
				DateFormat          *string `json:"date_format"`
				SortOrder           *string `json:"sort_order"`
				MessageSortCriteria *string `json:"message_sort_criteria"`
			}
			if err := ctx.BindJSON(&req); err != nil {
				return ctx.RespondBindError(err)
			}
			if req.MessagesPerPage != nil && *req.MessagesPerPage != 0 {
				settings.MessagesPerPage = *req.MessagesPerPage
			}
			if req.Signature != nil {
				settings.Signature = *req.Signature
			}
			if req.From != nil {
				settings.From = *req.From
			}
			if req.PreferredView != nil {
				settings.PreferredView = *req.PreferredView
			}
			if req.UI != nil {
				if req.UI.ThemeMode != "" {
					settings.UI.ThemeMode = req.UI.ThemeMode
				}
				if req.UI.ColorFamily != "" {
					settings.UI.ColorFamily = req.UI.ColorFamily
				}
				if req.UI.LayoutMode != "" {
					settings.UI.LayoutMode = req.UI.LayoutMode
				}
				if req.UI.DensityMode != "" {
					settings.UI.DensityMode = req.UI.DensityMode
				}
				if req.UI.EnableThreading != nil {
					settings.UI.EnableThreading = req.UI.EnableThreading
				}
				if req.UI.ThemeIframeContent != nil {
					settings.UI.ThemeIframeContent = req.UI.ThemeIframeContent
				}
				if req.UI.ShowSenderAvatars != nil {
					settings.UI.ShowSenderAvatars = req.UI.ShowSenderAvatars
				}
				if req.UI.CustomMailboxOrder != nil {
					settings.UI.CustomMailboxOrder = req.UI.CustomMailboxOrder
				}
			}

			// Merge new fields
			if req.CheckMailInterval != nil {
				settings.CheckMailInterval = *req.CheckMailInterval
			}
			if req.AutoLogout != nil {
				settings.AutoLogout = req.AutoLogout
				if ctx.Session != nil {
					newDuration := ctx.Server.Sessions.CalculateSessionDurationForVal(settings.AutoLogout)
					ctx.Session.UpdateDuration(newDuration)
				}
			}
			if req.DesktopNotifications != nil {
				settings.DesktopNotifications = *req.DesktopNotifications
			}
			if req.SoundNotifications != nil {
				settings.SoundNotifications = *req.SoundNotifications
			}
			if req.ReplyTo != nil {
				settings.ReplyTo = *req.ReplyTo
			}
			if req.BccMyself != nil {
				settings.BccMyself = *req.BccMyself
			}
			if req.MarkReadTimeout != nil {
				settings.MarkReadTimeout = *req.MarkReadTimeout
			}
			if req.ShowRemoteContent != nil {
				settings.ShowRemoteContent = *req.ShowRemoteContent
			}
			if req.ComposeFormat != nil {
				settings.ComposeFormat = *req.ComposeFormat
			}
			if req.UndoTimeout != nil {
				settings.UndoTimeout = *req.UndoTimeout
			}
			if req.Language != nil {
				settings.Language = *req.Language
			}
			if req.HourFormat != nil {
				settings.HourFormat = *req.HourFormat
			}
			if req.DateFormat != nil {
				settings.DateFormat = *req.DateFormat
			}
			if req.SortOrder != nil {
				settings.SortOrder = *req.SortOrder
			}
			if req.MessageSortCriteria != nil {
				settings.MessageSortCriteria = *req.MessageSortCriteria
			}
		} else {
			settings.MessagesPerPage, err = strconv.Atoi(ctx.FormValue("messages_per_page"))
			if err != nil {
				return alps.NewHTTPError(http.StatusBadRequest, "invalid messages per page: %v", err)
			}
			settings.Signature = ctx.FormValue("signature")
			settings.From = ctx.FormValue("from")
			settings.PreferredView = ctx.FormValue("preferred_view")
			if settings.PreferredView == "" {
				settings.PreferredView = "html"
			}
		}

		if settings.PreferredView == "" {
			settings.PreferredView = "html"
		}
		if settings.ShowRemoteContent == "" {
			settings.ShowRemoteContent = "ask"
		}

		if err := settings.check(); err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		if err := ctx.Session.Store().Put(settingsKey, settings); err != nil {
			return fmt.Errorf("failed to save settings: %v", err)
		}

		// Invalidate all message list caches since MessagesPerPage may have changed
		cache := ctx.Session.Cache()
		for _, key := range cache.GetKeysWithPrefix("messages:") {
			cache.Delete(key)
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
	}

	var mailboxes []MailboxInfo
	hasThreadCapability := false
	hasESearchCapability := false
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		mailboxes, err = listMailboxesWithProvider(p)
		if err != nil {
			return err
		}
		type threadCapable interface {
			HasThreadCapability() bool
		}
		if tc, ok := p.(threadCapable); ok {
			hasThreadCapability = tc.HasThreadCapability()
		}
		type esearchCapable interface {
			HasESearchCapability() bool
		}
		if ec, ok := p.(esearchCapable); ok {
			hasESearchCapability = ec.HasESearchCapability()
		}
		return nil
	})
	if err != nil {
		return err
	}

	if settings.UI.EnableThreading == nil {
		settings.UI.EnableThreading = &hasThreadCapability
	}

	maxAttachmentMiB := ctx.Server.Options.MaxAttachmentMiB
	if maxAttachmentMiB == 0 {
		maxAttachmentMiB = 32 // fallback to default
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"Settings":             settings,
		"Mailboxes":            mailboxes,
		"AutoLogout":           settings.AutoLogout,
		"MaxAttachmentMiB":     maxAttachmentMiB,
		"HasThreadCapability":  hasThreadCapability,
		"HasESearchCapability": hasESearchCapability,
	})
}

func handleSettingsAccounts(ctx *alps.Context) error {
	linkedAccounts, err := ctx.Session.GetLinkedAccounts()
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load linked accounts: " + err.Error()})
	}

	return ctx.JSON(http.StatusOK, linkedAccounts)
}

func handleAddAccount(ctx *alps.Context) error {
	username := ctx.FormValue("username")
	password := ctx.FormValue("password")
	displayName := ctx.FormValue("display_name")

	if username == "" || password == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Username and password are required"})
	}

	if ctx.Server.Options.LoginKey == nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Account linking requires login key to be configured"})
	}

	err := ctx.Session.AddLinkedAccount(username, password, displayName)
	if err != nil {
		errorMsg := fmt.Sprintf("Failed to add account: %v", err)
		if err == alps.ErrAccountAlreadyLinked {
			errorMsg = "This account is already linked"
		} else if err == alps.ErrCannotLinkSelf {
			errorMsg = "You cannot link your own account"
		} else if _, ok := err.(alps.AuthError); ok {
			errorMsg = "Authentication failed. Please check your credentials."
		}

		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": errorMsg})
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}

func handleRemoveAccount(ctx *alps.Context) error {
	username, err := url.PathUnescape(ctx.Param("id"))
	if err != nil || username == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "username required"})
	}

	err = ctx.Session.RemoveLinkedAccount(username)
	if errors.Is(err, alps.ErrReverseLinkNotCleared) {
		// The link IS gone from this account — reporting a failure would invite a
		// retry that cannot help. But this user's credential is still stored in
		// the other mailbox, and they are entitled to know that rather than be
		// told it all went fine.
		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"ok":      true,
			"warning": "reverse_link_not_cleared",
		})
	}
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": fmt.Sprintf("Failed to remove account: %v", err)})
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}

func handleSwitchAccount(ctx *alps.Context) error {
	if ctx.Request.Method != http.MethodPost {
		return alps.NewHTTPError(http.StatusMethodNotAllowed)
	}

	targetUsername := ctx.FormValue("username")
	if targetUsername == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "username required")
	}

	// Get password before switching (needed for login token and session creation)
	password, err := ctx.Session.GetLinkedAccountCredentials(targetUsername)
	if err != nil {
		return fmt.Errorf("failed to get credentials: %v", err)
	}

	// Switch to the linked account (creates new session)
	newSession, err := ctx.Server.Sessions.SwitchAccount(ctx.Session, targetUsername)
	if err != nil {
		return fmt.Errorf("failed to switch account: %v", err)
	}

	// Check if the target account has 2FA enabled
	has2FA := newSession.Requires2FA()

	// Check if we should skip 2FA for trusted linked accounts
	skipTwoFA := false
	if has2FA {
		trustLinked, err := newSession.TrustsLinkedAccounts()
		if err != nil {
			ctx.Server.Logger().Printf("Failed to check trust_linked_accounts for %s: %v", targetUsername, err)
			trustLinked = false
		}

		// Skip 2FA if:
		// 1. Target account trusts linked accounts
		// 2. Current session was authenticated with 2FA
		if trustLinked && ctx.Session.IsAuthenticated2FA() {
			skipTwoFA = true
			ctx.Server.Logger().Printf("Skipping 2FA for %s (trusted linked account, source authenticated)", targetUsername)
		}
	}

	if has2FA && !skipTwoFA {
		// 2FA required - set up pending session and redirect to WebAuthn verification
		ctx.SetCookie(&http.Cookie{
			Name:     "alps_2fa_pending",
			Value:    newSession.Token(),
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
			Secure:   ctx.IsEffectiveHTTPS(),
			MaxAge:   300, // 5 minutes
		})

		// Store credentials in session memory for login token creation after 2FA verification
		// Using session memory instead of IMAP METADATA to avoid logging passwords
		newSession.SetData("2fa_login_credentials", map[string]string{
			"username": targetUsername,
			"password": password,
		})

		// Close the old session
		ctx.Session.Close()

		// Clear the old session cookie so Auth middleware doesn't try to restore it
		ctx.SetCookie(&http.Cookie{
			Name:     "alps_session",
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			MaxAge:   -1,
		})

		// Don't set the session cookie yet - will be set after 2FA verification
		return ctx.JSON(http.StatusOK, map[string]interface{}{"requires_2fa": true})
	}

	// No 2FA (or trusted linked account) - complete the switch immediately
	// Close the old session
	ctx.Session.Close()

	// If we skipped 2FA due to trust, mark new session as 2FA authenticated
	if skipTwoFA {
		newSession.SetAuthenticated2FA(true)
	}

	// Set new session cookie
	ctx.SetSession(newSession)

	// Preserve persistence state from original login token
	origUsername, _, _, wasPersistent := ctx.GetLoginToken()

	// Update login token for new account, preserving persistence choice
	if origUsername != "" {
		ctx.SetLoginToken(targetUsername, password, newSession.IsAuthenticated2FA(), wasPersistent)
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}

func handleProxy(ctx *alps.Context) error {
	urlStr := ctx.QueryParam("url")
	if urlStr == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing url parameter")
	}

	u, err := url.Parse(urlStr)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		return alps.NewHTTPError(http.StatusBadRequest, "invalid url")
	}

	// Fetch through the egress-safe client: attacker-influenced URL, so block
	// internal/metadata addresses, bound with timeouts, and cap redirects.
	client := newSafeHTTPClient(20 * time.Second)
	resp, err := client.Get(u.String())
	if err != nil {
		return alps.NewHTTPError(http.StatusBadGateway, "failed to fetch resource")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return alps.NewHTTPError(http.StatusBadGateway, "failed to fetch resource")
	}

	mediaType, _, err := mime.ParseMediaType(resp.Header.Get("Content-Type"))
	if err != nil {
		mediaType = "application/octet-stream"
	}

	allowedPrefixes := []string{"image/", "font/", "text/css", "application/font", "application/x-font"}
	allowed := false
	for _, prefix := range allowedPrefixes {
		if strings.HasPrefix(mediaType, prefix) {
			allowed = true
			break
		}
	}
	if !allowed {
		return alps.NewHTTPError(http.StatusBadRequest, "invalid resource type")
	}

	maxSize := 5 * 1024 * 1024 // 5 MiB cap
	size, err := strconv.Atoi(resp.Header.Get("Content-Length"))
	if err == nil {
		if size > maxSize {
			return alps.NewHTTPError(http.StatusBadRequest, "resource too large")
		}
		ctx.Response.Header().Set("Content-Length", strconv.Itoa(size))
	}

	// The upstream body is untrusted. Proxied content is only ever consumed as a
	// subresource (img/link/font) from inside the sandboxed message iframe, so
	// prevent it from being rendered as an active document if fetched directly:
	// SVGs with inline scripts must not execute in this origin.
	ctx.Response.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox")
	ctx.Response.Header().Set("X-Content-Type-Options", "nosniff")
	ctx.Response.Header().Set("Content-Disposition", "attachment")

	lr := io.LimitedReader{R: resp.Body, N: int64(maxSize)}
	return ctx.Stream(http.StatusOK, mediaType, &lr)
}
