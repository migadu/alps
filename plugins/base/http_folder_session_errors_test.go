package alpsbase

import (
	"errors"
	"net/http"
	"net/url"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type folderFailureProvider struct {
	provider.MailProvider
	err error
}

func (p folderFailureProvider) CreateMailbox(string) error         { return p.err }
func (p folderFailureProvider) DeleteMailbox(string) error         { return p.err }
func (p folderFailureProvider) RenameMailbox(string, string) error { return p.err }
func (p folderFailureProvider) SubscribeMailbox(string) error      { return p.err }
func (p folderFailureProvider) UnsubscribeMailbox(string) error    { return p.err }

func TestHTTP_FolderMutationsPreserveSessionAndServiceErrors(t *testing.T) {
	for _, failure := range []struct {
		name   string
		err    error
		status int
	}{
		{"auth", provider.AuthError{Cause: &imap.Error{Type: imap.StatusResponseTypeNo, Code: imap.ResponseCodeAuthenticationFailed, Text: "Credentials no longer accepted"}}, http.StatusUnauthorized},
		{"outage", errors.Join(alps.ErrMailProviderUnavailable, errors.New("backend offline")), http.StatusServiceUnavailable},
	} {
		for _, op := range []struct {
			name, method, path string
			body               any
		}{
			{"create", "POST", "/mailboxes", url.Values{"name": {"Work"}}},
			{"delete", "DELETE", "/mailboxes/Work", nil},
			{"rename", "PUT", "/mailboxes/Work/rename", map[string]string{"new_name": "Other"}},
			{"subscribe", "PUT", "/mailboxes/Work/subscribe", nil},
			{"unsubscribe", "PUT", "/mailboxes/Work/unsubscribe", nil},
		} {
			t.Run(failure.name+"/"+op.name, func(t *testing.T) {
				s := newTestServerWrapping(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
					return folderFailureProvider{MailProvider: p, err: failure.err}
				})
				s.login()
				s.expect(s.do(op.method, op.path, op.body), failure.status)
			})
		}
	}
}
