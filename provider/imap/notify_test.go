package imap

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"net"
	"reflect"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
)

// notifyServer is a raw IMAP server that can watch mailboxes (NOTIFY) and
// tells of them as Sora does: a STATUS for every change to a mailbox other
// than the one selected, a flag changed included, with the same counts.
// What it tells, and when, is the test's to say (send).
type notifyServer struct {
	ln net.Listener
	// noNotify has the server not advertise NOTIFY; refuse has it answer
	// NOTIFY with NO.
	noNotify, refuse bool
	// initial is what NOTIFY SET STATUS answers with before its OK.
	initial []string
	// status supplies a fresh UIDNEXT snapshot after selected news.
	status map[string]string

	mu       sync.Mutex
	notifies []string // the NOTIFY commands, without their tags
	w        *bufio.Writer
	idleTag  string
}

// notifyMailboxes are what SELECT answers of each mailbox: its count,
// UIDVALIDITY and UIDNEXT.
var notifyMailboxes = map[string][3]string{
	"INBOX":   {"3", "11", "100"},
	"Sent":    {"7", "22", "200"},
	"Archive": {"4", "33", "300"},
}

func newNotifyServer(t *testing.T, configure func(*notifyServer)) *notifyServer {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	srv := &notifyServer{ln: ln}
	if configure != nil {
		configure(srv)
	}
	var conns []net.Conn
	var connsMu sync.Mutex
	go func() {
		for {
			c, err := ln.Accept()
			if err != nil {
				return
			}
			connsMu.Lock()
			conns = append(conns, c)
			connsMu.Unlock()
			go srv.serve(c)
		}
	}()
	t.Cleanup(func() {
		ln.Close()
		connsMu.Lock()
		defer connsMu.Unlock()
		for _, c := range conns {
			c.Close()
		}
	})
	return srv
}

func (srv *notifyServer) serve(c net.Conn) {
	caps := "IMAP4rev1 IDLE NOTIFY"
	if srv.noNotify {
		caps = "IMAP4rev1 IDLE"
	}
	srv.mu.Lock()
	srv.w = bufio.NewWriter(c)
	srv.mu.Unlock()
	srv.send("* OK [CAPABILITY " + caps + "] ready")
	r := bufio.NewReader(c)
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			return
		}
		line = strings.TrimRight(line, "\r\n")
		if strings.EqualFold(line, "DONE") {
			srv.mu.Lock()
			tag := srv.idleTag
			srv.mu.Unlock()
			srv.send(tag + " OK idle done")
			continue
		}
		parts := strings.SplitN(line, " ", 3)
		if len(parts) < 2 {
			continue
		}
		tag, cmd, rest := parts[0], strings.ToUpper(parts[1]), ""
		if len(parts) == 3 {
			rest = parts[2]
		}
		switch cmd {
		case "LOGIN":
			srv.send(tag + " OK [CAPABILITY " + caps + "] logged in")
		case "CAPABILITY":
			srv.send("* CAPABILITY " + caps)
			srv.send(tag + " OK done")
		case "NOTIFY":
			srv.mu.Lock()
			srv.notifies = append(srv.notifies, rest)
			srv.mu.Unlock()
			if srv.refuse {
				srv.send(tag + " NO [BADEVENT (FlagChange)] not here")
				continue
			}
			for _, status := range srv.initial {
				srv.send(status)
			}
			srv.send(tag + " OK watching")
		case "SELECT":
			mbox, ok := notifyMailboxes[strings.Trim(rest, `"`)]
			if !ok {
				srv.send(tag + " NO no such mailbox")
				continue
			}
			srv.send("* " + mbox[0] + " EXISTS")
			srv.send("* OK [UIDVALIDITY " + mbox[1] + "] ok")
			srv.send("* OK [UIDNEXT " + mbox[2] + "] ok")
			srv.send(tag + " OK [READ-WRITE] selected")
		case "STATUS":
			if status := srv.status[strings.Trim(strings.Fields(rest)[0], `"`)]; status != "" {
				srv.send(status)
			}
			srv.send(tag + " OK status done")
		case "IDLE":
			srv.mu.Lock()
			srv.idleTag = tag
			srv.mu.Unlock()
			srv.send("+ idling")
		case "LOGOUT":
			srv.send("* BYE bye")
			srv.send(tag + " OK bye")
			c.Close()
			return
		default:
			srv.send(tag + " OK done")
		}
	}
}

// send has the server say line, on the last connection, now.
func (srv *notifyServer) send(line string) {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	srv.w.WriteString(line + "\r\n")
	srv.w.Flush()
}

