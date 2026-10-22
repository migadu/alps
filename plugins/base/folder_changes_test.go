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

// listing is the answer to a mailbox listing at path.
func (s *testServer) listing(path string) mailboxPage {
	s.t.Helper()
	r := s.do("GET", path, nil)
	s.expect(r, http.StatusOK)
	var page mailboxPage
	r.json(s.t, &page)
	return page
}

// remakeElsewhere deletes mailbox in another client and makes it again with
// one message, which takes UID 1 under a new UIDVALIDITY.
func remakeElsewhere(t *testing.T, c *imapclient.Client, mailbox, message string, flags ...imap.Flag) {
	t.Helper()
	if err := c.Delete(mailbox).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := c.Create(mailbox, nil).Wait(); err != nil {
		t.Fatal(err)
	}
	deliverElsewhere(t, c, mailbox, message, flags...)
}

// opensAsItself fails the test unless page lists only the message with
// subject, at uid, and that message opens as itself.
func (s *testServer) opensAsItself(page mailboxPage, mailbox, subject, uid string) {
	s.t.Helper()
	if got := subjectsOf(page); got != subject {
		s.t.Fatalf("after %s was made again elsewhere, it shows %q, want %s", mailbox, got, subject)
	}
	if got := page.Messages[0].UID; got != uid {
		s.t.Fatalf("%s took UID %s, not %s, the UID the old message had; the test needs the two to be the same", subject, got, uid)
	}
	if got := s.rawMessage(mailbox, uid); !strings.Contains(got, "Subject: "+subject) {
		s.t.Errorf("%s, listed as UID %s of the new %s, opens as:\n%s", subject, uid, mailbox, got)
	}
}

// A folder deleted and made again keeps its name and may hold as many
// messages, under UIDs that name other messages now: UIDVALIDITY moves. The
// folder lists its new messages, and a message it lists opens as itself, not
// as the message that had its UID before. The new UIDVALIDITY reaches the
// session through the check for new mail, or through the folder list, read
// again with every folder's counts after a refresh, when the folder is then
// opened without a check.
//
// Or the folder itself is opened with a refresh, as the mail page does when it
// is shown again: that drops the status and the pages the new UIDVALIDITY
// would be compared with. Before it, a check of the Inbox that finds new mail
// may have dropped the folder's status, or had the folder list read it again
// under the new UIDVALIDITY, leaving only the pages to tell.
func TestHTTP_AFolderMadeAgainElsewhereIsListedAfresh(t *testing.T) {
	ways := []struct {
		name string
		list func(s *testServer, c *imapclient.Client) mailboxPage
	}{
		{"checked", func(s *testServer, _ *imapclient.Client) mailboxPage { return s.checkForNewMail("Work") }},
		{"opened", func(s *testServer, _ *imapclient.Client) mailboxPage {
			s.expect(s.do("GET", "/mailboxes/INBOX?page=0&refresh=1", nil), http.StatusOK)
			return s.listing("/mailboxes/Work?page=0")
		}},
		{"refreshed", func(s *testServer, _ *imapclient.Client) mailboxPage {
			return s.listing("/mailboxes/Work?page=0&refresh=1")
		}},
		{"refreshed after new mail", func(s *testServer, c *imapclient.Client) mailboxPage {
			deliverElsewhere(s.t, c, "INBOX", letter("Arrival"))
			if got := subjectsOf(s.checkForNewMail("INBOX")); got != "Arrival" {
				s.t.Fatalf("the Inbox shows %q, want Arrival", got)
			}
			return s.listing("/mailboxes/Work?page=0&refresh=1")
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

				remakeElsewhere(t, c, "Work", letter("New plans"), imap.FlagSeen)
				s.opensAsItself(way.list(s, c), "Work", "New plans", old)
			})
		}
	}
}

