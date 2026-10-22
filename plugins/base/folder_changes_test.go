package alpsbase

import (
	"bytes"
	"context"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/emersion/go-imap/v2/imapserver/imapmemserver"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	imapprovider "github.com/migadu/alps/provider/imap"
)

// A check for new mail notices a message that arrives as another goes, and a
// folder made again elsewhere, when the message and unread counts stay as they
// were. The counts were all it compared, so the session's cached pages were
// then served until the cache expired.

// imapWire is what alps sent the in-memory IMAP server, and its answers.
type imapWire struct {
	mu  sync.Mutex
	buf bytes.Buffer
}

func (w *imapWire) Write(p []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.buf.Write(p)
}

func (w *imapWire) String() string {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.buf.String()
}

// newIMAPAccountServer is newIMAPTestServer on an IMAP server that advertises
// caps. It also answers what alps sent the server, and a way in to the same
// account for another client.
func newIMAPAccountServer(t *testing.T, caps imap.CapSet, messages ...string) (*testServer, *imapWire, func() *imapclient.Client) {
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
	wire := &imapWire{}
	imapSrv := imapserver.New(&imapserver.Options{
		NewSession: func(*imapserver.Conn) (imapserver.Session, *imapserver.GreetingData, error) {
			return mem.NewSession(), nil, nil
		},
		Caps:         caps,
		InsecureAuth: true,
		DebugWriter:  wire,
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	go imapSrv.Serve(ln)
	t.Cleanup(func() { imapSrv.Close() })

	elsewhere := func() *imapclient.Client {
		t.Helper()
		c, err := imapclient.DialInsecure(ln.Addr().String(), nil)
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { c.Close() })
		if err := c.Login(testUser, testPassword).Wait(); err != nil {
			t.Fatal(err)
		}
		return c
	}

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
	return &testServer{t: t, url: ts.URL, client: &http.Client{Jar: jar}}, wire, elsewhere
}

// countingServers are the two ways alps reads a folder's counts: a STATUS of
// its own, or the folder list's LIST-STATUS.
var countingServers = []struct {
	name string
	caps imap.CapSet
}{
	{"STATUS", imap.CapSet{imap.CapIMAP4rev1: {}}},
	{"LIST-STATUS", imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapListExtended: {}, imap.CapListStatus: {}}},
}

func letter(subject string) string {
	return "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: " + subject + "\r\n" +
		"Date: Tue, 03 Jan 2006 15:04:05 +0000\r\nMessage-ID: <" + strings.ReplaceAll(strings.ToLower(subject), " ", ".") + "@remote.test>\r\n\r\nHello.\r\n"
}

func subjectsOf(page mailboxPage) string {
	var out []string
	for _, m := range page.Messages {
		out = append(out, m.Envelope.Subject)
	}
	return strings.Join(out, ", ")
}

func deliverElsewhere(t *testing.T, c *imapclient.Client, mailbox, message string, flags ...imap.Flag) {
	t.Helper()
	var options *imap.AppendOptions
	if len(flags) > 0 {
		options = &imap.AppendOptions{Flags: flags}
	}
	cmd := c.Append(mailbox, int64(len(message)), options)
	if _, err := cmd.Write([]byte(message)); err != nil {
		t.Fatal(err)
	}
	if err := cmd.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := cmd.Wait(); err != nil {
		t.Fatal(err)
	}
}

