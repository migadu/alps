package alpsbase

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"mime"
	"net/http"
	"strings"
	"testing"

	"github.com/migadu/go-imap"
)

// A text file's decoded stored octets are its download, even when BINARY
// canonicalizes its line endings or its MIME charset differs from UTF-8.
// When the message's structure is already held, downloading the text part asks
// directly for BODY.PEEK in a single FETCH rather than reading and discarding
// BINARY.PEEK first.
func TestHTTP_ATextAttachmentDownloadsItsStoredBytes(t *testing.T) {
	for _, tc := range []struct {
		name, contentType, wantCharset, body string
		cold                                 bool
	}{
		{name: "LF", contentType: "text/plain; charset=utf-8", wantCharset: "utf-8", body: "first\nsecond\n"},
		{name: "mixed line endings", contentType: "text/plain; charset=utf-8", wantCharset: "utf-8", body: "first\r\nsecond\nthird\r\n"},
		{name: "Windows-1252", contentType: "text/plain; charset=windows-1252", wantCharset: "windows-1252", body: "caf\xe9 \x80\r\n"},
		{name: "cold download", contentType: "text/plain; charset=utf-8", wantCharset: "utf-8", body: "first\nsecond\n", cold: true},
		{name: "malformed Content-Type parameter", contentType: "text/plain; name=my notes.txt", body: "first\nsecond\n", cold: true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			raw := "From: sender@remote.test\r\nTo: " + testUser + "\r\nSubject: File\r\n" +
				"MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=outer\r\n\r\n" +
				"--outer\r\nContent-Type: text/plain\r\n\r\nSee the file.\r\n" +
				"--outer\r\nContent-Type: " + tc.contentType + "\r\n" +
				"Content-Disposition: attachment; filename=notes.txt\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
				base64.StdEncoding.EncodeToString([]byte(tc.body)) + "\r\n--outer--\r\n"
			ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
			ps.deliver(testUser, "INBOX", raw)
			ps.login()
			if !tc.cold {
				ps.mailbox("INBOX")
			}

			const path = "/mailboxes/INBOX/messages/1/raw?part=2"
			mark := ps.commands.lineCount()
			r := ps.do("GET", path, nil)
			ps.expect(r, http.StatusOK)
			if string(r.body) != tc.body {
				t.Errorf("downloaded %q, want the stored file %q", r.body, tc.body)
			}
			if tc.wantCharset != "" {
				_, params, err := mime.ParseMediaType(r.header.Get("Content-Type"))
				if err != nil || params["charset"] != tc.wantCharset {
					t.Errorf("Content-Type = %q, want charset=%s for the unchanged bytes", r.header.Get("Content-Type"), tc.wantCharset)
				}
			}
			if !tc.cold {
				fetches := fetchLines(ps.commands.linesSince(mark))
				if len(fetches) != 1 || strings.Contains(strings.ToUpper(fetches[0]), "BINARY") {
					t.Errorf("listed text download sent %q, want one BODY.PEEK FETCH without BINARY", fetches)
				}
			}

			mark = ps.commands.lineCount()
			r = ps.do("GET", path, nil)
			ps.expect(r, http.StatusOK)
			if string(r.body) != tc.body {
				t.Errorf("cached download = %q, want %q", r.body, tc.body)
			}
			if fetches := fetchLines(ps.commands.linesSince(mark)); len(fetches) != 0 {
				t.Errorf("a repeated download sent %q, want the cached file", fetches)
			}
		})
	}
}

// Text without an attachment disposition is displayed by the browser, which
// needs the original charset now that the bytes are not converted to UTF-8.
func TestHTTP_AnInlineTextDownloadKeepsItsCharacterEncoding(t *testing.T) {
	const body = "caf\xe9 \x80\r\n"
	raw := "From: sender@remote.test\r\nTo: " + testUser + "\r\nSubject: Text\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: text/plain; charset=windows-1252\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
		base64.StdEncoding.EncodeToString([]byte(body)) + "\r\n"
	ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
	ps.deliver(testUser, "INBOX", raw)
	ps.login()
	r := ps.do("GET", "/mailboxes/INBOX/messages/1/raw?part=1", nil)
	ps.expect(r, http.StatusOK)
	if string(r.body) != body {
		t.Errorf("inline text = %q, want stored bytes %q", r.body, body)
	}
	mimeType, params, err := mime.ParseMediaType(r.header.Get("Content-Type"))
	if err != nil || mimeType != "text/plain" || params["charset"] != "windows-1252" {
		t.Errorf("Content-Type = %q, want text/plain; charset=windows-1252", r.header.Get("Content-Type"))
	}
	if disposition := r.header.Get("Content-Disposition"); disposition != "" {
		t.Errorf("the browser's text has Content-Disposition %q, want inline display", disposition)
	}
}