// A folder only searched holds no page in the session, only its status, read
// with the search, and the messages opened from the results. When the folder
// is made again elsewhere and then opened with a refresh, that status is all
// there is to tell.
func TestHTTP_AFolderSearchedAndMadeAgainElsewhereIsListedAfresh(t *testing.T) {
	for _, server := range countingServers {
		t.Run(server.name, func(t *testing.T) {
			s, _, elsewhere := newIMAPAccountServer(t, server.caps)
			c := elsewhere()
			if err := c.Create("Work", nil).Wait(); err != nil {
				t.Fatal(err)
			}
			deliverElsewhere(t, c, "Work", letter("Old plans"))
			s.login()
			found := s.listing("/mailboxes/Work?page=0&query=plans")
			if got := subjectsOf(found); got != "Old plans" {
				t.Fatalf("a search of Work finds %q", got)
			}
			old := found.Messages[0].UID
			if got := s.rawMessage("Work", old); !strings.Contains(got, "Subject: Old plans") {
				t.Fatalf("Old plans, UID %s of Work, opens as:\n%s", old, got)
			}
			// Away from Work, as the user is while another client replaces it.
			s.checkForNewMail("INBOX")

			remakeElsewhere(t, c, "Work", letter("New plans"))
			s.opensAsItself(s.listing("/mailboxes/Work?page=0&refresh=1"), "Work", "New plans", old)
		})
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

// statusCheck is what a check for new mail answers about a folder, and the
// answer as it came. UIDNext and UIDValidity are nil where it has none.
type statusCheck struct {
	Total       int
	Unseen      int
	UIDNext     *uint32 `json:"uidnext"`
	UIDValidity *uint32 `json:"uidvalidity"`
	raw         string
}

func (s *testServer) statusCheck(name string) statusCheck {
	s.t.Helper()
	r := s.do("GET", "/mailboxes/"+name+"/status", nil)
	s.expect(r, http.StatusOK)
	var check statusCheck
	r.json(s.t, &check)
	check.raw = string(r.body)
	return check
}

// The check answers the UIDNEXT and UIDVALIDITY it read beside the counts, as
// the listing carries them for the folder. A client that compares the check's
// answer with the listing it shows, to read the listing again only when the
// folder changed, can then tell a message that arrived as another went from
// no change at all, as the session's own cache now does.
func TestHTTP_ACheckAnswersTheUIDsItRead(t *testing.T) {
	for _, server := range countingServers {
		t.Run(server.name, func(t *testing.T) {
			s, _, elsewhere := newIMAPAccountServer(t, server.caps, letter("Engines"), letter("Looms"))
			s.login()
			before := s.statusCheck("INBOX")
			if before.UIDNext == nil || before.UIDValidity == nil {
				t.Fatalf("the check answers %s, without uidnext and uidvalidity", strings.TrimSpace(before.raw))
			}
			r := s.do("GET", "/mailboxes/INBOX?page=0", nil)
			s.expect(r, http.StatusOK)
			var listed struct {
				Mailbox struct {
					UIDNext     uint32
					UIDValidity uint32
				}
			}
			r.json(t, &listed)
			if *before.UIDNext != listed.Mailbox.UIDNext || *before.UIDValidity != listed.Mailbox.UIDValidity {
				t.Errorf("the check answers uidnext %d and uidvalidity %d, the listing %d and %d",
					*before.UIDNext, *before.UIDValidity, listed.Mailbox.UIDNext, listed.Mailbox.UIDValidity)
			}

			c := elsewhere()
			deliverElsewhere(t, c, "INBOX", letter("Arrival"))
			expungeElsewhere(t, c, "INBOX", 1)

			after := s.statusCheck("INBOX")
			if after.Total != before.Total || after.Unseen != before.Unseen {
				t.Fatalf("the counts moved from %d, %d unseen to %d, %d unseen; the test needs them to stay",
					before.Total, before.Unseen, after.Total, after.Unseen)
			}
			if after.UIDNext == nil || *after.UIDNext == *before.UIDNext {
				t.Errorf("after a message arrived and another went, the check answers %s, uidnext as before", strings.TrimSpace(after.raw))
			}
			if after.UIDValidity == nil || *after.UIDValidity != *before.UIDValidity {
				t.Errorf("after a message arrived and another went, the check answers %s, another uidvalidity", strings.TrimSpace(after.raw))
			}
		})
	}
}
