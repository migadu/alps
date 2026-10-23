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

	// News of new mail, pushed: see handleEvents
	p.GET("/events", handleEvents)

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
	status := &MailboxStatus{
		StatusData: &imap.StatusData{
			Mailbox:     mbox.Mailbox,
			NumMessages: &numMessages,
			NumUnseen:   &numUnseen,
		},
	}
	// What LIST-STATUS answered beside the counts, so that a status read with
	// the folder list compares with one a check for new mail reads.
	if mbox.Status != nil {
		status.UIDValidity = mbox.Status.UIDValidity
		status.UIDNext = mbox.Status.UIDNext
	}
	return status
}

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

// invalidateMailboxCache brings the session's cache in line with a write that
// changed what the named mailboxes hold: their pages and conversations are
// dropped, and their counts are read again, for the folder list too. With no
// names, the write changed the folder list itself (a subscription), and the
// list is dropped.
//
// It used to drop the folder list and the named folders' counts, so the
// listing that follows every write read every folder's counts again. And it
// dropped every message the session held of each folder; the messages that
// leave a folder are dropped by the write itself now (forgetMessages), and the
// rest are kept. A message's body never changes under its UID. Its flags do,
// and every copy the session holds of it is patched for them
// (applyFlagsToCache).
func invalidateMailboxCache(ctx *alps.Context, mailboxNames ...string) {
	cache := ctx.Session.Cache()
	if len(mailboxNames) == 0 {
		cache.Delete("mailboxes")
		return
	}

	mailboxNames = slices.Compact(slices.Sorted(slices.Values(mailboxNames)))
	for _, name := range mailboxNames {
		dropMailboxListings(cache, name)
	}
	rereadMailboxCounts(ctx, mailboxNames)
}

// rereadMailboxCounts reads the counts of mailboxes a write changed, with a
// STATUS each, and puts them where the next listing reads them: the cached
// counts, and the folder list. A folder the cached list does not hold (a
// write can create one, as an APPEND to Sent may) drops the list, and so does
// a STATUS that fails, as every write's did before: the list is then read
// again, with every folder's counts.
func rereadMailboxCounts(ctx *alps.Context, names []string) {
	cache := ctx.Session.Cache()
	dropAll := func() {
		cache.Delete("mailboxes")
		for _, name := range names {
			cache.Delete("status:" + name)
		}
	}

	// A request whose client has gone does not reach for the connection
	// again: cancelled there, it would close it (see DoMailWithContext).
	if ctx.Request.Context().Err() != nil {
		dropAll()
		return
	}
	statuses := make([]*MailboxStatus, len(names))
	err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		for i, name := range names {
			status, err := getMailboxStatusWithProvider(p, name)
			if err != nil {
				return err
			}
			statuses[i] = status
		}
		return nil
	})
	if err != nil {
		ctx.Server.Logger().Debugf("Re-reading the counts of %v after a write failed: %v", names, err)
		dropAll()
		return
	}

	for i, name := range names {
		cache.Set("status:"+name, statuses[i])
	}

	cached, ok := cache.Get("mailboxes")
	if !ok {
		return
	}
	mailboxes, ok := cached.([]MailboxInfo)
	if !ok {
		cache.Delete("mailboxes")
		return
	}
	// A copy, not the list in place: another request may be reading it.
	updated := slices.Clone(mailboxes)
	for i, name := range names {
		j := slices.IndexFunc(updated, func(mbox MailboxInfo) bool { return mbox.Name() == name })
		if j < 0 {
			cache.Delete("mailboxes")
			return
		}
		updated[j].Total = int(*statuses[i].NumMessages)
		updated[j].Unseen = int(*statuses[i].NumUnseen)
	}
	// With the expiry the list was read with. Set would renew it, and a list
	// patched on every write would never be read again: the counts of the
	// folders no write touched, and whose own cached counts have gone, would
	// be as old as the session.
	cache.Replace("mailboxes", updated)
}

// forgetMessages drops what the session holds of messages that have left
// mailbox: their bodies and parts, cached under the UIDs they had there. The
// mailbox's other messages are kept.
func forgetMessages(cache *alps.Cache, mailbox string, uids ...string) {
	if len(uids) == 0 {
		return
	}
	gone := make(map[string]bool, len(uids))
	for _, uid := range uids {
		gone[uid] = true
	}
	// Keys are message:<mailbox>:<uid>:[<part path>]..., and the prefix also
	// matches a mailbox whose name continues with a colon. Its keys read as a
	// UID no message of this mailbox has, and stay.
	prefix := "message:" + mailbox + ":"
	for _, key := range cache.GetKeysWithPrefix(prefix) {
		rest := key[len(prefix):]
		end := strings.Index(rest, ":[")
		if end < 0 || gone[rest[:end]] {
			cache.Delete(key)
		}
	}
}

func idStrings(ids []provider.MessageID) []string {
	strs := make([]string, len(ids))
	for i, id := range ids {
		strs[i] = id.String()
	}
	return strs
}

// dropMailboxListings forgets what this session was told a mailbox holds: its
// pages, and the conversations assembled from them.
//
// The two go together. A cached conversation is named by the same membership
// the pages carry (see listedThreadUIDs), so a page kept past a change it does
// not show is one thing, and a conversation kept past it would be that same
// staleness served to the reader under its own name. The conversations go by
// the messages they hold (dropConversationsHolding): those kept under the
// mailbox's keys, and those of other folders that hold its messages.
func dropMailboxListings(cache *alps.Cache, mailbox string) {
	deleteFolderEntries(cache, "messages", mailbox)
	dropConversationsHolding(cache, mailbox)
}

// deleteFolderEntries deletes the pages ("messages") or the messages read
// ("message") the session holds of mailbox. They are kept under keys that
// begin with kind:<mailbox>:, which also begins the keys of a folder whose
// name goes on from this one's with a colon, as Work:Sub's goes on from
// Work's. A page and a message record the folder they were read from, and one
// of another folder stays: deleted by the prefix, Work:Sub's were read again
// for every change to Work. An entry that names no folder goes, as it cannot
// be told apart.
func deleteFolderEntries(cache *alps.Cache, kind, mailbox string) {
	for _, key := range cache.GetKeysWithPrefix(kind + ":" + mailbox + ":") {
		if cached, ok := cache.Get(key); ok {
			folder := mailbox
			switch entry := cached.(type) {
			case CachedMessages:
				folder = entry.Mailbox
			case CachedMessagePart:
				folder = entry.Mailbox
			}
			if folder != "" && folder != mailbox {
				continue
			}
		}
		cache.Delete(key)
	}
}

// dropConversationsHolding drops the conversations the session holds, under
// any folder's keys, that hold a message of mailbox.
//
// A conversation is kept under the folder it was opened from, and one opened
// from the Inbox holds the user's own replies from Sent. Dropped with Sent's
// own alone, it went on showing a reply that had been deleted or moved, and
// one with the flags it had before the whole of Sent was marked read.
//
// By the folder each member names, not by the key, which names only the
// folder the conversation was opened from; and not by a prefix of the folder's
// name, as a folder whose name goes on from this one's with a colon is
// another. A conversation that holds none of this mailbox's messages stays.
func dropConversationsHolding(cache *alps.Cache, mailbox string) {
	for _, key := range cache.GetKeysWithPrefix("thread:") {
		cached, ok := cache.Get(key)
		if !ok {
			continue
		}
		msgs, ok := cached.([]IMAPMessage)
		if ok && slices.ContainsFunc(msgs, func(m IMAPMessage) bool { return m.Mailbox == mailbox }) {
			cache.Delete(key)
		}
	}
}

// dropRenumberedMailbox forgets everything this session holds about a
// mailbox's messages by UID, for a mailbox whose UIDVALIDITY moved: its pages
// and conversations, and every message read from it.
//
// A new UIDVALIDITY says that every UID may now name a different message. A
// message read under the old one is kept by its UID, and a re-listing keeps a
// cached message that has a body, so the list showed the new message and
// opening it showed the old one: handleGetPart answers message:<mbox>:<uid>:…
// from the cache.
func dropRenumberedMailbox(cache *alps.Cache, mailbox string) {
	dropMailboxListings(cache, mailbox)
	deleteFolderEntries(cache, "message", mailbox)
	cache.Delete("uidvalidity:" + mailbox)
}

// uidMoved reports whether a UIDVALIDITY or UIDNEXT moved from prev to now.
// Either is 0 where it is not known, and then it says nothing.
func uidMoved(prev, now uint32) bool {
	return prev != 0 && now != 0 && prev != now
}

// heldUIDValidities answers the UIDVALIDITY values the session's status,
// pages and raw-part validator were read at, where they are known.
//
// Any can be all that is left from before the folder was
// made again elsewhere. The folder list reads every folder's status again
// without looking at its pages, a check of another folder that finds a change
// drops every status and keeps the pages, and a folder only searched has a
// status and no page. A raw part can outlive both its status and its pages.
func heldUIDValidities(cache *alps.Cache, mailbox string) []uint32 {
	var held []uint32
	if cached, ok := cache.Get("uidvalidity:" + mailbox); ok && cached.(uint32) != 0 {
		held = append(held, cached.(uint32))
	}
	if cached, ok := cache.Get("status:" + mailbox); ok {
		if status := cached.(*MailboxStatus); status.StatusData != nil && status.UIDValidity != 0 {
			held = append(held, status.UIDValidity)
		}
	}
	for _, key := range cache.GetKeysWithPrefix("messages:" + mailbox + ":") {
		cached, ok := cache.Get(key)
		if !ok {
			continue
		}
		// Another folder's pages were read at its own UIDVALIDITY, and taken
		// for this one's they would make it look made again.
		if page, ok := cached.(CachedMessages); ok && page.Mailbox == mailbox && page.Counts.UIDValidity != 0 {
			held = append(held, page.Counts.UIDValidity)
		}
	}
	return held
}

// renumberedSince reports whether any of the held UIDVALIDITY values moved to
// now.
func renumberedSince(held []uint32, now uint32) bool {
	for _, prev := range held {
		if uidMoved(prev, now) {
			return true
		}
	}
	return false
}

// CachedMessages holds cached message list data
type CachedMessages struct {
	// Mailbox is the folder the page lists. A page is found by the prefix of
	// its key, "messages:<folder>:", and the pages of a folder whose name
	// begins with another's and a colon, as "Work:Sub" begins with "Work",
	// have keys with the other folder's prefix too.
	Mailbox  string
	Messages []provider.Message
	Total    int
	// Threaded records what Total counts, so a cache hit reports the same
	// kind of row the live listing would have. See provider.PageInfo.
	Threaded bool
	// Counts are the folder's message and unseen counts as they stood when
	// the page was read, and the page is served only while the folder still
	// has them.
	//
	// A check for new mail drops the pages when the counts it reads differ
	// from the ones the session holds (handleMailboxStatus). But the check is
	// not the only reader of those counts: the folder list that comes with
	// every message and part read fetches them whenever they are missing, and
	// reading a message no page holds is one way they go missing (see
	// applyFlagsToCache). Mail that arrived in between was counted there and
	// nowhere else, the check then saw no change, and the list went on
	// answering from a page that did not hold the new mail until the cache
	// expired. Held by the page itself, the counts tell it that it is out of
	// date, whoever read them.
	Counts mailboxCounts
}

