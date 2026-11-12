package alpsbase

import (
	"github.com/migadu/go-imap"
	"net/http"
	"testing"
)

func TestHTTP_AllFolderSearchWithoutCapabilityIsRefused(t *testing.T) {
	s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, nil)
	s.login()
	s.expect(s.do("GET", "/mailboxes/*?query=invoice", nil), http.StatusBadRequest)
}
