package imap

import (
	"bufio"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2/imapclient"
)

// A second EXISTS or an EXPUNGE is received while post-IDLE STATUS is on
// the wire. Already announced, it must not be announced again after a
// background SELECT of Sent followed by another IDLE in Inbox.
func TestIdle_NewsDuringStatusDoesNotLeaveAnOlderCount(t *testing.T) {
	for _, expunge := range []bool{false, true} {
		name := "arrival"
		if expunge {
			name = "removal"
		}
		t.Run(name, func(t *testing.T) { newsDuringStatus(t, expunge) })
	}
}

func newsDuringStatus(t *testing.T, expunge bool) {
	t.Helper()
	finalCount, finalNext := 2, 3
	if expunge {
		finalCount, finalNext = 0, 2
	}
	conn, server := net.Pipe()
	t.Cleanup(func() { conn.Close(); server.Close() })
	go func() {
		writer := bufio.NewWriter(server)
		say := func(line string) { fmt.Fprint(writer, line+"\r\n"); writer.Flush() }
		say("* OK [CAPABILITY IMAP4rev1 IDLE] ready")
		reader := bufio.NewReader(server)
		idleTag := ""
		idles, statuses := 0, 0
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				return
			}
			parts := strings.Fields(line)
			if len(parts) == 1 && parts[0] == "DONE" {
				say(idleTag + " OK done")
				continue
			}
			if len(parts) < 2 {
				continue
			}
			tag, command := parts[0], parts[1]
			switch command {
			case "LOGIN":
				say(tag + " OK [CAPABILITY IMAP4rev1 IDLE] logged in")
			case "CAPABILITY":
				say("* CAPABILITY IMAP4rev1 IDLE")
				say(tag + " OK done")
			case "SELECT":
				count, next := 0, 1
				if strings.Contains(line, "INBOX") && idles > 0 {
					count, next = finalCount, finalNext
				}
				say(fmt.Sprintf("* %d EXISTS", count))
				say("* OK [UIDVALIDITY 1] ok")
				say(fmt.Sprintf("* OK [UIDNEXT %d] ok", next))
				say(tag + " OK [READ-WRITE] selected")
			case "IDLE":
				idles++
				idleTag = tag
				say("+ idling")
				if idles == 1 {
					say("* 1 EXISTS")
				}
			case "STATUS":
				statuses++
				if statuses == 1 {
					if expunge {
						say("* 1 EXPUNGE")
					} else {
						say("* 2 EXISTS")
					}
				}
				say(fmt.Sprintf("* STATUS INBOX (UIDNEXT %d)", finalNext))
				say(tag + " OK status")
			default:
				say(tag + " OK done")
			}
		}
	}()
	news := new(mailboxNews)
	client := imapclient.New(conn, &imapclient.Options{UnilateralDataHandler: news.handler()})
	news.client.Store(client)
	if err := client.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	if err := client.Noop().Wait(); err != nil {
		t.Fatal(err)
	}
	p := &IMAPProvider{client: client, news: news, responseTimeout: time.Second}
	t.Cleanup(func() { client.Close() })
	heard := listen(p)
	stop, began, done := make(chan struct{}), make(chan struct{}), make(chan error, 1)
	go func() { done <- p.Idle("INBOX", stop, func() { close(began) }) }()
	awaitBegun(t, began)
	heard.await(t)
	close(stop)
	if err := <-done; err != nil {
		t.Fatal(err)
	}
	heard.await(t)
	if p.idled.count != uint32(finalCount) || p.idled.count != p.client.Mailbox().NumMessages {
		t.Fatalf("STATUS recorded an older count: remembered=%+v, live count=%d", p.idled, p.client.Mailbox().NumMessages)
	}
	if err := p.ensureMailboxSelected("Sent"); err != nil {
		t.Fatal(err)
	}
	// Complete another command before using the selected state: the current
	// IMAP dependency can release SELECT.Wait before publishing that state.
	// This regression isolates news during STATUS from that separate race.
	if err := p.client.Noop().Wait(); err != nil {
		t.Fatal(err)
	}
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Fatal(err)
	}
	if err := p.client.Noop().Wait(); err != nil {
		t.Fatal(err)
	}
	heard.mu.Lock()
	beforeAgain := append([]string(nil), heard.news...)
	heard.mu.Unlock()
	again := make(chan struct{})
	if err := p.Idle("INBOX", again, func() { close(again) }); err != nil {
		t.Fatal(err)
	}
	heard.mu.Lock()
	count := len(heard.news)
	heard.mu.Unlock()
	if count != 2 {
		t.Fatalf("two changes already announced became %d announcements after SELECT/IDLE; before=%v after=%v remembered=%+v selectedUIDNEXT=%v", count, beforeAgain, heard.news, p.idled, p.selectedUIDNext)
	}
}
