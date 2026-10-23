package alpsbase

import (
	"errors"
	"slices"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// reflaggedPage brings a page the session holds up to date with the flags
// that changed since it was read, for a folder that holds the messages it
// held then (reflaggedOnly), and keeps it at counts.
//
// The page was dropped, or kept as it was, by its counts alone. A flag
// changed in another client that left the unread count as it was, a star, was
// then not listed until the cache expired, and one that moved it dropped every
// page of the folder: the next listing read the page again in full, its
// conversations threaded again. The mail server answers which of the page's
// messages changed since the change number the page was read at, in one
// FETCH that answers no more than the page's messages (see
// provider.ChangeTracker).
//
// The page is kept as patched only when nothing changed it meanwhile: a flag
// change of the session's own patches it in place (applyFlagsToCache), and
// the flags read here may be from before that change. Then the patched page
// is answered and not kept, and the next listing asks again.
func reflaggedPage(ctx *alps.Context, key string, page CachedMessages, counts mailboxCounts) (CachedMessages, error) {
	var ids []provider.MessageID
	for _, row := range page.Messages {
		if row.ID != nil {
			ids = append(ids, row.ID)
		}
		for _, sub := range row.SubMessages {
			if sub.ID != nil {
				ids = append(ids, sub.ID)
			}
		}
	}

	var changed []provider.Message
	err := ctx.Session.DoMailWithContext(ctx.Request.Context(), func(p provider.MailProvider) error {
		tracker, ok := p.(provider.ChangeTracker)
		if !ok {
			return errors.New("the mail provider numbers no changes")
		}
		var err error
		changed, err = tracker.ChangedFlags(page.Mailbox, ids, page.Counts.HighestModSeq)
		return err
	})
	if err != nil {
		return page, err
	}

	flags := make(map[string][]provider.Flag, len(changed))
	for _, m := range changed {
		if m.ID != nil {
			flags[m.ID.String()] = m.Flags
		}
	}
	read, rows := page.Counts, page.Messages
	page.Messages = withChangedFlags(rows, flags)
	page.Counts = counts

	kept := false
	cache := ctx.Session.Cache()
	cache.Update(key, func(cached interface{}) interface{} {
		held, ok := cached.(CachedMessages)
		if !ok || held.Counts != read || !sameRows(held.Messages, rows) {
			return cached
		}
		kept = true
		return page
	})
	if kept {
		layChangedFlags(cache, page.Mailbox, flags)
	}
	return page, nil
}

// withChangedFlags answers a copy of rows with the flags given for any of
// them, or for any message behind them (SubMessages). rows are left as they
// are: a request may be answering from them.
func withChangedFlags(rows []provider.Message, flags map[string][]provider.Flag) []provider.Message {
	if len(flags) == 0 {
		return rows
	}
	rows = slices.Clone(rows)
	for i := range rows {
		if rows[i].ID != nil {
			if f, ok := flags[rows[i].ID.String()]; ok {
				rows[i].Flags = slices.Clone(f)
			}
		}
		subs := rows[i].SubMessages
		for j := range subs {
			if subs[j].ID == nil {
				continue
			}
			if f, ok := flags[subs[j].ID.String()]; ok {
				if &subs[0] == &rows[i].SubMessages[0] {
					rows[i].SubMessages = slices.Clone(subs)
				}
				rows[i].SubMessages[j].Flags = slices.Clone(f)
			}
		}
	}
	return rows
}

// sameRows reports whether a and b are one list, not two lists alike: the
// cached copies are changed by publishing new ones, never in place (see
// applyFlagsToCache).
func sameRows(a, b []provider.Message) bool {
	return len(a) == len(b) && (len(a) == 0 || &a[0] == &b[0])
}

// layChangedFlags lays flags the mail server answered for messages of mailbox
// over the session's other copies of them: each message's own entry and the
// parts read with it (handleGetPart), and the conversations that hold it
// (handleGetThread).
func layChangedFlags(cache *alps.Cache, mailbox string, flags map[string][]provider.Flag) {
	if len(flags) == 0 {
		return
	}
	prefix := "message:" + mailbox + ":"
	for _, key := range cache.GetKeysWithPrefix(prefix) {
		// message:<mailbox>:<uid>:[<part>]; a folder whose name goes on from
		// this one's with a colon has keys with this prefix too, and is told
		// apart by the folder its entries name.
		uid, _, ok := strings.Cut(strings.TrimPrefix(key, prefix), ":")
		f, changed := flags[uid]
		if !ok || !changed {
			continue
		}
		cache.Update(key, func(cached interface{}) interface{} {
			part, ok := cached.(CachedMessagePart)
			if !ok || part.Message == nil || part.Mailbox != mailbox {
				return cached
			}
			message := *part.Message
			message.Flags = slices.Clone(f)
			part.Message = &message
			return part
		})
	}

	for _, key := range cache.GetKeysWithPrefix("thread:") {
		cache.Update(key, func(cached interface{}) interface{} {
			msgs, ok := cached.([]IMAPMessage)
			if !ok {
				return cached
			}
			var updated []IMAPMessage
			for i := range msgs {
				f, changed := flags[msgs[i].AlpsUID]
				if !changed || msgs[i].Mailbox != mailbox || msgs[i].FetchMessageBuffer == nil {
					continue
				}
				if updated == nil {
					updated = slices.Clone(msgs)
				}
				message := *msgs[i].FetchMessageBuffer
				message.Flags = make([]imap.Flag, len(f))
				for j, flag := range f {
					message.Flags[j] = imap.Flag(flag)
				}
				updated[i].FetchMessageBuffer = &message
			}
			if updated == nil {
				return cached
			}
			return updated
		})
	}
}
