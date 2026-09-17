package alpsbase

import (
	"bufio"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/emersion/go-message"
	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-message/textproto"
)

// A reply sent from the web UI answers its message. What it answers is
// written so a server and the recipient's client can read it, whatever form
// the composer sent the IDs in; the answered message is marked, and the list
// shows the mark without waiting for its cache to expire.
func TestHTTP_AReplyAnswersItsMessage(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	var original string
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == "Engines" {
			original = m.UID
		}
	}
	if original == "" {
		t.Fatal("the message to answer is not listed")
	}

	r := s.do("POST", "/messages", url.Values{
		"to":            {"charles@remote.test"},
		"subject":       {"Re: Engines"},
		"text":          {"Agreed."},
		"in_reply_to":   {"engines@remote.test"},
		"references":    {"plans@remote.test"},
		"reply_mailbox": {"INBOX"},
		"reply_uid":     {original},
	})
	s.expect(r, http.StatusOK)

	rec.mu.Lock()
	data := rec.data
	rec.mu.Unlock()
	th, err := textproto.ReadHeader(bufio.NewReader(strings.NewReader(data)))
	if err != nil {
		t.Fatalf("reading the sent header: %v", err)
	}
	h := mail.Header{Header: message.Header{Header: th}}
	if ids, err := h.MsgIDList("In-Reply-To"); err != nil || len(ids) != 1 || ids[0] != "engines@remote.test" {
		t.Errorf("In-Reply-To = %q, read as %q, %v", h.Get("In-Reply-To"), ids, err)
	}
	if ids, err := h.MsgIDList("References"); err != nil || strings.Join(ids, " ") != "plans@remote.test engines@remote.test" {
		t.Errorf("References = %q, read as %q, %v", h.Get("References"), ids, err)
	}

	answered := false
	for _, m := range s.mailbox("INBOX").Messages {
		if m.UID == original && contains(m.Flags, `\Answered`) {
			answered = true
		}
	}
	if !answered {
		t.Error("the answered message is not listed as answered")
	}
	if sent := s.mailbox("Sent"); sent.Total != 1 || sent.Messages[0].Envelope.Subject != "Re: Engines" {
		t.Errorf("Sent holds %d messages: %+v", sent.Total, sent.Messages)
	}
}