func (srv *notifyServer) notifyCommands() []string {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	return append([]string(nil), srv.notifies...)
}

func (srv *notifyServer) dial(t *testing.T) *IMAPProvider {
	t.Helper()
	opts, err := (&Config{Server: "imap+insecure://" + srv.ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	mp, err := opts.CreateFactory(5*time.Second, false)("ada", "pass")
	if err != nil {
		t.Fatal(err)
	}
	p := mp.(*IMAPProvider)
	t.Cleanup(func() { p.client.Close() })
	return p
}

// awaitNews waits until the provider has passed on news of mailbox, and
// answers all the news it passed on, in order. What the server said before
// has been read by then: the client reads what it says in order.
func (h *heard) awaitNews(t *testing.T, mailbox string) []string {
	t.Helper()
	timeout := time.After(3 * time.Second)
	for {
		h.mu.Lock()
		for _, news := range h.news {
			if news == mailbox {
				defer h.mu.Unlock()
				return append([]string(nil), h.news...)
			}
		}
		h.mu.Unlock()
		select {
		case <-h.came:
		case <-timeout:
			t.Fatalf("no news of %s came", mailbox)
		}
	}
}

// watched has p watch the folders, and fails the test unless it began to now.
func watched(t *testing.T, p *IMAPProvider) {
	t.Helper()
	ok, begun, err := p.WatchFolders()
	if err != nil || !ok || !begun {
		t.Fatalf("WatchFolders = %v, %v, %v; want the folders watched from now on", ok, begun, err)
	}
}

// The folders are watched with one NOTIFY, on a connection to a server that
// has it: for the messages that arrive and go, in the mailbox selected and
// in the subscribed ones, and for no flag changed. Asked again, the
// connection is watching already, and nothing more is sent.
func TestWatchFolders_AsksOnceForTheSelectedAndTheSubscribedMailboxes(t *testing.T) {
	srv := newNotifyServer(t, nil)
	p := srv.dial(t)

	watched(t, p)
	ok, begun, err := p.WatchFolders()
	if err != nil || !ok || begun {
		t.Fatalf("asked again, WatchFolders = %v, %v, %v; want watched, not begun again", ok, begun, err)
	}
	want := []string{"SET STATUS (SELECTED (MessageNew MessageExpunge)) (SUBSCRIBED (MessageNew MessageExpunge))"}
	if got := srv.notifyCommands(); !reflect.DeepEqual(got, want) {
		t.Errorf("NOTIFY sent %q, want %q", got, want)
	}
}

// A server without NOTIFY is not asked, and the folders go unwatched.
func TestWatchFolders_NotWhereTheServerCannot(t *testing.T) {
	srv := newNotifyServer(t, func(srv *notifyServer) { srv.noNotify = true })
	p := srv.dial(t)

	ok, begun, err := p.WatchFolders()
	if err != nil || ok || begun {
		t.Fatalf("WatchFolders = %v, %v, %v; want unwatched, and no error", ok, begun, err)
	}
	if got := srv.notifyCommands(); len(got) > 0 {
		t.Errorf("NOTIFY sent %q to a server without it", got)
	}
}

// A NOTIFY refused is said once, and not asked again on the connection,
// which goes on as before.
func TestWatchFolders_ARefusalIsNotAskedAgain(t *testing.T) {
	srv := newNotifyServer(t, func(srv *notifyServer) { srv.refuse = true })
	p := srv.dial(t)

	ok, _, err := p.WatchFolders()
	if ok || err == nil {
		t.Fatalf("WatchFolders = %v, %v; want unwatched, and the refusal said", ok, err)
	}
	if errors.Is(err, net.ErrClosed) {
		t.Fatalf("a refusal reads as a lost connection: %v", err)
	}
	ok, _, err = p.WatchFolders()
	if ok || err != nil {
		t.Fatalf("asked again, WatchFolders = %v, %v; want unwatched, and nothing said", ok, err)
	}
	if got := srv.notifyCommands(); len(got) != 1 {
		t.Errorf("NOTIFY sent %d times, want once", len(got))
	}
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Errorf("the connection does not go on after the refusal: %v", err)
	}
}

// What the server says of a watched folder is news when a message arrived
// in it or went from it, one in and one out included, and when it was made
// again. A flag changed there, which Sora tells of with the same counts, is
// no news: flags come with the poll.
func TestFolderNews_AnArrivalOrARemovalIsNewsAFlagChangedIsNot(t *testing.T) {
	srv := newNotifyServer(t, func(srv *notifyServer) {
		srv.initial = []string{
			"* STATUS Archive (MESSAGES 4 UIDNEXT 300 UIDVALIDITY 33)",
			"* STATUS Lists (MESSAGES 9 UIDNEXT 90 UIDVALIDITY 44)",
			"* STATUS Drafts (MESSAGES 1 UIDNEXT 10 UIDVALIDITY 55)",
		}
	})
	p := srv.dial(t)
	h := listen(p)
	watched(t, p)

	srv.send("* STATUS Archive (MESSAGES 4 UIDNEXT 300 UIDVALIDITY 33)") // a flag
	srv.send("* STATUS Lists (MESSAGES 10 UIDNEXT 91 UIDVALIDITY 44)")   // in
	if got, want := h.awaitNews(t, "Lists"), []string{"Lists"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("news %q, want %q: a flag changed in Archive was news", got, want)
	}
	srv.send("* STATUS Archive (MESSAGES 4 UIDNEXT 301 UIDVALIDITY 33)") // one in, one out
	srv.send("* STATUS Lists (MESSAGES 9 UIDNEXT 91 UIDVALIDITY 44)")    // out
	srv.send("* STATUS Archive (MESSAGES 4 UIDNEXT 301 UIDVALIDITY 33)") // a flag
	srv.send("* STATUS Archive (MESSAGES 4 UIDNEXT 301 UIDVALIDITY 34)") // made again
	srv.send("* STATUS Drafts (MESSAGES 2 UIDNEXT 11 UIDVALIDITY 55)")   // the end
	got := h.awaitNews(t, "Drafts")
	if want := []string{"Lists", "Archive", "Lists", "Archive", "Drafts"}; !reflect.DeepEqual(got, want) {
		t.Errorf("news %q, want %q", got, want)
	}
}

// What the server first says of a folder, the STATUS NOTIFY SET answers with
// among them, is how it is, not how it changed: no news. A folder subscribed
// since is so too.
func TestFolderNews_WhatAFolderFirstSaysIsNoNews(t *testing.T) {
	srv := newNotifyServer(t, func(srv *notifyServer) {
		srv.initial = []string{"* STATUS Archive (MESSAGES 4 UIDNEXT 300 UIDVALIDITY 33)"}
	})
	p := srv.dial(t)
	h := listen(p)
	watched(t, p)

	srv.send("* STATUS Lists (MESSAGES 9 UIDNEXT 90 UIDVALIDITY 44)")
	srv.send("* STATUS Archive (MESSAGES 5 UIDNEXT 301 UIDVALIDITY 33)")
	if got, want := h.awaitNews(t, "Archive"), []string{"Archive"}; !reflect.DeepEqual(got, want) {
		t.Errorf("news %q, want %q", got, want)
	}
}

// A mailbox the connection selected, and left for another, is next told of
// with a STATUS, as Sora does once it is no longer the one selected. That is
// compared with what it held as it was left: the arrivals told while it was
// selected are not told again, as every job that selects elsewhere would
// have had every page check the Inbox. One after it is news.
func TestFolderNews_AMailboxLeftIsComparedWithWhatItHeldThen(t *testing.T) {
	srv := newNotifyServer(t, func(srv *notifyServer) {
		srv.status = map[string]string{"INBOX": "* STATUS INBOX (UIDNEXT 101)"}
		srv.initial = []string{
			"* STATUS INBOX (MESSAGES 3 UIDNEXT 100 UIDVALIDITY 11)",
			"* STATUS Archive (MESSAGES 4 UIDNEXT 300 UIDVALIDITY 33)",
		}
	})
	p := srv.dial(t)
	h := listen(p)
	watched(t, p)
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Fatal(err)
	}
	srv.send("* 4 EXISTS")
	h.awaitNews(t, "INBOX")
	// As the preceding IDLE ends, its STATUS records the UIDNEXT after
	// the already-announced arrival. Leaving this valid snapshot is quiet.
	if err := p.rememberIdled(true); err != nil {
		t.Fatal(err)
	}

	// A job's SELECT elsewhere.
	if err := p.ensureMailboxSelected("Sent"); err != nil {
		t.Fatal(err)
	}
	srv.send("* STATUS INBOX (MESSAGES 4 UIDNEXT 101 UIDVALIDITY 11)")
	srv.send("* STATUS Archive (MESSAGES 5 UIDNEXT 301 UIDVALIDITY 33)")
	if got, want := h.awaitNews(t, "Archive"), []string{"INBOX", "Archive"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("news %q, want %q: the Inbox as it was left was news", got, want)
	}
	h.mu.Lock()
	h.news = nil
	h.mu.Unlock()
	srv.send("* STATUS INBOX (MESSAGES 5 UIDNEXT 102 UIDVALIDITY 11)")
	if got, want := h.awaitNews(t, "INBOX"), []string{"INBOX"}; !reflect.DeepEqual(got, want) {
		t.Errorf("news %q, want %q", got, want)
	}
}