// The reader may use BINARY's canonical text, but that cached representation
// must not replace the stored file when the same part is downloaded later, and
// downloading the stored part keeps the reader's cached verdict and References.
func TestHTTP_AReaderCachedTextStillDownloadsItsStoredBytes(t *testing.T) {
	const body = "first\nsecond\n"
	raw := "Authentication-Results: mx.example.com; dmarc=pass header.from=brand.test\r\n" +
		"From: Brand <news@brand.test>\r\nTo: " + testUser + "\r\nSubject: Text\r\n" +
		"References: <root@brand.test>\r\nMIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
		base64.StdEncoding.EncodeToString([]byte(body)) + "\r\n"
	ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
	ps.deliver(testUser, "INBOX", raw)
	ps.login()
	ps.mailbox("INBOX")

	mark := ps.commands.lineCount()
	r := ps.do("GET", "/mailboxes/INBOX/messages/1?view=text", nil)
	ps.expect(r, http.StatusOK)
	var opened openedMessage
	r.json(t, &opened)
	if opened.Body == nil || *opened.Body != "first\r\nsecond\r\n" {
		t.Fatalf("the reader did not receive the server's canonical text: %+v", opened.Body)
	}
	if !opened.Message.HasBimiPotential || !contains(opened.Message.References, "root@brand.test") {
		t.Fatalf("the reader lost verdict or References: %+v", opened.Message)
	}
	if fetches := fetchLines(ps.commands.linesSince(mark)); len(fetches) != 1 || !strings.Contains(strings.ToUpper(fetches[0]), "BINARY.PEEK[1]") {
		t.Errorf("opening listed text sent %q, want one BINARY.PEEK[1] FETCH", fetches)
	}

	const path = "/mailboxes/INBOX/messages/1/raw?part=1"
	mark = ps.commands.lineCount()
	r = ps.do("GET", path, nil)
	ps.expect(r, http.StatusOK)
	if string(r.body) != body {
		t.Errorf("download after reading = %q, want stored file %q", r.body, body)
	}
	if fetches := fetchLines(ps.commands.linesSince(mark)); len(fetches) != 1 || strings.Contains(strings.ToUpper(fetches[0]), "BINARY") {
		t.Errorf("downloading after reading sent %q, want one BODY.PEEK FETCH without BINARY", fetches)
	}

	mark = ps.commands.lineCount()
	r = ps.do("GET", path, nil)
	ps.expect(r, http.StatusOK)
	if string(r.body) != body || len(fetchLines(ps.commands.linesSince(mark))) != 0 {
		t.Errorf("repeated download = %q, fetches = %q; want cached %q", r.body, fetchLines(ps.commands.linesSince(mark)), body)
	}

	mark = ps.commands.lineCount()
	r = ps.do("GET", "/mailboxes/INBOX/messages/1?view=text", nil)
	ps.expect(r, http.StatusOK)
	opened = openedMessage{}
	r.json(t, &opened)
	if !opened.Message.HasBimiPotential || !contains(opened.Message.References, "root@brand.test") {
		t.Errorf("reopening after download lost verdict or References: %+v", opened.Message)
	}
	if fetches := fetchLines(ps.commands.linesSince(mark)); len(fetches) != 0 {
		t.Errorf("reopening after download sent %q, want nothing", fetches)
	}
}

// Opening an unlisted text message on a BINARY server is not a download: it
// must keep the reader's at-most-two-FETCH bound rather than re-reading the
// text part as stored.
func TestHTTP_OpeningAnUnlistedTextMessageOverBinaryAsksAtMostTwice(t *testing.T) {
	ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
	ps.deliver(testUser, "INBOX", gearsMessage)
	ps.login()

	mark := ps.commands.lineCount()
	openAsReader(t, ps.testServer, "1")
	if fetches := fetchLines(ps.commands.linesSince(mark)); len(fetches) > 2 {
		t.Errorf("opening an unlisted message on a BINARY server sent %d FETCH, want at most 2: %q", len(fetches), fetches)
	}
}

// A browser holding a download from before byte-preserving downloads must
// receive the new body instead of validating the old transformed copy.
func TestHTTP_ATextDownloadReplacesTheOldCachedFormat(t *testing.T) {
	const body = "first\nsecond\n"
	raw := "From: sender@remote.test\r\nTo: " + testUser + "\r\nSubject: Text\r\n" +
		"MIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
		base64.StdEncoding.EncodeToString([]byte(body)) + "\r\n"
	ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
	ps.deliver(testUser, "INBOX", raw)
	ps.login()
	r := ps.do("GET", "/mailboxes/INBOX/status", nil)
	ps.expect(r, http.StatusOK)
	var status struct{ UIDValidity uint32 }
	r.json(t, &status)
	if status.UIDValidity == 0 {
		t.Fatal("the mailbox has no UIDVALIDITY")
	}
	const path = "/mailboxes/INBOX/messages/1/raw?part=1"
	sum := sha256.Sum256(fmt.Appendf(nil, "1\x00%s\x00%d\x00%s", testUser, status.UIDValidity, path))
	oldETag := `"` + hex.EncodeToString(sum[:12]) + `"`
	r = ps.do("GET", path, nil, "If-None-Match", oldETag)
	ps.expect(r, http.StatusOK)
	if string(r.body) != body || r.header.Get("ETag") == oldETag {
		t.Errorf("download = %q, ETag %q; want new representation with body %q", r.body, r.header.Get("ETag"), body)
	}
}
