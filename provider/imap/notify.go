package imap

import (
	"errors"
	"fmt"
	"sync"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

var _ provider.FolderWatcher = (*IMAPProvider)(nil)

// folderEvents are what the folders are watched for: messages that arrive
// and go. FlagChange is left out: flags come with the poll, as with IDLE (see
// mailboxNews), and with it the server would also send FETCH responses for
// the mailbox selected at any time, which the client takes for a FETCH's own
// answer when one of the messages it asked for is among them.
var folderEvents = []imap.NotifyEvent{imap.NotifyEventMessageNew, imap.NotifyEventMessageExpunge}

// folderWatch is what a connection knows of the mailboxes its server tells of
// unasked (NOTIFY, RFC 5465), as part of mailboxNews.
//
// The server tells of a change to a mailbox other than the one selected with
// a STATUS of it. Sora sends one for any change, a flag set or cleared among
// them, with the same counts, so a STATUS is news only when its count, its
// UIDNEXT or its UIDVALIDITY differs from the last one known: a message came,
// went, came as another went, or the mailbox was made again. What the server
// first says of a mailbox is how it is, not how it changed, and no news: the
// STATUS that NOTIFY SET STATUS answers with, for every mailbox watched, and
// the first of a mailbox subscribed since.
//
// A STATUS the connection asks for itself, for a page's check, takes in the
// server's news of that mailbox that comes meanwhile (see
// imapclient.UnilateralDataHandler.Status), which is then not passed on: the
// check has found what changed. The next news of it is compared with what
// was known before, and may be told although nothing moved since the check.
type folderWatch struct {
	mu sync.Mutex
	// on says that the server tells of the folders now; refused that it
	// would not, on this connection. lost is closed when it stops
	// (NOTIFICATIONOVERFLOW), and replaced as the watch begins again.
	on, refused bool
	lost        chan struct{}
	known       map[string]folderCounts
}

// folderCounts is what is known of a mailbox: 0 is not known, but for the
// count, which hasMessages says.
type folderCounts struct {
	messages    uint32
	hasMessages bool
	uidNext     imap.UID
	uidValidity uint32
}

// heardStatus records what the server said unasked of a mailbox, and reports
// whether it is news of it (see folderWatch). It runs on the connection's
// reader.
func (fw *folderWatch) heardStatus(data *imap.StatusData) bool {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	was, known := fw.known[data.Mailbox]
	now := was
	if data.NumMessages != nil {
		now.messages, now.hasMessages = *data.NumMessages, true
	}
	if data.UIDNext != 0 {
		now.uidNext = data.UIDNext
	}
	if data.UIDValidity != 0 {
		now.uidValidity = data.UIDValidity
	}
	if fw.known == nil {
		fw.known = make(map[string]folderCounts)
	}
	fw.known[data.Mailbox] = now
	if !known {
		return false
	}
	return was.hasMessages && now.hasMessages && was.messages != now.messages ||
		was.uidNext != 0 && now.uidNext != 0 && was.uidNext != now.uidNext ||
		was.uidValidity != 0 && now.uidValidity != 0 && was.uidValidity != now.uidValidity
}

// left records what a mailbox held as the connection selected another: the
// server told of every message that arrived or went while it was selected,
// and once it is no longer, it tells of the mailbox with a STATUS again, as
// it now is. Compared with what was known before it was selected, the news
// already told was told again, of the Inbox each time a job selected
// elsewhere, and every page checked it. Its UIDNEXT is not known: the one it
// was selected with is behind any arrival told since.
func (fw *folderWatch) left(mailbox string, count, uidValidity uint32) {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	if !fw.on {
		return
	}
	if fw.known == nil {
		fw.known = make(map[string]folderCounts)
	}
	fw.known[mailbox] = folderCounts{messages: count, hasMessages: true, uidValidity: uidValidity}
}

// overflowed says the server has stopped telling of the folders, as it may
// when there is more to tell than it will (RFC 5465 §5.8): until asked again
// it says no more. It runs on the connection's reader.
func (fw *folderWatch) overflowed() {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	if fw.on {
		fw.on = false
		close(fw.lost)
	}
}

// stopped is closed once the server stops telling of the folders, and
// already when it has; nil when they were never watched (see Idle).
func (fw *folderWatch) stopped() <-chan struct{} {
	fw.mu.Lock()
	defer fw.mu.Unlock()
	return fw.lost
}

// WatchFolders: see provider.FolderWatcher.
//
// One NOTIFY SET for the connection's life, unless the server stops: for the
// messages that arrive and go in the mailbox selected, as IDLE tells of them,
// and in the subscribed mailboxes. With the STATUS indicator the server first
// says how each mailbox it watches is (see folderWatch).
func (p *IMAPProvider) WatchFolders() (watched, begun bool, err error) {
	if p.client == nil || p.news == nil {
		return false, false, nil
	}
	fw := &p.news.folders
	fw.mu.Lock()
	on, refused := fw.on, fw.refused
	fw.mu.Unlock()
	switch {
	case on:
		return true, false, nil
	case refused:
		return false, false, nil
	}
	caps := p.client.Caps()
	if caps == nil {
		return false, false, p.lostIf(errors.New("imap: the server's capabilities could not be read"))
	}
	if !caps.Has(imap.CapNotify) {
		return false, false, nil
	}

	// On before the command: the STATUS responses that come before its OK
	// are read meanwhile.
	fw.mu.Lock()
	fw.on, fw.lost = true, make(chan struct{})
	fw.mu.Unlock()
	err = p.answeredWithin("NOTIFY", func() error {
		cmd, err := p.client.Notify(&imap.NotifyOptions{
			Status: true,
			Items: []imap.NotifyItem{
				{MailboxSpec: imap.NotifyMailboxSpecSelected, Events: folderEvents},
				{MailboxSpec: imap.NotifyMailboxSpecSubscribed, Events: folderEvents},
			},
		})
		if err != nil {
			return err
		}
		return cmd.Wait()
	})
	if err == nil {
		return true, true, nil
	}
	fw.mu.Lock()
	fw.on = false
	var refusal *imap.Error
	if errors.As(err, &refusal) && (refusal.Type == imap.StatusResponseTypeNo || refusal.Type == imap.StatusResponseTypeBad) {
		fw.refused = true
	}
	refused = fw.refused
	fw.mu.Unlock()
	if refused {
		return false, false, fmt.Errorf("imap: NOTIFY refused: %w", err)
	}
	return false, false, p.lostIf(err)
}
