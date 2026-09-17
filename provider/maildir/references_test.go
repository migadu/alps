package maildir

import (
	"sort"
	"strings"
	"testing"
)

// The same conversation as the IMAP provider's test: replies in Sent found by
// the IDs the inbox thread shares, followed one step further, and not a
// message whose ID merely contains one of them.
func TestFindByReferences(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	if err := p.CreateMailbox("Sent"); err != nil {
		t.Fatal(err)
	}
	mail := func(id, headers string) *mockMessage {
		return &mockMessage{content: []byte("From: ada@example.com\r\nSubject: Engines\r\nMessage-ID: <" + id + ">\r\n" + headers + "\r\nbody\r\n")}
	}
	for _, m := range []*mockMessage{
		mail("mine1@local.test", "In-Reply-To: root@remote.test\r\n"),
		mail("mine2@local.test", "In-Reply-To: <reply2@remote.test>\r\nReferences: <root@remote.test> <mine1@local.test> <reply2@remote.test>\r\n"),
		mail("mine3@local.test", "In-Reply-To: <mine2@local.test>\r\n"),
		mail("other@local.test", "In-Reply-To: <xroot@remote.test>\r\n"),
		mail("unrelated@local.test", ""),
	} {
		if _, _, _, err := p.AppendMessage("Sent", m, 0); err != nil {
			t.Fatal(err)
		}
	}

	found, err := p.FindByReferences("Sent", []string{"root@remote.test", "reply2@remote.test", "mine1@local.test"})
	if err != nil {
		t.Fatal(err)
	}
	var got []string
	for _, m := range found {
		got = append(got, strings.Trim(m.Envelope.MessageID, "<>"))
		if m.Mailbox != "Sent" {
			t.Errorf("%s is in %q, want Sent", m.Envelope.MessageID, m.Mailbox)
		}
	}
	sort.Strings(got)
	if want := "mine1@local.test mine2@local.test mine3@local.test"; strings.Join(got, " ") != want {
		t.Errorf("found %q, want %q", got, want)
	}

	if found, err := p.FindByReferences("Sent", []string{"nobody@remote.test"}); err != nil || len(found) != 0 {
		t.Errorf("an ID nothing names found %d messages, err %v", len(found), err)
	}
	if found, err := p.FindByReferences("Never Created", []string{"root@remote.test"}); err != nil || len(found) != 0 {
		t.Errorf("a Sent never delivered to found %d messages, err %v", len(found), err)
	}
}
