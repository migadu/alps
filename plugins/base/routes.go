package alpsbase

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/url"
	"strconv"
	"strings"

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
	p.POST("/settings/2fa/credential/{id}/delete", handleDisable)
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
func updateCachedMessageFlags(ctx *alps.Context, mailbox string, uid imap.UID, addFlags []imap.Flag, removeFlags []imap.Flag) {
	cache := ctx.Session.Cache()

	// Convert IMAP flags to alps flags
	alpsAddFlags := make([]provider.Flag, len(addFlags))
	for i, f := range addFlags {
		alpsAddFlags[i] = provider.Flag(f)
	}
	alpsRemoveFlags := make([]provider.Flag, len(removeFlags))
	for i, f := range removeFlags {
		alpsRemoveFlags[i] = provider.Flag(f)
	}

	// Helper function to update flags
	updateFlags := func(flags []provider.Flag) []provider.Flag {
		// Add new flags
		for _, flag := range alpsAddFlags {
			hasFlag := false
			for _, existing := range flags {
				if existing == flag {
					hasFlag = true
					break
				}
			}
			if !hasFlag {
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
	uidStr := strconv.FormatUint(uint64(uid), 10)

	messageUpdated := false
	for _, key := range keys {
		if cached, ok := cache.Get(key); ok {
			cachedData := cached.(CachedMessages)
			// Find and update the message in this page
			for i := range cachedData.Messages {
				if cachedData.Messages[i].ID.String() == uidStr {
					cachedData.Messages[i].Flags = updateFlags(cachedData.Messages[i].Flags)
					cache.Set(key, cachedData)
					messageUpdated = true
					ctx.Server.Logger().Debugf("Updated flags for message %s in cache key %s", uidStr, key)
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
			cachedPart.Message.Flags = updateFlags(cachedPart.Message.Flags)
			cache.Set(msgKey, cachedPart)
			ctx.Server.Logger().Debugf("Updated flags for message %s in individual cache", uidStr)
			messageUpdated = true
		}
	}

	if !messageUpdated {
		ctx.Server.Logger().Debugf("Message %d not found in cache, pages may need refresh", uid)
	}

	// Update mailbox status if we're changing the \Seen flag
	seenAdded := false
	seenRemoved := false
	for _, flag := range addFlags {
		if flag == imap.FlagSeen {
			seenAdded = true
			break
		}
	}
	for _, flag := range removeFlags {
		if flag == imap.FlagSeen {
			seenRemoved = true
			break
		}
	}

	if seenAdded || seenRemoved {
		statusKey := "status:" + mailbox
		if cached, ok := cache.Get(statusKey); ok {
			status := cached.(*MailboxStatus)
			if seenAdded && status.NumUnseen != nil && *status.NumUnseen > 0 {
				newCount := *status.NumUnseen - 1
				status.NumUnseen = &newCount
				cache.Set(statusKey, status)
				ctx.Server.Logger().Debugf("Decremented unseen count for %s to %d", mailbox, newCount)
			} else if seenRemoved && status.NumUnseen != nil {
				newCount := *status.NumUnseen + 1
				status.NumUnseen = &newCount
				cache.Set(statusKey, status)
				ctx.Server.Logger().Debugf("Incremented unseen count for %s to %d", mailbox, newCount)
			}
		}
	}
}

func getBaseMailboxData(ctx *alps.Context) (*BaseMailboxData, error) {

	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return nil, alps.NewHTTPError(http.StatusBadRequest, err)
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
						// Server doesn't support LIST-STATUS, need individual STATUS command
						status, err := getMailboxStatusWithProvider(p, mbox.Name())
						if err != nil {
							return err
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
	}
	if *mbox.NumUnseen > 0 {
		title = fmt.Sprintf("(%d) %s", *mbox.NumUnseen, title)
	}

	page := 0
	if pageStr := ctx.QueryParam("page"); pageStr != "" {
		var err error
		if page, err = strconv.Atoi(pageStr); err != nil || page < 0 {
			return alps.NewHTTPError(http.StatusBadRequest, "invalid page index")
		}
	}

	settings, err := loadSettings(ctx.Session.Store())
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
	msgCacheKey := fmt.Sprintf("messages:%s:page%d:perpage%d:query%s:sort%s:criteria%s", mbox.Name(), page, messagesPerPage, query, sortOrder, settings.MessageSortCriteria)

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

func handleNewMailbox(ctx *alps.Context) error {
	name := ctx.FormValue("name")
	if name == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Name is required"})
	}

	err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		return createMailboxWithProvider(p, name)
	})

	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	// Invalidate mailbox list cache
	invalidateMailboxCache(ctx)
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
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	// Invalidate mailbox list cache
	invalidateMailboxCache(ctx)
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
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
	}
	if req.NewName == "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "New name is required"})
	}

	isMoveToTrash := strings.HasPrefix(strings.ToLower(req.NewName), "trash")

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		if isMoveToTrash {
			_ = unsubscribeMailboxWithProvider(p, mboxName)
		}
		return renameMailboxWithProvider(p, mboxName, req.NewName)
	})
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	invalidateMailboxCache(ctx)
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
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
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
		ctx.Server.Logger().Errorf("IMAP unsubscribe failed for %s: %v", mboxName, err)
	}

	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	invalidateMailboxCache(ctx)
	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

