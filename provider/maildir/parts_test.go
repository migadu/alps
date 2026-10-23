package maildir

import (
	"io"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
	imapprovider "github.com/migadu/alps/provider/imap"
)

func appendOne(t *testing.T, p *Provider, content string) provider.MessageID {
	t.Helper()
	if err := p.CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	if _, _, _, err := p.AppendMessage("INBOX", &mockMessage{content: []byte(content)}, 0); err != nil {
		t.Fatal(err)
	}
	// AppendMessage cannot name the message it stored: the listing does.
	listed, _, err := p.ListMessages("INBOX", "asc", 0, 10)
	if err != nil || len(listed) != 1 {
		t.Fatalf("listing: %d messages, err %v", len(listed), err)
	}
	return listed[0].ID
}

// A message that is not multipart, the most common kind, has one part: its
// body, part 1, as IMAP numbers a message's parts (RFC 3501, section 6.4.5).
// The reader asks for part 1 of such a message, and every way of reading a
// part answered "entity is not multipart", so the message could not be
// opened.
func TestASinglePartMessageIsItsOwnPartOne(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	const body = "See you at the workshop.\r\n"
	id := appendOne(t, p, "From: charles@remote.test\r\nSubject: Engines\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n"+body)

	if _, part, err := p.GetMessagePart("INBOX", id, []int{1}); err != nil {
		t.Errorf("part: %v", err)
	} else {
		got, _ := io.ReadAll(part.Body)
		if mediaType, _, _ := part.Header.ContentType(); mediaType != "text/plain" || string(got) != body {
			t.Errorf("part 1 is %s %q, want text/plain %q", mediaType, got, body)
		}
	}

	if _, header, raw, err := p.GetMessagePartRaw("INBOX", id, []int{1}, 0); err != nil {
		t.Errorf("raw part: %v", err)
	} else if !strings.Contains(string(header), "Content-Type: text/plain") || string(raw) != body {
		t.Errorf("raw part 1 is %q %q, want the text/plain body %q", header, raw, body)
	}

	if _, _, _, data, err := p.GetMessagePartWithData("INBOX", id, []int{1}); err != nil {
		t.Errorf("part with data: %v", err)
	} else if string(data) != body {
		t.Errorf("part 1 with data is %q, want %q", data, body)
	}

	// There is no other part.
	for _, path := range [][]int{{2}, {1, 1}} {
		if _, _, err := p.GetMessagePart("INBOX", id, path); err == nil {
			t.Errorf("part %v of a single-part message was found", path)
		}
	}
}

// The parts of a multipart message are numbered from 1 as before.
func TestAMultipartMessagesPartsAreItsChildren(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	id := appendOne(t, p, "From: charles@remote.test\r\nSubject: Engines\r\n"+
		"Content-Type: multipart/alternative; boundary=b\r\n\r\n"+
		"--b\r\nContent-Type: text/plain\r\n\r\nplain\r\n"+
		"--b\r\nContent-Type: text/html\r\n\r\n<p>html</p>\r\n"+
		"--b--\r\n")

	for n, want := range map[int]string{1: "plain", 2: "<p>html</p>"} {
		_, _, _, data, err := p.GetMessagePartWithData("INBOX", id, []int{n})
		if err != nil || string(data) != want {
			t.Errorf("part %d is %q (%v), want %q", n, data, err, want)
		}
	}
	if _, _, err := p.GetMessagePart("INBOX", id, []int{3}); err == nil {
		t.Error("part 3 of a two-part message was found")
	}
}

// forward is a message that carries another, as a forward as attachment
// does: a note, and the forwarded message, multipart itself.
const forward = "From: ada@example.com\r\nSubject: Fwd: Engines\r\nContent-Type: multipart/mixed; boundary=outer\r\n\r\n" +
	"--outer\r\nContent-Type: text/plain\r\n\r\nSee below.\r\n" +
	"--outer\r\nContent-Type: message/rfc822\r\n\r\n" +
	"From: Charles <charles@remote.test>\r\nSubject: Engines\r\nMessage-ID: <engines@remote.test>\r\n" +
	"Content-Type: multipart/alternative; boundary=inner\r\n\r\n" +
	"--inner\r\nContent-Type: text/plain\r\n\r\nplain\r\n" +
	"--inner\r\nContent-Type: text/html\r\n\r\n<p>html</p>\r\n" +
	"--inner--\r\n" +
	"\r\n--outer--\r\n"