func expungeElsewhere(t *testing.T, c *imapclient.Client, mailbox string, uid imap.UID) {
	t.Helper()
	if _, err := c.Select(mailbox, nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := c.Store(imap.UIDSetNum(uid), &imap.StoreFlags{
		Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{imap.FlagDeleted},
	}, nil).Close(); err != nil {
		t.Fatal(err)
	}
	if err := c.Expunge().Close(); err != nil {
		t.Fatal(err)
	}
	if err := c.Unselect().Wait(); err != nil {
		t.Fatal(err)
	}
}

// folderListReads matches a LIST alps sends, which reads the folder list.
var folderListReads = regexp.MustCompile(`(?m)^[^*\s]\S* LIST `)

// One message in, another out: the counts stand, and UIDNEXT moves. The check
// treats that as it treats counts that moved: the folder list is read again
// too, for mail that may have been filed into folders no check looks at.
func TestHTTP_AMessageThatArrivesAsAnotherGoesIsListed(t *testing.T) {
	for _, server := range countingServers {
		t.Run(server.name, func(t *testing.T) {
			s, wire, elsewhere := newIMAPAccountServer(t, server.caps, letter("Engines"), letter("Looms"))
			s.login()
			if got := subjectsOf(s.checkForNewMail("INBOX")); got != "Looms, Engines" {
				t.Fatalf("the list shows %q", got)
			}

			c := elsewhere()
			deliverElsewhere(t, c, "INBOX", letter("Arrival"))
			expungeElsewhere(t, c, "INBOX", 1)

			before := len(wire.String())
			if got := subjectsOf(s.checkForNewMail("INBOX")); got != "Arrival, Looms" {
				t.Errorf("after a message arrived and another went, the list shows %q, want Arrival, Looms", got)
			}
			if !folderListReads.MatchString(wire.String()[before:]) {
				t.Error("after a message arrived and another went, the check did not read the folder list again")
			}
		})
	}
}

// rawMessage is a message as the reader opens it.
func (s *testServer) rawMessage(mailbox, uid string) string {
	s.t.Helper()
	r := s.do("GET", "/mailboxes/"+mailbox+"/messages/"+uid+"/raw", nil)
	s.expect(r, http.StatusOK)
	return string(r.body)
}

// A folder deleted and made again keeps its name and may hold as many
// messages, under UIDs that name other messages now: UIDVALIDITY moves. The
// folder lists its new messages, and a message it lists opens as itself, not
// as the message that had its UID before. The new UIDVALIDITY reaches the
// session through the check for new mail, or through the folder list, read
// again with every folder's counts after a refresh, when the folder is then
// opened without a check.
func TestHTTP_AFolderMadeAgainElsewhereIsListedAfresh(t *testing.T) {
	ways := []struct {
		name string
		list func(s *testServer) mailboxPage
	}{
		{"checked", func(s *testServer) mailboxPage { return s.checkForNewMail("Work") }},
		{"opened", func(s *testServer) mailboxPage {
			s.expect(s.do("GET", "/mailboxes/INBOX?page=0&refresh=1", nil), http.StatusOK)
			r := s.do("GET", "/mailboxes/Work?page=0", nil)
			s.expect(r, http.StatusOK)
			var page mailboxPage
			r.json(s.t, &page)
			return page
		}},
	}
	for _, server := range countingServers {
		for _, way := range ways {
			t.Run(server.name+"/"+way.name, func(t *testing.T) {
				s, _, elsewhere := newIMAPAccountServer(t, server.caps)
				c := elsewhere()
				if err := c.Create("Work", nil).Wait(); err != nil {
					t.Fatal(err)
				}
				deliverElsewhere(t, c, "Work", letter("Old plans"))
				s.login()
				page := s.checkForNewMail("Work")
				if got := subjectsOf(page); got != "Old plans" {
					t.Fatalf("Work shows %q", got)
				}
				old := page.Messages[0].UID
				if got := s.rawMessage("Work", old); !strings.Contains(got, "Subject: Old plans") {
					t.Fatalf("Old plans, UID %s of Work, opens as:\n%s", old, got)
				}
				// Marked read, as the reader does when a message is opened. The
				// new Work's one message is read too, so the counts stay as
				// they were.
				s.expect(s.do("PUT", "/mailboxes/Work/messages/flag", map[string]any{
					"uids": []string{old}, "flags": []string{`\Seen`}, "action": "add",
				}), http.StatusOK)
				// Away from Work, as the user is while another client replaces it.
				s.checkForNewMail("INBOX")

				if err := c.Delete("Work").Wait(); err != nil {
					t.Fatal(err)
				}
				if err := c.Create("Work", nil).Wait(); err != nil {
					t.Fatal(err)
				}
				deliverElsewhere(t, c, "Work", letter("New plans"), imap.FlagSeen)

				page = way.list(s)
				if got := subjectsOf(page); got != "New plans" {
					t.Fatalf("after Work was made again elsewhere, it shows %q, want New plans", got)
				}
				uid := page.Messages[0].UID
				if uid != old {
					t.Fatalf("New plans took UID %s, not %s, the UID Old plans had; the test needs the two to be the same", uid, old)
				}
				if got := s.rawMessage("Work", uid); !strings.Contains(got, "Subject: New plans") {
					t.Errorf("New plans, listed as UID %s of the new Work, opens as:\n%s", uid, got)
				}
			})
		}
	}
}

// messageReads matches a command alps sends to read a folder's messages.
var messageReads = regexp.MustCompile(`(?m)^[^*\s]\S* (UID )?(FETCH|SEARCH|SORT|THREAD) `)

// Asking for more of the folder's state must not cost the check that finds
// nothing new: the counts the folder list read, and the ones the check reads,
// say the same, and the page the session holds is still the answer.
func TestHTTP_ACheckThatFindsNothingNewReadsNoMessages(t *testing.T) {
	for _, server := range countingServers {
		t.Run(server.name, func(t *testing.T) {
			s, wire, _ := newIMAPAccountServer(t, server.caps, letter("Engines"), letter("Looms"))
			s.login()
			s.checkForNewMail("INBOX")

			before := len(wire.String())
			if got := subjectsOf(s.checkForNewMail("INBOX")); got != "Looms, Engines" {
				t.Fatalf("the list shows %q", got)
			}
			if reads := messageReads.FindAllString(wire.String()[before:], -1); len(reads) > 0 {
				t.Errorf("a check that found nothing new read the folder again: %q", reads)
			}
		})
	}
}
