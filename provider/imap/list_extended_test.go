// The folder list must not depend on LIST-EXTENDED (RFC 5258) where the server
// has not offered it. RFC 3501 §6.3.8 gives LIST two arguments, and a server
// that knows nothing else may answer the RETURN form with BAD — which left
// alps without a folder list, and so without a mailbox page, settings or an
// Empty Trash.
//
// The in-memory server cannot show this: whatever it advertises, its parser
// takes the extended form. So these tests talk to a scripted server that reads
// LIST the way RFC 3501 writes it.
package imap

import (
	"bufio"
	"net"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-imap/v2/imapclient"
)

// scriptedIMAP is an IMAP server that knows CAPABILITY, LOGIN, LIST and
// LOGOUT, and answers BAD to a LIST with more than its two arguments, as some
// IMAP4rev1 servers do.
type scriptedIMAP struct {
	caps string // the capabilities it advertises, e.g. "IMAP4rev1"
	// takesReturn makes it answer the RETURN form instead, as a server with
	// LIST-EXTENDED does: INBOX subscribed, Work not, and each folder's
	// STATUS when that is asked for.
	takesReturn bool

	mu    sync.Mutex
	lists []string // the arguments of each LIST, in the order received
}

func (s *scriptedIMAP) listCommands() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]string(nil), s.lists...)
}

func (s *scriptedIMAP) serve(conn net.Conn) {
	defer conn.Close()
	r := bufio.NewReader(conn)
	reply := func(lines ...string) {
		for _, l := range lines {
			conn.Write([]byte(l + "\r\n"))
		}
	}
	reply("* OK [CAPABILITY " + s.caps + "] scripted server ready")
	for {
		line, err := r.ReadString('\n')
		if err != nil {
			return
		}
		tag, rest, _ := strings.Cut(strings.TrimRight(line, "\r\n"), " ")
		name, args, _ := strings.Cut(rest, " ")
		switch strings.ToUpper(name) {
		case "CAPABILITY":
			reply("* CAPABILITY "+s.caps, tag+" OK CAPABILITY completed")
		case "LOGIN":
			reply(tag + " OK [CAPABILITY " + s.caps + "] LOGIN completed")
		case "LIST":
			s.mu.Lock()
			s.lists = append(s.lists, args)
			s.mu.Unlock()
			if countArgs(args) != 2 && s.takesReturn {
				reply(`* LIST (\HasNoChildren \Subscribed) "/" INBOX`)
				if strings.Contains(args, "STATUS") {
					reply(`* STATUS INBOX (MESSAGES 2 UIDVALIDITY 7 UNSEEN 1)`)
				}
				reply(`* LIST (\HasNoChildren) "/" Work`)
				if strings.Contains(args, "STATUS") {
					reply(`* STATUS Work (MESSAGES 0 UIDVALIDITY 8 UNSEEN 0)`)
				}
				reply(tag + " OK LIST completed")
				continue
			}
			if countArgs(args) != 2 {
				reply(tag + " BAD Command Argument Error")
				continue
			}
			reply(`* LIST (\HasNoChildren) "/" INBOX`,
				`* LIST (\HasNoChildren) "/" Work`,
				tag+" OK LIST completed")
		case "LOGOUT":
			reply("* BYE logging out", tag+" OK LOGOUT completed")
			return
		default:
			reply(tag + " BAD unknown command")
		}
	}
}

// countArgs counts the arguments on a command line: atoms, quoted strings and
// parenthesized lists each count as one.
func countArgs(args string) int {
	n := 0
	for i := 0; i < len(args); {
		switch args[i] {
		case ' ':
			i++
			continue
		case '"':
			i++
			for i < len(args) && args[i] != '"' {
				if args[i] == '\\' {
					i++
				}
				i++
			}
			i++
		case '(':
			depth := 0
			for ; i < len(args); i++ {
				if args[i] == '(' {
					depth++
				} else if args[i] == ')' {
					if depth--; depth == 0 {
						i++
						break
					}
				}
			}
		default:
			for i < len(args) && args[i] != ' ' {
				i++
			}
		}
		n++
	}
	return n
}

