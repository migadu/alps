package imap

import (
	"slices"
	"strings"
	"testing"

	"github.com/migadu/alps/provider"
)

func TestCarriedRawPartsKeepWireBytesOrderAndUnreadFlag(t *testing.T) {
	const raw = "From: Ada <ada@example.test>\r\nSubject: Raw parts\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=b\r\n\r\n" +
		"--b\r\nContent-Type: text/plain; charset=iso-8859-1\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\ncaf=E9\r\n" +
		"--b\r\nContent-Type: application/octet-stream\r\nContent-Transfer-Encoding: base64\r\n\r\nAAEC/w==\r\n" +
		"--b--\r\n"
	s := &memServer{}
	p := memIMAP(t, s, raw)
	if err := p.ensureMailboxSelected("INBOX"); err != nil {
		t.Fatal(err)
	}
	before := len(s.traffic.String())
	headers, bodies, err := p.GetMessagePartsRaw("INBOX", IMAPUID(1), [][]int{{2}, {1}})
	if err != nil {
		t.Fatal(err)
	}
	sent := s.traffic.String()[before:]
	if n := len(fetchCommands.FindAllString(sent, -1)); n != 1 {
		t.Fatalf("sent %d FETCH commands, want one: %s", n, sent)
	}
	if len(headers) != 2 || len(bodies) != 2 {
		t.Fatalf("got %d headers and %d bodies", len(headers), len(bodies))
	}
	if !strings.Contains(string(headers[0]), "application/octet-stream") || string(bodies[0]) != "AAEC/w==" {
		t.Errorf("first raw part: %q %q", headers[0], bodies[0])
	}
	if !strings.Contains(string(headers[1]), "charset=iso-8859-1") || string(bodies[1]) != "caf=E9" {
		t.Errorf("second raw part: %q %q", headers[1], bodies[1])
	}
	msg, err := p.GetMessageMetadata("INBOX", IMAPUID(1))
	if err != nil {
		t.Fatal(err)
	}
	if slices.Contains(msg.Flags, provider.FlagSeen) {
		t.Errorf("raw carry marked the source read: %v", msg.Flags)
	}
}
