package imap

import (
	"bufio"
	"net"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

// selectingServer is a raw IMAP server that answers SELECT with a count and a
// UIDVALIDITY of the mailbox's own, and records, by connection, the mailbox
// each successful SELECT left selected.
type selectingServer struct {
	ln net.Listener

	mu       sync.Mutex
	selected string // on the last connection
	countFor func(string) string
	// closes has a SELECT made while a mailbox is selected first say that
	// one is closed ([CLOSED], RFC 9051 §7.1), as IMAP4rev2 and QRESYNC
	// servers do.
	closes bool
}

func newSelectingServer(t *testing.T) *selectingServer {
	t.Helper()
	return startSelectingServer(t, &selectingServer{})
}

func newSelectingServerWithCounts(t *testing.T, countFor func(string) string) *selectingServer {
	t.Helper()
	return startSelectingServer(t, &selectingServer{countFor: countFor})
}

// startSelectingServer serves srv on a port of its own until the test ends.
func startSelectingServer(t *testing.T, srv *selectingServer) *selectingServer {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	srv.ln = ln
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

// mailboxes are the counts and UIDVALIDITYs of the account's mailboxes.
var selectingMailboxes = map[string]struct{ count, validity string }{
	"INBOX": {"3", "11"},
	"Sent":  {"7", "22"},
}

func (srv *selectingServer) serve(c net.Conn) {
	w := bufio.NewWriter(c)
	say := func(s string) { w.WriteString(s + "\r\n"); w.Flush() }
	say("* OK [CAPABILITY IMAP4rev1 IDLE] ready")
	r := bufio.NewReader(c)
	open := false // a mailbox is selected on this connection
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			return
		}
		parts := strings.SplitN(strings.TrimRight(line, "\r\n"), " ", 3)
		if len(parts) < 2 {
			continue
		}
		tag, cmd := parts[0], strings.ToUpper(parts[1])
		switch cmd {
		case "LOGIN":
			say(tag + " OK [CAPABILITY IMAP4rev1 IDLE] logged in")
		case "SELECT":
			name := strings.Trim(parts[2], `"`)
			if srv.closes && open {
				say("* OK [CLOSED] previous mailbox closed")
			}
			mbox, ok := selectingMailboxes[name]
			open = ok
			if !ok {
				srv.mu.Lock()
				srv.selected = ""
				srv.mu.Unlock()
				say(tag + " NO no such mailbox")
				continue
			}
			srv.mu.Lock()
			srv.selected = name
			srv.mu.Unlock()
			count := mbox.count
			if srv.countFor != nil {
				count = srv.countFor(name)
			}
			say("* " + count + " EXISTS")
			say("* OK [UIDVALIDITY " + mbox.validity + "] ok")
			say("* OK [UIDNEXT 100] ok")
			say(tag + " OK [READ-WRITE] selected")
		case "LOGOUT":
			say("* BYE bye")
			say(tag + " OK bye")
			c.Close()
			return
		default:
			say(tag + " OK done")
		}
	}
}

func (srv *selectingServer) selectedNow() string {
	srv.mu.Lock()
	defer srv.mu.Unlock()
	return srv.selected
}

func (srv *selectingServer) dial(t *testing.T) *IMAPProvider {
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

// A mailbox asked for is the one selected, and straight after the SELECT the
// client shows it, with its count, and its UIDVALIDITY is known.
//
// alps goes by the client's record of the mailbox selected. A go-imap client
// before c839773 released a SELECT's waiter before it recorded the mailbox
// (issue #469), so straight after a SELECT it could still show the mailbox
// selected before, or none when the server answered the switch with
// [CLOSED]. The race is short, and switched to and fro a few thousand times
// it shows.
func TestEnsureMailboxSelected_TheClientShowsWhatWasJustSelected(t *testing.T) {
	for _, closes := range []bool{false, true} {
		t.Run(map[bool]string{false: "IMAP4rev1", true: "CLOSED"}[closes], func(t *testing.T) {
			srv := startSelectingServer(t, &selectingServer{closes: closes})
			p := srv.dial(t)
			for i := 0; i < 60000; i++ {
				name := "INBOX"
				if i%2 == 1 {
					name = "Sent"
				}
				if err := p.ensureMailboxSelected(name); err != nil {
					t.Fatal(err)
				}
				if got := srv.selectedNow(); got != name {
					t.Fatalf("switch %d: asked for %s, the server has %q selected", i, name, got)
				}
				want := selectingMailboxes[name]
				if mbox := p.client.Mailbox(); mbox == nil || mbox.Name != name || strconv.Itoa(int(mbox.NumMessages)) != want.count {
					t.Fatalf("switch %d: %s just selected, the client shows %+v", i, name, mbox)
				}
				if got := strconv.Itoa(int(p.SelectedUIDValidity(name))); got != want.validity {
					t.Fatalf("switch %d: the UIDVALIDITY of %s, just selected, reads %s, want %s", i, name, got, want.validity)
				}
			}
		})
	}
}

// A SELECT the server refuses leaves no mailbox selected (RFC 3501 §6.3.1),
// and the next request for the mailbox selected before selects it again. The
// server here sends no [CLOSED]: a go-imap client before ee66cc1
// (migadu/go-imap#98) went on showing the mailbox selected before.
func TestEnsureMailboxSelected_ARefusedSelectLeavesNoneSelected(t *testing.T) {
	srv := newSelectingServer(t)
	p := srv.dial(t)
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Fatal(err)
	}
	if err := p.ensureMailboxSelected("Gone"); err == nil {
		t.Fatal("selecting a mailbox the server refuses succeeded")
	}
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Fatal(err)
	}
	if got := srv.selectedNow(); got != "INBOX" {
		t.Errorf("after a refused SELECT, the server has %q selected, want INBOX selected again", got)
	}
}

// A fresh SELECT of the same named mailbox shows its own count at once, not
// the one the SELECT before it left (issue #533): the name alone cannot tell
// the two apart.
func TestSelectedMailbox_AReselectUsesItsOwnFreshCount(t *testing.T) {
	var next int
	srv := newSelectingServerWithCounts(t, func(string) string {
		next++
		if next%2 == 0 {
			return "0"
		}
		return "3"
	})
	p := srv.dial(t)
	for i := 0; i < 60000; i++ {
		data, err := p.selectMailbox("INBOX")
		if err != nil {
			t.Fatal(err)
		}
		selected := p.client.Mailbox()
		if selected == nil || selected.NumMessages != data.NumMessages {
			t.Fatalf("reselect %d: fresh count %d, selected snapshot %+v", i, data.NumMessages, selected)
		}
	}
}