// A server that gives up on telling (NOTIFICATIONOVERFLOW) has stopped: the
// IDLE ends, rather than wait on in silence, and the next ask begins the
// watch again.
func TestIdle_EndsWhenTheServerStopsTellingOfTheFolders(t *testing.T) {
	srv := newNotifyServer(t, nil)
	p := srv.dial(t)
	watched(t, p)

	stop := make(chan struct{})
	defer close(stop)
	began := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(began) }) }()
	awaitBegun(t, began)
	srv.send("* OK [NOTIFICATIONOVERFLOW] too much to tell")
	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("the IDLE ended with %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("the IDLE waits on, told of nothing")
	}
	watched(t, p)
	if got := srv.notifyCommands(); len(got) != 2 {
		t.Errorf("NOTIFY sent %d times, want twice", len(got))
	}
}

// Against the in-memory server's NOTIFY: mail filed into a subscribed folder
// while the connection waits in IDLE on the Inbox is news of that folder,
// and so is mail in the Inbox, as without NOTIFY. A folder not subscribed is
// not watched.
func TestWatchFolders_TellsOfMailFiledIntoASubscribedFolder(t *testing.T) {
	p, user := idleAccount(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapIdle: {}, imap.CapNotify: {}})
	ctx := context.Background()
	for _, name := range []string{"Archive", "Lists"} {
		if err := user.Create(ctx, name, nil); err != nil {
			t.Fatal(err)
		}
	}
	if err := user.Subscribe(ctx, "Archive"); err != nil {
		t.Fatal(err)
	}
	h := listen(p)
	watched(t, p)

	stop := make(chan struct{})
	began := make(chan struct{})
	done := make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(began) }) }()
	awaitBegun(t, began)

	deliverTo(t, user, "Lists")
	deliverTo(t, user, "Archive")
	if got, want := h.awaitNews(t, "Archive"), []string{"Archive"}; !reflect.DeepEqual(got, want) {
		t.Errorf("news %q, want %q", got, want)
	}
	deliverTo(t, user, "INBOX")
	h.awaitNews(t, "INBOX")

	close(stop)
	if err := <-done; err != nil {
		t.Fatalf("the IDLE ended with %v", err)
	}
}

