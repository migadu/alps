package alpsbase

import (
	"encoding/base64"
	"mime"
	"net/http"
	"testing"

	"github.com/migadu/go-imap"
)

// Rendering uses the server's MIME charset support, while a download of the
// same cached part still returns the original file. A browser's TextDecoder
// lacks IBM850 and interprets UTF-16 as little-endian even with a big-endian BOM.
func TestHTTP_TextRenderingKeepsTheDownloadBytes(t *testing.T) {
	for _, tc := range []struct {
		name, charset, body, text string
	}{
		{"Windows-1252", "windows-1252", "Caf\xe9 \x80", "Café €"},
		{"IBM850", "IBM850", "Caf\x82", "Café"},
		{"UTF-16 big endian", "UTF-16", "\xfe\xff\x00C\x00a\x00f\x00\xe9", "Café"},
		{"UTF-16 little endian", "UTF-16", "\xff\xfeC\x00a\x00f\x00\xe9\x00", "Café"},
	} {
		for _, renderFirst := range []bool{false, true} {
			order := "download first"
			if renderFirst {
				order = "render first"
			}
			t.Run(tc.name+"/"+order, func(t *testing.T) {
				raw := "From: sender@remote.test\r\nTo: " + testUser + "\r\nSubject: Text file\r\n" +
					"MIME-Version: 1.0\r\nContent-Type: text/plain; charset=" + tc.charset + "\r\n" +
					"Content-Disposition: attachment; filename=notes.txt\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
					base64.StdEncoding.EncodeToString([]byte(tc.body)) + "\r\n"
				ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapBinary: {}}, testUser)
				ps.deliver(testUser, "INBOX", raw)
				ps.login()
				ps.mailbox("INBOX")

				const download = "/mailboxes/INBOX/messages/1/raw?part=1"
				const render = download + "&text=1"
				paths := []string{download, render, download, render}
				if renderFirst {
					paths = []string{render, download, render, download}
				}
				var downloadETag, renderETag string
				for _, path := range paths {
					r := ps.do("GET", path, nil)
					ps.expect(r, http.StatusOK)
					want, charset := tc.body, tc.charset
					if path == render {
						want, charset = tc.text, "utf-8"
						renderETag = r.header.Get("ETag")
					} else {
						downloadETag = r.header.Get("ETag")
					}
					if string(r.body) != want {
						t.Errorf("%s = %q, want %q", path, r.body, want)
					}
					_, params, err := mime.ParseMediaType(r.header.Get("Content-Type"))
					if err != nil || params["charset"] != charset {
						t.Errorf("%s Content-Type = %q, want charset=%s", path, r.header.Get("Content-Type"), charset)
					}
				}
				if downloadETag == "" || renderETag == "" || downloadETag == renderETag {
					t.Fatalf("render/download validators must differ: %q, %q", renderETag, downloadETag)
				}
				ps.expect(ps.do("GET", render, nil, "If-None-Match", downloadETag), http.StatusOK)
				ps.expect(ps.do("GET", render, nil, "If-None-Match", renderETag), http.StatusNotModified)
				ps.expect(ps.do("GET", download, nil, "If-None-Match", downloadETag), http.StatusNotModified)
			})
		}
	}
}
