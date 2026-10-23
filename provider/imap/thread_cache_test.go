// A mailbox's conversations are threaded once for as long as it holds the
// same messages.
//
// THREAD is answered over the whole mailbox, so its cost is the mailbox's
// size, not the page's, and with the date order a SORT over the threads
// follows it. Both were sent again for every page, for every re-list after a
// cached page was dropped, and for a conversation opened without a hint. A
// server that rate-limits THREAD then refused it, and the folder was listed
// without grouping.
package imap

import (
	"regexp"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps/provider"
)

func threadingServer() *memServer {
	return &memServer{
		caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}, imap.CapSort: {}, imap.Cap("THREAD=REFERENCES"): {}},
		threads: []imap.ThreadData{
			{Chain: []uint32{1, 2}},
			{Chain: []uint32{3}},
			{Chain: []uint32{4}},
		},
	}
}

func threadedInbox(t *testing.T, s *memServer) *IMAPProvider {
	t.Helper()
	return memIMAP(t, s,
		datedMessage("Engines", "Mon, 01 Sep 2026 08:00:00 +0000"),
		datedMessage("Re: Engines", "Tue, 02 Sep 2026 08:00:00 +0000"),
		datedMessage("Looms", "Wed, 03 Sep 2026 08:00:00 +0000"),
		datedMessage("Tables", "Thu, 04 Sep 2026 08:00:00 +0000"),
	)
}

// listings are the two ways a page of a whole folder is read: ListMessages,
// which the arrival order uses, and a search with no query, which the date
// order uses. Without settings, as here, both sort by date.
func listings(p *IMAPProvider) []struct {
	how  string
	list func(page int) ([]provider.Message, provider.PageInfo, error)
} {
	return []struct {
		how  string
		list func(page int) ([]provider.Message, provider.PageInfo, error)
	}{
		{"listed", func(page int) ([]provider.Message, provider.PageInfo, error) {
			return p.ListMessages("INBOX", "desc", page, 1)
		}},
		{"searched", func(page int) ([]provider.Message, provider.PageInfo, error) {
			return p.SearchMessages("INBOX", "", "desc", page, 1)
		}},
	}
}

// sentThreads matches a THREAD the client sent, not the server's completion.
var sentThreads = regexp.MustCompile(`(?m)^[^*\s]\S* UID THREAD `)

func countThreads(s *memServer, since int) int {
	return len(sentThreads.FindAllString(s.traffic.String()[since:], -1))
}

func TestPagingAThreadedListingThreadsTheMailboxOnce(t *testing.T) {
	for i, l := range listings(nil) {
		t.Run(l.how, func(t *testing.T) {
			s := threadingServer()
			p := threadedInbox(t, s)
			l := listings(p)[i]

			before := len(s.traffic.String())
			var subjects []string
			for _, page := range []int{0, 1, 2, 0} {
				rows, info, err := l.list(page)
				if err != nil {
					t.Fatal(err)
				}
				if !info.Threaded || info.Total != 3 || len(rows) != 1 {
					t.Fatalf("page %d: %d rows of %d, threaded %v; want one of three conversations", page, len(rows), info.Total, info.Threaded)
				}
				subjects = append(subjects, rows[0].Envelope.Subject)
			}
			if got := strings.Join(subjects, ", "); got != "Tables, Looms, Re: Engines, Tables" {
				t.Errorf("pages read %q, want the conversations newest first", got)
			}
			traffic := s.traffic.String()[before:]
			if n := countThreads(s, before); n != 1 {
				t.Errorf("%d THREAD commands for four pages of a folder that did not change, want 1", n)
			}
			if n := len(sortCommands.FindAllString(traffic, -1)); n != 1 {
				t.Errorf("%d SORT commands for four pages of a folder that did not change, want 1", n)
			}
		})
	}
}

// The conversations are kept in the order last asked for. A page in the other
// order sorts them again, from the conversations kept.
func TestAListingInTheOtherOrderUsesTheSameConversations(t *testing.T) {
	s := threadingServer()
	p := threadedInbox(t, s)

	before := len(s.traffic.String())
	var subjects []string
	for _, order := range []string{"desc", "asc", "desc"} {
		rows, _, err := p.SearchMessages("INBOX", "", order, 0, 1)
		if err != nil {
			t.Fatal(err)
		}
		if len(rows) != 1 {
			t.Fatalf("%s: %d rows, want 1", order, len(rows))
		}
		subjects = append(subjects, rows[0].Envelope.Subject)
	}
	if got := strings.Join(subjects, ", "); got != "Tables, Re: Engines, Tables" {
		t.Errorf("the first page newest first, oldest first, then newest first again reads %q, want Tables, Re: Engines, Tables", got)
	}
	if n := countThreads(s, before); n != 1 {
		t.Errorf("%d THREAD commands for a folder that did not change, want 1", n)
	}
}

