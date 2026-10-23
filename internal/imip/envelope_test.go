package imip

import (
	"context"
	"errors"
	"io"
	"net"
	"reflect"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
)

type envelopeRecorder struct {
	mu      sync.Mutex
	from    string
	to      []string
	body    string
	refusal error
}

func (r *envelopeRecorder) NewSession(*smtp.Conn) (smtp.Session, error) { return r, nil }
func (r *envelopeRecorder) Mail(_ context.Context, from string, _ *smtp.MailOptions) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.from = from
	return nil
}
func (r *envelopeRecorder) Rcpt(_ context.Context, to string, _ *smtp.RcptOptions) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.refusal != nil {
		return r.refusal
	}
	r.to = append(r.to, to)
	return nil
}
func (r *envelopeRecorder) Data(_ context.Context, body io.Reader) error {
	b, err := io.ReadAll(body)
	if err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	r.body = string(b)
	return nil
}
func (r *envelopeRecorder) Reset()        {}
func (r *envelopeRecorder) Logout() error { return nil }

func dialEnvelopeRecorder(t *testing.T, r *envelopeRecorder) *smtp.Client {
	t.Helper()
	server := smtp.NewServer(r)
	server.Domain = "localhost"
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go server.Serve(ln)
	t.Cleanup(func() { server.Close() })
	c, err := smtp.Dial(ln.Addr().String())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { c.Close() })
	return c
}

func TestSendKeepsQuotedLocalPartsInTheEnvelope(t *testing.T) {
	for _, tc := range []struct {
		name, from, to string
		parsedSender   bool
	}{
		{"ordinary mailbox", "account@example.com", "grace@example.org", false},
		{"null envelope sender", "", "grace@example.org", false},
		{"recipient quoted at sign", "account@example.com", `"a@b"@remote.test`, false},
		{"recipient specials", "account@example.com", `"a; b\"\\c"@remote.test`, false},
		{"recipient literal edge quotes", "account@example.com", `"\"quoted\""@remote.test`, false},
		{"serialized sender", `"a; b\"\\c"@example.com`, "grace@example.org", false},
		{"parsed sender", `"a; b\"\\c"@example.com`, "grace@example.org", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			sender := &mail.Address{}
			if tc.from != "" {
				var err error
				sender, err = mail.ParseAddress(tc.from)
				if err != nil {
					t.Fatal(err)
				}
			}
			recipient, err := mail.ParseAddress(tc.to)
			if err != nil {
				t.Fatal(err)
			}
			recipient.Name = "Grace Hopper"
			envelopeFrom := tc.from
			if tc.parsedSender {
				envelopeFrom = sender.Address
			}
			rec := &envelopeRecorder{}
			c := dialEnvelopeRecorder(t, rec)
			m := &Message{From: &mail.Address{Name: "Organizer", Address: "organizer@example.net"}, To: []*mail.Address{recipient}, Text: "Please join.", Calendar: calendar("REQUEST")}
			if err := Send(c, envelopeFrom, m); err != nil {
				t.Fatal(err)
			}
			rec.mu.Lock()
			defer rec.mu.Unlock()
			if rec.from != sender.Address || !reflect.DeepEqual(rec.to, []string{recipient.Address}) {
				t.Fatalf("envelope from=%q to=%q, want %q/%q", rec.from, rec.to, sender.Address, recipient.Address)
			}
			reader, err := mail.CreateReader(strings.NewReader(rec.body))
			if err != nil {
				t.Fatal(err)
			}
			from, err := reader.Header.AddressList("From")
			if err != nil || len(from) != 1 || from[0].Address != m.From.Address {
				t.Fatalf("header sender=%+v err=%v", from, err)
			}
			to, err := reader.Header.AddressList("To")
			if err != nil || len(to) != 1 || to[0].Address != recipient.Address || to[0].Name != recipient.Name {
				t.Fatalf("header recipient=%+v err=%v", to, err)
			}
		})
	}
}

func TestSendKeepsQuotedRecipientRefusalRetryable(t *testing.T) {
	rec := &envelopeRecorder{refusal: &smtp.SMTPError{Code: 451, Message: "try again later"}}
	c := dialEnvelopeRecorder(t, rec)
	to, err := mail.ParseAddress(`"a; b"@remote.test`)
	if err != nil {
		t.Fatal(err)
	}
	m := &Message{From: &mail.Address{Address: "organizer@example.net"}, To: []*mail.Address{to}, Calendar: calendar("REQUEST")}
	err = Send(c, "account@example.com", m)
	var refusal *smtp.SMTPError
	if !errors.As(err, &refusal) || refusal.Code != 451 {
		t.Fatalf("got %v, want preserved451 refusal", err)
	}
}
