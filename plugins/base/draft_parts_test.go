package alpsbase

import (
	"bytes"
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// imapTraffic is what crossed the wire to the in-memory IMAP server, both ways.
type imapTraffic struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (b *imapTraffic) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *imapTraffic) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.String()
}

// newRecordedIMAPTestServer is newIMAPTestServer, with the IMAP traffic kept
// for the test to read, on a server with UIDPLUS so that an append names the
// message it stored.
func newRecordedIMAPTestServer(t *testing.T, messages ...string) (*testServer, *imapTraffic) {
	t.Helper()
	ctx := context.Background()
	user := imapmemserver.NewUser(testUser, testPassword)
	if err := user.Create(ctx, "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	for _, m := range messages {
		if _, err := user.Append(ctx, "INBOX", strings.NewReader(m), &imap.AppendOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	traffic := &imapTraffic{}
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		Caps:         imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}},
		InsecureAuth: true,
		DebugWriter:  traffic,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go imapSrv.Serve(ln)
	t.Cleanup(func() { imapSrv.Close() })

	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	popt, err := (&imapprovider.Config{Server: "imap+insecure://" + ln.Addr().String()}).ToOptions()
	if err != nil {
		t.Fatal(err)
	}
	srv, err := alps.New(alps.NewLogger(), &alps.Options{
		Provider:     popt,
		SMTP:         alps.SMTPOptions{Server: "smtp://127.0.0.1:1"},
		LoginKey:     &key,
		CacheEnabled: true,
		CacheTTL:     time.Minute,
	})
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() {
		ts.Close()
		srv.Close()
	})
	jar, _ := cookiejar.New(nil)
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}}, traffic
}

// partReads matches a FETCH alps sent for one or more parts of a message,
// which it reads with each part's MIME header.
var partReads = regexp.MustCompile(`(?m)^[^*\s]\S* UID FETCH [^\r\n]*\.MIME\][^\r\n]*`)

// A draft that keeps parts from the message it forwards, or from the draft
// saved before it, reads them again on every save, and an autosave runs
// seconds after typing stops. They were read one FETCH each, and each FETCH
// also asked for the message's envelope and structure, which the save does
// not use.
func TestHTTP_ADraftSaveReadsTheEarlierPartsInOneFetch(t *testing.T) {
	s, traffic := newRecordedIMAPTestServer(t, figuresMessage)
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
	uid := s.mailbox("INBOX").Messages[0].UID

	before := len(traffic.String())
	form := forwardForm(uid)
	form.Set("save_as_draft", "1")
	r := s.do("POST", "/messages", form)
	s.expect(r, http.StatusOK)
	var saved struct {
		Attachments []struct {
			Name string `json:"name"`
		} `json:"attachments"`
	}
	r.json(t, &saved)

	var names []string
	for _, a := range saved.Attachments {
		names = append(names, a.Name)
	}
	if got := strings.Join(names, ","); got != "ledger.txt,chart.png" {
		t.Errorf("the draft holds %q, want the file and the image it carried over", got)
	}

	reads := partReads.FindAllString(traffic.String()[before:], -1)
	if len(reads) != 1 {
		t.Fatalf("the save read the two earlier parts with %d FETCH, want 1:\n%s", len(reads), strings.Join(reads, "\n"))
	}
	for _, unused := range []string{"ENVELOPE", "BODYSTRUCTURE"} {
		if strings.Contains(reads[0], unused) {
			t.Errorf("the part read asks for %s, which the save does not use: %s", unused, reads[0])
		}
	}
}
