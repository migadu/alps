package alpsbase

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-smtp"
	"github.com/migadu/alps/provider"
)

// stallingSMTP is an SMTP server that records a message, and then holds its
// answer to the message's DATA until the test releases it.
type stallingSMTP struct {
	*smtpRecorder
	received chan struct{} // closed once the message's DATA has been read
	release  chan struct{}
}

func (b *stallingSMTP) NewSession(*smtp.Conn) (smtp.Session, error) {
	return &stallingSMTPSession{smtpSession{b: b.smtpRecorder}, b}, nil
}

type stallingSMTPSession struct {
	smtpSession
	stall *stallingSMTP
}

func (s *stallingSMTPSession) Data(ctx context.Context, r io.Reader) error {
	err := s.smtpSession.Data(ctx, r)
	close(s.stall.received)
	<-s.stall.release
	return err
}

// listenStalling serves b and returns the address to configure.
func listenStalling(t *testing.T, b *stallingSMTP) string {
	t.Helper()
	srv := smtp.NewServer(b)
	srv.Domain = "localhost"
	srv.AllowInsecureAuth = true
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })
	return "smtp+insecure://" + ln.Addr().String()
}

// A send the browser stops waiting for, while the SMTP server takes the
// message, is still finished: the message it answers is marked, and it is
// filed in Sent. A request given up on does no mail work it has not begun,
// but by then the message has gone, and this work is the end of sending it.
func TestHTTP_ASendGivenUpOnIsStillFiled(t *testing.T) {
	smtpServer := &stallingSMTP{smtpRecorder: &smtpRecorder{}, received: make(chan struct{}), release: make(chan struct{})}
	s := newTestServerWithSMTP(t, listenStalling(t, smtpServer))
	s.login()

	var original string
	for _, m := range s.mailbox("INBOX").Messages {
		if m.Envelope.Subject == "Engines" {
			original = m.UID
		}
	}
	if original == "" {
		t.Fatal("the message to answer is not listed")
	}

	form := url.Values{
		"to":            {"charles@remote.test"},
		"subject":       {"Re: Engines"},
		"text":          {"Agreed."},
		"in_reply_to":   {"engines@remote.test"},
		"reply_mailbox": {"INBOX"},
		"reply_uid":     {original},
	}
	ctx, giveUp := context.WithCancel(context.Background())
	defer giveUp()
	req, err := http.NewRequestWithContext(ctx, "POST", s.url+"/messages", strings.NewReader(form.Encode()))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", s.url)
	gaveUp := make(chan struct{})
	go func() {
		defer close(gaveUp)
		if res, err := s.client.Do(req); err == nil {
			res.Body.Close()
		}
	}()

	select {
	case <-smtpServer.received:
	case <-time.After(5 * time.Second):
		t.Fatal("the message did not reach the SMTP server")
	}
	giveUp()
	<-gaveUp
	// The server notices that the browser went away as soon as its connection
	// closes; this leaves it time to.
	time.Sleep(200 * time.Millisecond)
	close(smtpServer.release)

	// Asked of the store, not of alps, which would answer from its cache.
	var filed, marked bool
	for deadline := time.Now().Add(5 * time.Second); time.Now().Before(deadline); time.Sleep(20 * time.Millisecond) {
		sent, _, err := s.store.ListMessages("Sent", "desc", 0, 50)
		filed = err == nil && len(sent) == 1 && sent[0].Envelope != nil && sent[0].Envelope.Subject == "Re: Engines"
		inbox, _, err := s.store.ListMessages("INBOX", "desc", 0, 50)
		marked = false
		for _, m := range inbox {
			if err == nil && m.ID.String() == original {
				for _, f := range m.Flags {
					marked = marked || f == provider.FlagAnswered
				}
			}
		}
		if filed && marked {
			return
		}
	}
	if !filed {
		t.Error("the message the browser gave up on was sent, and not filed in Sent")
	}
	if !marked {
		t.Error("the message the browser gave up on was sent, and the message it answers is not marked answered")
	}
}
