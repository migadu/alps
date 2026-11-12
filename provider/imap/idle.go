package imap

import (
	"errors"
	"fmt"
	"net"
	"os"
	"sync/atomic"
	"time"

	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
	"github.com/migadu/go-imap/imapclient"
)

var _ provider.Idler = (*IMAPProvider)(nil)

// defaultResponseTimeout bounds waits for the server's answers on a
// connection made without a timeout of its own, matching the client's
// default response timeout.
const defaultResponseTimeout = 30 * time.Second

// mailboxNews passes on what the mail server says unasked about the mailbox
// selected on a connection, of messages that arrived or went: EXISTS and
// EXPUNGE, which IDLE is for (see IMAPProvider.OnMailboxNews). Where the
// folders are watched too, it passes on the news of the others, which comes
// as STATUS (see folderWatch). The client takes its handlers when it is
// made, so this is made before the connection and told of it once it is.
//
// A FETCH the server sends unasked says that flags changed. It is no news
// here, and the client discards it, as it did before: the poll keeps flags
// current, and a message read here is announced back by the server soon
// after, which every page would have read the Inbox again for.
type mailboxNews struct {
	client atomic.Pointer[imapclient.Client]
	news   atomic.Pointer[func(mailbox string)]
	// heard says that the server has told of a message that arrived or went
	// since the last IDLE ended (see Idle).
	heard atomic.Bool
	// told counts the messages the server has told of, unasked, as arriving
	// or going (see selectedStatus).
	told atomic.Uint64
	// folders is what is known of the folders the server tells of, once
	// they are watched (see IMAPProvider.WatchFolders).
	folders folderWatch
}

func (n *mailboxNews) handler() *imapclient.UnilateralDataHandler {
	return &imapclient.UnilateralDataHandler{
		Mailbox: func(data *imapclient.UnilateralDataMailbox) {
			// EXISTS. A changed list of flags the mailbox knows is no news of
			// its messages.
			if data.NumMessages != nil {
				n.told.Add(1)
				n.heard.Store(true)
				n.tell()
			}
		},
		Expunge: func(uint32) {
			n.told.Add(1)
			n.heard.Store(true)
			n.tell()
		},
		Status: func(data *imap.StatusData) {
			if n.folders.heardStatus(data) {
				n.tellOf(data.Mailbox)
			}
		},
		NotificationOverflow: n.folders.overflowed,
	}
}

// tell passes the news on, naming the mailbox selected now. The handlers run
// on the connection's reader, and the client has recorded the change before
// it calls one, and any SELECT answered before it (see selectMailbox): the
// client's own record is the one to go by here.
func (n *mailboxNews) tell() {
	c, news := n.client.Load(), n.news.Load()
	if c == nil || news == nil {
		return
	}
	if mbox := c.Mailbox(); mbox != nil {
		(*news)(mbox.Name)
	}
}

// tellOf passes on news of mailbox, which the caller names: a folder the
// server told of with STATUS, or the one an IDLE selected.
func (n *mailboxNews) tellOf(mailbox string) {
	if news := n.news.Load(); news != nil {
		(*news)(mailbox)
	}
}

// idledMailbox is what a mailbox was as the last IDLE on it ended: how many
// messages it held, its UIDVALIDITY and UIDNEXT, and which select of it that
// was (see IMAPProvider.selects).
type idledMailbox struct {
	known       bool
	mailbox     string
	count       uint32
	uidValidity uint32
	uidNext     imap.UID
	selects     uint64
}

// CanIdle reports whether the mail server can tell of changes to a mailbox as
// they happen (IDLE, part of IMAP4rev2). A connection made without the news
// handler cannot hear them. Capabilities that could not be read say nothing
// either way: that is an error, not a server without IDLE.
func (p *IMAPProvider) CanIdle() (bool, error) {
	if p.client == nil || p.news == nil {
		return false, nil
	}
	caps := p.client.Caps()
	if caps == nil {
		// Gone, as often as not: then it is let go of (see lostIf).
		return false, p.lostIf(errors.New("imap: the server's capabilities could not be read"))
	}
	return caps.Has(imap.CapIdle) || caps.Has(imap.CapIMAP4rev2), nil
}

// OnMailboxNews: see provider.Idler. nil stops the news.
func (p *IMAPProvider) OnMailboxNews(news func(mailbox string)) {
	if p.news == nil {
		return
	}
	if news == nil {
		p.news.news.Store(nil)
		return
	}
	p.news.news.Store(&news)
}

