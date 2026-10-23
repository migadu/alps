package maildir

import (
	"encoding/base64"
	"io"
	"strings"
	"testing"
)

func TestEncodedAttachedMessageRawParts(t *testing.T) {
	inner := "From: person@example.com\r\nSubject: Nested\r\nContent-Type: text/plain; charset=iso-8859-1\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\ncaf=E9"
	raw := "From: sender@example.com\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n--b\r\nContent-Type: message/rfc822\r\nContent-Transfer-Encoding: base64\r\n\r\n" + base64.StdEncoding.EncodeToString([]byte(inner)) + "\r\n--b--\r\n"
	p := NewProvider(t.TempDir(), "ada@example.com")
	id := appendOne(t, p, raw)
	_, h, b, e := p.GetMessagePartRaw("INBOX", id, []int{1, 1}, 0)
	if e != nil || string(b) != "caf=E9" || !strings.Contains(string(h), "quoted-printable") {
		t.Fatalf("raw %q %q %v", h, b, e)
	}
	_, part, e := p.GetMessagePart("INBOX", id, []int{1, 1})
	if e != nil {
		t.Fatal(e)
	}
	decoded, e := io.ReadAll(part.Body)
	if e != nil || string(decoded) != "café" {
		t.Fatalf("decoded %q %v", decoded, e)
	}
}
func TestUnsupportedEncodingDoesNotBlockRawReads(t *testing.T) {
	for _, head := range []string{"Content-Type: text/plain; charset=x-unknown-charset\r\n", "Content-Type: application/octet-stream\r\nContent-Transfer-Encoding: x-unknown\r\n"} {
		t.Run(head, func(t *testing.T) {
			p := NewProvider(t.TempDir(), "ada@example.com")
			if e := p.CreateMailbox("INBOX"); e != nil {
				t.Fatal(e)
			}
			_, id, _, e := p.AppendMessage("INBOX", &mockMessage{content: []byte("From: person@example.com\r\n" + head + "\r\nstored-bytes")}, 0)
			if e != nil {
				t.Fatal(e)
			}
			if _, err := p.GetMessageMetadata("INBOX", id); err != nil {
				t.Errorf("metadata should not require body decoding: %v", err)
			}
			if _, _, err := p.GetMessagePart("INBOX", id, []int{1}); err == nil {
				t.Error("decoded read should report the unsupported encoding")
			}
			for _, path := range [][]int{nil, {1}} {
				_, _, body, e := p.GetMessagePartRaw("INBOX", id, path, 0)
				if e != nil || string(body) != "stored-bytes" {
					t.Errorf("raw unsupported %v: %q %v", path, body, e)
				}
			}
		})
	}
}
