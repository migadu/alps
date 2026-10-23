package maildir

import (
	"io"
	"strings"
	"testing"

	"github.com/migadu/alps/provider"
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
