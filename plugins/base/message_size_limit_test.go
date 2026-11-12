package alpsbase

import (
	"github.com/emersion/go-smtp"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
	"net"
	"net/http"
	"testing"
)

type limitedMailStore struct {
	provider.MailProvider
	size int64
}

func (p limitedMailStore) MessageSizeLimit() int64 { return p.size }

func listenLimitedSubmission(t *testing.T, size int64) string {
	t.Helper()
	srv := smtp.NewServer(&smtpRecorder{})
	srv.Domain = "localhost"
	srv.AllowInsecureAuth = true
	srv.MaxMessageBytes = size
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(listener)
	t.Cleanup(func() { srv.Close() })
	return "smtp+insecure://" + listener.Addr().String()
}

func TestHTTP_AttachmentBudgetObservesAdvertisedMessageLimits(t *testing.T) {
	for _, tc := range []struct {
		name         string
		append, smtp int64
		configured   int
		largest      float64
	}{
		{"no upstream limits", 0, 0, 32, 32},
		{"IMAP25MiB", 25 << 20, 0, 32, 19},
		{"SMTP10MB", 0, 10_000_000, 32, 8},
		{"smaller SMTP wins", 25 << 20, 10_000_000, 32, 8},
		{"configured limit wins", 25 << 20, 10_000_000, 4, 4},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := newTestServerWithOptionsWrapping(t, listenLimitedSubmission(t, tc.smtp), alps.NewLogger(), func(o *alps.Options) { o.MaxAttachmentMiB = tc.configured }, func(p provider.MailProvider) provider.MailProvider { return limitedMailStore{p, tc.append} })
			server.login()
			for _, path := range []string{"/session", "/settings"} {
				response := server.do(http.MethodGet, path, nil)
				server.expect(response, http.StatusOK)
				var data struct{ MaxAttachmentMiB float64 }
				response.json(t, &data)
				if data.MaxAttachmentMiB <= 0 || data.MaxAttachmentMiB > tc.largest {
					t.Errorf("%s advertises %.3fMiB, want positive and <=%.1fMiB", path, data.MaxAttachmentMiB, tc.largest)
				}
			}
		})
	}
}
