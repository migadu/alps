package imap

import (
	"bufio"
	"net"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2/imapclient"
)

// selectingServer is a raw IMAP server that answers SELECT with a count and a
// UIDVALIDITY of the mailbox's own, and records, by connection, the mailbox
// each successful SELECT left selected.
type selectingServer struct {
	ln net.Listener

	mu       sync.Mutex
	selected string // on the last connection
}

func newSelectingServer(t *testing.T) *selectingServer {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	srv := &selectingServer{ln: ln}
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
			mbox, ok := selectingMailboxes[name]
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
			say("* " + mbox.count + " EXISTS")
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

// A mailbox asked for is the one selected, and its UIDVALIDITY is known at
// once, whatever the client shows meanwhile.
//
// The go-imap client releases a SELECT's waiter before it records the
// mailbox as selected (issue #469), so straight after a SELECT it can still
// show the mailbox selected before. Taken for the selected one, it had the
// next SELECT, of that earlier mailbox, skipped, and the commands after ran
// in the wrong mailbox; and the UIDVALIDITY of the mailbox just selected was
// reported as unknown. The race is short, and switched to and fro a few
// thousand times it shows.
func TestEnsureMailboxSelected_SelectsWhatIsAskedWhateverTheClientShows(t *testing.T) {
	srv := newSelectingServer(t)
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
		want := uint32(11)
		if name == "Sent" {
			want = 22
		}
		if got := p.SelectedUIDValidity(name); got != want {
			t.Fatalf("switch %d: the UIDVALIDITY of %s, just selected, reads %d, want %d", i, name, got, want)
		}
	}
}

// A SELECT the server refuses leaves no mailbox selected (RFC 3501 §6.3.1),
// and the next request for the mailbox selected before selects it again.
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

// What changed while the connection was elsewhere is passed on in the name of
// the mailbox the IDLE selected, not the one the client shows. Straight after
// the SELECT, the client may show none: a server that answers the switch
// with [CLOSED], as the in-memory one does, has the client record no mailbox
// until it has recorded the new one, and the news was dropped then. Here the
// connection has selected nothing the client knows of.
func TestIdle_NewsOfWhatChangedMeanwhileNamesTheMailboxSelected(t *testing.T) {
	p, _ := idleAccount(t, idleCaps)
	h := listen(p)
	if p.client.Mailbox() != nil {
		t.Fatal("a new connection shows a mailbox selected")
	}
	p.selected = &imapclient.SelectedMailbox{Name: "INBOX", NumMessages: 2}
	p.selects = 2
	p.idled = idledMailbox{known: true, mailbox: "INBOX", count: 1, selects: 1}
	p.tellWhatChangedMeanwhile("INBOX")
	if news := h.await(t); len(news) != 1 || news[0] != "INBOX" {
		t.Fatalf("the news named %v, want INBOX", news)
	}
}
