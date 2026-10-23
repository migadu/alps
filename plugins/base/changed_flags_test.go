package alpsbase

import (
	"encoding/json"
	"net/http"
	"regexp"
	"slices"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/migadu/alps"
)

// A session keeps a folder's pages while the folder's counts stay as they
// were read. A flag changed in another client that leaves the unread count as
// it was, a star, was then not listed until the cache expired; one that moves
// it, a message read, dropped every page of the folder, and the next listing
// read the page again in full. With condstore on, and a server that numbers
// its changes (CONDSTORE), the counts carry HIGHESTMODSEQ, and a page whose
// messages are all still there has the flags that changed since it was read
// asked for and laid over it.

// condStoreServer numbers the changes to the mailboxes' messages.
var condStoreServer = imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapEnable: {}, imap.CapCondStore: {}, imap.CapUIDPlus: {}}

func newCondStoreAccountServer(t *testing.T, messages ...string) (*testServer, *imapWire, func() *imapclient.Client) {
	t.Helper()
	return newIMAPAccountServerWith(t, condStoreServer, func(o *alps.Options) { o.CondStore = true }, messages...)
}

// envelopeFetches matches a FETCH alps sends for messages' envelopes, as a
// listing reads its page.
var envelopeFetches = regexp.MustCompile(`(?m)^[^*\s]\S* (UID )?FETCH [^\r\n]*ENVELOPE`)

// changedFlagFetches matches a FETCH alps sends for the flags changed since a
// change it names.
var changedFlagFetches = regexp.MustCompile(`(?m)^[^*\s]\S* UID FETCH [^\r\n]*CHANGEDSINCE`)

func flagsListed(t *testing.T, page mailboxPage, subject string) []string {
	t.Helper()
	for _, m := range page.Messages {
		if m.Envelope.Subject == subject {
			return m.Flags
		}
	}
	t.Fatalf("%s is not listed: %s", subject, subjectsOf(page))
	return nil
}

func flagElsewhere(t *testing.T, c *imapclient.Client, mailbox string, uid imap.UID, flag imap.Flag) {
	t.Helper()
	if _, err := c.Select(mailbox, nil).Wait(); err != nil {
		t.Fatal(err)
	}
	if err := c.Store(imap.UIDSetNum(uid), &imap.StoreFlags{
		Op: imap.StoreFlagsAdd, Silent: true, Flags: []imap.Flag{flag},
	}, nil).Close(); err != nil {
		t.Fatal(err)
	}
	if err := c.Unselect().Wait(); err != nil {
		t.Fatal(err)
	}
}

func (s *testServer) changeNumber(mailbox string) uint64 {
	s.t.Helper()
	r := s.do("GET", "/mailboxes/"+mailbox+"/status", nil)
	s.expect(r, http.StatusOK)
	var status struct {
		HighestModSeq uint64 `json:"highestmodseq"`
	}
	if err := json.Unmarshal(r.body, &status); err != nil {
		s.t.Fatal(err)
	}
	return status.HighestModSeq
}

// A star from another client is listed at the next check, from the page held,
// with the flags that changed laid over it.
func TestHTTP_AStarFromAnotherClientIsListed(t *testing.T) {
	s, wire, elsewhere := newCondStoreAccountServer(t, letter("Engines"), letter("Looms"))
	s.login()
	if got := subjectsOf(s.checkForNewMail("INBOX")); got != "Looms, Engines" {
		t.Fatalf("the list shows %q", got)
	}

	flagElsewhere(t, elsewhere(), "INBOX", 2, imap.FlagFlagged)

	before := len(wire.String())
	page := s.checkForNewMail("INBOX")
	if flags := flagsListed(t, page, "Looms"); !slices.Contains(flags, string(imap.FlagFlagged)) {
		t.Errorf("after a star in another client, Looms is listed with %v, want it starred", flags)
	}
	if envelopeFetches.MatchString(wire.String()[before:]) {
		t.Errorf("the page was read again for a star:\n%s", wire.String()[before:])
	}
}

// A message read in another client moves the unread count, and is listed read
// without the page being read again.
func TestHTTP_AMessageReadInAnotherClientIsListedFromThePageHeld(t *testing.T) {
	s, wire, elsewhere := newCondStoreAccountServer(t, letter("Engines"), letter("Looms"))
	s.login()
	s.checkForNewMail("INBOX")

	flagElsewhere(t, elsewhere(), "INBOX", 2, imap.FlagSeen)

	before := len(wire.String())
	page := s.checkForNewMail("INBOX")
	if flags := flagsListed(t, page, "Looms"); !slices.Contains(flags, string(imap.FlagSeen)) {
		t.Errorf("after Looms was read in another client, it is listed with %v, want it read", flags)
	}
	sent := wire.String()[before:]
	if envelopeFetches.MatchString(sent) {
		t.Errorf("the page was read again for a message read elsewhere:\n%s", sent)
	}
	if !changedFlagFetches.MatchString(sent) {
		t.Errorf("no FETCH asked for the flags that changed:\n%s", sent)
	}
}

// The check answers the change number with the counts, and a flag changed
// elsewhere moves it, as the page asks the check whether to read the listing
// again.
func TestHTTP_ACheckAnswersTheChangeNumber(t *testing.T) {
	s, _, elsewhere := newCondStoreAccountServer(t, letter("Engines"))
	s.login()
	was := s.changeNumber("INBOX")
	if was == 0 {
		t.Fatal("the check answers no change number")
	}
	flagElsewhere(t, elsewhere(), "INBOX", 1, imap.FlagFlagged)
	if now := s.changeNumber("INBOX"); now <= was {
		t.Errorf("after a star in another client the change number is %d, was %d", now, was)
	}
}

// A message that arrives as another goes leaves the counts as they were, and
// moves HIGHESTMODSEQ as a flag does. It is not taken for a change of flags:
// the page is read again.
func TestHTTP_AMessageThatArrivesAsAnotherGoesIsListedWhenChangesAreNumbered(t *testing.T) {
	s, _, elsewhere := newCondStoreAccountServer(t, letter("Engines"), letter("Looms"))
	s.login()
	s.checkForNewMail("INBOX")

	c := elsewhere()
	deliverElsewhere(t, c, "INBOX", letter("Arrival"))
	expungeElsewhere(t, c, "INBOX", 1)

	if got := subjectsOf(s.checkForNewMail("INBOX")); got != "Arrival, Looms" {
		t.Errorf("after a message arrived and another went, the list shows %q, want Arrival, Looms", got)
	}
}

// The user's own star moves HIGHESTMODSEQ too, and costs the next listing the
// flags that changed, not the page.
func TestHTTP_AStarOfTheUsersOwnDoesNotReadThePageAgain(t *testing.T) {
	s, wire, _ := newCondStoreAccountServer(t, letter("Engines"), letter("Looms"))
	s.login()
	s.checkForNewMail("INBOX")
	s.expect(s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
		"uids": []string{"2"}, "flags": []string{`\Flagged`}, "action": "add",
	}), http.StatusOK)

	before := len(wire.String())
	page := s.checkForNewMail("INBOX")
	if flags := flagsListed(t, page, "Looms"); !slices.Contains(flags, string(imap.FlagFlagged)) {
		t.Errorf("after the user starred Looms, it is listed with %v", flags)
	}
	if envelopeFetches.MatchString(wire.String()[before:]) {
		t.Errorf("the page was read again for the user's own star:\n%s", wire.String()[before:])
	}
}