// mailboxCounts is a folder's message and unseen counts, held by value: the
// cached status is a pointer that a flag change moves in place.
//
// UIDValidity and UIDNext go with them, 0 where the provider has none. A
// message that arrives as another goes leaves both counts as they were, and
// moves UIDNext; a folder deleted and made again elsewhere with as many
// messages moves UIDValidity.
type mailboxCounts struct {
	Known       bool
	Messages    uint32
	Unseen      uint32
	UIDValidity uint32
	UIDNext     uint32
}

// countsOf reads the counts out of a status. A status without them (the
// search across every folder has none) gives counts that match only each
// other, so such a page is served as it always was.
func countsOf(status *MailboxStatus) mailboxCounts {
	if status == nil || status.StatusData == nil || status.NumMessages == nil || status.NumUnseen == nil {
		return mailboxCounts{}
	}
	return mailboxCounts{
		Known:       true,
		Messages:    *status.NumMessages,
		Unseen:      *status.NumUnseen,
		UIDValidity: status.UIDValidity,
		UIDNext:     uint32(status.UIDNext),
	}
}

// shiftListedUnseen moves the unseen count every cached page of a mailbox was
// read at by step, for a message whose \Seen the pages have been brought in
// line with. The server's count moved by the same step, and the pages are
// still what it would list; left behind, they would be read again for a
// change they already show.
func shiftListedUnseen(cache *alps.Cache, mailbox string, step int) {
	for _, key := range cache.GetKeysWithPrefix("messages:" + mailbox + ":") {
		cached, ok := cache.Get(key)
		if !ok {
			continue
		}
		page, ok := cached.(CachedMessages)
		// Another folder's pages count its own messages, which this change
		// did not touch.
		if !ok || page.Mailbox != mailbox || !page.Counts.Known || (step < 0 && page.Counts.Unseen == 0) {
			continue
		}
		page.Counts.Unseen = uint32(int64(page.Counts.Unseen) + int64(step))
		cache.Set(key, page)
	}
}

// CachedMessagePart holds a cached individual message with optional body data
type CachedMessagePart struct {
	Message    *provider.Message
	HeaderData []byte // nil if only envelope/flags are cached
	BodyData   []byte // nil if only envelope/flags are cached
	Mailbox    string
	// UIDValidity is the folder's UIDVALIDITY as the session held it when the
	// message was read, 0 where it was not known. The message is kept by its
	// UID, which names another message once the UIDVALIDITY has moved, and it
	// can outlive everything else the session held of the folder from before
	// (see handleGetPart).
	UIDValidity uint32
	// ReaderFields says that Message carries the verdict and References the
	// reader shows, which only a read of the part for the reader fetches.
	ReaderFields bool
}

// updateCachedMessageFlags updates flags for specific messages in cached message lists.
// It reports whether the mailbox's cached count was dropped (see
// applyFlagsToCache), for the caller to read it again.
func updateCachedMessageFlags(ctx *alps.Context, mailbox string, uid provider.MessageID, addFlags []imap.Flag, removeFlags []imap.Flag) bool {
	return applyFlagsToCache(ctx.Session.Cache(), ctx.Server.Logger().Debugf, mailbox, uid, addFlags, removeFlags)
}

// patchCachedConversations brings the conversations this session has assembled
// in line with a flag change, so a star or a read does not have to throw them
// away (see handleGetThread).
//
// Dropping them would undo the caching exactly where it pays: a reader marks a
// conversation read AS it opens it, and the next thing it asks for is the next
// member of that same conversation. A conversation that does not hold the
// message is left alone — it is not affected by the change — but one whose
// members cannot be told apart from it is dropped rather than guessed at.
//
// Every folder's conversations are looked through, not only this one's: a
// conversation is kept under the folder it was opened from, and one opened
// from the Inbox holds the user's own replies from Sent. Patched under Sent's
// keys alone, a reply starred in Sent was shown unstarred in the Inbox's.
// Finding them all walks no more of the cache than finding this folder's
// did: the cache goes through every key it holds for any prefix.
func patchCachedConversations(cache *alps.Cache, debugf func(string, ...interface{}), mailbox, uidStr string, addFlags, removeFlags []imap.Flag) {
	for _, key := range cache.GetKeysWithPrefix("thread:") {
		patched := false
		cache.Update(key, func(cached interface{}) interface{} {
			msgs, ok := cached.([]IMAPMessage)
			if !ok {
				return nil
			}
			for i := range msgs {
				// By the id the reader names messages with, which is the provider's
				// own: a UID under IMAP, a file name under maildir. It names a
				// message only within its folder, and the conversations walked are
				// every folder's, each holding that folder's messages and the
				// user's own from Sent. Every member names its folder (namedIn).
				// The key is not asked: it names only the folder the conversation
				// was opened from, and Work's begins the keys of Work:Sub too.
				if msgs[i].AlpsUID != uidStr || msgs[i].Mailbox != mailbox {
					continue
				}
				// A reader may be encoding the old conversation now. Its slice,
				// message buffer and flag storage must all stay unchanged. Update
				// publishes the new snapshot atomically, so another flag change
				// cannot overwrite it and an invalidation cannot be undone.
				updated := slices.Clone(msgs)
				message := *msgs[i].FetchMessageBuffer
				flags := slices.Clone(message.Flags)
				for _, flag := range addFlags {
					if !slices.Contains(flags, flag) {
						flags = append(flags, flag)
					}
				}
				for _, flag := range removeFlags {
					for j := len(flags) - 1; j >= 0; j-- {
						if flags[j] == flag {
							flags = append(flags[:j], flags[j+1:]...)
							break
						}
					}
				}
				message.Flags = flags
				updated[i].FetchMessageBuffer = &message
				patched = true
				return updated
			}
			return msgs
		})
		if patched {
			debugf("Updated flags for message %s in conversation %s", uidStr, key)
		}
	}
}

// listedMessage finds the message named uid among a page's rows and, in a
// threaded page, among the earlier messages of each row's conversation, which
// the row (the conversation's latest message) carries as SubMessages. It
// returns the copy in the page, to be changed in place.
func listedMessage(rows []provider.Message, uid string) *provider.Message {
	for i := range rows {
		if rows[i].ID.String() == uid {
			return &rows[i]
		}
		for j := range rows[i].SubMessages {
			if rows[i].SubMessages[j].ID.String() == uid {
				return &rows[i].SubMessages[j]
			}
		}
	}
	return nil
}