// checkWebAuthnEnabled checks if a user has WebAuthn 2FA enabled
func checkWebAuthnEnabled(store provider.Store) (bool, error) {
	// Use a minimal struct that matches only the fields we need
	// This avoids importing the webauthn plugin types
	var data map[string]interface{}

	if err := store.Get("webauthn", &data); err != nil {
		if err == provider.ErrNoStoreEntry {
			return false, nil
		}
		return false, err
	}

	enabled, ok := data["enabled"].(bool)
	if !ok {
		return false, nil
	}

	if !enabled {
		return false, nil
	}

	credentials, ok := data["credentials"].([]interface{})
	if !ok {
		return false, nil
	}

	return len(credentials) > 0, nil
}

// checkTrustLinkedAccounts checks if a user has enabled "trust linked accounts" setting
func checkTrustLinkedAccounts(store provider.Store) (bool, error) {
	var data map[string]interface{}

	if err := store.Get("webauthn", &data); err != nil {
		if err == provider.ErrNoStoreEntry {
			return false, nil // Default: don't trust
		}
		return false, err
	}

	trust, ok := data["trust_linked_accounts"].(bool)
	if !ok {
		return false, nil // Default: don't trust
	}

	return trust, nil
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
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "invalid json"})
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
	if username == "" && password == "" {
		username, password, _ = ctx.GetLoginToken()
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

		// Check if WebAuthn 2FA is enabled for this user
		// Skip 2FA check if restoring from login token (token only exists after successful 2FA)
		enabled := false
		if !restoredFromToken {
			var err error
			enabled, err = checkWebAuthnEnabled(s.Store())
			if err != nil {
				ctx.Server.Logger().Printf("Failed to check WebAuthn status: %v", err)
				// Continue with normal login on error
				enabled = false
			}
		}
		if enabled {
			// 2FA required - store temporary session token and redirect to WebAuthn verification
			ctx.SetCookie(&http.Cookie{
				Name:     "alps_2fa_pending",
				Value:    s.Token(),
				Path:     "/",
				HttpOnly: true,
				SameSite: http.SameSiteStrictMode,
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
					MaxAge:   300, // 5 minutes
				})
			}

			// Store credentials temporarily for login token creation after 2FA verification
			// This enables session restoration after server restart for 2FA users
			if err := s.Store().Put("2fa_login_credentials", map[string]string{
				"username": username,
				"password": password,
			}); err != nil {
				ctx.Server.Logger().Printf("Failed to store 2FA login credentials: %v", err)
			}

			return ctx.JSON(http.StatusOK, map[string]interface{}{"requires_2fa": true})
		}

		// No 2FA - proceed with normal login
		// Always create encrypted login token to enable session restoration after server restart
		persistent := remember == "on"
		ctx.SetLoginToken(username, password, true, persistent)

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

