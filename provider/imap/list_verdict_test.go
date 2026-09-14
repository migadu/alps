package imap

import (
	"bytes"
	"context"
	"errors"
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

// Sort passes SORT through to the in-memory server's session, which embedding
// the Session interface alone would hide.
func (s *threadedSession) Sort(ctx context.Context, kind imapserver.NumKind, sortCriteria []imap.SortCriterion, charset string, searchCriteria *imap.SearchCriteria, options *imap.SortOptions) (*imap.SortData, error) {
	sorter, ok := s.Session.(interface {
		Sort(context.Context, imapserver.NumKind, []imap.SortCriterion, string, *imap.SearchCriteria, *imap.SortOptions) (*imap.SortData, error)
	})
	if !ok {
		return nil, errors.New("the in-memory session cannot sort")
	}
	return sorter.Sort(ctx, kind, sortCriteria, charset, searchCriteria, options)
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

// Listings read no Authentication-Results. A server reads that header from
// each stored message rather than its index, and for older mail it answered
// one message at a time, seconds per page, while holding the session's
// connection. The frontend asks for verdicts after the list shows.
func TestListingsReadNoAuthenticationResults(t *testing.T) {
	messages := []string{
		brandMessage("launch", passedResults),
		brandMessage("Re: launch", passedResults),
		brandMessage("Re: launch, again", passedResults),
		brandMessage("forged", forgedResults),
	}
	servers := []struct {
		name       string
		server     *memServer
		rows, subs int
	}{
		{"flat", &memServer{}, 4, 0},
		{"threaded", &memServer{
			caps:    imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}},
			threads: []imap.ThreadData{{Chain: []uint32{1, 2, 3}}, {Chain: []uint32{4}}},
		}, 2, 2},
	}
	for _, srv := range servers {
		t.Run(srv.name, func(t *testing.T) {
			p := memIMAP(t, srv.server, messages...)
			listings := []struct {
				how  string
				list func() ([]provider.Message, int, error)
			}{
				{"listed", func() ([]provider.Message, int, error) { return p.ListMessages("INBOX", "", 0, 50) }},
				{"searched", func() ([]provider.Message, int, error) { return p.SearchMessages("INBOX", "", "", 0, 50) }},
			}
			for _, l := range listings {
				before := len(srv.server.traffic.String())
				rows, _, err := l.list()
				if err != nil {
					t.Fatalf("%s: %v", l.how, err)
				}
				subs := 0
				for _, r := range rows {
					subs += len(r.SubMessages)
				}
				if len(rows) != srv.rows || subs != srv.subs {
					t.Errorf("%s: %d rows and %d earlier thread messages, want %d and %d", l.how, len(rows), subs, srv.rows, srv.subs)
				}
				if reads := len(headerReads.FindAllString(srv.server.traffic.String()[before:], -1)); reads != 0 {
					t.Errorf("%s: %d Authentication-Results reads, want none", l.how, reads)
				}
			}
		})
	}
}