// scriptedProvider starts the scripted server and returns a provider logged
// in to it.
func scriptedProvider(t *testing.T, srv *scriptedIMAP) *IMAPProvider {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { ln.Close() })
	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			go srv.serve(conn)
		}
	}()

	client, err := imapclient.DialInsecure(ln.Addr().String(), nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { client.Close() })
	if err := client.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	return NewIMAPProvider(client, false)
}

// A server that offers neither LIST-EXTENDED, LIST-STATUS nor IMAP4rev2 is
// asked a plain LIST. It has no way to report subscriptions in that listing,
// and the client library has no LSUB to ask separately, so every folder counts
// as subscribed: the server then reads each one's unread count for the
// sidebar, and a rename carries its subscription over to the new name.
func TestListMailboxesWithoutListExtendedSendsAPlainList(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1"}
	p := scriptedProvider(t, srv)

	mailboxes, err := p.ListMailboxes()
	if err != nil {
		t.Fatalf("listing folders on an IMAP4rev1 server failed: %v (LIST commands sent: %q)", err, srv.listCommands())
	}
	if got := srv.listCommands(); len(got) != 1 || got[0] != `"" "*"` {
		t.Errorf(`LIST commands sent: %q, want one plain LIST "" "*"`, got)
	}
	var names []string
	for _, mb := range mailboxes {
		names = append(names, mb.Name)
		if !mb.Subscribed {
			t.Errorf("%s is reported unsubscribed, though the server was never asked", mb.Name)
		}
	}
	if strings.Join(names, ",") != "INBOX,Work" {
		t.Errorf("listed %v, want INBOX and Work", names)
	}
}

// LIST-STATUS is a RETURN option of LIST-EXTENDED (RFC 5819), so a server
// that offers it takes the RETURN form even where it does not advertise
// LIST-EXTENDED itself, as a server that has turned IMAP4rev2 off for one
// session may. It is asked for subscriptions and counts in the one LIST.
func TestListMailboxesAsksAListStatusServerForTheReturnForm(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1 LIST-STATUS", takesReturn: true}
	p := scriptedProvider(t, srv)

	mailboxes, err := p.ListMailboxes()
	if err != nil {
		t.Fatal(err)
	}
	if got := srv.listCommands(); len(got) != 1 || !strings.Contains(got[0], "RETURN (SUBSCRIBED STATUS (") {
		t.Errorf("LIST commands sent: %q, want one asking RETURN (SUBSCRIBED STATUS (...))", got)
	}
	if len(mailboxes) != 2 {
		t.Fatalf("listed %d folders, want 2", len(mailboxes))
	}
	if inbox := mailboxes[0]; !inbox.Subscribed || inbox.Unseen != 1 || inbox.Total != 2 {
		t.Errorf("INBOX subscribed %v with %d of %d unread, want subscribed with 1 of 2", inbox.Subscribed, inbox.Unseen, inbox.Total)
	}
	if work := mailboxes[1]; work.Subscribed {
		t.Error("Work is reported subscribed, though the server listed it without \\Subscribed")
	}
}

// A server that advertises LIST-EXTENDED and still refuses the RETURN form is
// asked once more, plainly, rather than leaving alps with no folders at all.
// The refusal is remembered: the next listing goes straight to a plain LIST.
func TestListMailboxesRetriesARefusedExtendedList(t *testing.T) {
	srv := &scriptedIMAP{caps: "IMAP4rev1 LIST-EXTENDED"}
	p := scriptedProvider(t, srv)

	mailboxes, err := p.ListMailboxes()
	if err != nil {
		t.Fatalf("a refused LIST-EXTENDED listing was not retried: %v (LIST commands sent: %q)", err, srv.listCommands())
	}
	got := srv.listCommands()
	if len(got) != 2 || !strings.Contains(got[0], "RETURN (SUBSCRIBED)") || got[1] != `"" "*"` {
		t.Errorf(`LIST commands sent: %q, want the RETURN form and then a plain LIST "" "*"`, got)
	}
	if len(mailboxes) != 2 {
		t.Errorf("listed %d folders, want 2", len(mailboxes))
	}

	if _, err := p.ListMailboxes(); err != nil {
		t.Fatal(err)
	}
	if got := srv.listCommands(); len(got) != 3 || got[2] != `"" "*"` {
		t.Errorf(`LIST commands sent: %q, want the second listing to send only a plain LIST "" "*"`, got)
	}
}