// applyFlagsToCache brings the session's cached copies of one message, and
// its mailbox's unseen count, in line with a flag change the server has made.
// It reports whether it dropped the count instead, as the copies could not say
// what the message was before the change.
func applyFlagsToCache(cache *alps.Cache, debugf func(string, ...interface{}), mailbox string, uid provider.MessageID, addFlags []imap.Flag, removeFlags []imap.Flag) bool {
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
	// back: adding \Seen to a message that already has it changes nothing on
	// the server, and a count that dropped on every add fell by two for one
	// message marked read twice.
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

	// The message's own entry is asked before any page is touched. A listing
	// caches each row twice, in the page and as the message on its own, and
	// the two are one message in memory (handleGetMailbox): updating the page
	// first made the entry report the change as the state before it. The
	// copies then disagreed, and reading a listed message dropped the count
	// instead of lowering it.
	msgKey := fmt.Sprintf("message:%s:%s:[]", mailbox, uidStr)
	if cached, ok := cache.Get(msgKey); ok {
		if cachedPart, ok := cached.(CachedMessagePart); ok && cachedPart.Message != nil {
			noteSeen(cachedPart.Message.Flags)
		}
	}

	messageUpdated := false
	for _, key := range keys {
		if cached, ok := cache.Get(key); ok {
			cachedData := cached.(CachedMessages)
			// Another folder's page lists its own messages, and the UID names
			// a different one there.
			if cachedData.Mailbox != mailbox {
				continue
			}
			// Find and update the message in this page
			if row := listedMessage(cachedData.Messages, uidStr); row != nil {
				noteSeen(row.Flags)
				row.Flags = updateFlags(row.Flags)
				cache.Set(key, cachedData)
				messageUpdated = true
				debugf("Updated flags for message %s in cache key %s", uidStr, key)
			}
		}
	}

	// Update the message's own entries: its metadata, and each part read with
	// it. A part is answered with the flags it was cached with, and the reader
	// shows them, so a part that kept its old ones reopened a starred message
	// unstarred, or a message marked unread as read. They are kept across
	// writes now, as the body under a UID does not change.
	for _, key := range cache.GetKeysWithPrefix(fmt.Sprintf("message:%s:%s:[", mailbox, uidStr)) {
		cached, ok := cache.Get(key)
		if !ok {
			continue
		}
		cachedPart, ok := cached.(CachedMessagePart)
		if !ok || cachedPart.Message == nil {
			continue
		}
		cachedPart.Message.Flags = updateFlags(cachedPart.Message.Flags)
		cache.Set(key, cachedPart)
		debugf("Updated flags for message %s in cache key %s", uidStr, key)
		messageUpdated = true
	}

	// The parts read of the message (handleGetPart) are cached with the
	// message as the read found it, flags included, and a reopened message is
	// answered from them. A read leaves \Seen as it is, so an unread message
	// is cached unread, and the reader's own mark-as-read is the change that
	// has to reach them: without it the message reopened unread. They follow
	// the change but are not asked what the message was before it. That is
	// the listing's to say: a part is not read again when the listing is, and
	// one cached before another client changed the message would move the
	// count for a change that changed nothing.
	partPrefix := fmt.Sprintf("message:%s:%s:", mailbox, uidStr)
	for _, key := range cache.GetKeysWithPrefix(partPrefix) {
		// The part path, as in "[2]:limit0". A mailbox whose name goes on
		// from this one's with a colon has keys under the prefix too.
		if key == msgKey || !strings.HasPrefix(key[len(partPrefix):], "[") {
			continue
		}
		cached, ok := cache.Get(key)
		if !ok {
			continue
		}
		part, ok := cached.(CachedMessagePart)
		if !ok || part.Message == nil || part.Mailbox != mailbox {
			continue
		}
		part.Message.Flags = updateFlags(part.Message.Flags)
		cache.Set(key, part)
		debugf("Updated flags for message %s in cached part %s", uidStr, key)
	}

	patchCachedConversations(cache, debugf, mailbox, uidStr, addFlags, removeFlags)

	if !messageUpdated {
		debugf("Message %s not found in cache, pages may need refresh", uidStr)
	}

	seenAdded := slices.Contains(addFlags, imap.FlagSeen)
	seenRemoved := slices.Contains(removeFlags, imap.FlagSeen)
	if !seenAdded && !seenRemoved {
		return false
	}

	// The pages move with the server's count, cached status or not. When the
	// copies cannot say what the message was, they keep the count they were
	// read at: if the message was unseen, the next count read is not theirs,
	// and they are read again.
	switch {
	case cachedSeen == cachedUnseen:
	case seenAdded && cachedUnseen:
		shiftListedUnseen(cache, mailbox, -1)
	case seenRemoved && cachedSeen:
		shiftListedUnseen(cache, mailbox, 1)
	}

	statusKey := "status:" + mailbox
	cached, ok := cache.Get(statusKey)
	if !ok {
		return false
	}
	status := cached.(*MailboxStatus)
	if status.NumUnseen == nil {
		return false
	}

	// Copies that disagree, or no copy at all, say nothing reliable about the
	// message's state before the change: drop the count, for the caller to
	// read again. Left missing, the folder list's own count for the folder
	// would be shown in its place (withHeldCounts), and the list outlives
	// writes: a message opened from a search across every folder, which no
	// copy of the folder's own holds, left its folder counted unread until
	// the list expired.
	if cachedSeen == cachedUnseen {
		cache.Delete(statusKey)
		debugf("Dropped cached status for %s: the message's previous \\Seen state is unknown", mailbox)
		return true
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
	return false
}

// heldCounts returns the counts the session holds for a mailbox, or nil when
// it holds none, or not both.
func heldCounts(cache *alps.Cache, mailbox string) *MailboxStatus {
	cached, ok := cache.Get("status:" + mailbox)
	if !ok {
		return nil
	}
	held, ok := cached.(*MailboxStatus)
	if !ok || held.NumUnseen == nil || held.NumMessages == nil {
		return nil
	}
	return held
}

// withHeldCounts returns a copy of a folder list with the counts the session
// holds laid over the list's own. The folder list outlives writes, and a flag
// change moves only its folder's cached counts (applyFlagsToCache): a list
// answered as it was cached showed a folder read, or marked unread, with its
// old count. A copy, as other requests may be reading the cached list.
func withHeldCounts(cache *alps.Cache, mailboxes []MailboxInfo) []MailboxInfo {
	held := slices.Clone(mailboxes)
	for i := range held {
		if status := heldCounts(cache, held[i].Name()); status != nil {
			held[i].Unseen = int(*status.NumUnseen)
			held[i].Total = int(*status.NumMessages)
		}
	}
	return held
}

// cachedMailboxList returns the session's folder list, going to IMAP only when
// the cache has none, with the counts the session holds (withHeldCounts). The
// key is the one every mailbox verb already drops, so a list read straight
// after a create or a rename is the new tree.
func cachedMailboxList(ctx *alps.Context) ([]MailboxInfo, error) {
	const cacheKey = "mailboxes"
	cache := ctx.Session.Cache()
	if cached, ok := cache.Get(cacheKey); ok {
		return withHeldCounts(cache, cached.([]MailboxInfo)), nil
	}

	var mailboxes []MailboxInfo
	err := doRequestMail(ctx, func(p provider.MailProvider) error {
		var err error
		mailboxes, err = listMailboxesWithProvider(p)
		if err != nil {
			return err
		}
		cache.Set(cacheKey, mailboxes)
		// The counts the list carries are the newest the session has, and go
		// where the counts are held, as getBaseMailboxData's list puts them.
		// Else the older ones held from before, laid over this list and every
		// listing after it, would bring back what it had replaced.
		for _, mbox := range mailboxes {
			if mbox.Unseen >= 0 && mbox.Total >= 0 {
				cache.Set("status:"+mbox.Name(), mailboxInfoToStatus(mbox))
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return withHeldCounts(cache, mailboxes), nil
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
		err = doRequestMail(ctx, func(p provider.MailProvider) error {
			var err error
			var needsMailboxListFetch = len(mailboxes) == 0

			// Collect which statuses we need to fetch
			statusesToFetch := make(map[string]bool)
			var missing []string
			if mboxName != "" {
				if _, ok := ctx.Session.Cache().Get("status:" + mboxName); !ok {
					statusesToFetch[mboxName] = true
					missing = append(missing, mboxName)
				}
			}
			if mboxName != "INBOX" {
				if _, ok := ctx.Session.Cache().Get("status:INBOX"); !ok {
					statusesToFetch["INBOX"] = true
					missing = append(missing, "INBOX")
				}
			}

			// With the folder list cached, the counts that are missing are
			// asked for on their own. Read with the list instead, one or two
			// missing counts cost a LIST-STATUS over every folder, or on a
			// server without it a LIST and a STATUS per subscribed folder.
			if !needsMailboxListFetch && len(missing) > 0 {
				if fetched, ok := statusesOfListed(p, mailboxes, missing); ok {
					for _, name := range missing {
						statuses[name] = fetched[name]
						ctx.Session.Cache().Set("status:"+name, fetched[name])
						ctx.Server.Logger().Debugf("Cache MISS for status:%s (via STATUS)", name)
					}
					statusesToFetch = nil
				} else {
					// The list the session holds may be what is out of date,
					// so the list read now replaces it.
					needsMailboxListFetch = true
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
				var unlisted []string
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
						unlisted = append(unlisted, mbox.Name())
					} else if mbox.Name() != mboxName && mbox.Name() != "INBOX" {
						// A folder whose counts are not read again here (an
						// unsubscribed one, on a server without LIST-STATUS)
						// forgets the ones the session held for it. A change
						// elsewhere no longer drops them, and kept, they would
						// go on vouching for its cached pages when it is
						// opened, whether mail reached it since or not. The
						// INBOX's and the open folder's stay: they are read
						// from the cache below.
						//
						// Its parts' validator goes with them, as nothing
						// checks it now (heldPartUIDValidity): a part of the
						// folder made again elsewhere was confirmed to the
						// browser with a 304, the old one for the new message,
						// even after a refresh. The next part read asks the
						// folder's UIDVALIDITY again.
						ctx.Session.Cache().Delete("status:" + mbox.Name())
						ctx.Session.Cache().Delete("uidvalidity:" + mbox.Name())
					}
				}

				// Sent together, so that the listing waits for one round trip
				// rather than one per folder.
				fetched, errs := getMailboxStatusesWithProvider(p, unlisted)
				for i, name := range unlisted {
					if errs[i] != nil {
						if statusesToFetch[name] {
							return errs[i]
						}
						// A sidebar folder's STATUS failure must not take
						// down the whole mailbox view.
						ctx.Server.Logger().Errorf("Failed to get status for mailbox %q: %v", name, errs[i])
						continue
					}
					statuses[name] = fetched[i]
					ctx.Session.Cache().Set("status:"+name, fetched[i])
					ctx.Server.Logger().Debugf("Cache MISS for status:%s (via STATUS)", name)
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
		if status == nil {
			// Every folder's counts the session holds, not only the INBOX's
			// and this folder's, as withHeldCounts lays them: a folder read,
			// or marked unread, and then left kept its old count in the
			// sidebar until the list was read again.
			status = heldCounts(ctx.Session.Cache(), mailboxes[i].Name())
		}
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

// statusesOfListed reads the status of each of names, folders the session's
// folder list holds, with a STATUS each. It reports false when one of them is
// not a folder of that list that a STATUS may be asked of, or when a STATUS
// fails: the folder list may be what is out of date, and is read again.
func statusesOfListed(p provider.MailProvider, mailboxes []MailboxInfo, names []string) (map[string]*MailboxStatus, bool) {
	for _, name := range names {
		i := slices.IndexFunc(mailboxes, func(mbox MailboxInfo) bool { return mbox.Name() == name })
		if i < 0 || mailboxes[i].HasAttr(string(imap.MailboxAttrNoSelect)) ||
			mailboxes[i].HasAttr(string(imap.MailboxAttrNonExistent)) {
			return nil, false
		}
	}
	got, errs := getMailboxStatusesWithProvider(p, names)
	fetched := make(map[string]*MailboxStatus, len(names))
	for i, name := range names {
		if errs[i] != nil || got[i] == nil {
			return nil, false
		}
		fetched[name] = got[i]
	}
	return fetched, true
}

// MailboxStatusResponse is the JSON response for the mailbox status polling endpoint.
type MailboxStatusResponse struct {
	Total  int `json:"total"`
	Unseen int `json:"unseen"`
	// UIDNext and UIDValidity are the ones read with the counts, 0 where
	// they are not known, as a listing's Mailbox and Inbox carry them. A
	// client that reads the listing again only when the folder changed can
	// tell from them what the counts do not show: a message that arrived as
	// another went, or a folder made again elsewhere.
	UIDNext     uint32 `json:"uidnext"`
	UIDValidity uint32 `json:"uidvalidity"`
}

// handleMailboxStatus returns a lightweight JSON response with the current
// mailbox message count and unseen count. It asks the IMAP server, which picks
// up changes with a NOOP, rather than the status cache, and records the answer
// in the cache. When the counts differ from the ones the session held, it
// also drops the folder's cached pages and conversations, so the next full
// page fetch returns up-to-date data, and the folder list, so that the
// listing after it reads the sidebar's counts again: mail that arrives here
// may have been filed into folders no check looks at.
//
// The other folders' counts are kept, where that listing does not read them
// again (see getBaseMailboxData). Dropped with the list, as they were, each
// other folder's next check found no earlier counts to compare with, and read
// as a change.
func handleMailboxStatus(ctx *alps.Context) error {
	mboxName, err := url.PathUnescape(ctx.Param("mbox"))
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	cache := ctx.Session.Cache()
	statusKey := "status:" + mboxName

	var prev, counts mailboxCounts
	var heldValidities []uint32
	err = ctx.Session.DoBackgroundMail(ctx.Request.Context(), func(p provider.MailProvider) error {
		// The counts held before are read under the lock, beside the STATUS:
		// a listing that ran while this request waited for it may have read
		// newer ones. They stay in the cache until the answer replaces them,
		// so that a listing meanwhile does not find them missing and read
		// every folder's counts again.
		if cached, ok := cache.Get(statusKey); ok {
			prev = countsOf(cached.(*MailboxStatus))
		}
		heldValidities = heldUIDValidities(cache, mboxName)
		s, err := p.GetMailboxStatus(mboxName)
		if err != nil {
			return err
		}
		status := providerStatusToMailboxStatus(s)
		counts = countsOf(status)
		cache.Set(statusKey, status)
		return nil
	})
	if err != nil {
		return err
	}

	// No earlier counts is not zero earlier counts: taken as zero, every first
	// check of a folder read as a change. Without them, the folder's cached
	// pages say whether it moved since they were read, as each holds the
	// counts it was read at.
	readAt, recounted := true, false
	if !prev.Known {
		readAt, recounted = pagesReadAt(cache, mboxName, counts)
	}

	renumbered := renumberedSince(heldValidities, counts.UIDValidity)
	switch {
	case renumbered || prev.Known && (prev.Messages != counts.Messages || prev.Unseen != counts.Unseen ||
		uidMoved(prev.UIDNext, counts.UIDNext)):
		if renumbered {
			dropRenumberedMailbox(cache, mboxName)
		} else {
			dropMailboxListings(cache, mboxName)
		}
		cache.Delete("mailboxes")
		ctx.Server.Logger().Debugf("Mailbox %s status changed: total %d→%d, unseen %d→%d — caches invalidated",
			mboxName, prev.Messages, counts.Messages, prev.Unseen, counts.Unseen)
	case !readAt:
		// Pages that disagree, or none at all, mean the folder's listings
		// are dropped, all of them. A page read at another message count
		// says that mail came or went, as a change seen against earlier
		// counts does, so the folder list goes too. One that differs only
		// in its unread count says no more than that a message was read or
		// marked unread, which may have been the session's own doing, and
		// nothing about the other folders, so the list stays.
		if renumbered {
			dropRenumberedMailbox(cache, mboxName)
		} else {
			dropMailboxListings(cache, mboxName)
		}
		if recounted || renumbered {
			cache.Delete("mailboxes")
		}
		ctx.Server.Logger().Debugf("Mailbox %s status read with no earlier counts: its pages are not at %d, %d unseen — its listings dropped",
			mboxName, counts.Messages, counts.Unseen)
	}

	return ctx.JSON(http.StatusOK, MailboxStatusResponse{
		Total:       int(counts.Messages),
		Unseen:      int(counts.Unseen),
		UIDNext:     counts.UIDNext,
		UIDValidity: counts.UIDValidity,
	})
}

// pagesReadAt reports whether the session holds pages of mailbox and every one
// of them was read at counts. With no page to say so, the folder may have
// changed under conversations assembled from it. recounted reports whether a
// page was read at another message count.
func pagesReadAt(cache *alps.Cache, mailbox string, counts mailboxCounts) (readAt, recounted bool) {
	held, agree := false, true
	for _, key := range cache.GetKeysWithPrefix("messages:" + mailbox + ":") {
		cached, ok := cache.Get(key)
		if !ok {
			continue
		}
		page, ok := cached.(CachedMessages)
		// Another folder's pages were read at its own counts, and say
		// nothing of whether this one moved.
		if ok && page.Mailbox != mailbox {
			continue
		}
		held = true
		if !ok || page.Counts != counts {
			agree = false
		}
		if ok && page.Counts.Known && page.Counts.Messages != counts.Messages {
			recounted = true
		}
	}
	return held && agree, recounted
}

func handleGetMailbox(ctx *alps.Context) error {
	// The UIDVALIDITY values the session holds the folder at, taken before
	// anything below reads its status again, to compare with the status this
	// page is read beside. A refresh drops the folder's status and pages,
	// which are what a new UIDVALIDITY is seen against. And a folder with no
	// page held, opened when its counts have gone, has its status read for
	// this page and nothing to compare it with but these: a conversation, or
	// a message, read from it before it was made again elsewhere went on
	// answering for the new folder's message under the same UID.
	cache := ctx.Session.Cache()
	var heldValidities []uint32
	mboxName, nameErr := url.PathUnescape(ctx.Param("mbox"))
	if nameErr == nil {
		heldValidities = heldUIDValidities(cache, mboxName)
	}
	if refresh := ctx.QueryParam("refresh"); refresh == "1" || refresh == "true" {
		cache.Delete("mailboxes")
		for _, key := range cache.GetKeysWithPrefix("status:") {
			cache.Delete(key)
		}

		if nameErr == nil {
			dropMailboxListings(cache, mboxName)
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
		// threaded says whether Total counts conversations or messages; a
		// server may refuse THREAD for one request and allow it for the next,
		// and the client has to notice rather than page on with an offset that
		// changed meaning underneath it.
		threaded bool
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

	// A search is never answered from the cache, and never stored in it.
	//
	// A cached page is dropped when the mailbox changes — a write here, or its
	// counts moving (handleMailboxStatus, CachedMessages.Counts). A search's
	// answer changes without either: a body word is matched through a
	// full-text index the server builds after delivery, so the message is
	// counted well before its body can be found. The first search for it was
	// empty, correctly, and that empty page was then the answer to every
	// search after it until something else in the mailbox moved. A search is
	// a question asked on purpose; it goes to the server each time.
	cacheable := query == ""

	// The counts this page is answered beside, taken before the listing is
	// read so that a page never claims counts newer than its rows. A cached
	// page is served only while they are still the ones it was read at.
	counts := countsOf(mbox)
	// A folder made again elsewhere, opened with a refresh or with no page
	// held, has no cached page to be turned down below, and what was read
	// from it before is dropped here instead.
	if renumberedSince(heldValidities, counts.UIDValidity) {
		dropRenumberedMailbox(ctx.Session.Cache(), mbox.Name())
	}

	// Try to get messages from cache
	cached, hit := ctx.Session.Cache().Get(msgCacheKey)
	if !cacheable {
		hit = false
	}
	if hit {
		cachedData, ok := cached.(CachedMessages)
		if ok && cachedData.Counts == counts {
			total = cachedData.Total
			threaded = cachedData.Threaded

			// Convert cached provider messages to IMAP messages for display
			msgs = make([]IMAPMessage, len(cachedData.Messages))
			for i, msg := range cachedData.Messages {
				msgs[i] = providerMessageToIMAP(msg)
			}

			ctx.Server.Logger().Debugf("Cache HIT for messages in %s page %d (query: %q)", mbox.Name(), page, query)
		} else {
			hit = false
			// The folder's status can reach the session with the folder list,
			// without a check for new mail, and then this is where a new
			// UIDVALIDITY is seen.
			if ok && uidMoved(cachedData.Counts.UIDValidity, counts.UIDValidity) {
				dropRenumberedMailbox(ctx.Session.Cache(), mbox.Name())
			}
		}
	}
	if !hit {
		var providerMsgs []provider.Message
		err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
			var err error
			var pageInfo provider.PageInfo
			if query != "" || settings.MessageSortCriteria == "date" {
				providerMsgs, pageInfo, err = p.SearchMessages(mbox.Name(), query, sortOrder, page, messagesPerPage)
			} else {
				providerMsgs, pageInfo, err = p.ListMessages(mbox.Name(), sortOrder, page, messagesPerPage)
			}
			if err != nil {
				return err
			}
			total, threaded = pageInfo.Total, pageInfo.Threaded

			// Cache the message list using provider types
			if cacheable {
				ctx.Session.Cache().Set(msgCacheKey, CachedMessages{
					Mailbox:  mbox.Name(),
					Messages: providerMsgs,
					Total:    total,
					Threaded: threaded,
					Counts:   counts,
				})
			}

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
					Message:     &providerMsgs[i],
					HeaderData:  nil, // No body data yet
					BodyData:    nil,
					Mailbox:     mbox.Name(),
					UIDValidity: counts.UIDValidity,
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
		"Address":         ctx.Session.Address(),
		"Mailboxes":       ibase.Mailboxes,
		"Mailbox":         ibase.Mailbox,
		"Inbox":           ibase.Inbox,
		"Messages":        msgs,
		"Total":           total,
		"Threaded":        threaded,
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
		// Read fresh rather than from the session's cache: which folders are
		// subscribed is the point, and another client may have changed that.
		// A listing that fails leaves the rename to go ahead on the Trash
		// guess by name alone, as it always could.
		mailboxes, _ := p.ListMailboxes()
		plan := planRenameSubscriptions(mailboxes, mboxName, req.NewName)
		if plan.unsubscribeOld {
			_ = unsubscribeMailboxWithProvider(p, mboxName)
		}
		if err := renameMailboxWithProvider(p, mboxName, req.NewName); err != nil {
			return err
		}
		for _, name := range plan.subscribe {
			_ = subscribeMailboxWithProvider(p, name)
		}
		return nil
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
			ctx.Server.Logger().Slog().Warn("sign-in failed",
				"user", username,
				"ip", ctx.ClientIP(),
				"reason", "rate limited",
				"detail", reason)

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
			var authErr provider.AuthError
			if errors.As(err, &authErr) {
				ctx.Server.Logger().Slog().Warn("sign-in failed",
					"user", username,
					"ip", ctx.ClientIP(),
					"reason", "bad credentials",
					"agent", ctx.Request.UserAgent())
				return ctx.JSON(http.StatusUnauthorized, map[string]interface{}{"error": "Failed to login"})
			}
			ctx.Server.Logger().Slog().Warn("sign-in failed",
				"user", username,
				"ip", ctx.ClientIP(),
				"reason", "error",
				"error", err.Error())
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

			ctx.Server.Logger().Slog().Info("sign-in awaits second factor",
				"user", username,
				"ip", ctx.ClientIP(),
				"session", s.ID())
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

		ctx.Server.Logger().Slog().Info("sign-in",
			"user", username,
			"ip", ctx.ClientIP(),
			"session", s.ID(),
			"2fa", s.IsAuthenticated2FA(),
			"remember", persistent,
			"restored", restoredFromToken,
			"agent", ctx.Request.UserAgent())
		return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
	}

	return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Missing credentials"})
}

func handleLogout(ctx *alps.Context) error {
	if ctx.Session != nil {
		ctx.Session.CloseWithReason("sign-out")
		ctx.SetSession(nil)
	}
	ctx.SetLoginToken("", "", false, false)
	return ctx.JSON(http.StatusOK, map[string]interface{}{"ok": true})
}

// A conversation, keyed by EVERY member that lives in this mailbox.
//
// Reading through a long conversation means opening one member after another,
// and each open asked for the conversation again from scratch: the same THREAD,
// the same search through Sent, the same envelopes. They are one answer, so it
// is stored once per member and any of them is served from it. Dropped wherever
// the mailbox's listings are (see dropMailboxListings), which is every write
// that changes what the mailbox holds, every count change and every explicit
// refresh, and by a reply to one of its messages, which adds a member in Sent
// (handleComposeNew).
func threadCacheKey(mailbox, uid string) string {
	return "thread:" + mailbox + ":" + uid
}

func handleGetThread(ctx *alps.Context) error {
	mboxName, uidStr, err := parseMboxAndUidStr(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return err
	}

	cache := ctx.Session.Cache()
	if cached, ok := cache.Get(threadCacheKey(mboxName, uidStr)); ok {
		if msgs, ok := cached.([]IMAPMessage); ok {
			return ctx.JSON(http.StatusOK, map[string]interface{}{"Messages": msgs})
		}
	}

	var thread []provider.Message
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		uid, parseErr := p.ParseMessageID(uidStr)
		if parseErr != nil {
			return parseErr
		}
		var threadErr error
		thread, threadErr = messageThreadWithProvider(p, mboxName, uid, listedThreadUIDs(p, cache, mboxName, uidStr))
		return threadErr
	})
	if err != nil {
		return err
	}

	// Threading sees one mailbox at a time, and the replies a user sends are
	// not in the mailbox of the messages they answer. They are looked for in
	// Sent on the session's background connection, which selects Sent to
	// search it: the session's own keeps this mailbox selected, and the next
	// request for the folder on screen does not select it again. A failed look
	// is logged, and the thread is answered as it is.
	var sent []provider.Message
	var lookErr error
	err = ctx.Session.DoBackgroundMail(ctx.Request.Context(), func(p provider.MailProvider) error {
		sent, lookErr = sentOfConversation(p, mboxName, thread, cachedSentMailbox(cache))
		return lookErr
	})
	// Not the look's own failure but the connection's, or a request given up
	// on, whose look may still be running: answered as any other.
	if err != nil && (ctx.Request.Context().Err() != nil || lookErr == nil) {
		return err
	}
	conversation := thread
	if lookErr != nil {
		ctx.Server.Logger().Printf("looking in Sent for the conversation of %s/%s: %v", mboxName, uidStr, lookErr)
	} else {
		conversation = mergeConversation(thread, sent)
	}
	msgs := make([]IMAPMessage, len(conversation))
	for i, m := range conversation {
		msgs[i] = providerMessageToIMAP(m)
	}

	// Under the message asked for, and under every member of the conversation
	// that lives in this mailbox: reading a long conversation means opening one
	// member after another, and they are all this one answer.
	cache.Set(threadCacheKey(mboxName, uidStr), msgs)
	for _, m := range msgs {
		// Members from Sent are keyed under their own mailbox by the read that
		// asks for them there, which is a different conversation to assemble.
		if m.AlpsUID == "" || m.Mailbox != mboxName {
			continue
		}
		cache.Set(threadCacheKey(mboxName, m.AlpsUID), msgs)
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"Messages": msgs,
	})
}

// listedThreadUIDs answers which UIDs the conversation holds in this mailbox,
// from the listing pages this session has already read.
//
// A threaded listing carries every row's whole thread (ListMessages), so for a
// message the user clicked on a page they are looking at — which is nearly
// every open — the membership is known and no THREAD command is needed. The
// answer is as fresh as that page: a reply that landed since is missed, but it
// is missed by the row the user clicked as well, so the reader is shown the
// conversation it already had, not an older one.
//
// Nothing is claimed when the message is not on a cached page, and the caller
// then threads for it as before.
func listedThreadUIDs(p provider.MailProvider, cache *alps.Cache, mailbox, uidStr string) []provider.MessageID {
	for _, key := range cache.GetKeysWithPrefix("messages:" + mailbox + ":") {
		cached, ok := cache.Get(key)
		if !ok {
			continue
		}
		// Another folder's rows name its own messages, and their
		// conversations are its own.
		listing, ok := cached.(CachedMessages)
		if !ok || listing.Mailbox != mailbox {
			continue
		}
		for _, row := range listing.Messages {
			if !rowHoldsUID(row, uidStr) {
				continue
			}
			if len(row.ThreadUIDs) == 0 {
				return nil
			}
			uids := make([]provider.MessageID, 0, len(row.ThreadUIDs))
			for _, u := range row.ThreadUIDs {
				id, err := p.ParseMessageID(u)
				if err != nil {
					return nil
				}
				uids = append(uids, id)
			}
			return uids
		}
	}
	return nil
}

// rowHoldsUID: the row itself, or one of the messages behind it.
func rowHoldsUID(row provider.Message, uidStr string) bool {
	if row.ID != nil && row.ID.String() == uidStr {
		return true
	}
	for _, u := range row.ThreadUIDs {
		if u == uidStr {
			return true
		}
	}
	return false
}

// cachedSentMailbox names Sent from the mailbox list the session holds, so a
// conversation read does not LIST for it every time. Empty when the list is not
// cached, which leaves the provider to ask.
func cachedSentMailbox(cache *alps.Cache) string {
	cached, ok := cache.Get("mailboxes")
	if !ok {
		return ""
	}
	mailboxes, ok := cached.([]MailboxInfo)
	if !ok {
		return ""
	}
	for _, mbox := range mailboxes {
		if mbox.HasAttr("\\Sent") {
			return mbox.Name()
		}
	}
	for _, mbox := range mailboxes {
		if strings.EqualFold(mbox.Name(), "Sent") {
			return mbox.Name()
		}
	}
	return ""
}

// backgroundRequestHeader marks a request the browser makes on its own, which
// nobody waits for, such as a body a conversation reads ahead of the user.
const backgroundRequestHeader = "X-Alps-Background"

// doRequestMail runs f for the request ctx: on the session's background
// connection when the browser marked the request as one nobody waits for (see
// backgroundRequestHeader), so that what the user opens meanwhile does not
// wait behind it, and on the session's own connection otherwise.
func doRequestMail(ctx *alps.Context, f func(provider.MailProvider) error) error {
	if ctx.Request.Header.Get(backgroundRequestHeader) != "" {
		return ctx.Session.DoBackgroundMail(ctx.Request.Context(), f)
	}
	return ctx.Session.DoMailWithContext(ctx.Request.Context(), f)
}

func handleGetPart(ctx *alps.Context, raw bool) error {
	mboxName, uidStr, err := parseMboxAndUidStr(ctx.Param("mbox"), ctx.Param("uid"))
	if err != nil {
		return err
	}
	// Confirm a browser-held part before reading the page, settings or body.
	var validity uint32
	if raw {
		validity, err = mailboxUIDValidity(ctx, mboxName)
		if err != nil {
			return err
		}
		if etag := rawPartETag(ctx, validity); etag != "" && etagListed(ctx.Request.Header.Get("If-None-Match"), etag) {
			setRawPartCaching(ctx.Response.Header(), etag)
			return ctx.NoContent(http.StatusNotModified)
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

	settings, err := readSettings(ctx)
	if err != nil {
		return err
	}

	partPathParam := ctx.QueryParam("part")
	partPath, err := parsePartPath(partPathParam)
	if err != nil {
		return alps.NewHTTPError(http.StatusBadRequest, err)
	}

	// The reader's request names no part: the part to show is chosen here,
	// and its text goes back with the answer.
	reading := partPathParam == "" && !raw
	cache := ctx.Session.Cache()

	// The session's cache names a message by its id as a listing gave it,
	// which is the id the client sends, so the cache is asked before the id
	// is parsed. Parsing it waits for the session's IMAP connection, and an
	// answer the cache holds needs nothing from that connection.
	var uid provider.MessageID
	parseUID := func(p provider.MailProvider) error {
		if uid != nil {
			return nil
		}
		var err error
		uid, err = p.ParseMessageID(uidStr)
		return err
	}

	// The message's metadata, when this request had to read it from the
	// server. It carries the verdict and References that a listing row does
	// not.
	var tempMsg *IMAPMessage

	if reading {
		// The part is chosen from the message's structure, which the session
		// holds for every message a listing listed and every message opened
		// before, and which never changes under a UID. It was read from the
		// server before every open all the same, before the cache was looked
		// in, even for a message whose body the cache held.
		structure := cachedMessageRow(cache, mbox.Name(), uidStr, mbox.UIDValidity)
		if structure == nil {
			err = doRequestMail(ctx, func(p provider.MailProvider) error {
				if err := parseUID(p); err != nil {
					return err
				}
				meta, err := p.GetMessageMetadata(mbox.Name(), uid)
				if err != nil {
					return err
				}
				cacheMessageRow(cache, mbox.Name(), meta, mbox.UIDValidity)
				imapMsg := providerMessageToIMAP(*meta)
				tempMsg = &imapMsg
				return nil
			})
			if err != nil {
				return err
			}
			structure = tempMsg
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
			preferredPart = structure.HTMLPart()
			if preferredPart == nil {
				preferredPart = structure.TextPart()
			}
		} else {
			preferredPart = structure.TextPart()
			if preferredPart == nil {
				preferredPart = structure.HTMLPart()
			}
		}

		// Use the preferred part path
		if preferredPart != nil {
			partPath = preferredPart.Path
		}
	}

	var msg *IMAPMessage
	var headerData, bodyData []byte
	var partValidity uint32

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
	msgCacheKey := fmt.Sprintf("message:%s:%s:%s:limit%d", mbox.Name(), uidStr, partPathStr, limit)

	// A part cached with its body is served from the cache. The reader is also
	// shown the verdict and References, which a part cached by another read of
	// it (/raw) does not carry, so for the reader such a part is read again
	// unless this request has just read them.
	var cachedPart *CachedMessagePart
	if cached, ok := cache.Get(msgCacheKey); ok {
		if cp, ok := cached.(CachedMessagePart); ok && cp.Message != nil && cp.HeaderData != nil && cp.BodyData != nil &&
			(!reading || cp.ReaderFields || tempMsg != nil) && (!raw || cp.UIDValidity == validity) {
			cachedPart = &cp
		}
	}
	// A message read before the folder was made again elsewhere is the old
	// folder's message, under a UID that may now name another. It can be all
	// the session holds of the folder from before: a folder only searched, or
	// a message opened from a link, has no page, a page may expire before a
	// message read from it, a refresh of another folder or a check that finds
	// new mail drops every status, and the folder list reads the statuses
	// again without comparing them. The list then showed the new message, and
	// opening it showed the old one. Held at another UIDVALIDITY than the
	// folder has now, the message goes, with everything else read from the
	// folder, and is read again.
	if cachedPart != nil && uidMoved(cachedPart.UIDValidity, mbox.UIDValidity) {
		ctx.Server.Logger().Debugf("Mailbox %s uidvalidity %d→%d since message %s was read — messages read from it dropped",
			mbox.Name(), cachedPart.UIDValidity, mbox.UIDValidity, uidStr)
		dropRenumberedMailbox(ctx.Session.Cache(), mbox.Name())
		cachedPart = nil
	}
	if cachedPart != nil {
		imapMsg := providerMessageToIMAP(*cachedPart.Message)
		if tempMsg != nil {
			// Read from the server just now, where the cached part has the
			// flags of the read that cached it.
			imapMsg.Flags = tempMsg.Flags
			imapMsg.HasBimiPotential = tempMsg.HasBimiPotential
			imapMsg.HasBimiFailed = tempMsg.HasBimiFailed
			if len(imapMsg.References) == 0 && len(tempMsg.References) > 0 {
				imapMsg.References = tempMsg.References
			}
		}
		msg = &imapMsg
		headerData = cachedPart.HeaderData
		bodyData = cachedPart.BodyData
		partValidity = cachedPart.UIDValidity

		ctx.Server.Logger().Debugf("Cache HIT for message %s/%s part %v", mbox.Name(), uidStr, partPath)
	} else {
		var providerMsg *provider.Message
		err = doRequestMail(ctx, func(p provider.MailProvider) error {
			if err := parseUID(p); err != nil {
				return err
			}
			var err error
			switch {
			case raw:
				// For raw mode, don't parse - just get bytes
				providerMsg, headerData, bodyData, err = p.GetMessagePartRaw(mbox.Name(), uid, partPath, limit)
			case reading && tempMsg == nil:
				// The structure came from the cache: the verdict and the
				// References are read with the part, in the same FETCH.
				providerMsg, headerData, bodyData, err = readerPartWithProvider(p, mbox.Name(), uid, partPath)
			default:
				providerMsg, _, headerData, bodyData, err = p.GetMessagePartWithData(mbox.Name(), uid, partPath)
			}
			if err != nil {
				return err
			}

			partValidity = partUIDValidity(ctx, p, mbox.Name(), mbox.UIDValidity)

			if tempMsg != nil {
				providerMsg.BimiPotential = tempMsg.HasBimiPotential
				providerMsg.BimiFailed = tempMsg.HasBimiFailed
				if len(providerMsg.References) == 0 && len(tempMsg.References) > 0 {
					providerMsg.References = tempMsg.References
				}
			}

			// Cache the raw bytes using provider type so we can recreate fresh readers
			cache.Set(msgCacheKey, CachedMessagePart{
				Message:      providerMsg,
				HeaderData:   headerData,
				BodyData:     bodyData,
				Mailbox:      mbox.Name(),
				ReaderFields: reading,
				UIDValidity:  partValidity,
			})
			ctx.Server.Logger().Debugf("Cache MISS for message %s/%s part %v, fetched and cached", mbox.Name(), uidStr, partPath)
			return nil
		})
		if err != nil {
			return err
		}

		// Convert provider message to IMAP message for display
		imapMsg := providerMessageToIMAP(*providerMsg)
		msg = &imapMsg
	}

	// Note: We no longer need selected mailbox info from IMAP
	// The provider abstraction doesn't expose this, and we use standard flags below

	if raw {
		etag := rawPartETag(ctx, partValidity)
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
			setRawPartCaching(ctx.Response.Header(), etag)

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
		setRawPartCaching(ctx.Response.Header(), etag)

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

	// The folder list is not sent: the listing sends it, and the reader
	// never read it here.
	answer := map[string]interface{}{
		"Message": msg,
		"Part":    partNode,

		"Flags":       flags,
		"Attachments": msg.Attachments(),
		"HasHTML":     msg.HTMLPart() != nil,
		"HasText":     func() bool { tp := msg.TextPart(); return tp != nil && strings.EqualFold(tp.MIMEType, "text/plain") }(),
	}
	// The part's text, which the reader used to ask for again with /raw: a
	// second request, and a second wait for the session's IMAP connection,
	// for bytes this one already holds. A text that cannot be decoded is left
	// out, and the reader asks /raw for it as before.
	if partNode != nil {
		if text, err := partText(headerData, bodyData); err == nil {
			answer["Body"] = text
		} else {
			ctx.Server.Logger().Debugf("Message %s/%s part %v sent without its text: %v", mbox.Name(), uidStr, partPath, err)
		}
	}
	return ctx.JSON(http.StatusOK, answer)
}

// partText is a part's body as /raw serves it: the transfer encoding undone,
// and a text in a charset alps knows converted to UTF-8.
func partText(headerData, bodyData []byte) (string, error) {
	h, err := textproto.ReadHeader(bufio.NewReader(bytes.NewReader(headerData)))
	if err != nil {
		return "", fmt.Errorf("failed to read part header: %v", err)
	}
	entity, err := message.New(message.Header{Header: h}, bytes.NewReader(bodyData))
	if err != nil {
		return "", fmt.Errorf("failed to create message reader: %v", err)
	}
	text, err := io.ReadAll(entity.Body)
	if err != nil {
		return "", fmt.Errorf("failed to decode message body: %v", err)
	}
	return string(text), nil
}

// cachedMessageRow returns the message's own entry in the session cache,
// which a listing writes for each row it lists (handleGetMailbox), when it
// holds the message's structure to choose the part to show from.
func cachedMessageRow(cache *alps.Cache, mailbox, uid string, validity uint32) *IMAPMessage {
	cached, ok := cache.Get(fmt.Sprintf("message:%s:%s:[]", mailbox, uid))
	if !ok {
		return nil
	}
	row, ok := cached.(CachedMessagePart)
	if !ok || row.Message == nil {
		return nil
	}
	if uidMoved(row.UIDValidity, validity) {
		dropRenumberedMailbox(cache, mailbox)
		return nil
	}
	msg := providerMessageToIMAP(*row.Message)
	if msg.BodyStructure == nil {
		return nil
	}
	return &msg
}

// cacheMessageRow keeps the metadata of a message opened without a listing
// in the entry a listing would have written, so that it opens from the cache
// next time as a listed one does. Flag changes keep that entry current
// (applyFlagsToCache).
func cacheMessageRow(cache *alps.Cache, mailbox string, msg *provider.Message, validity uint32) {
	if msg == nil || msg.ID == nil {
		return
	}
	cache.Set(fmt.Sprintf("message:%s:%s:[]", mailbox, msg.ID.String()), CachedMessagePart{Message: msg, Mailbox: mailbox, UIDValidity: validity})
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
	// A draft is saved as the user types, several megabytes of it with its
	// attachments, and what they open meanwhile does not wait for it: a save
	// does its mail work on the session's background connection.
	doMail := ctx.Session.DoMailWithContext
	if saveAsDraft {
		doMail = ctx.Session.DoBackgroundMail
	}

	fromAddr := ctx.FormValue("from")
	if fromAddr == "" {
		// The user's address, not the login: a login can be a bare user
		// name, which is no address to send from (see Session.Address).
		fromAddr = ctx.Session.Address()
		if settings, err := readSettings(ctx); err == nil {
			// The display name is free text, so it is formatted as an address
			// rather than pasted in front of one. Written bare, a comma in it
			// ("Doe, Jane") read as two addresses, the first with none, and
			// every send and draft save failed; quotes in it were lost.
			if name := strings.TrimSpace(settings.From); name != "" {
				fromAddr = (&mail.Address{Name: name, Address: ctx.Session.Address()}).String()
			}
		}
	}

	// A field that does not read as addresses is refused here, for what it
	// is, rather than as a failure to send or to store the draft. A Bcc that
	// does not read so is refused only when the message is sent: a draft is
	// still saved, with each Bcc entry that does read. Saved without the
	// field, it lost every Bcc recipient over one that did not, the ones
	// written correctly too.
	recipients := map[string][]string{}
	for _, field := range []string{"to", "cc", "bcc"} {
		list, err := parseAddressList(ctx.FormValue(field))
		if err != nil && saveAsDraft && field == "bcc" {
			list, err = readableAddresses(ctx.FormValue(field)), nil
		}
		if err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": fmt.Sprintf("invalid %s address: %v", field, err)})
		}
		recipients[field] = list
	}

	msg := &OutgoingMessage{
		From:       fromAddr,
		To:         recipients["to"],
		Cc:         recipients["cc"],
		Bcc:        recipients["bcc"],
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

	// Where each of msg.Attachments comes from, in the same order: the upload
	// or the earlier part the composer named it by. A draft save answers with
	// it, so the composer can tell which stored part each of its entries became.
	var sources []map[string]string

	// Every id the session does not hold (it ended, or the attachment budget
	// let the upload go) is refused before anything is taken, all of them
	// named, so the composer can ask for those files again and save the rest.
	var ids, missing []string
	for _, uuid := range strings.Split(ctx.FormValue("attachment-uuids"), ",") {
		uuid = strings.TrimSpace(uuid)
		if uuid == "" {
			continue
		}
		if ctx.Session.GetAttachment(uuid) == nil {
			missing = append(missing, uuid)
			continue
		}
		ids = append(ids, uuid)
	}
	refuseMissing := func(missing []string) error {
		return ctx.JSON(http.StatusConflict, map[string]interface{}{
			"error":               "unable to retrieve message attachment " + strings.Join(missing, ", "),
			"missing_attachments": missing,
		})
	}
	if len(missing) > 0 {
		return refuseMissing(missing)
	}

	// Then the uploads are the request's: taken out of the session, so that
	// nothing else removes their files while the message is written (the
	// user's Remove, the session's end, room made for another upload). Once
	// the message holds them they are removed; otherwise they are given back,
	// for the next try. They used to be removed when the request ended,
	// whether the message was stored or not.
	type takenUpload struct {
		uuid       string
		attachment *alps.Attachment
	}
	var taken []takenUpload
	inMessage := false
	defer func() {
		for _, u := range taken {
			if inMessage {
				u.attachment.Form.RemoveAll()
			} else {
				ctx.Session.ReturnAttachment(u.uuid, u.attachment)
			}
		}
	}()
	for _, uuid := range ids {
		attachment := ctx.Session.PopAttachment(uuid)
		if attachment == nil {
			// Removed since the pass above.
			return refuseMissing([]string{uuid})
		}
		taken = append(taken, takenUpload{uuid, attachment})
		msg.Attachments = append(msg.Attachments, &formAttachment{attachment.File})
		sources = append(sources, map[string]string{"uuid": uuid})
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

		err := doMail(ctx.Request.Context(), func(p provider.MailProvider) error {
			// Added only after every part is read, so a retry never duplicates them.
			var parts []Attachment
			var partSources []map[string]string
			parsedUid, err := p.ParseMessageID(sourcePath.Uid)
			if err != nil {
				return fmt.Errorf("invalid UID: %v", err)
			}
			partPaths := make([][]int, len(prevAttachments))
			for i, pathStr := range prevAttachments {
				if partPaths[i], err = parsePartPath(pathStr); err != nil {
					return fmt.Errorf("invalid part path: %v", err)
				}
			}
			// All of them in one read: an autosave carries them every time.
			entities, err := messagePartsWithProvider(p, sourcePath.Mailbox, parsedUid, partPaths)
			if err != nil {
				return fmt.Errorf("failed to fetch attachments %s: %v", strings.Join(prevAttachments, ","), err)
			}
			for i, pathStr := range prevAttachments {
				partPath, entity := partPaths[i], entities[i]

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
					return fmt.Errorf("failed to decode attachment %s: %v", pathStr, err)
				}

				node := &IMAPPartNode{
					Path:     partPath,
					MIMEType: mimeType,
					Filename: filename,
				}
				parts = append(parts, &imapAttachment{
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
				partSources = append(partSources, map[string]string{"partPath": pathStr})
			}
			msg.Attachments = append(msg.Attachments, parts...)
			sources = append(sources, partSources...)
			return nil
		})
		if err != nil {
			return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to fetch previous attachments: " + err.Error()})
		}
	}

	if saveAsDraft {
		// The Bcc actually written, not the field the browser posted: a Bcc
		// entry that does not read is omitted from a draft. Name and Address
		// stay separate so the browser need not decode MIME display names.
		storedBcc, err := prepareAddressList(msg.Bcc)
		if err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "invalid bcc address: " + err.Error()})
		}
		for _, addr := range storedBcc {
			// Keep quoting required by a local part such as "a;b", while
			// leaving the display name plain for the browser to format.
			addr.Address = mailboxAddress(addr)
		}
		var drafts *MailboxInfo
		var uid provider.MessageID
		var size uint32
		var respAttachments []map[string]interface{}
		// Whether the answer can say which stored part each upload became.
		// Without it the composer still names them by id, so they are kept for
		// its next save.
		readBack := false

		// The source of each attachment, by the part path WriteTo gives it
		// (see partPaths).
		sourceAt := make(map[string]map[string]string, len(sources))
		for i, path := range msg.partPaths() {
			sourceAt[path] = sources[i]
		}

		err = doMail(ctx.Request.Context(), func(p provider.MailProvider) error {
			var err error
			drafts, uid, size, err = appendMessageWithProvider(p, msg.asDraft(), provider.MailboxTypeDrafts)
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
				readBack = true
				msgIMAP := providerMessageToIMAP(*newMsg)
				stored := func(a IMAPPartNode) map[string]interface{} {
					path := formatPartPath(a.Path)
					part := map[string]interface{}{
						"name":     a.Filename,
						"size":     a.Size,
						"type":     a.MIMEType,
						"partPath": path,
					}
					if source, ok := sourceAt[path]; ok {
						part["source"] = source
					}
					return part
				}
				for _, a := range msgIMAP.Attachments() {
					respAttachments = append(respAttachments, stored(a))
				}
				// The body's images too, marked inline, so that each inline
				// entry the save carried finds the part it is now stored as.
				// Left out, such an entry would keep a path the new draft does
				// not have.
				for _, a := range msgIMAP.EmbeddedParts() {
					part := stored(a)
					part["inline"] = true
					respAttachments = append(respAttachments, part)
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
		inMessage = readBack

		mailboxesToInvalidate := []string{drafts.Name()}
		if draftPath != nil && draftPath.Mailbox != drafts.Name() {
			mailboxesToInvalidate = append(mailboxesToInvalidate, draftPath.Mailbox)
		}
		invalidateMailboxCache(ctx, mailboxesToInvalidate...)
		if draftPath != nil {
			forgetMessages(ctx.Session.Cache(), draftPath.Mailbox, draftPath.Uid)
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"ok":            true,
			"draft_uid":     uid.String(),
			"draft_mailbox": drafts.Name(),
			"draft_size":    size,
			"draft_bcc":     storedBcc,
			"attachments":   respAttachments,
		})
	}

	// A send the browser has given up on before the message goes is not
	// sent. The composer has already said that the send failed, and is open
	// again for the user to send the message once more: sent now as well, it
	// would go twice. Nothing has changed yet; the draft is where it was.
	if err := ctx.Request.Context().Err(); err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "message not sent: " + err.Error()})
	}

	err := ctx.Session.DoSMTP(func(c *smtp.Client) error {
		// A temporary refusal may outlast the browser's wait. Each new
		// attempt checks again before MAIL, while nothing has been sent.
		if err := ctx.Request.Context().Err(); err != nil {
			return fmt.Errorf("message not sent: %v", err)
		}
		return sendMessage(c, msg)
	})
	if err != nil {
		var authErr provider.AuthError
		if errors.As(err, &authErr) {
			return ctx.JSON(http.StatusForbidden, map[string]string{"error": "Forbidden"})
		}
		return ctx.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to send message: " + err.Error()})
	}
	// Sent. The copy in Sent below still reads them, and they are removed
	// when the request ends, whether that copy is written or not.
	inMessage = true

	// The message has gone. What is left of sending it, the mark on the
	// message it answers, the copy in Sent and the removal of its draft, is
	// done whether or not the browser still waits for the answer. A request
	// given up on does no mail work it has not begun (see DoMailWithContext),
	// but this is the end of work that has: see FinishMail.
	if inReplyToPath != nil {
		var answered provider.MessageID
		err := ctx.Session.FinishMail(ctx.Request.Context(), func(p provider.MailProvider) error {
			parsedReplyUid, err := p.ParseMessageID(inReplyToPath.Uid)
			if err != nil {
				return err
			}
			if err := markMessageAnsweredWithProvider(p, inReplyToPath.Mailbox, parsedReplyUid); err != nil {
				return err
			}
			answered = parsedReplyUid
			return nil
		})
		if err != nil {
			// The reply is sent; the mark is only a mark.
			ctx.Server.Logger().Printf("marking %s/%s answered failed: %v", inReplyToPath.Mailbox, inReplyToPath.Uid, err)
		} else {
			// The mark is patched into the pages the session holds, as a star
			// is. The answered message's folder used to be dropped for it, and
			// read again whole for one flag.
			updateCachedMessageFlags(ctx, inReplyToPath.Mailbox, answered, []imap.Flag{imap.FlagAnswered}, nil)
		}
	}

	var sentName string
	err = ctx.Session.FinishMail(ctx.Request.Context(), func(p provider.MailProvider) error {
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

	// The account's own Sent, which is not always named so, and the folder the
	// sent draft was taken from.
	mailboxesToInvalidate := []string{sentName}
	if draftPath != nil {
		mailboxesToInvalidate = append(mailboxesToInvalidate, draftPath.Mailbox)
	}
	invalidateMailboxCache(ctx, mailboxesToInvalidate...)
	if draftPath != nil {
		forgetMessages(ctx.Session.Cache(), draftPath.Mailbox, draftPath.Uid)
	}
	if inReplyToPath != nil {
		// The answered message's folder keeps its pages, with the mark patched
		// in above, but not its conversations: each was assembled with the
		// replies Sent held then, and reopened, it would not show this one.
		dropConversationsHolding(ctx.Session.Cache(), inReplyToPath.Mailbox)
	}

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
		if errors.Is(err, alps.ErrAttachmentCacheSize) {
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

// messageScope is how a write says which messages it is about: the UIDs the
// client listed, or — from the list's "select all in this folder" — every
// message the folder holds that the listing's own `query` matches, less the
// rows the user then unchecked.
//
// `all` is resolved here, against the mailbox, rather than by the client
// sending thousands of UIDs: the client holds one page of a listing, and what
// it holds goes stale while the user reads it.
type messageScope struct {
	Uids   []string `json:"uids"`
	All    bool     `json:"all"`
	Query  string   `json:"query"`
	Except []string `json:"except"`
}

// problem names what a write cannot be acted on for — one that names no
// messages, and one that names them two ways at once, where only the sender
// knows which it meant — or "" when the scope can be resolved.
func (scope messageScope) problem() string {
	if scope.All && len(scope.Uids) > 0 {
		return "uids_and_all"
	}
	if !scope.All && len(scope.Uids) == 0 {
		return "No messages selected."
	}
	return ""
}

// resolve answers the messages to act on, in the order the mailbox gives them.
func (scope messageScope) resolve(p provider.MailProvider, mboxName string) ([]provider.MessageID, error) {
	if !scope.All {
		ids := make([]provider.MessageID, len(scope.Uids))
		for i, uidStr := range scope.Uids {
			uid, err := p.ParseMessageID(uidStr)
			if err != nil {
				return nil, err
			}
			ids[i] = uid
		}
		return ids, nil
	}

	found, err := p.SearchMessageIDs(mboxName, scope.Query)
	if err != nil {
		return nil, fmt.Errorf("failed to find the messages to act on: %v", err)
	}
	if len(scope.Except) == 0 {
		return found, nil
	}

	except := make(map[string]struct{}, len(scope.Except))
	for _, uid := range scope.Except {
		except[uid] = struct{}{}
	}
	kept := make([]provider.MessageID, 0, len(found))
	for _, id := range found {
		if _, skip := except[id.String()]; !skip {
			kept = append(kept, id)
		}
	}
	return kept, nil
}

// maxScopeBatch is how many messages one command carries. A whole folder can be
// any size, and both the mail server and this session are better served by
// several commands than by one of unbounded length.
const maxScopeBatch = 500

// maxReportedMapping is how many moved messages an answer carries the new UIDs
// for. The client offers Undo with them; past that the table is larger than the
// undo is worth, and the client says so instead.
const maxReportedMapping = 1000

// filedCount is how many messages of batch a move or a copy filed: those the
// provider names in its answer. A message gone since the page listed it is
// passed over by an IMAP server without an error, and was counted all the
// same. A server that names none, as one without UIDPLUS does, has said
// nothing either way, and the batch counts as asked.
func filedCount(mapping map[provider.MessageID]provider.MessageID, batch []provider.MessageID) int {
	if len(mapping) == 0 {
		return len(batch)
	}
	return len(mapping)
}

// inBatches runs fn over the ids, at most maxScopeBatch at a time.
func inBatches(ids []provider.MessageID, fn func([]provider.MessageID) error) error {
	for start := 0; start < len(ids); start += maxScopeBatch {
		end := start + maxScopeBatch
		if end > len(ids) {
			end = len(ids)
		}
		if err := fn(ids[start:end]); err != nil {
			return err
		}
	}
	return nil
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

	var scope messageScope
	var to string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			messageScope
			To string `json:"to"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		scope = req.messageScope
		to = req.To
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		scope.Uids = formParams["uids"]
		to = formOrQueryParam(ctx, "to")
	}

	if problem := scope.problem(); problem != "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": problem})
	}

	if to == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing 'to' parameter")
	}

	moved := 0
	var movedIDs []provider.MessageID
	uidMapping := make(map[string]string)
	err = ctx.Session.DoMailOnceWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		alpsMsgIDs, err := scope.resolve(p, mboxName)
		if err != nil {
			return err
		}
		withMapping := len(alpsMsgIDs) <= maxReportedMapping
		return inBatches(alpsMsgIDs, func(batch []provider.MessageID) error {
			mapping, err := moveMessagesWithProvider(p, mboxName, to, batch)
			if err != nil {
				// What did move is forgotten below all the same.
				for id := range mapping {
					movedIDs = append(movedIDs, id)
				}
				// Wrapped, here as for a copy and a delete, so that the kind
				// of failure the provider names is answered as such: a
				// message that is gone is a 404, as when it is read.
				return fmt.Errorf("failed to move messages: %w", err)
			}
			moved += filedCount(mapping, batch)
			movedIDs = append(movedIDs, batch...)
			if !withMapping {
				return nil
			}
			for k, v := range mapping {
				uidMapping[k.String()] = v.String()
			}
			return nil
		})
	})
	// The folders are read again after a move that failed too: it may have
	// moved some of the messages first, in an earlier batch, or one by one as
	// the maildir provider moves them. They went on listing what had left.
	invalidateMailboxCache(ctx, mboxName, to)
	forgetMessages(ctx.Session.Cache(), mboxName, idStrings(movedIDs)...)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"ok":         true,
		"count":      moved,
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

	var scope messageScope
	var to string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			messageScope
			To string `json:"to"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		scope = req.messageScope
		to = req.To
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		scope.Uids = formParams["uids"]
		to = formOrQueryParam(ctx, "to")
	}

	if problem := scope.problem(); problem != "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": problem})
	}

	if to == "" {
		return alps.NewHTTPError(http.StatusBadRequest, "missing 'to' parameter")
	}

	copied := 0
	uidMapping := make(map[string]string)
	err = ctx.Session.DoMailOnceWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		alpsMsgIDs, err := scope.resolve(p, mboxName)
		if err != nil {
			return err
		}
		withMapping := len(alpsMsgIDs) <= maxReportedMapping
		return inBatches(alpsMsgIDs, func(batch []provider.MessageID) error {
			mapping, err := copyMessagesWithProvider(p, mboxName, to, batch)
			if err != nil {
				return fmt.Errorf("failed to copy messages: %w", err)
			}
			copied += filedCount(mapping, batch)
			if !withMapping {
				return nil
			}
			for k, v := range mapping {
				uidMapping[k.String()] = v.String()
			}
			return nil
		})
	})
	// The destination is read again after a copy that failed too: it may hold
	// some of the copies (see handleMove).
	invalidateMailboxCache(ctx, to)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, map[string]interface{}{
		"ok":         true,
		"count":      copied,
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

	var scope messageScope

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		if err := ctx.BindJSON(&scope); err != nil {
			return ctx.RespondBindError(err)
		}
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}
		scope.Uids = formParams["uids"]
	}

	if problem := scope.problem(); problem != "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": problem})
	}

	deleted := 0
	var deletedIDs []provider.MessageID
	err = ctx.Session.DoMailOnceWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		alpsMsgIDs, err := scope.resolve(p, mboxName)
		if err != nil {
			return err
		}
		return inBatches(alpsMsgIDs, func(batch []provider.MessageID) error {
			err := deleteMessagesWithProvider(p, mboxName, batch)
			// A batch that failed may have deleted some of its messages:
			// what the session holds of any of them is forgotten.
			deletedIDs = append(deletedIDs, batch...)
			if err != nil {
				return fmt.Errorf("failed to delete messages: %w", err)
			}
			deleted += len(batch)
			return nil
		})
	})

	// The folder is read again after a delete that failed too (see
	// handleMove).
	invalidateMailboxCache(ctx, mboxName)
	forgetMessages(ctx.Session.Cache(), mboxName, idStrings(deletedIDs)...)
	if err != nil {
		return err
	}

	return ctx.JSON(http.StatusOK, map[string]any{"ok": "true", "count": deleted})
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

	var discarded int
	err = ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		// Security check: Only allow emptying Trash or Junk
		mailboxes, err := p.ListMailboxes()
		if err != nil {
			return fmt.Errorf("failed to list mailboxes for validation: %v", err)
		}

		if !mayEmptyMailbox(mboxName, mailboxes) {
			return errEmptyNotAllowed
		}

		discarded, err = p.EmptyMailbox(mboxName)
		return err
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

	// Invalidate cache for the mailbox, and every message it held.
	invalidateMailboxCache(ctx, mboxName)
	ctx.Session.Cache().DeletePrefix("message:" + mboxName + ":")

	// How many went, so the client can tell an emptied folder from one that had
	// nothing in it. The two are the same 200 otherwise, and "Mailbox emptied"
	// over a list that still shows mail is the report a user cannot act on: it
	// says the work was done when the only honest answer is that this request
	// found nothing to do.
	return ctx.JSON(http.StatusOK, map[string]any{"ok": "true", "discarded": discarded})
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
		"Address":               ctx.Session.Address(),
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

	var scope messageScope
	var flags []string
	var actionStr string

	if strings.HasPrefix(ctx.Request.Header.Get("Content-Type"), "application/json") {
		var req struct {
			messageScope
			Flags  []string `json:"flags"`
			Action string   `json:"action"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		scope = req.messageScope
		flags = req.Flags
		actionStr = req.Action
	} else {
		formParams, err := ctx.FormParams()
		if err != nil {
			return alps.NewHTTPError(http.StatusBadRequest, err)
		}

		scope.Uids = formParams["uids"]
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

	if problem := scope.problem(); problem != "" {
		return ctx.JSON(http.StatusBadRequest, map[string]string{"error": problem})
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

	// A whole folder is not sent as a list, so this bounds only what a client
	// listed itself; `all` is resolved here and written a batch at a time.
	if len(scope.Uids) > maxFlagUIDs {
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
		alpsMsgIDs, err = scope.resolve(p, mboxName)
		if err != nil {
			return err
		}
		return inBatches(alpsMsgIDs, func(batch []provider.MessageID) error {
			return setMessageFlagsWithProvider(p, mboxName, batch, alpsOp, alpsFlags)
		})
	})
	if err != nil {
		return err
	}

	// A whole folder's worth of messages is not patched into the cache one at a
	// time: the listing is dropped instead, and read again. So is a change
	// that replaces every flag (StoreFlagsSet), whose result is not worked out
	// here. The messages' cached copies carry their flags, and go with it.
	if scope.All || op == imap.StoreFlagsSet {
		invalidateMailboxCache(ctx, mboxName)
		deleteFolderEntries(ctx.Session.Cache(), "message", mboxName)
	} else {
		// Update cached message flags instead of full invalidation
		recount := false
		for _, uid := range alpsMsgIDs {
			if op == imap.StoreFlagsAdd {
				recount = updateCachedMessageFlags(ctx, mboxName, uid, l, nil) || recount
			} else {
				recount = updateCachedMessageFlags(ctx, mboxName, uid, nil, l) || recount
			}
		}
		// Once for the request, however many messages' earlier state was
		// unknown.
		if recount {
			rereadMailboxCounts(ctx, []string{mboxName})
		}
	}

	return ctx.JSON(http.StatusOK, map[string]any{"ok": "true", "count": len(alpsMsgIDs)})
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

// renameSubscriptions is what a folder rename does to subscriptions, worked
// out before the RENAME from the listing as it stood.
type renameSubscriptions struct {
	// unsubscribeOld: the folder is going into Trash, and leaves the
	// subscriptions on its way, so that other clients stop showing a deleted
	// folder among the live ones.
	unsubscribeOld bool
	// subscribe: the names, after the rename, to subscribe to.
	subscribe []string
}

// planRenameSubscriptions keeps a renamed folder's subscriptions with it.
//
// IMAP does not say whether a subscription follows a RENAME, and a server is
// forbidden to drop one by itself (RFC 3501 §6.3.6), so on a server that does
// not carry them over the old name stays subscribed and the new one is not: a
// folder renamed here dropped out of every client that shows subscribed
// folders only. So every folder of the renamed subtree that was subscribed is
// subscribed again under its new name, which is harmless where the server
// has already done it.
//
// Two cases are Trash's. A folder deleted into Trash leaves the subscriptions,
// as it always has here. One taken back out of Trash — the deletion's Undo,
// or a rename by hand — is subscribed again, because it was this unsubscribe
// that took it out of them, and a restored folder would otherwise come back
// missing from those clients.
//
// "Is this rename a move into Trash?" is resolved by IMAP special-use, not by
// testing whether the new name starts with the English word "trash". The
// frontend already resolves the real Trash folder by attribute — see
// findMailboxNameByRole and the issue #4 comment it carries — so the two
// halves of one feature disagreed: on Gmail, where Trash is `[Gmail]/Trash`,
// the unsubscribe that is supposed to accompany the move never happened, and a
// user's own folder named "Trash notes" got it when it should not have.
func planRenameSubscriptions(mailboxes []provider.Mailbox, oldName, newName string) renameSubscriptions {
	if isInTrash(mailboxes, newName) {
		return renameSubscriptions{unsubscribeOld: true}
	}
	outOfTrash := isInTrash(mailboxes, oldName)
	var plan renameSubscriptions
	for _, mb := range mailboxes {
		rest, ok := strings.CutPrefix(mb.Name, oldName)
		if !ok || (rest != "" && (mb.Delimiter == 0 || !strings.HasPrefix(rest, string(mb.Delimiter)))) {
			continue
		}
		if mb.Subscribed || (rest == "" && outOfTrash) {
			plan.subscribe = append(plan.subscribe, newName+rest)
		}
	}
	return plan
}

// isInTrash reports whether `name` is the Trash mailbox or sits beneath it,
// with Trash identified by its \Trash special-use attribute and only falling
// back to the English name when the server advertises none — or when there is
// no listing to read, where unknown would be more honest, but the English name
// is the best guess available.
func isInTrash(mailboxes []provider.Mailbox, name string) bool {
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

// The most folders UnsubscribedFolders holds, and the most bytes their names
// take together. The record is one METADATA entry, which servers cap (64 KiB
// on sora), and every other setting has to fit in it as well. The frontend
// keeps the newest names that fit.
const (
	maxUnsubscribedFolders      = 200
	maxUnsubscribedFoldersBytes = 16 << 10
)

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

	// UnsubscribedFolders names the folders the user unsubscribed from in
	// alps, oldest first. The sidebar puts such a folder behind its More row
	// for as long as the server still lists it unsubscribed. The server's own
	// subscription list cannot answer that by itself: it also holds every
	// folder unsubscribed in another client, and every folder a server that
	// does not subscribe on CREATE was given unsubscribed.
	UnsubscribedFolders []string `json:"unsubscribedFolders,omitempty"`
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
	WeekStart  *int   `json:"week_start,omitempty"`
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
	case err == nil || errors.Is(err, provider.ErrNoStoreEntry):
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
	if s.WeekStart != nil && *s.WeekStart != 0 && *s.WeekStart != 1 {
		return fmt.Errorf("week_start must be 0 or 1")
	}
	if err := checkUnsubscribedFolders(s.UI.UnsubscribedFolders); err != nil {
		return err
	}
	return nil
}

// checkUnsubscribedFolders holds the list to its caps, and to one entry per
// folder: a name is a folder's, and the list is a set kept in order.
func checkUnsubscribedFolders(names []string) error {
	if len(names) > maxUnsubscribedFolders {
		return fmt.Errorf("unsubscribed folders: at most %d, not %d", maxUnsubscribedFolders, len(names))
	}
	seen := make(map[string]bool, len(names))
	size := 0
	for _, name := range names {
		if name == "" {
			return fmt.Errorf("unsubscribed folders: a folder without a name")
		}
		if seen[name] {
			return fmt.Errorf("unsubscribed folders: %q twice", name)
		}
		seen[name] = true
		size += len(name)
	}
	if size > maxUnsubscribedFoldersBytes {
		return fmt.Errorf("unsubscribed folders: names take %d bytes, at most %d", size, maxUnsubscribedFoldersBytes)
	}
	return nil
}

// listingSettings is everything about a listing that the settings decide: how
// many messages a page holds, the order they are in, and whether rows are
// conversations. A cached page is only wrong if one of these changed.
func listingSettings(s *Settings) [4]string {
	threading := "server"
	if s.UI.EnableThreading != nil {
		threading = strconv.FormatBool(*s.UI.EnableThreading)
	}
	return [4]string{strconv.Itoa(s.MessagesPerPage), s.SortOrder, s.MessageSortCriteria, threading}
}

func parseWeekStartOption(val interface{}) int {
	switch v := val.(type) {
	case int:
		if v == 0 || v == 1 {
			return v
		}
	case int64:
		if v == 0 || v == 1 {
			return int(v)
		}
	case float64:
		if v == 0 || v == 1 {
			return int(v)
		}
	case string:
		switch strings.ToLower(strings.TrimSpace(v)) {
		case "0", "sunday", "sun":
			return 0
		case "1", "monday", "mon":
			return 1
		}
	}
	return 1
}

func handleSettings(ctx *alps.Context) error {
	settings, err := readFreshSettings(ctx)
	if err != nil {
		return fmt.Errorf("failed to load settings: %v", err)
	}

	if ctx.Request.Method == http.MethodPut {
		// What a cached listing page was READ under, before this write changes
		// anything: see the invalidation below.
		listedAs := listingSettings(settings)

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
				WeekStart           *int    `json:"week_start"`
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
				// An empty list is a list: the last folder subscribed to again.
				if req.UI.UnsubscribedFolders != nil {
					settings.UI.UnsubscribedFolders = req.UI.UnsubscribedFolders
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
			if req.WeekStart != nil && (*req.WeekStart == 0 || *req.WeekStart == 1) {
				settings.WeekStart = req.WeekStart
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
			if ws := ctx.FormValue("week_start"); ws != "" {
				if parsed, err := strconv.Atoi(ws); err == nil && (parsed == 0 || parsed == 1) {
					settings.WeekStart = &parsed
				}
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

		// Only when this write changed what a listing IS.
		//
		// Every settings write dropped every cached page of every mailbox —
		// and the frontend writes settings for things that have nothing to do
		// with listings: the theme, the layout, the signature, and once per
		// sign-in the address it just learned. The page a reader is looking at
		// was thrown away seconds after it was read, every time, and with it
		// the conversations assembled from it (see listedThreadUIDs).
		if listedAs != listingSettings(settings) {
			cache := ctx.Session.Cache()
			for _, key := range cache.GetKeysWithPrefix("messages:") {
				cache.Delete(key)
			}
			for _, key := range cache.GetKeysWithPrefix("thread:") {
				cache.Delete(key)
			}
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

	if settings.WeekStart == nil {
		weekStart := 1
		if caldavCfg, ok := ctx.Server.Options.Plugins["caldav"]; ok && caldavCfg.Options != nil {
			if v, exists := caldavCfg.Options["week_start"]; exists {
				weekStart = parseWeekStartOption(v)
			} else if v, exists := caldavCfg.Options["first_day_of_week"]; exists {
				weekStart = parseWeekStartOption(v)
			}
		}
		settings.WeekStart = &weekStart
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
		// Whether the pages are to open the event stream (see handleEvents).
		"PushNewMail": ctx.Server.Sessions.PushNewMail(),
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
		var authErr provider.AuthError
		if errors.Is(err, alps.ErrAccountAlreadyLinked) {
			errorMsg = "This account is already linked"
		} else if errors.Is(err, alps.ErrCannotLinkSelf) {
			errorMsg = "You cannot link your own account"
		} else if errors.As(err, &authErr) {
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

		ctx.Server.Logger().Slog().Info("account switch awaits second factor",
			"user", ctx.Session.Username(),
			"to", targetUsername,
			"ip", ctx.ClientIP(),
			"session", newSession.ID())

		// Close the old session
		ctx.Session.CloseWithReason("switched")

		// Clear the old session cookie so Auth middleware doesn't try to restore it
		ctx.SetSession(nil)

		// Don't set the session cookie yet - will be set after 2FA verification
		return ctx.JSON(http.StatusOK, map[string]interface{}{"requires_2fa": true})
	}

	// No 2FA (or trusted linked account) - complete the switch immediately
	ctx.Server.Logger().Slog().Info("account switch",
		"user", ctx.Session.Username(),
		"to", targetUsername,
		"ip", ctx.ClientIP(),
		"session", newSession.ID(),
		"2fa_trusted", skipTwoFA)

	// Close the old session
	ctx.Session.CloseWithReason("switched")

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
