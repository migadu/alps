package imap

import (
	"bufio"
	"fmt"
	"net"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

// STATUS responses can follow the FETCH responses of a later pipelined
// command. The client's FETCH queue holds128 messages: drain it before
// waiting for another command, even a NOOP sent before that FETCH.
func TestSelectedBatchDrainsFetchBeforeOtherReplies(t *testing.T) {
	for _, tc := range []struct {
		name                     string
		selectedFirst, delayNoop bool
		rows                     int
		fetchReply, workReply    string
		disconnect               bool
	}{
		{name: "selected last with200 changes", rows: 200},
		{name: "selected first with delayed NOOP", selectedFirst: true, delayNoop: true, rows: 200},
		{name: "empty delta", delayNoop: true},
		{name: "unrelated STATUS refusal", rows: 200, workReply: "NO"},
		{name: "FETCH refusal", fetchReply: "NO"},
		{name: "FETCH bad command", fetchReply: "BAD"},
		{name: "lost connection during FETCH", rows: 12, disconnect: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			ln, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer ln.Close()
			var armed atomic.Bool
			serverDone := make(chan struct{})
			go func() {
				defer close(serverDone)
				c, err := ln.Accept()
				if err != nil {
					return
				}
				defer c.Close()
				say := func(line string) bool { _, err := fmt.Fprintf(c, "%s\r\n", line); return err == nil }
				caps := "IMAP4rev1 ENABLE CONDSTORE"
				say("* OK [CAPABILITY " + caps + "] ready")
				r := bufio.NewScanner(c)
				workTag, noopTag := "", ""
				fetched, batchFinished := false, false
				version := 7
				status := func(tag, name string) {
					say(fmt.Sprintf("* STATUS %s (MESSAGES 200 UNSEEN 200 UIDNEXT 201 UIDVALIDITY 1 HIGHESTMODSEQ %d)", name, version))
					say(tag + " OK status")
				}
				finish := func() {
					if workTag == "" || !fetched {
						return
					}
					if tc.workReply != "" {
						say(workTag + " " + tc.workReply + " refused")
					} else {
						status(workTag, "Work")
					}
					workTag = ""
					batchFinished = true
					if noopTag != "" {
						say(noopTag + " OK noop")
						noopTag = ""
					}
				}
				for r.Scan() {
					fields := strings.Fields(r.Text())
					if len(fields) < 2 {
						continue
					}
					tag, command := fields[0], strings.ToUpper(fields[1])
					switch command {
					case "LOGIN":
						say(tag + " OK [CAPABILITY " + caps + "] logged in")
					case "CAPABILITY":
						say("* CAPABILITY " + caps)
						say(tag + " OK caps")
					case "ENABLE":
						say("* ENABLED CONDSTORE")
						say(tag + " OK enabled")
					case "SELECT":
						say("* 200 EXISTS")
						say("* OK [UIDVALIDITY 1] valid")
						say("* OK [UIDNEXT 201] next")
						say(tag + " OK selected")
					case "NOOP":
						if armed.Load() && tc.delayNoop && !batchFinished {
							noopTag = tag
							finish()
						} else {
							say(tag + " OK noop")
						}
					case "STATUS":
						name := strings.Trim(fields[2], "\"")
						if armed.Load() && name == "Work" {
							workTag = tag
							finish()
						} else {
							status(tag, name)
						}
					case "UID":
						if len(fields) < 3 || strings.ToUpper(fields[2]) != "FETCH" {
							say(tag + " BAD unsupported")
							continue
						}
						for i := 1; i <= tc.rows; i++ {
							if !say(fmt.Sprintf("* %d FETCH (UID %d FLAGS (\\Flagged) MODSEQ (8))", i, i)) {
								return
							}
						}
						if tc.disconnect {
							return
						}
						if tc.rows > 0 {
							version = 8
						}
						reply := tc.fetchReply
						if reply == "" {
							reply = "OK"
						}
						say(tag + " " + reply + " fetch")
						fetched = true
						finish()
					case "LOGOUT":
						say("* BYE done")
						say(tag + " OK logout")
						return
					default:
						say(tag + " OK done")
					}
				}
			}()
			conn, err := net.Dial("tcp", ln.Addr().String())
			if err != nil {
				t.Fatal(err)
			}
			defer func() {
				conn.Close()
				select {
				case <-serverDone:
				case <-time.After(time.Second):
					t.Error("scripted server did not stop after closing its connection")
				}
			}()
			news := new(mailboxNews)
			client := imapclient.New(conn, &imapclient.Options{UnilateralDataHandler: news.handler()})
			news.client.Store(client)
			p := &IMAPProvider{client: client, news: news, responseTimeout: 100 * time.Millisecond}
			if err := client.Login("ada", "pass").Wait(); err != nil {
				t.Fatal(err)
			}
			if tracked, err := p.TrackChanges(); err != nil || !tracked {
				t.Fatalf("track: %v %v", tracked, err)
			}
			if err := p.ensureMailboxSelected("INBOX"); err != nil {
				t.Fatal(err)
			}
			if err := client.Noop().Wait(); err != nil {
				t.Fatal(err)
			} // SELECT publication barrier.
			if _, err := p.GetMailboxStatus("INBOX"); err != nil {
				t.Fatal(err)
			}
			armed.Store(true)
			names := []string{"Work", "INBOX"}
			selected := 1
			if tc.selectedFirst {
				names = []string{"INBOX", "Work"}
				selected = 0
			}
			type result struct {
				statuses []*provider.MailboxStatus
				errs     []error
			}
			done := make(chan result, 1)
			go func() { a, b := p.GetMailboxStatuses(names); done <- result{a, b} }()
			var got result
			select {
			case got = <-done:
			case <-time.After(2 * time.Second):
				// Close the raw socket rather than Client.Close: the unfixed decoder
				// is blocked publishing its129th FETCH and cannot process shutdown.
				conn.Close()
				t.Fatal("pipelined batch did not drain FETCH before waiting for another reply")
			}
			if tc.disconnect {
				for i, err := range got.errs {
					if err == nil {
						t.Errorf("%s succeeded after disconnect: %+v", names[i], got.statuses[i])
					}
				}
				client.Close()
				return
			}
			if got.errs[selected] != nil || got.statuses[selected] == nil {
				t.Fatalf("selected answer: %+v %v", got.statuses, got.errs)
			}
			want := uint64(7)
			if tc.rows > 0 {
				want = 8
			}
			if got.statuses[selected].HighestModSeq != want {
				t.Errorf("MODSEQ=%d want%d", got.statuses[selected].HighestModSeq, want)
			}
			other := 1 - selected
			if tc.workReply != "" {
				if got.errs[other] == nil || got.statuses[other] != nil {
					t.Errorf("unrelated refusal lost: %+v %v", got.statuses, got.errs)
				}
			} else if got.errs[other] != nil || got.statuses[other] == nil {
				t.Errorf("unrelated status lost: %+v %v", got.statuses, got.errs)
			}
			// All commands, including a refused FETCH, must be consumed before the
			// next operation reuses the same connection.
			if err := client.Noop().Wait(); err != nil {
				t.Errorf("next command: %v", err)
			}
			client.Close()
		})
	}
}
