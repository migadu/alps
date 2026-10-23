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
	"time"
)

// scriptedIMAP is an IMAP server that knows CAPABILITY, LOGIN, LIST, LSUB,
// SUBSCRIBE, UNSUBSCRIBE and LOGOUT, and answers BAD to a LIST with more than
// its two arguments, as some IMAP4rev1 servers do.
type scriptedIMAP struct {
	caps string // the capabilities it advertises, e.g. "IMAP4rev1"
	// takesReturn makes it answer the RETURN form instead, as a server with
	// LIST-EXTENDED does: INBOX subscribed, Work not, and each folder's
	// STATUS when that is asked for.
	takesReturn bool
	// list is its answer to a plain LIST, line by line; INBOX and Work when
	// nil. lsub is its answer to LSUB; INBOX alone when nil. A line may carry
	// a literal: "{4}\r\nWork".
	list, lsub []string
	// refuseLsub answers LSUB with NO, and hangLsub never answers it.
	refuseLsub, hangLsub bool
	// Status response text may itself end in a literal-looking "{number}".
	greetingText, loginText, lsubText string

	mu    sync.Mutex
	lists []string // the arguments of each LIST, in the order received
	lsubs []string // and of each LSUB
	conns int      // the connections it took
}

func (s *scriptedIMAP) listCommands() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]string(nil), s.lists...)
}

func (s *scriptedIMAP) lsubCommands() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	return append([]string(nil), s.lsubs...)
}

func (s *scriptedIMAP) connections() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.conns
}

func (s *scriptedIMAP) serve(conn net.Conn) {
	defer conn.Close()
	r := bufio.NewReader(conn)
	reply := func(lines ...string) {
		for _, l := range lines {
			conn.Write([]byte(l + "\r\n"))
		}
	}
	greetingText := s.greetingText
	if greetingText == "" {
		greetingText = "scripted server ready"
	}
	reply("* OK [CAPABILITY " + s.caps + "] " + greetingText)
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
			text := s.loginText
			if text == "" {
				text = "LOGIN completed"
			}
			reply(tag + " OK [CAPABILITY " + s.caps + "] " + text)
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
			lines := s.list
			if lines == nil {
				lines = []string{`* LIST (\HasNoChildren) "/" INBOX`, `* LIST (\HasNoChildren) "/" Work`}
			}
			reply(append(lines, tag+" OK LIST completed")...)
		case "LSUB":
			s.mu.Lock()
			s.lsubs = append(s.lsubs, args)
			s.mu.Unlock()
			switch {
			case s.hangLsub:
				// Says nothing until the client gives up and hangs up.
				r.ReadString('\n')
				return
			case s.refuseLsub:
				reply(tag + " NO LSUB is not offered here")
				continue
			}
			lines := s.lsub
			if lines == nil {
				// RFC 3501 §6.3.9: the subscribed folders, INBOX alone.
				lines = []string{`* LSUB () "/" INBOX`}
			}
			text := s.lsubText
			if text == "" {
				text = "LSUB completed"
			}
			reply(append(lines, tag+" OK "+text)...)
		case "SUBSCRIBE", "UNSUBSCRIBE":
			reply(tag + " OK " + name + " completed")
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

// scriptedProvider starts the scripted server and returns a provider signed
// in to it, as a session's is.
func scriptedProvider(t *testing.T, srv *scriptedIMAP) *IMAPProvider {
	t.Helper()
	p, _ := scriptedProviderAt(t, srv, 2*time.Second)
	return p
}

// scriptedProviderAt is scriptedProvider with the provider's timeout, and
// the listener, for a test that stops it taking connections.
func scriptedProviderAt(t *testing.T, srv *scriptedIMAP, timeout time.Duration) (*IMAPProvider, net.Listener) {
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
			srv.mu.Lock()
			srv.conns++
			srv.mu.Unlock()
			go srv.serve(conn)
		}
	}()
	return signedIn(t, ln.Addr().String(), timeout), ln
}

// signedIn returns a provider signed in to the server at addr as ada, made
// the way a session's is.
func signedIn(t *testing.T, addr string, timeout time.Duration) *IMAPProvider {
	t.Helper()
	return signedInWith(t, addr, timeout, "pass")
}

func signedInWith(t *testing.T, addr string, timeout time.Duration, password string) *IMAPProvider {
	t.Helper()
	opts, err := (&Config{Server: "imap+insecure://" + addr}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	mp, err := opts.CreateFactory(timeout, false)("ada", password)
	if err != nil {
		t.Fatal(err)
	}
	p := mp.(*IMAPProvider)
	t.Cleanup(func() { p.Close() })
	return p
}

// A server that offers neither LIST-EXTENDED, LIST-STATUS nor IMAP4rev2 is
// asked a plain LIST, which says nothing about subscriptions. They are read
// with LSUB (RFC 3501 §6.3.9), and only the folders it lists count as
// subscribed. Every folder counted as subscribed before: one unsubscribed came
// back subscribed with the next listing.
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
	if got := srv.lsubCommands(); len(got) != 1 || got[0] != `"" "*"` {
		t.Errorf(`LSUB commands sent: %q, want one LSUB "" "*"`, got)
	}
	var names []string
	for _, mb := range mailboxes {
		names = append(names, mb.Name)
	}
	if strings.Join(names, ",") != "INBOX,Work" {
		t.Fatalf("listed %v, want INBOX and Work", names)
	}
	if !mailboxes[0].Subscribed {
		t.Error("INBOX is reported unsubscribed, though LSUB listed it")
	}
	if mailboxes[1].Subscribed {
		t.Error("Work is reported subscribed, though LSUB did not list it")
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
