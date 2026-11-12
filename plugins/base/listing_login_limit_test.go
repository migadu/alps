package alpsbase

import (
	"errors"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"github.com/migadu/go-imap"
	"net/http"
	"testing"
)

type loginLimitedListing struct{ provider.MailProvider }

func (p loginLimitedListing) SearchMessages(string, string, string, int, int) ([]provider.Message, provider.PageInfo, error) {
	return nil, provider.PageInfo{}, errors.Join(alps.ErrMailProviderUnavailable, &provider.LimitError{Cause: &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeLimit, Text: "connection limit reached"}})
}

func TestHTTP_ListingLoginLimitIsUnavailable(t *testing.T) {
	for _, path := range []string{"/mailboxes/INBOX", "/mailboxes/INBOX?query=invoice"} {
		s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider { return loginLimitedListing{p} })
		s.login()
		response := s.do("GET", path, nil)
		s.expect(response, http.StatusServiceUnavailable)
		var answer struct {
			Error string `json:"error"`
		}
		response.json(t, &answer)
		if answer.Error != "mail_server_unavailable" {
			t.Errorf("%s: %s", path, response.body)
		}
	}
}
