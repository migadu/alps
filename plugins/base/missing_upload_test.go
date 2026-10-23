package alpsbase

import (
	"context"
	"io"
	"net"
	"net/http"
	"net/url"
	"reflect"
	"strings"
	"sync"
	"testing"

	"github.com/emersion/go-message"
	"github.com/emersion/go-smtp"
)

func draftWith(uuids string) url.Values {
	return url.Values{
		"to":               {"mary@remote.test"},
		"subject":          {"Notes"},
		"text":             {"See the file."},
		"save_as_draft":    {"1"},
		"attachment-uuids": {uuids},
	}
}

// An upload the session no longer holds (it ended, or the attachment budget
// let the upload go) is named in a refusal the composer can act on. It used to
// be a 400 that said so only in English, so the composer kept sending the id,
// and every later save and the send failed the same way.
func TestHTTP_AnUploadTheServerNoLongerHasIsNamed(t *testing.T) {
	// Over IMAP, where a save's answer can say which part each upload became.
	s := newIMAPTestServer(t)
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
	notes := s.upload("notes.txt", "remember the milk")

	r := s.do("POST", "/messages", draftWith(notes+",gone-1"))
	s.expect(r, http.StatusConflict)
	var refusal struct {
		Missing []string `json:"missing_attachments"`
	}
	r.json(t, &refusal)
	if !reflect.DeepEqual(refusal.Missing, []string{"gone-1"}) {
		t.Errorf("missing_attachments = %q, want [gone-1]", refusal.Missing)
	}

	// The upload named beside it is still there: the refusal took nothing.
	s.expect(s.do("POST", "/messages", draftWith(notes)), http.StatusOK)

	// Once the draft holds it, and the answer says as which part, the
	// session lets it go.
	r = s.do("POST", "/messages", draftWith(notes))
	s.expect(r, http.StatusConflict)
	r.json(t, &refusal)
	if !reflect.DeepEqual(refusal.Missing, []string{notes}) {
		t.Errorf("after the save, missing_attachments = %q, want [%s]", refusal.Missing, notes)
	}
}

// A save or a send that fails keeps the uploads it was given, for the next
// try. They were taken out of the session before the message was stored, and
// their files deleted when the request ended, whether or not it succeeded.
func TestHTTP_AFailedSaveOrSendKeepsItsUploads(t *testing.T) {
	s := newTestServer(t)
	s.login()

	notes := s.upload("notes.txt", "remember the milk")
	refused := draftWith(notes)
	refused.Set("prev_attachments", "2") // a part, with no message to take it from
	s.expect(s.do("POST", "/messages", refused), http.StatusBadRequest)
	s.expect(s.do("POST", "/messages", draftWith(notes)), http.StatusOK)
	// Stored, but the maildir provider cannot read the draft back, so the
	// answer names no parts and the composer still has only the id: the
	// upload is kept for its next save.
	s.expect(s.do("POST", "/messages", draftWith(notes)), http.StatusOK)

	// The test server's SMTP relay is not listening.
	ledger := s.upload("ledger.txt", "one two three")
	send := draftWith(ledger)
	send.Del("save_as_draft")
	s.expect(s.do("POST", "/messages", send), http.StatusInternalServerError)
	s.expect(s.do("POST", "/messages", draftWith(ledger)), http.StatusOK)
}

// heldSMTP is an SMTP recorder whose first RCPT waits until the test lets it
// go: a send under way, holding its uploads, for as long as the test needs.
type heldSMTP struct {
	smtpRecorder
	once    sync.Once
	reached chan struct{}
	release chan struct{}
	sends   int
}

func (b *heldSMTP) NewSession(*smtp.Conn) (smtp.Session, error) {
	return &heldSMTPSession{smtpSession: smtpSession{b: &b.smtpRecorder}, held: b}, nil
}

type heldSMTPSession struct {
	smtpSession
	held *heldSMTP
}

func (s *heldSMTPSession) Rcpt(ctx context.Context, to string, opts *smtp.RcptOptions) error {
	s.held.once.Do(func() {
		close(s.held.reached)
		<-s.held.release
	})
	return s.smtpSession.Rcpt(ctx, to, opts)
}

func (s *heldSMTPSession) Data(ctx context.Context, r io.Reader) error {
	s.held.mu.Lock()
	s.held.sends++
	s.held.mu.Unlock()
	return s.smtpSession.Data(ctx, r)
}

func listenHeld(t *testing.T) (string, *heldSMTP) {
	t.Helper()
	held := &heldSMTP{reached: make(chan struct{}), release: make(chan struct{})}
	srv := smtp.NewServer(held)
	srv.Domain = "localhost"
	srv.AllowInsecureAuth = true
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })
	return "smtp+insecure://" + ln.Addr().String(), held
}

// fileIn is the decoded body of the part of raw named name, or "" if there is
// none.
func fileIn(t *testing.T, raw, name string) string {
	t.Helper()
	e, err := message.Read(strings.NewReader(raw))
	if err != nil {
		t.Fatal(err)
	}
	var found string
	var walk func(e *message.Entity)
	walk = func(e *message.Entity) {
		if mr := e.MultipartReader(); mr != nil {
			for {
				p, err := mr.NextPart()
				if err != nil {
					return
				}
				walk(p)
			}
		}
		if _, params, _ := e.Header.ContentDisposition(); params["filename"] == name {
			body, _ := io.ReadAll(e.Body)
			found = string(body)
		}
	}
	walk(e)
	return found
}

// While a message is written, its uploads are the request's. Read in place,
// they could be removed under it by the user's own Remove, by the session's
// end, or to make room for another upload: the message then went out cut off
// where the file should have been, and the user was told it had not gone.
func TestHTTP_AnUploadIsTheRequestsUntilItEnds(t *testing.T) {
	addr, held := listenHeld(t)
	s := newTestServerWithSMTP(t, addr)
	s.login()
	// Past the size an upload is kept in memory at, so its bytes are in a
	// file that can be removed.
	content := strings.Repeat("remember the milk\n", 4<<10)
	notes := s.upload("notes.txt", content)

	send := draftWith(notes)
	send.Del("save_as_draft")
	sent := make(chan int, 1)
	go func() {
		req, _ := http.NewRequest("POST", s.url+"/messages", strings.NewReader(send.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("Origin", s.url)
		res, err := s.client.Do(req)
		if err != nil {
			sent <- 0
			return
		}
		res.Body.Close()
		sent <- res.StatusCode
	}()
	<-held.reached
	s.expect(s.do("DELETE", "/attachments/"+notes, nil), http.StatusOK)
	close(held.release)

	if status := <-sent; status != http.StatusOK {
		t.Errorf("the send answered %d", status)
	}
	held.mu.Lock()
	defer held.mu.Unlock()
	if held.sends != 1 {
		t.Errorf("%d messages delivered, want 1", held.sends)
	}
	if got := fileIn(t, held.data, "notes.txt"); got != content {
		t.Errorf("notes.txt went out with %d of its %d bytes", len(got), len(content))
	}
}
