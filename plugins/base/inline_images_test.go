package alpsbase

import (
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
)

// newsletter is an HTML message showing images it carries, by Content-ID:
//
//	1  text/html
//	2  image/png  <logo@remote.test>
//	3  image/png  <chart@remote.test>
//	4  image/png  <photo@remote.test>, large unless photo is small
func newsletter(photo string) string {
	image := func(id, base64Body string) string {
		return "--r\r\nContent-Type: image/png\r\nContent-ID: <" + id + "@remote.test>\r\nContent-Disposition: inline\r\n" +
			"Content-Transfer-Encoding: base64\r\n\r\n" + base64Body + "\r\n"
	}
	return "From: News <news@remote.test>\r\nTo: " + testUser + "\r\nSubject: News\r\nMIME-Version: 1.0\r\n" +
		"Content-Type: multipart/related; boundary=r\r\n\r\n" +
		"--r\r\nContent-Type: text/html; charset=utf-8\r\n\r\n" +
		`<p><img src="cid:logo@remote.test"><img src="cid:chart@remote.test"><img src="cid:photo@remote.test"></p>` + "\r\n" +
		image("logo", "iVBORw0KGgpsb2dv") + image("chart", "iVBORw0KGgpjaGFydA==") + image("photo", photo) +
		"--r--\r\n"
}

// openListed lists INBOX and opens its first message as the reader does,
// and answers the commands the open sent.
func (ps *partsServer) openListed(view string) map[string]int {
	ps.t.Helper()
	uid := ps.mailbox("INBOX").Messages[0].UID
	before := ps.commands.snapshot()
	r := ps.do("GET", "/mailboxes/INBOX/messages/"+uid+"?view="+view, nil)
	ps.expect(r, http.StatusOK)
	return ps.commands.since(before)
}

// fetchesFor reads each path with /raw, as the reader's page does for the
// images its HTML shows, and answers how many FETCH that sent.
func (ps *partsServer) fetchesFor(paths ...string) int {
	ps.t.Helper()
	before := ps.commands.snapshot()
	for _, path := range paths {
		ps.expect(ps.do("GET", path, nil), http.StatusOK)
	}
	return ps.commands.since(before)["FETCH"]
}

// An HTML body's images are read in the FETCH that reads the body, and kept,
// so the page's requests for them read nothing more. Each image was a
// request and a FETCH of its own, each FETCH asking again for the message's
// envelope and structure, one after another on the session's connection.
func TestHTTP_AnHTMLBodysImagesAreReadWithIt(t *testing.T) {
	ps := newPartsServer(t, testUser)
	ps.deliver(testUser, "INBOX", newsletter("iVBORw0KGgpwaG90bw=="))
	ps.login()

	if sent := ps.openListed("html"); sent["FETCH"] != 1 {
		t.Fatalf("opening the message sent %v, want one FETCH", sent)
	}
	if n := ps.fetchesFor("/mailboxes/INBOX/messages/1/raw?part=2", "/mailboxes/INBOX/messages/1/raw?part=3", "/mailboxes/INBOX/messages/1/raw?part=4"); n != 0 {
		t.Errorf("the page's images sent %d FETCH, want none: they came with the body", n)
	}
	r := ps.do("GET", "/mailboxes/INBOX/messages/1/raw?part=3", nil)
	if string(r.body) != "\x89PNG\r\n\x1a\nchart" {
		t.Errorf("the chart reads %q", r.body)
	}
}

// So are those of a message opened from a link, which no listing has read.
func TestHTTP_AnHTMLBodysImagesAreReadWithItOpenedFromALink(t *testing.T) {
	ps := newPartsServer(t, testUser)
	ps.deliver(testUser, "INBOX", newsletter("iVBORw0KGgpwaG90bw=="))
	ps.login()

	ps.expect(ps.do("GET", "/mailboxes/INBOX/messages/1?view=html", nil), http.StatusOK)
	if n := ps.fetchesFor("/mailboxes/INBOX/messages/1/raw?part=2", "/mailboxes/INBOX/messages/1/raw?part=3", "/mailboxes/INBOX/messages/1/raw?part=4"); n != 0 {
		t.Errorf("the page's images sent %d FETCH, want none", n)
	}
}

// As BINARY where the server has it, and the images are the bytes they are.
func TestHTTP_AnHTMLBodysImagesAreReadWithItAsBinary(t *testing.T) {
	ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
	ps.deliver(testUser, "INBOX", newsletter("iVBORw0KGgpwaG90bw=="))
	ps.login()

	uid := ps.mailbox("INBOX").Messages[0].UID
	mark := ps.commands.lineCount()
	ps.expect(ps.do("GET", "/mailboxes/INBOX/messages/"+uid+"?view=html", nil), http.StatusOK)
	fetches := fetchLines(ps.commands.linesSince(mark))
	if len(fetches) != 1 || !strings.Contains(strings.ToUpper(fetches[0]), "BINARY.PEEK[3]") {
		t.Errorf("the message was opened with %q, want one FETCH carrying BINARY.PEEK[3]", fetches)
	}
	if n := ps.fetchesFor("/mailboxes/INBOX/messages/1/raw?part=3"); n != 0 {
		t.Errorf("the chart sent %d FETCH", n)
	}
	r := ps.do("GET", "/mailboxes/INBOX/messages/1/raw?part=3", nil)
	if string(r.body) != "\x89PNG\r\n\x1a\nchart" {
		t.Errorf("the chart reads %q", r.body)
	}
}

// What the body waits for is bounded: an image above the part cache's limit,
// and images past it all told, are not read with the body, and are read when
// the page asks for them, as before.
func TestHTTP_AnHTMLBodyWaitsForAtMostTheCacheLimitOfImages(t *testing.T) {
	ps := newPartsServerWithOptions(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(o *alps.Options) { o.CacheMaxPartKiB = 4 }, testUser)
	ps.deliver(testUser, "INBOX", newsletter(base64Of(8<<10)))
	ps.login()

	ps.openListed("html")
	if n := ps.fetchesFor("/mailboxes/INBOX/messages/1/raw?part=2", "/mailboxes/INBOX/messages/1/raw?part=3"); n != 0 {
		t.Errorf("the small images sent %d FETCH, want none", n)
	}
	if n := ps.fetchesFor("/mailboxes/INBOX/messages/1/raw?part=4"); n != 1 {
		t.Errorf("the 8 KiB photo sent %d FETCH, want it read when asked for", n)
	}
}