// A server need not send a fresh STATUS just because a mailbox ceased to
// be selected. Its first later notification can already describe new mail
// balanced by an expunge, for which MESSAGES did not change.
func TestFolderNews_BalancedChangeAfterLeavingSelectedMailbox(t *testing.T) {
	for _, selectedChanged := range []bool{false, true} {
		t.Run(fmt.Sprint(selectedChanged), func(t *testing.T) {
			srv := newNotifyServer(t, func(srv *notifyServer) {
				srv.initial = []string{
					"* STATUS Archive (MESSAGES 4 UIDNEXT 300 UIDVALIDITY 33)",
					"* STATUS Lists (MESSAGES 9 UIDNEXT 90 UIDVALIDITY 44)",
				}
			})
			p := srv.dial(t)
			h := listen(p)
			watched(t, p)
			if err := p.ensureMailboxSelected("Archive"); err != nil {
				t.Fatal(err)
			}
			uidNext := "301"
			if selectedChanged {
				// Selected news makes the SELECT's UIDNEXT too old to trust. This
				// count-balanced change was already heard; no STATUS refreshed it.
				srv.send("* 5 EXISTS")
				srv.send("* 1 EXPUNGE")
				if err := p.client.Noop().Wait(); err != nil {
					t.Fatal(err)
				}
				h.mu.Lock()
				h.news = nil
				h.mu.Unlock()
				uidNext = "302"
			}
			if err := p.ensureMailboxSelected("Sent"); err != nil {
				t.Fatal(err)
			}
			srv.send("* STATUS Archive (MESSAGES 4 UIDNEXT " + uidNext + " UIDVALIDITY 33)")
			srv.send("* STATUS Lists (MESSAGES 10 UIDNEXT 91 UIDVALIDITY 44)")
			if got, want := h.awaitNews(t, "Lists"), []string{"Archive", "Lists"}; !reflect.DeepEqual(got, want) {
				t.Fatalf("news %q, want %q: balanced change after SELECT was missed", got, want)
			}
		})
	}
}