// An attached message is described as IMAP describes it (RFC 3501, section
// 7.4.2): by its envelope and its own parts. It was one opaque part, so the
// reader could not even name it after its subject, as it does over IMAP.
func TestAnAttachedMessageIsDescribedByItsEnvelopeAndParts(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	id := appendOne(t, p, forward)

	meta, err := p.GetMessageMetadata("INBOX", id)
	if err != nil {
		t.Fatal(err)
	}
	outer, ok := meta.BodyStructure.(*imapprovider.IMAPBodyStructure).BodyStructure.(*imap.BodyStructureMultiPart)
	if !ok || len(outer.Children) != 2 {
		t.Fatalf("the message is described as %#v", meta.BodyStructure)
	}
	attached, ok := outer.Children[1].(*imap.BodyStructureSinglePart)
	if !ok || attached.MediaType() != "message/rfc822" {
		t.Fatalf("part 2 is described as %#v", outer.Children[1])
	}
	m := attached.MessageRFC822
	if m == nil || m.Envelope == nil {
		t.Fatal("the attached message has no envelope")
	}
	from := m.Envelope.From
	if m.Envelope.Subject != "Engines" || m.Envelope.MessageID != "engines@remote.test" ||
		len(from) != 1 || from[0] != (imap.Address{Name: "Charles", Mailbox: "charles", Host: "remote.test"}) {
		t.Errorf("the attached message's envelope is %+v", m.Envelope)
	}
	inner, ok := m.BodyStructure.(*imap.BodyStructureMultiPart)
	if !ok || inner.MediaType() != "multipart/alternative" || len(inner.Children) != 2 ||
		inner.Children[0].MediaType() != "text/plain" || inner.Children[1].MediaType() != "text/html" {
		t.Errorf("the attached message's parts are described as %#v", m.BodyStructure)
	}
}

// The parts of an attached message are numbered within it, as a message's
// are: 2.1 is the first part of the message at 2, or its body when it is not
// multipart. They could not be read at all.
func TestAnAttachedMessagesPartsAreReadByTheirNumbers(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	id := appendOne(t, p, forward)
	for want, path := range map[string][]int{"plain": {2, 1}, "<p>html</p>": {2, 2}} {
		if _, _, _, data, err := p.GetMessagePartWithData("INBOX", id, path); err != nil || string(data) != want {
			t.Errorf("part %v is %q (%v), want %q", path, data, err, want)
		}
	}
	// The attached message itself is still the part at 2, whole.
	if _, _, _, data, err := p.GetMessagePartWithData("INBOX", id, []int{2}); err != nil || !strings.HasPrefix(string(data), "From: Charles") {
		t.Errorf("part 2 is %q (%v), want the attached message", data, err)
	}
	if _, _, err := p.GetMessagePart("INBOX", id, []int{2, 3}); err == nil {
		t.Error("part 2.3 of a two-part attached message was found")
	}

	// An attached message that is not multipart has a part 1, its body.
	p = NewProvider(t.TempDir(), "ada@example.com")
	id = appendOne(t, p, "From: ada@example.com\r\nSubject: Fwd: Looms\r\nContent-Type: multipart/mixed; boundary=outer\r\n\r\n"+
		"--outer\r\nContent-Type: text/plain\r\n\r\nSee below.\r\n"+
		"--outer\r\nContent-Type: message/rfc822\r\n\r\n"+
		"From: charles@remote.test\r\nSubject: Looms\r\n\r\nbody of Looms\r\n"+
		"\r\n--outer--\r\n")
	if _, _, _, data, err := p.GetMessagePartWithData("INBOX", id, []int{2, 1}); err != nil || string(data) != "body of Looms\r\n" {
		t.Errorf("part 2.1 is %q (%v), want the attached message's body", data, err)
	}
}
