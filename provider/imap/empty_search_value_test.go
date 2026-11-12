package imap

import (
	"errors"
	"github.com/migadu/alps/provider"
	"testing"
)

func TestEmptySearchValuesCannotSelectMessages(t *testing.T) {
	p := memIMAP(t, &memServer{},
		"From: alice@example.com\r\nTo: bob@example.com\r\nCc: carol@example.com\r\nSubject: invoice one\r\nX-Custom: yes\r\n\r\ninvoice body one\r\n",
		"From: alice@example.com\r\nTo: bob@example.com\r\nCc: carol@example.com\r\nSubject: invoice two\r\nX-Custom: yes\r\n\r\ninvoice body two\r\n")
	var queries []string
	for _, prefix := range []string{"from:", "to:", "cc:", "subject:", "body:", "header:X-Custom:", "is:"} {
		for _, suffix := range []string{"", `""`, `"`} {
			queries = append(queries, prefix+suffix)
		}
	}
	queries = append(queries, `invoice body:""`, `from: invoice`, `header:X-Custom:"" invoice`, `subject:"" body:invoice`)
	for _, query := range queries {
		t.Run(query, func(t *testing.T) {
			ids, err := p.SearchMessageIDs("INBOX", query)
			var invalid *provider.InvalidSearchError
			if !errors.As(err, &invalid) || len(ids) != 0 {
				t.Errorf("bulk search %q returned %d IDs, error %v; want refusal", query, len(ids), err)
			}
			messages, _, err := p.SearchMessages("INBOX", query, "desc", 0, 50)
			if !errors.As(err, &invalid) || len(messages) != 0 {
				t.Errorf("listing %q returned %d messages, error %v; want refusal", query, len(messages), err)
			}
		})
	}
}
