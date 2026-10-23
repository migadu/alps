package alpsbase

import (
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
)

// base64Of is about n bytes of base64 text in lines of 76, as a mail client
// writes an attachment.
func base64Of(n int) string {
	line := strings.Repeat("A", 76)
	var b strings.Builder
	for b.Len() < n {
		b.WriteString(line)
		b.WriteString("\r\n")
	}
	return strings.TrimSuffix(b.String(), "\r\n")
}

// fetchesToReadAgain reads a part, then reads it again, and answers how many
// FETCH the second read sent.
func (ps *partsServer) fetchesToReadAgain(path string) int {
	ps.t.Helper()
	ps.expect(ps.do("GET", path, nil), http.StatusOK)
	before := ps.commands.snapshot()
	ps.expect(ps.do("GET", path, nil), http.StatusOK)
	return ps.commands.since(before)["FETCH"]
}

// A part above the session cache's limit, 1 MiB unless the config says
// otherwise, is not kept in it. Every part read was kept, attachments of any
// size among them, for the life of the cache entry and in a cache with no
// limit of its own: a few large attachments opened in one session held their
// whole bytes in the server's memory. Read again, such a part is fetched
// again; the browser's own copy, revalidated with a 304, is what saves that.
func TestHTTP_ALargePartIsNotKeptInTheSessionCache(t *testing.T) {
	ps := newPartsServer(t, testUser)
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
	ps.deliver(testUser, "INBOX", withPhoto(base64Of(1536<<10)))
	ps.login()

	if n := ps.fetchesToReadAgain("/mailboxes/INBOX/messages/1/raw?part=2"); n != 0 {
		t.Errorf("reading a small part again sent %d FETCH, want it kept", n)
	}
	if n := ps.fetchesToReadAgain("/mailboxes/INBOX/messages/2/raw?part=2"); n != 1 {
		t.Errorf("reading a 1.5 MiB part again sent %d FETCH, want it not kept, and read again", n)
	}
}

// The limit is the config's where it sets one.
func TestHTTP_ThePartCacheLimitIsTheConfigs(t *testing.T) {
	ps := newPartsServerWithOptions(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(o *alps.Options) { o.CacheMaxPartKiB = 4 }, testUser)
	ps.deliver(testUser, "INBOX", withPhoto(base64Of(2<<10)))
	ps.deliver(testUser, "INBOX", withPhoto(base64Of(8<<10)))
	ps.login()

	if n := ps.fetchesToReadAgain("/mailboxes/INBOX/messages/1/raw?part=2"); n != 0 {
		t.Errorf("reading a 2 KiB part again sent %d FETCH, want it kept under a 4 KiB limit", n)
	}
	if n := ps.fetchesToReadAgain("/mailboxes/INBOX/messages/2/raw?part=2"); n != 1 {
		t.Errorf("reading an 8 KiB part again sent %d FETCH, want it not kept under a 4 KiB limit", n)
	}
}
