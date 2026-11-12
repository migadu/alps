package alpsbase

import (
	"net/http"
	"net/url"
	"testing"
)

func TestHTTP_MaildirAllMailboxesCannotBecomeARealFolder(t *testing.T) {
	s := newTestServer(t)
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"*"}}), http.StatusBadRequest)
	s.expect(s.do("GET", "/mailboxes/*?query=invoice", nil), http.StatusBadRequest)
}
