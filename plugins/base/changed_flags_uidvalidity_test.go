package alpsbase

import (
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type pausedChanges struct {
	provider.MailProvider
	gate *changedFlagGate
}
type changedFlagGate struct {
	once             sync.Once
	entered, release chan struct{}
}

func (p pausedChanges) TrackChanges() (bool, error) {
	return p.MailProvider.(provider.ChangeTracker).TrackChanges()
}
func (p pausedChanges) ChangedFlags(mailbox string, ids []provider.MessageID, since uint64) ([]provider.Message, error) {
	p.gate.once.Do(func() { close(p.gate.entered); <-p.gate.release })
	return p.MailProvider.(provider.ChangeTracker).ChangedFlags(mailbox, ids, since)
}
func (p pausedChanges) SelectedUIDValidity(mailbox string) uint32 {
	return p.MailProvider.(interface{ SelectedUIDValidity(string) uint32 }).SelectedUIDValidity(mailbox)
}

// The STATUS that found a flag change and the foreground SELECT that reads
// those flags use different connections/turns. A mailbox recreated between
// them gives the same UIDs to different messages; its flags are no patch of
// the old page, even when every count and UIDNEXT happened to stay equal.
func TestHTTP_ChangedFlagsDoNotPatchAPageFromAnotherUIDValidity(t *testing.T) {
	gate := &changedFlagGate{entered: make(chan struct{}), release: make(chan struct{})}
	defer func() {
		select {
		case <-gate.release:
		default:
			close(gate.release)
		}
	}()
	s, _, elsewhere := newIMAPAccountServerWith(t, condStoreServer, func(o *alps.Options) {
		o.CondStore = true
		o.Provider = wrappedOptions{o.Provider, func(p provider.MailProvider) provider.MailProvider { return pausedChanges{p, gate} }}
	})
	c := elsewhere()
	if err := c.Create("Work", nil).Wait(); err != nil {
		t.Fatal(err)
	}
	deliverElsewhere(t, c, "Work", letter("Old plans"))
	s.login()
	if got := subjectsOf(s.checkForNewMail("Work")); got != "Old plans" {
		t.Fatal(got)
	}
	// Keep an old UID-keyed body too, so a refresh must discard it.
	if got := s.rawMessage("Work", "1"); !strings.Contains(got, "Subject: Old plans") {
		t.Fatal(got)
	}
	s.checkForNewMail("INBOX") // The foreground connection is no longer on Work.
	flagElsewhere(t, c, "Work", 1, imap.FlagFlagged)
	s.expect(s.do("GET", "/mailboxes/Work/status", nil), http.StatusOK)
	done := make(chan response, 1)
	go func() { done <- s.do("GET", "/mailboxes/Work?page=0", nil) }()
	select {
	case <-gate.entered:
	case <-time.After(2 * time.Second):
		t.Fatal("no changed-flags request")
	}
	remakeElsewhere(t, c, "Work", letter("New plans"), imap.FlagAnswered)
	flagElsewhere(t, c, "Work", 1, imap.FlagFlagged)
	status, err := c.Status("Work", &imap.StatusOptions{UIDValidity: true}).Wait()
	if err != nil {
		t.Fatal(err)
	}
	close(gate.release)
	r := <-done
	s.expect(r, http.StatusOK)
	var page mailboxPage
	r.json(t, &page)
	var identity struct {
		Mailbox struct{ UIDValidity uint32 }
	}
	r.json(t, &identity)
	if identity.Mailbox.UIDValidity != status.UIDValidity {
		t.Errorf("page UIDVALIDITY = %d, want selected mailbox %d", identity.Mailbox.UIDValidity, status.UIDValidity)
	}
	if got := subjectsOf(page); got != "New plans" {
		t.Fatalf("after recreation patched page shows %q (%+v), want New plans", got, page.Messages)
	}
	// A subsequent cached page and raw body must agree with the new rows.
	r = s.do("GET", "/mailboxes/Work?page=0", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &page)
	if got := subjectsOf(page); got != "New plans" {
		t.Errorf("kept page shows %q", got)
	}
	if got := s.rawMessage("Work", "1"); !strings.Contains(got, "Subject: New plans") {
		t.Errorf("old body survived recreation: %s", got)
	}
}