// A flag change moves no message from one conversation to another.
func TestAFlagChangeDoesNotThreadAgain(t *testing.T) {
	s := threadingServer()
	p := threadedInbox(t, s)
	if _, _, err := p.ListMessages("INBOX", "desc", 0, 1); err != nil {
		t.Fatal(err)
	}
	if err := p.SetMessagesFlags("INBOX", []provider.MessageID{IMAPUID(3)}, provider.FlagOperation{
		Op: provider.FlagOpAdd, Flags: []provider.Flag{provider.Flag(imap.FlagFlagged)},
	}); err != nil {
		t.Fatal(err)
	}

	before := len(s.traffic.String())
	rows, _, err := p.ListMessages("INBOX", "desc", 1, 1)
	if err != nil {
		t.Fatal(err)
	}
	if n := countThreads(s, before); n != 0 {
		t.Errorf("%d THREAD commands after a flag change, want none", n)
	}
	if len(rows) != 1 || !hasFlag(rows[0], imap.FlagFlagged) {
		t.Errorf("the page does not show the new flag: %+v", rows)
	}
}

func hasFlag(m provider.Message, f imap.Flag) bool {
	for _, have := range m.Flags {
		if string(have) == string(f) {
			return true
		}
	}
	return false
}

// A message that arrives, or one that goes, changes the conversations, and
// so does one arriving while another goes, which leaves the count as it was.
func TestAChangedMailboxIsThreadedAgain(t *testing.T) {
	changes := []struct {
		name   string
		change func(t *testing.T, p *IMAPProvider)
	}{
		{"a message arrives", func(t *testing.T, p *IMAPProvider) {
			appendTo(t, p.client, "INBOX", datedMessage("Spindles", "Fri, 05 Sep 2026 08:00:00 +0000"))
		}},
		{"the last message goes", func(t *testing.T, p *IMAPProvider) { deleteUID(t, p.client, 4) }},
		{"a message that is not the last goes", func(t *testing.T, p *IMAPProvider) { deleteUID(t, p.client, 2) }},
		{"one arrives and another goes", func(t *testing.T, p *IMAPProvider) {
			appendTo(t, p.client, "INBOX", datedMessage("Spindles", "Fri, 05 Sep 2026 08:00:00 +0000"))
			deleteUID(t, p.client, 4)
		}},
	}
	for _, c := range changes {
		t.Run(c.name, func(t *testing.T) {
			for i := range listings(nil) {
				s := threadingServer()
				p := threadedInbox(t, s)
				l := listings(p)[i]
				if _, _, err := l.list(0); err != nil {
					t.Fatal(err)
				}
				c.change(t, p)
				before := len(s.traffic.String())
				if _, _, err := l.list(0); err != nil {
					t.Fatal(err)
				}
				if n := countThreads(s, before); n != 1 {
					t.Errorf("%s: %d THREAD commands after the folder changed, want 1", l.how, n)
				}
			}
		})
	}
}

// Opening a message without its conversation's members at hand looks it up
// in the conversations the listing threaded.
func TestOpeningAConversationUsesTheListingsThreads(t *testing.T) {
	s := threadingServer()
	p := threadedInbox(t, s)
	if _, _, err := p.SearchMessages("INBOX", "", "desc", 0, 50); err != nil {
		t.Fatal(err)
	}

	before := len(s.traffic.String())
	msgs, err := p.GetMessageThread("INBOX", IMAPUID(1))
	if err != nil {
		t.Fatal(err)
	}
	if got := strings.Join(uids(msgs), ","); got != "1,2" {
		t.Errorf("the conversation of UID 1 is %s, want 1,2", got)
	}
	if n := countThreads(s, before); n != 0 {
		t.Errorf("%d THREAD commands to open a conversation the listing had threaded, want none", n)
	}
}

