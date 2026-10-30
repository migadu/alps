package imap

import (
	"bufio"
	"fmt"
	"net"
	"strings"
	"testing"
	"time"
)

// LIST and LSUB have distinct response types and may be answered in either
// order. More than the client's 64 queued LSUB responses must not prevent it
// reading the LIST completion that the caller is waiting for.
func TestListingDrainsPipelinedSubscriptionsBeforeListCompletes(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	accepted := make(chan net.Conn, 1)
	go func() {
		c, err := ln.Accept()
		if err != nil {
			return
		}
		accepted <- c
		defer c.Close()
		say := func(s string) { fmt.Fprint(c, s+"\r\n") }
		say("* OK [CAPABILITY IMAP4rev1] ready")
		r := bufio.NewReader(c)
		var listTag string
		for {
			line, err := r.ReadString('\n')
			if err != nil {
				return
			}
			fields := strings.Fields(line)
			if len(fields) < 2 {
				return
			}
			tag := fields[0]
			switch strings.ToUpper(fields[1]) {
			case "LOGIN":
				say(tag + " OK [CAPABILITY IMAP4rev1] logged in")
			case "CAPABILITY":
				say("* CAPABILITY IMAP4rev1")
				say(tag + " OK done")
			case "LIST":
				listTag = tag
			case "LSUB":
				say(`* LSUB () "/" Work`)
				for i := 0; i < 80; i++ {
					say(fmt.Sprintf(`* LSUB () "/" Folder%d`, i))
				}
				say(tag + " OK LSUB completed")
				say(`* LIST () "/" INBOX`)
				say(`* LIST () "/" Work`)
				say(listTag + " OK LIST completed")
			default:
				say(tag + " BAD unexpected command")
			}
		}
	}()
	opts, err := (&Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	mp, err := opts.CreateFactory(time.Second, false)("ada", "pass")
	if err != nil {
		t.Fatal(err)
	}
	p := mp.(*IMAPProvider)
	completed := false
	defer func() {
		if completed {
			p.Close()
		} else {
			go p.Close()
		}
	}()
	c := <-accepted
	defer c.Close()
	done := make(chan struct{}, 1)
	var got map[string]bool
	var listErr error
	go func() {
		mailboxes, err := p.ListMailboxes()
		listErr = err
		got = make(map[string]bool)
		for _, m := range mailboxes {
			got[m.Name] = m.Subscribed
		}
		done <- struct{}{}
	}()
	select {
	case <-done:
		completed = true
	case <-time.After(2 * time.Second):
		t.Fatal("listing blocked behind an undrained pipelined LSUB response queue")
	}
	if listErr != nil {
		t.Fatal(listErr)
	}
	if len(got) != 2 || !got["Work"] || got["INBOX"] {
		t.Fatalf("subscriptions %v, want Work alone", got)
	}
}
