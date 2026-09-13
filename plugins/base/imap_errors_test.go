package alpsbase

import (
	"errors"
	"fmt"
	"net/http"
	"testing"

	"github.com/emersion/go-imap/v2"
)

func TestMailboxErrorStatus(t *testing.T) {
	imapErr := func(code imap.ResponseCode) error {
		return &imap.Error{Type: imap.StatusResponseTypeNo, Code: code, Text: "Mailbox server v1.2 at imap.internal says no"}
	}
	cases := []struct {
		name   string
		err    error
		status int
		slug   string
	}{
		{"already exists", imapErr(imap.ResponseCodeAlreadyExists), http.StatusConflict, "already_exists"},
		{"nonexistent", imapErr(imap.ResponseCodeNonExistent), http.StatusNotFound, "not_found"},
		{"no permission", imapErr(imap.ResponseCodeNoPerm), http.StatusForbidden, "forbidden"},
		{"cannot", imapErr(imap.ResponseCodeCannot), http.StatusBadRequest, "cannot"},
		{"over quota", imapErr(imap.ResponseCodeOverQuota), http.StatusInsufficientStorage, "over_quota"},
		{"another code", imapErr(imap.ResponseCode("CONTACTADMIN")), http.StatusInternalServerError, "server_error"},
		{"no code", imapErr(""), http.StatusInternalServerError, "server_error"},
		{"wrapped", fmt.Errorf("rename: %w", imapErr(imap.ResponseCodeAlreadyExists)), http.StatusConflict, "already_exists"},
		{"not an IMAP error", errors.New("connection reset by peer"), http.StatusInternalServerError, "server_error"},
	}
	for _, c := range cases {
		status, slug := mailboxErrorStatus(c.err)
		if status != c.status || slug != c.slug {
			t.Errorf("%s: got %d %q, want %d %q", c.name, status, slug, c.status, c.slug)
		}
	}
}
