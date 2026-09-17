package imap

import (
	"sort"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
)

func conversationMail(id, headers string) string {
	return "From: someone@example.com\r\nSubject: Engines\r\nMessage-ID: <" + id + ">\r\n" + headers + "\r\nbody\r\n"
}

func messageIDsOf(msgs []provider.Message) []string {
	var ids []string
	for _, m := range msgs {
		ids = append(ids, m.Envelope.MessageID)
	}
	sort.Strings(ids)
	return ids
}

// A conversation's replies from the user are in Sent, found by the IDs the
// conversation shares: a reply to one of its messages, a message one of them
// answered, and a reply to one of those in turn.
func TestFindByReferences(t *testing.T) {
	p := memIMAP(t, &memServer{})
	if err := p.client.Create("Sent", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	for _, m := range []string{
		// Answers the root, written bare as this web UI used to.
		conversationMail("mine1@local.test", "In-Reply-To: root@remote.test\r\n"),
		// Answers the remote reply to mine1.
		conversationMail("mine2@local.test", "In-Reply-To: <reply2@remote.test>\r\nReferences: <root@remote.test> <mine1@local.test> <reply2@remote.test>\r\n"),
		// Follows up mine2, naming nothing the inbox holds.
		conversationMail("mine3@local.test", "In-Reply-To: <mine2@local.test>\r\n"),
		// Another conversation, whose root merely contains the searched ID.
		conversationMail("other@local.test", "In-Reply-To: <xroot@remote.test>\r\n"),
		conversationMail("unrelated@local.test", ""),
	} {
		appendTo(t, p.client, "Sent", m)
	}

	// What the inbox thread names: the root, and the remote reply to mine1.
	ids := []string{"root@remote.test", "reply2@remote.test", "mine1@local.test"}
	found, err := p.FindByReferences("Sent", ids)
	if err != nil {
		t.Fatal(err)
	}
	got := messageIDsOf(found)
	want := []string{"mine1@local.test", "mine2@local.test", "mine3@local.test"}
	if len(got) != len(want) || got[0] != want[0] || got[1] != want[1] || got[2] != want[2] {
		t.Fatalf("found %q, want %q", got, want)
	}
	for _, m := range found {
		if m.Mailbox != "Sent" {
			t.Errorf("%s is in %q, want Sent", m.Envelope.MessageID, m.Mailbox)
		}
		if m.Envelope.MessageID == "mine1@local.test" && m.Envelope.InReplyTo != "root@remote.test" {
			t.Errorf("mine1 answers %q, want the bare ID it names", m.Envelope.InReplyTo)
		}
		if m.Envelope.MessageID == "mine2@local.test" && len(m.References) != 3 {
			t.Errorf("mine2 references %q", m.References)
		}
	}

	if found, err := p.FindByReferences("Sent", []string{"nobody@remote.test"}); err != nil || len(found) != 0 {
		t.Errorf("an ID nothing names found %d messages, err %v", len(found), err)
	}
}

// A full search stays within what servers accept. Every OR is parenthesised
// on the wire, so a chain would nest as deep as there are keys, and servers
// bound both the depth and the number of criteria nodes: Sora at 30 and 256.
func TestReferenceCriteriaStayWithinServerLimits(t *testing.T) {
	var ids []string
	for i := 0; i < maxReferenceIDs; i++ {
		ids = append(ids, "id@example.com")
	}
	var walk func(c imap.SearchCriteria) (depth, nodes int)
	walk = func(c imap.SearchCriteria) (int, int) {
		depth, nodes := 0, 1
		for _, or := range c.Or {
			for _, branch := range or {
				d, n := walk(branch)
				depth = max(depth, 1+d)
				nodes += n
			}
		}
		return depth, nodes
	}
	depth, nodes := walk(*referenceCriteria(ids))
	if depth > 8 || nodes > 256 {
		t.Errorf("%d IDs make a search %d ORs deep with %d nodes", len(ids), depth, nodes)
	}
}
