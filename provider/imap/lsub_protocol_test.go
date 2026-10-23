package imap

import (
	"bufio"
	"fmt"
	"strings"
	"testing"
	"time"
)

// resp-text is human-readable text, not a string/literal. The same valid
// greeting and LOGIN reply are also read by the primary go-imap connection.
func TestLsubStatusTextIsNotALiteral(t *testing.T) {
	for _, where := range []string{"greeting", "login", "completion"} {
		t.Run(where, func(t *testing.T) {
			srv := &scriptedIMAP{caps: "IMAP4rev1"}
			switch where {
			case "greeting":
				srv.greetingText = "ready {4}"
			case "login":
				srv.loginText = "authenticated {4}"
			case "completion":
				srv.lsubText = "complete {4}"
			}
			p, _ := scriptedProviderAt(t, srv, 300*time.Millisecond)
			if got := subscriptions(t, p); !got["INBOX"] || got["Work"] {
				t.Fatalf("valid %s text: subscriptions %v, want INBOX alone", where, got)
			}
		})
	}
}

func TestLsubInboxMutationsUseCanonicalName(t *testing.T) {
	for _, subscribe := range []bool{false, true} {
		t.Run(fmt.Sprintf("subscribe=%v", subscribe), func(t *testing.T) {
			lsub := []string{`* LSUB () "/" INBOX`}
			if subscribe {
				lsub = []string{}
			}
			srv := &scriptedIMAP{caps: "IMAP4rev1", lsub: lsub}
			p := scriptedProvider(t, srv)
			if got := subscriptions(t, p); got["INBOX"] == subscribe {
				t.Fatalf("initial subscriptions %v", got)
			}
			var err error
			if subscribe {
				err = p.SubscribeMailbox("InBoX")
			} else {
				err = p.UnsubscribeMailbox("inbox")
			}
			if err != nil {
				t.Fatal(err)
			}
			if got := subscriptions(t, p); got["INBOX"] != subscribe {
				t.Errorf("after accepted mutation: subscriptions %v, INBOX want %v", got, subscribe)
			}
			if got := srv.connections(); got != 2 {
				t.Errorf("connections %d, want no refresh after local mutation", got)
			}
		})
	}

	// Only the special INBOX name is case-insensitive.
	srv := &scriptedIMAP{
		caps: "IMAP4rev1",
		list: []string{`* LIST () "/" Work`, `* LIST () "/" work`},
		lsub: []string{`* LSUB () "/" work`},
	}
	p := scriptedProvider(t, srv)
	subscriptions(t, p)
	if err := p.SubscribeMailbox("Work"); err != nil {
		t.Fatal(err)
	}
	if err := p.UnsubscribeMailbox("work"); err != nil {
		t.Fatal(err)
	}
	if got := subscriptions(t, p); !got["Work"] || got["work"] {
		t.Errorf("case-sensitive folders: subscriptions %v, want Work alone", got)
	}
}

func TestLsubMalformedNamesUseSafeFallback(t *testing.T) {
	for _, answer := range []string{
		`* LSUB () "/" Work trailing`,
		`* LSUB () "/" "Work" trailing`,
		"* LSUB () \"/\" {4}\r\nWork trailing",
		"* LSUB () \"/\" {4}\r\nWork{4}\r\nMore",
	} {
		t.Run(answer, func(t *testing.T) {
			p := scriptedProvider(t, &scriptedIMAP{caps: "IMAP4rev1", lsub: []string{answer}})
			if got := subscriptions(t, p); !got["INBOX"] || !got["Work"] {
				t.Errorf("unreadable LSUB: subscriptions %v, want fallback with every folder subscribed", got)
			}
		})
	}
}

// LSUB's only literal is its final mailbox name. These boundaries include
// the continuation line, so a malformed response cannot accumulate literals
// or exceed the line bound by splitting its text around a literal.
func TestLsubResponseBounds(t *testing.T) {
	for _, tc := range []struct {
		name, wire string
		wantErr    bool
	}{
		{"literal at limit", fmt.Sprintf("* LSUB () NIL {%d}\r\n%s\r\n", maxLsubLiteral, strings.Repeat("x", maxLsubLiteral)), false},
		{"literal too large", fmt.Sprintf("* LSUB () NIL {%d}\r\n", maxLsubLiteral+1), true},
		{"line too large", strings.Repeat("x", maxLsubLine) + "\r\n", true},
		{"split text too large", "* LSUB () NIL {1}\r\nx" + strings.Repeat("x", maxLsubLine-2) + "\r\n", true},
		{"second literal", "* LSUB () NIL {1}\r\nx{1}\r\ny\r\n", true},
		{"empty literal", "* LSUB () NIL {0}\r\n\r\n", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := &lsubSession{r: bufio.NewReader(strings.NewReader(tc.wire))}
			_, _, err := s.readResponse()
			if (err != nil) != tc.wantErr {
				t.Errorf("readResponse error %v, want error %v", err, tc.wantErr)
			}
		})
	}
}