func handleGetPart(ctx *alps.Context, raw bool) error {
	_, imapUID, err := parseMboxAndUid(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return err
	}
	uid := imapUIDFromIMAP(imapUID)
	ibase, err := getBaseMailboxData(ctx)
	if err != nil {
		return err
	}
	mbox := ibase.Mailbox
	if mbox == nil {
		return alps.NewHTTPError(http.StatusNotFound, "Mailbox not found")
	}

	settings, err := loadSettings(ctx.Session.Store())
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
	// If no part specified and not raw, determine preferred part
	if partPathParam == "" && !raw {
		err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			tempMsg, err = getMessageMetadataWithProvider(p, mbox.Name(), uid)
			return err
		})
		if err != nil {
			return err
		}

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
			msg = &imapMsg
			headerData = cachedData.HeaderData
			bodyData = cachedData.BodyData

			ctx.Server.Logger().Debugf("Cache HIT (full) for message %s/%d part %v", mbox.Name(), uid, partPath)
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
			msg = &imapMsg

			// Fetching body without Peek marks message as \Seen, so update the cached flags
			updateCachedMessageFlags(ctx, mbox.Name(), imapUID, []imap.Flag{imap.FlagSeen}, nil)
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
		}
		msg = &imapMsg

		// Fetching body without Peek marks message as \Seen, so update the cached flags
		updateCachedMessageFlags(ctx, mbox.Name(), imapUID, []imap.Flag{imap.FlagSeen}, nil)
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
				subject = fmt.Sprintf("message_%d", msg.UID)
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
	if partNode != nil && (!partNode.IsText() || partNode.Size == 0) {
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
	Uid     imap.UID
}

func handleComposeNew(ctx *alps.Context) error {
	saveAsDraft := ctx.FormValue("save_as_draft") != ""

	fromAddr := ctx.FormValue("from")
	if fromAddr == "" {
		fromAddr = ctx.Session.Username()
		if settings, err := loadSettings(ctx.Session.Store()); err == nil && settings.From != "" {
			fromAddr = fmt.Sprintf("%s <%s>", settings.From, ctx.Session.Username())
		}
	}

	msg := &OutgoingMessage{
		From:      fromAddr,
		To:        parseAddressList(ctx.FormValue("to")),
		Cc:        parseAddressList(ctx.FormValue("cc")),
		Bcc:       parseAddressList(ctx.FormValue("bcc")),
		Subject:   ctx.FormValue("subject"),
		Text:      ctx.FormValue("text"),
		HTML:      ctx.FormValue("html"),
		InReplyTo: ctx.FormValue("in_reply_to"),
		ReplyTo:   ctx.FormValue("reply_to"),
		MessageID: ctx.FormValue("message_id"),
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
			draftUid, err := strconv.ParseUint(draftUidStr, 10, 32)
			if err == nil {
				draftPath = &messagePath{Mailbox: draftMbox, Uid: imap.UID(draftUid)}
			}
		}
	}

	var inReplyToPath *messagePath
	if replyMbox := ctx.FormValue("reply_mailbox"); replyMbox != "" {
		if replyUidStr := ctx.FormValue("reply_uid"); replyUidStr != "" {
			replyUid, err := strconv.ParseUint(replyUidStr, 10, 32)
			if err == nil {
				inReplyToPath = &messagePath{Mailbox: replyMbox, Uid: imap.UID(replyUid)}
			}
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
		var sourcePath *messagePath
		if draftPath != nil {
			sourcePath = draftPath
		} else if inReplyToPath != nil {
			sourcePath = inReplyToPath
		}

		if sourcePath != nil {
			err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
				for _, pathStr := range prevAttachments {
					partPath, err := parsePartPath(pathStr)
					if err != nil {
						return fmt.Errorf("invalid part path: %v", err)
					}
					_, entity, _, _, err := p.GetMessagePartWithData(sourcePath.Mailbox, imapUIDFromIMAP(sourcePath.Uid), partPath)
					if err != nil {
						return fmt.Errorf("failed to fetch attachment %s: %v", pathStr, err)
					}

					mimeType, _, _ := entity.Header.ContentType()
					_, dispParams, _ := entity.Header.ContentDisposition()
					filename := dispParams["filename"]
					if filename == "" {
						_, ctParams, _ := entity.Header.ContentType()
						filename = ctParams["name"]
					}
					if mimeType == "" {
						mimeType = "application/octet-stream"
					}

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
					})
				}
				return nil
			})
			if err != nil {
				return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to fetch previous attachments: " + err.Error()})
			}
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
			}

			if draftPath != nil {
				if err := deleteMessagesWithProvider(p, draftPath.Mailbox, []provider.MessageID{imapUIDFromIMAP(draftPath.Uid)}); err != nil {
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

	if inReplyToPath != nil {
		ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			return markMessageAnsweredWithProvider(p, inReplyToPath.Mailbox, imapUIDFromIMAP(inReplyToPath.Uid))
		})
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		if _, _, _, err := appendMessageWithProvider(p, msg, provider.MailboxTypeSent); err != nil {
			return err
		}
		if draftPath != nil {
			if err := deleteMessagesWithProvider(p, draftPath.Mailbox, []provider.MessageID{imapUIDFromIMAP(draftPath.Uid)}); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to save message to Sent mailbox: " + err.Error()})
	}

	mailboxesToInvalidate := []string{"Sent"}
	if draftPath != nil {
		mailboxesToInvalidate = append(mailboxesToInvalidate, draftPath.Mailbox)
	}
	invalidateMailboxCache(ctx, mailboxesToInvalidate...)

	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}

