package alpsbase

import (
	"net/http"
	"strings"
	"testing"
)

// UIDVALIDITY also guards the cached structure used to choose the reader's
// part. A body-only guard is too late if the old structure names a MIME part
// which does not exist in the replacement message.
func TestHTTP_AReaderOfARemadeFolderChoosesTheNewMessagesPart(t *testing.T) {
	for _, server := range countingServers {
		t.Run(server.name, func(t *testing.T) {
			s, _, elsewhere := newIMAPAccountServer(t, server.caps)
			c := elsewhere()
			if err := c.Create("Work", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			if err := c.Subscribe("Work").Wait(); err != nil {
				t.Fatal(err)
			}
			old := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Old plans\r\n" +
				"MIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=old\r\n\r\n" +
				"--old\r\nContent-Type: text/plain\r\n\r\nOld plain.\r\n" +
				"--old\r\nContent-Type: text/html\r\n\r\n<p>Old HTML.</p>\r\n--old--\r\n"
			deliverElsewhere(t, c, "Work", old)
			s.login()
			first := s.do("GET", "/mailboxes/Work/messages/1?view=html", nil)
			s.expect(first, http.StatusOK)
			if !strings.Contains(string(first.body), "Old HTML.") {
				t.Fatalf("first reader response %s", first.body)
			}
			// Keep the old metadata row while the folder list learns the new
			// status. No Work listing or explicit refresh clears that row.
			s.expect(s.do("GET", "/mailboxes/INBOX?page=0&refresh=1", nil), http.StatusOK)
			remakeElsewhere(t, c, "Work", letter("New plans"))
			s.expect(s.do("GET", "/mailboxes/INBOX?page=0&refresh=1", nil), http.StatusOK)
			renewed := s.do("GET", "/mailboxes/Work/messages/1?view=html", nil)
			s.expect(renewed, http.StatusOK)
			if !strings.Contains(string(renewed.body), "Hello.") || strings.Contains(string(renewed.body), "Old HTML.") {
				t.Fatalf("reader opened the remade folder with stale structure: %s", renewed.body)
			}
		})
	}
}