// A change made in another mail program reaches alps only as the server's
// updates to the folder. The check for a changed folder has to have them
// before it asks for the folder's last message: asked at the same time, the
// update of a flag on that message could be taken for the answer, while
// another message went and one arrived, and the folder looked unchanged.
func TestAFolderChangedElsewhereIsThreadedAgain(t *testing.T) {
	spindles := datedMessage("Spindles", "Fri, 05 Sep 2026 08:00:00 +0000")
	changes := []struct {
		name    string
		change  func(t *testing.T, other *imapclient.Client)
		threads int
	}{
		{"a message arrives", func(t *testing.T, other *imapclient.Client) {
			appendTo(t, other, "INBOX", spindles)
		}, 1},
		{"the last message is read, another goes and one arrives", func(t *testing.T, other *imapclient.Client) {
			flagUID(t, other, 4, imap.FlagSeen)
			deleteUID(t, other, 2)
			appendTo(t, other, "INBOX", spindles)
		}, 1},
		{"the last message goes as one arrives", func(t *testing.T, other *imapclient.Client) {
			appendTo(t, other, "INBOX", spindles)
			deleteUID(t, other, 4)
		}, 1},
		{"the last message is flagged", func(t *testing.T, other *imapclient.Client) {
			flagUID(t, other, 4, imap.FlagFlagged)
		}, 0},
	}
	for _, c := range changes {
		t.Run(c.name, func(t *testing.T) {
			for i := range listings(nil) {
				s := threadingServer()
				p := threadedInbox(t, s)
				other := elsewhere(t, s)
				l := listings(p)[i]
				if _, _, err := l.list(0); err != nil {
					t.Fatal(err)
				}
				c.change(t, other)
				before := len(s.traffic.String())
				if _, _, err := l.list(0); err != nil {
					t.Fatal(err)
				}
				if n := countThreads(s, before); n != c.threads {
					t.Errorf("%s: %d THREAD commands after the folder changed in another program, want %d", l.how, n, c.threads)
				}
			}
		})
	}
}

// A search is threaded over the messages it matches, not read from the
// folder's conversations.
func TestASearchIsThreadedOnItsOwn(t *testing.T) {
	s := threadingServer()
	p := threadedInbox(t, s)
	if _, _, err := p.SearchMessages("INBOX", "", "desc", 0, 50); err != nil {
		t.Fatal(err)
	}

	before := len(s.traffic.String())
	if _, _, err := p.SearchMessages("INBOX", "Engines", "desc", 0, 50); err != nil {
		t.Fatal(err)
	}
	sent := sentThreads.FindAllString(s.traffic.String()[before:], -1)
	if len(sent) != 1 {
		t.Fatalf("%d THREAD commands for a search after the folder was listed, want 1", len(sent))
	}
	line := s.traffic.String()[before:]
	line = line[strings.Index(line, sent[0]):]
	if line = line[:strings.IndexByte(line, '\n')]; !strings.Contains(line, "Engines") {
		t.Errorf("the search threaded %q, want the messages that match Engines", line)
	}
}

// elsewhere logs in to the test's account a second time, as another mail
// program the user has open, with INBOX selected.
func elsewhere(t *testing.T, s *memServer) *imapclient.Client {
	t.Helper()
	c, err := imapclient.DialInsecure(s.addr, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { c.Close() })
	if err := c.Login("ada", "pass").Wait(); err != nil {
		t.Fatal(err)
	}
	if _, err := c.Select("INBOX", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	return c
}

func flagUID(t *testing.T, c *imapclient.Client, uid imap.UID, flag imap.Flag) {
	t.Helper()
	if err := c.Store(imap.UIDSetNum(uid), &imap.StoreFlags{
		Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{flag},
	}, nil).Close(); err != nil {
		t.Fatal(err)
	}
}

func deleteUID(t *testing.T, c *imapclient.Client, uid imap.UID) {
	t.Helper()
	flagUID(t, c, uid, imap.FlagDeleted)
	if err := c.UIDExpunge(imap.UIDSetNum(uid)).Close(); err != nil {
		t.Fatal(err)
	}
}

// A session keeps the conversations of the eight folders it read last, not of
// every folder it ever opened. After INBOX and eight more, the first of the
// eight is listed again without a THREAD, and INBOX, the ninth folder back,
// is threaded again.
func TestOnlyTheLastFoldersReadKeepTheirConversations(t *testing.T) {
	s := threadingServer()
	p := threadedInbox(t, s)
	var folders []string
	for i := 0; i < 8; i++ {
		name := "Folder" + string(rune('A'+i))
		if err := p.CreateMailbox(name); err != nil {
			t.Fatal(err)
		}
		appendTo(t, p.client, name, datedMessage("Engines", "Mon, 01 Sep 2026 08:00:00 +0000"))
		folders = append(folders, name)
	}
	list := func(name string) {
		t.Helper()
		if _, _, err := p.ListMessages(name, "desc", 0, 1); err != nil {
			t.Fatal(err)
		}
	}
	for _, name := range append([]string{"INBOX"}, folders...) {
		list(name)
	}

	before := len(s.traffic.String())
	list(folders[0])
	if n := countThreads(s, before); n != 0 {
		t.Errorf("%d THREAD commands to list %s again, the eighth folder read back, want none", n, folders[0])
	}
	before = len(s.traffic.String())
	list("INBOX")
	if n := countThreads(s, before); n != 1 {
		t.Errorf("%d THREAD commands to list INBOX again, the ninth folder read back, want 1", n)
	}
}
