package imap

import (
	"bytes"
	"context"
	"net"
	"regexp"
	"sync"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/migadu/alps/provider"
)

// memServer describes an in-memory IMAP account for one test and records the
// raw traffic to it.
type memServer struct {
	caps    imap.CapSet       // IMAP4rev1 alone when nil
	threads []imap.ThreadData // the answer to THREAD
	traffic lockedBuffer
}

type lockedBuffer struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (b *lockedBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.Write(p)
}

func (b *lockedBuffer) String() string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.buf.String()
}

// threadedSession answers THREAD with the test's threads; the in-memory
// server's own answer is a fixed placeholder.
type threadedSession struct {
	imapserver.Session
	threads []imap.ThreadData
}

func (s *threadedSession) Thread(ctx context.Context, numKind imapserver.NumKind, algorithm imap.ThreadAlgorithm, charset string, criteria *imap.SearchCriteria) ([]imap.ThreadData, error) {
	return s.threads, nil
}

// memIMAP serves the account with messages in INBOX and returns a provider
// logged in to it.
func memIMAP(t *testing.T, s *memServer, messages ...string) *IMAPProvider {
	t.Helper()
	user := imapmemserver.NewUser("ada", "pass")
	if err := user.Create(context.Background(), "INBOX", nil); err != nil {
		t.Fatal(err)
	}
	mem := imapmemserver.New()
	mem.AddUser(user)
	caps := s.caps
	if caps == nil {
		caps = imap.CapSet{imap.CapIMAP4rev1: {}}
	}
	srv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return &threadedSession{Session: mem.NewSession(), threads: s.threads}, nil, nil
		},
		Caps:         caps,
		InsecureAuth: true,
		DebugWriter:  &s.traffic,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go srv.Serve(ln)
	t.Cleanup(func() { srv.Close() })

	client, err := imapclient.DialInsecure(ln.Addr().String(), nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { client.Close() })
	if err := client.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	for _, m := range messages {
		cmd := client.Append("INBOX", int64(len(m)), nil)
		if _, err := cmd.Write([]byte(m)); err != nil {
			t.Fatal(err)
		}
		if err := cmd.Close(); err != nil {
			t.Fatal(err)
		}
		if _, err := cmd.Wait(); err != nil {
			t.Fatal(err)
		}
	}
	return NewIMAPProvider(client, false)
}

func brandMessage(subject, results string) string {
	return results + "From: Brand <news@brand.test>\r\nSubject: " + subject + "\r\n\r\nHello\r\n"
}

const (
	passedResults = "Authentication-Results: mx.test; dmarc=pass header.from=brand.test\r\n"
	forgedResults = "Authentication-Results: mx.test; dmarc=fail header.from=brand.test\r\nAuthentication-Results: brand.test; dmarc=pass header.from=brand.test\r\n"
)

// headerReads matches a server response carrying a message's
// Authentication-Results fields.
var headerReads = regexp.MustCompile(`(?i)\* \d+ FETCH \([^\r\n]*BODY\[HEADER\.FIELDS`)

// The list and search fetches asked for no Authentication-Results, so a
// listed row never carried a verdict and the list could not tell a message
// that passed DMARC from one that did not.
func TestListedRowsCarryTheReceiversVerdict(t *testing.T) {
	p := memIMAP(t, &memServer{}, brandMessage("passed", passedResults), brandMessage("forged", forgedResults))

	listed, _, err := p.ListMessages("INBOX", "", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	searched, _, err := p.SearchMessages("INBOX", "", "", 0, 50)
	if err != nil {
		t.Fatal(err)
	}
	for how, msgs := range map[string][]provider.Message{"listed": listed, "searched": searched} {
		potential := map[string]bool{}
		for _, m := range msgs {
			if m.Envelope != nil {
				potential[m.Envelope.Subject] = m.BimiPotential
			}
		}
		if len(potential) != 2 || !potential["passed"] || potential["forged"] {
			t.Errorf("%s: DMARC pass by subject %v, want passed=true forged=false", how, potential)
		}
	}
}

// A threaded page fetches every message of every thread on it. Asking that
// fetch for Authentication-Results too, a header a server reads from each
// stored message rather than its index, made hundreds of reads per page on a
// threaded inbox, and the page timed out. The verdict is read for the listed
// rows alone.
func TestThreadedListReadsTheVerdictOnlyForListedRows(t *testing.T) {
	s := &memServer{
		caps:    imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}},
		threads: []imap.ThreadData{{Chain: []uint32{1, 2, 3}}, {Chain: []uint32{4}}},
	}
	p := memIMAP(t, s,
		brandMessage("launch", passedResults),
		brandMessage("Re: launch", passedResults),
		brandMessage("Re: launch, again", passedResults),
		brandMessage("forged", forgedResults),
	)

	cases := []struct {
		how  string
		list func() ([]provider.Message, int, error)
	}{
		{"listed", func() ([]provider.Message, int, error) { return p.ListMessages("INBOX", "", 0, 50) }},
		{"searched", func() ([]provider.Message, int, error) { return p.SearchMessages("INBOX", "", "", 0, 50) }},
	}
	for _, c := range cases {
		before := len(s.traffic.String())
		rows, _, err := c.list()
		if err != nil {
			t.Fatalf("%s: %v", c.how, err)
		}
		reads := headerReads.FindAllString(s.traffic.String()[before:], -1)

		potential := map[string]bool{}
		subMessages := 0
		for _, r := range rows {
			potential[r.Envelope.Subject] = r.BimiPotential
			subMessages += len(r.SubMessages)
		}
		if len(rows) != 2 || subMessages != 2 || !potential["Re: launch, again"] || potential["forged"] {
			t.Errorf("%s: %d rows, %d earlier thread messages, DMARC pass by subject %v; want 2 rows, 2 earlier messages, the thread's latest passed and forged not", c.how, len(rows), subMessages, potential)
		}
		if len(reads) != len(rows) {
			t.Errorf("%s: %d Authentication-Results reads for %d rows", c.how, len(reads), len(rows))
		}
	}
}
