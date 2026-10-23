package alpsbase

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"testing"
)

func TestHTTP_MaildirEscapedHostKeyRemainsUsableAcrossRoutes(t *testing.T) {
	if os.PathSeparator == '\\' {
		t.Skip("backslash is a Windows path separator")
	}
	for _, key := range []string{`1700000000.M1P2.mail\057relay`, `1700000000.M3P4.mail\072993`} {
		t.Run(key, func(t *testing.T) {
			s := newTestServer(t)
			s.login()
			if err := os.WriteFile(filepath.Join(s.dir, "cur", key+":2,"), []byte("Subject: Escaped host\r\n\r\nkept\r\n"), 0o600); err != nil {
				t.Fatal(err)
			}
			listed := false
			for _, msg := range s.mailbox("INBOX").Messages {
				if msg.UID == key {
					listed = true
				}
			}
			if !listed {
				t.Fatal("escaped key absent from listing")
			}
			path := "/mailboxes/INBOX/messages/" + url.PathEscape(key)
			s.expect(s.do("GET", path, nil), http.StatusOK)
			s.expect(s.do("GET", path+"/raw?part=1", nil), http.StatusOK)
			s.expect(s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{"uids": []string{key}, "flags": []string{`\Flagged`}, "action": "add"}), http.StatusOK)
			s.expect(s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": []string{key}, "to": "Archive"}), http.StatusOK)
			s.expect(s.do("GET", "/mailboxes/Archive/messages/"+url.PathEscape(key), nil), http.StatusOK)
			s.expect(s.do("DELETE", "/mailboxes/Archive/messages", map[string]any{"uids": []string{key}}), http.StatusOK)
			if got := s.mailbox("Archive").Total; got != 0 {
				t.Errorf("Archive retains%d messages after delete", got)
			}
		})
	}
}
