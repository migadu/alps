package alpsbase

import (
	"context"
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
)

// fetchLines is the FETCH commands among lines.
func fetchLines(lines []string) []string {
	var fetches []string
	for _, line := range lines {
		if strings.Contains(strings.ToUpper(line), " FETCH ") {
			fetches = append(fetches, line)
		}
	}
	return fetches
}

// Where the server can undo a part's transfer encoding itself (BINARY, RFC
// 3516), a part is asked for as BINARY.PEEK: its bytes as they are, without
// base64's third more. It was always BODY.PEEK, and alps decoded the base64
// the server sent.
func TestHTTP_APartIsReadAsBinaryWhereTheServerCan(t *testing.T) {
	ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE=")) // "\x89PNG\r\n\x1a\nada"
	ps.login()

	mark := ps.commands.lineCount()
	r := ps.do("GET", "/mailboxes/INBOX/messages/1/raw?part=2", nil)
	ps.expect(r, http.StatusOK)
	if string(r.body) != "\x89PNG\r\n\x1a\nada" {
		t.Errorf("the part reads %q", r.body)
	}
	fetches := fetchLines(ps.commands.linesSince(mark))
	if len(fetches) != 1 || !strings.Contains(strings.ToUpper(fetches[0]), "BINARY.PEEK[2]") {
		t.Errorf("the part was read with %q, want one FETCH of BINARY.PEEK[2]", fetches)
	}

	// The whole message, as stored, is never asked for decoded.
	mark = ps.commands.lineCount()
	ps.expect(ps.do("GET", "/mailboxes/INBOX/messages/1/raw", nil), http.StatusOK)
	for _, fetch := range fetchLines(ps.commands.linesSince(mark)) {
		if strings.Contains(strings.ToUpper(fetch), "BINARY") {
			t.Errorf("the whole message was read with %q", fetch)
		}
	}
}

// A server that advertises BINARY may still refuse a part, one under a
// transfer encoding it does not know among them ([UNKNOWN-CTE]): the part is
// read again as stored.
func TestHTTP_APartTheServerWillNotSendAsBinaryIsReadAsStored(t *testing.T) {
	s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}},
		func(session imapserver.Session) imapserver.Session { return refusesBinary{session} },
		withPhoto("iVBORw0KGgphZGE="))
	s.login()
	r := s.do("GET", "/mailboxes/INBOX/messages/1/raw?part=2", nil)
	s.expect(r, http.StatusOK)
	if string(r.body) != "\x89PNG\r\n\x1a\nada" {
		t.Errorf("the part reads %q", r.body)
	}
}

// refusesBinary is a session that answers every FETCH of a BINARY section
// with NO [UNKNOWN-CTE].
type refusesBinary struct{ imapserver.Session }

func (s refusesBinary) Fetch(ctx context.Context, w *imapserver.FetchWriter, numSet imap.NumSet, options *imap.FetchOptions) error {
	if len(options.BinarySection) > 0 {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeUnknownCTE, Text: "unknown transfer encoding"}
	}
	return s.Session.Fetch(ctx, w, numSet, options)
}