func handleComposeAttachment(ctx *alps.Context) error {
	reader, err := ctx.Request.MultipartReader()
	if err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid request",
		})
	}
	form, err := reader.ReadForm(32 << 10) // 32 KB - force attachments to temp dir on disk
	if err != nil {
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

func unwrapIMAPAddressList(addrs []imap.Address) []string {
	l := make([]string, len(addrs))
	for i, addr := range addrs {
		l[i] = unwrapIMAPAddress(addr)
	}
	return l
}

func unwrapIMAPAddress(addr imap.Address) string {
	address := addr.Addr()
	if addr.Name != "" {
		address = fmt.Sprintf("%q <%s>", addr.Name, address)
	}
	return address
}

func formatMsgIDList(l []string) string {
	if len(l) == 0 {
		return ""
	}
	return "<" + strings.Join(l, ">, <") + ">"
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

	var uids []string
	var to string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Uids []string `json:"uids"`
			To   string   `json:"to"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
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

	uidList, err := parseUidList(uids)
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	if len(uidList) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "No messages selected."})
	}

	if to == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing 'to' parameter")
	}

	fmt.Printf("BULK DEBUG: %d uids received: %v\n", len(uidList), uidList)
	alpsMsgIDs := make([]provider.MessageID, len(uidList))
	for i, uid := range uidList {
		alpsMsgIDs[i] = imapUIDFromIMAP(uid)
	}

	uidMapping := make(map[string]string)
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
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

	var uids []string
	var to string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Uids []string `json:"uids"`
			To   string   `json:"to"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
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

	uidList, err := parseUidList(uids)
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	if len(uidList) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "No messages selected."})
	}

	if to == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing 'to' parameter")
	}

	fmt.Printf("BULK DEBUG: %d uids received: %v\n", len(uidList), uidList)
	alpsMsgIDs := make([]provider.MessageID, len(uidList))
	for i, uid := range uidList {
		alpsMsgIDs[i] = imapUIDFromIMAP(uid)
	}

	uidMapping := make(map[string]string)
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
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

	var uids []string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			Uids []string `json:"uids"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		uids = req.Uids
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		uids = formParams["uids"]
	}

	uidList, err := parseUidList(uids)
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	if len(uidList) == 0 {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "No messages selected."})
	}

	fmt.Printf("BULK DEBUG: %d uids received: %v\n", len(uidList), uidList)
	alpsMsgIDs := make([]provider.MessageID, len(uidList))
	for i, uid := range uidList {
		alpsMsgIDs[i] = imapUIDFromIMAP(uid)
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
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

		isSpamOrTrash := false
		for _, mb := range mailboxes {
			if mb.Name == mboxName {
				for _, attr := range mb.Attributes {
					if strings.EqualFold(attr, string(imap.MailboxAttrTrash)) || strings.EqualFold(attr, string(imap.MailboxAttrJunk)) {
						isSpamOrTrash = true
						break
					}
				}
				break
			}
		}

		// Fallback check by name if attributes are missing
		if !isSpamOrTrash {
			lowerName := strings.ToLower(mboxName)
			if lowerName == "trash" || lowerName == "junk" || lowerName == "spam" || lowerName == "deleted items" {
				isSpamOrTrash = true
			}
		}

		if !isSpamOrTrash {
			return fmt.Errorf("emptying is only allowed for Trash and Junk mailboxes")
		}

		return p.EmptyMailbox(mboxName)
	})
	if err != nil {
		return fmt.Errorf("failed to empty mailbox: %v", err)
	}

	// Invalidate cache for the mailbox
	invalidateMailboxCache(ctx, mboxName)

	return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
}

func handleGetSession(ctx *alps.Context) error {
	passwordChangeEnabled := false
	var enabledPlugins []string

	for name, pluginCfg := range ctx.Server.Options.Plugins {
		if pluginCfg.Enabled {
			enabledPlugins = append(enabledPlugins, name)
			if name == "password" {
				passwordChangeEnabled = true
			}
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
			return alps.NewHTTPError(http.StatusBadRequest, err)
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
		flags, _ = formParams["flags"]
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

	uidList, err := parseUidList(uids)
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
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

	l := make([]imap.Flag, len(flags))
	for i, s := range flags {
		l[i] = imap.Flag(s)
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

	// Convert UIDs to provider.MessageID
	fmt.Printf("BULK DEBUG: %d uids received: %v\n", len(uidList), uidList)
	alpsMsgIDs := make([]provider.MessageID, len(uidList))
	for i, uid := range uidList {
		alpsMsgIDs[i] = imapUIDFromIMAP(uid)
	}

	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		return setMessageFlagsWithProvider(p, mboxName, alpsMsgIDs, alpsOp, alpsFlags)
	})
	if err != nil {
		return err
	}

	// Update cached message flags instead of full invalidation
	for _, uid := range uidList {
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

const settingsKey = "base.settings"
const maxMessagesPerPage = 100

type UIPreferences struct {
	ThemeMode   string `json:"themeMode,omitempty"`
	ColorFamily string `json:"colorFamily,omitempty"`
	LayoutMode  string `json:"layoutMode,omitempty"`
	DensityMode string `json:"densityMode,omitempty"`
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

func loadSettings(s provider.Store) (*Settings, error) {
	autoLogoutDefault := 30
	settings := &Settings{
		MessagesPerPage:    50,
		PreferredView:      "html", // Default to HTML view
		AutoLogout:         &autoLogoutDefault,
		SoundNotifications: true,
	}
	if err := s.Get(settingsKey, settings); err != nil && err != provider.ErrNoStoreEntry {
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
	if err := settings.check(); err != nil {
		return nil, err
	}
	return settings, nil
}

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
	settings, err := loadSettings(ctx.Session.Store())
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
				return alps.NewHTTPError(http.StatusBadRequest, err)
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
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		mailboxes, err = listMailboxesWithProvider(p)
		return err
	})
	if err != nil {
		return err
	}

	maxAttachmentMiB := ctx.Server.Options.MaxAttachmentMiB
	if maxAttachmentMiB == 0 {
		maxAttachmentMiB = 32 // fallback to default
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"Settings":         settings,
		"Mailboxes":        mailboxes,
		"AutoLogout":       settings.AutoLogout,
		"MaxAttachmentMiB": maxAttachmentMiB,
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
	has2FA, err := checkWebAuthnEnabled(newSession.Store())
	if err != nil {
		ctx.Server.Logger().Printf("Failed to check WebAuthn status for %s: %v", targetUsername, err)
		has2FA = false // Continue without 2FA on error
	}

	// Check if we should skip 2FA for trusted linked accounts
	skipTwoFA := false
	if has2FA {
		trustLinked, err := checkTrustLinkedAccounts(newSession.Store())
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
			MaxAge:   300, // 5 minutes
		})

		// Store credentials for login token creation after 2FA verification
		if err := newSession.Store().Put("2fa_login_credentials", map[string]string{
			"username": targetUsername,
			"password": password,
		}); err != nil {
			ctx.Server.Logger().Printf("Failed to store 2FA login credentials: %v", err)
		}

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
	// If a login token exists, the user had "remember me" checked
	origUsername, _, _ := ctx.GetLoginToken()
	wasPersistent := origUsername != ""

	// Update login token for new account, preserving persistence choice
	ctx.SetLoginToken(targetUsername, password, true, wasPersistent)

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

	resp, err := http.Get(u.String())
	if err != nil {
		return err
	}
	defer resp.Body.Close()

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

	lr := io.LimitedReader{R: resp.Body, N: int64(maxSize)}
	return ctx.Stream(http.StatusOK, mediaType, &lr)
}
