package maildir

import (
	"io"
	"strings"
	"testing"
)

// A part's raw bytes are the part as it is stored, its transfer encoding and
// charset included, as IMAP's BODY[n] gives them; its entity is decoded, once.
// The raw bytes were the decoded body under the part's own header, which said
// base64 of text that was not, so every reader of them decoded it again.
func TestRawPartsAreThePartAsStored(t *testing.T) {
	const encoded = "U2VlIHlvdS4NCg==\r\n" // "See you.\r\n"
	single := "From: charles@remote.test\r\nSubject: Engines\r\n" +
		"Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" + encoded
	multipart := "From: charles@remote.test\r\nSubject: Café\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n" +
		"--b\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" + encoded +
		"--b\r\nContent-Type: text/plain; charset=iso-8859-1\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\ncaf=E9\r\n" +
		"--b--\r\n"

	for name, tc := range map[string]struct {
		message      string
		path         []int
		header       string // in the raw header
		raw, decoded string
	}{
		"a single-part message's body": {single, []int{1}, "Content-Transfer-Encoding: base64", encoded, "See you.\r\n"},
		"a whole message":              {single, nil, "Subject: Engines", encoded, "See you.\r\n"},
		"a base64 part":                {multipart, []int{1}, "Content-Transfer-Encoding: base64", "U2VlIHlvdS4NCg==", "See you.\r\n"},
		"a Latin-1 part":               {multipart, []int{2}, "charset=iso-8859-1", "caf=E9", "café"},
	} {
		t.Run(name, func(t *testing.T) {
			p := NewProvider(t.TempDir(), "ada@example.com")
			id := appendOne(t, p, tc.message)

			_, header, raw, err := p.GetMessagePartRaw("INBOX", id, tc.path, 0)
			if err != nil {
				t.Fatalf("raw: %v", err)
			}
			if !strings.Contains(string(header), tc.header) || string(raw) != tc.raw {
				t.Errorf("raw: header %q, body %q; want %q under a header with %q", header, raw, tc.raw, tc.header)
			}

			_, entity, _, data, err := p.GetMessagePartWithData("INBOX", id, tc.path)
			if err != nil {
				t.Fatalf("with data: %v", err)
			}
			if string(data) != tc.raw {
				t.Errorf("with data: raw body %q, want %q", data, tc.raw)
			}
			if tc.path != nil {
				if got, _ := io.ReadAll(entity.Body); string(got) != tc.decoded {
					t.Errorf("with data: decoded body %q, want %q", got, tc.decoded)
				}
				_, part, err := p.GetMessagePart("INBOX", id, tc.path)
				if err != nil {
					t.Fatalf("part: %v", err)
				}
				if got, _ := io.ReadAll(part.Body); string(got) != tc.decoded {
					t.Errorf("part: decoded body %q, want %q", got, tc.decoded)
				}
			}
		})
	}
}

// A limit on a raw read cuts the part as stored.
func TestARawReadIsLimitedInStoredBytes(t *testing.T) {
	p := NewProvider(t.TempDir(), "ada@example.com")
	id := appendOne(t, p, "From: charles@remote.test\r\nSubject: Engines\r\n"+
		"Content-Type: text/plain\r\nContent-Transfer-Encoding: base64\r\n\r\nU2VlIHlvdS4NCg==\r\n")
	if _, _, raw, err := p.GetMessagePartRaw("INBOX", id, []int{1}, 4); err != nil || string(raw) != "U2Vl" {
		t.Errorf("the first 4 bytes are %q (%v), want %q", raw, err, "U2Vl")
	}
}