// Idle: see provider.Idler.
//
// What changed while no IDLE ran was not always told. While the connection
// was in another mailbox, the server said nothing of this one, and a SELECT
// of it, the IDLE's own or a background job's, tells only what it holds now.
// So an IDLE that selected the mailbox again, or found it selected again
// since the last IDLE on it ended, compares what it holds now with what it
// held then: another count, UIDVALIDITY or UIDNEXT is news. UIDNEXT tells of a
// message that came as another went, which leaves the count as it was. While
// the mailbox stayed selected the server told of every change, and nothing is
// compared.
//
// The UIDNEXT recorded is the server's. The one the mailbox was selected with
// falls behind once an arrival has been told of, and selected again, the
// mailbox read as changed for that arrival, told of already: every page
// dropped what it held of the Inbox for nothing. So an IDLE that ends after
// news asks the server for the mailbox's UIDNEXT (STATUS).
//
// Where the folders are watched (see WatchFolders) and the server stops
// telling of them, the wait ends too, for the session to ask again.
//
// The client bounds every answer, including the continuation to IDLE and the
// answer to DONE, by the connection's response timeout. Its half-hour IDLE
// deadline applies only while waiting for news after the continuation. Either
// answer left pending past the response timeout loses the connection: it is
// closed, and the error says so whichever deadline fires first.
func (p *IMAPProvider) Idle(mailbox string, stop <-chan struct{}, started func()) error {
	select {
	case <-stop:
		return nil
	default:
	}
	if err := p.ensureMailboxSelected(mailbox); err != nil {
		return p.lostIf(err)
	}
	p.tellWhatChangedMeanwhile(mailbox)

	var cmd *imapclient.IdleCommand
	err := p.answeredWithin("IDLE", func() (err error) {
		cmd, err = p.client.Idle()
		return err
	})
	if err != nil {
		return p.lostIf(err)
	}
	if started != nil {
		started()
	}
	var unwatched <-chan struct{}
	if p.news != nil {
		unwatched = p.news.folders.stopped()
	}
	select {
	case <-stop:
	case <-p.client.Closed():
	case <-unwatched:
	}
	if err = p.answeredWithin("DONE", func() error {
		closeErr := cmd.Close()
		err := cmd.Wait()
		if err == nil {
			err = closeErr
		}
		return err
	}); errors.Is(err, errUnanswered) {
		return err
	}

	if rememberErr := p.rememberIdled(err == nil); err == nil {
		err = rememberErr
	}
	return p.lostIf(err)
}

// rememberIdled records what the selected mailbox is as an IDLE on it ends
// (see Idle). With ask, the server may be asked for its UIDNEXT.
func (p *IMAPProvider) rememberIdled(ask bool) error {
	mbox := p.client.Mailbox()
	if mbox == nil {
		return nil
	}
	uidNext := p.selectedUIDNext
	if was := p.idled; was.known && was.mailbox == mbox.Name && was.selects == p.selects {
		// The same select: what was learnt of it then still stands.
		uidNext = was.uidNext
	}
	if p.news != nil && p.news.heard.Swap(false) && ask {
		var status *imap.StatusData
		err := p.answeredWithin("STATUS", func() (err error) {
			status, err = p.client.Status(mbox.Name, &imap.StatusOptions{UIDNext: true}).Wait()
			return err
		})
		if err != nil {
			// A tagged refusal keeps the conservative selected UIDNEXT. A
			// half-open or lost connection must free the session's background
			// slot, as an unanswered IDLE or DONE does.
			var refused *imap.Error
			if !errors.As(err, &refused) || (refused.Type != imap.StatusResponseTypeNo && refused.Type != imap.StatusResponseTypeBad) {
				// A failed command can be released before the reader closes
				// its Closed channel. Finish closing before classifying it.
				p.client.Close()
				return p.lostIf(err)
			}
		} else if status.UIDNext != 0 {
			uidNext = status.UIDNext
		}
	}
	// STATUS can receive another EXISTS or EXPUNGE before its answer. The
	// handler already told of it; record that newer count with the UIDNEXT
	// learnt above rather than announcing the same change after a reselect.
	mbox = p.client.Mailbox()
	if mbox == nil {
		return nil
	}
	p.idled = idledMailbox{
		known:       true,
		mailbox:     mbox.Name,
		count:       mbox.NumMessages,
		uidValidity: p.selectedUIDValidity,
		uidNext:     uidNext,
		selects:     p.selects,
	}
	return nil
}

// errUnanswered marks a command the server left unanswered (see Idle).
var errUnanswered = errors.New("imap: no answer in time")

// answeredWithin runs wait, which waits for the server's answer to what, for
// no longer than the connection's response timeout. Its timer and the client's
// read deadline use the same timeout. Whichever fires first closes the
// connection and returns the same unanswered, lost-connection error.
func (p *IMAPProvider) answeredWithin(what string, wait func() error) error {
	answered := make(chan error, 1)
	go func() { answered <- wait() }()
	timeout := p.responseTimeout
	if timeout <= 0 {
		timeout = defaultResponseTimeout
	}
	timer := time.NewTimer(timeout)
	defer timer.Stop()
	unanswered := func() error {
		// The client releases failed commands before closing its Closed channel.
		// Finish closing before callers classify the answer as a lost connection.
		p.client.Close()
		return fmt.Errorf("%w: %s within %v, connection closed: %w", errUnanswered, what, timeout, net.ErrClosed)
	}
	select {
	case err := <-answered:
		if errors.Is(err, os.ErrDeadlineExceeded) {
			return unanswered()
		}
		return err
	case <-timer.C:
		err := unanswered()
		<-answered
		return err
	}
}

// lostIf marks err as a network error when the connection has closed under
// it. The client's own error says so not always in a way a caller can tell:
// a failed SELECT is reported as text.
func (p *IMAPProvider) lostIf(err error) error {
	if err == nil {
		return nil
	}
	select {
	case <-p.client.Closed():
		if !errors.Is(err, net.ErrClosed) {
			return fmt.Errorf("%v: %w", err, net.ErrClosed)
		}
	default:
	}
	return err
}

// tellWhatChangedMeanwhile passes on, as news of mailbox, a difference
// between what it holds now, as selected, and what it was as the last IDLE
// on it ended. See Idle.
func (p *IMAPProvider) tellWhatChangedMeanwhile(mailbox string) {
	was, now := p.idled, p.client.Mailbox()
	if p.news == nil || now == nil || !was.known || was.mailbox != mailbox || was.selects == p.selects {
		return
	}
	if now.NumMessages != was.count || p.selectedUIDValidity != was.uidValidity || p.selectedUIDNext != was.uidNext {
		p.news.tellOf(mailbox)
	}
}
