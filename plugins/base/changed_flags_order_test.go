package alpsbase

import (
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type heldDeltaID struct {
	provider.MessageID
	entered chan struct{}
	release chan struct{}
	once    *sync.Once
}

func (id heldDeltaID) String() string {
	id.once.Do(func() { close(id.entered); <-id.release })
	return id.MessageID.String()
}

type heldDeltaProvider struct {
	provider.MailProvider
	version *atomic.Uint64
	id      *heldDeltaID
}

func (p heldDeltaProvider) TrackChanges() (bool, error) { return true, nil }
func (p heldDeltaProvider) ChangedFlags(string, []provider.MessageID, uint64) ([]provider.Message, error) {
	return []provider.Message{{ID: *p.id}}, nil
}
func (p heldDeltaProvider) GetMailboxStatus(name string) (*provider.MailboxStatus, error) {
	status, err := p.MailProvider.GetMailboxStatus(name)
	if err == nil {
		status.UIDValidity, status.UIDNext, status.HighestModSeq = 41, 3, p.version.Load()
	}
	return status, err
}
func (p heldDeltaProvider) ListMailboxes() ([]provider.Mailbox, error) {
	boxes, err := p.MailProvider.ListMailboxes()
	for i := range boxes {
		boxes[i].UIDValidity, boxes[i].UIDNext, boxes[i].HighestModSeq = 41, 3, p.version.Load()
	}
	return boxes, err
}

type heldCacheWriteLogger struct {
	alps.Logger
	key     string
	armed   atomic.Bool
	entered chan struct{}
	release chan struct{}
	once    sync.Once
}

func (l *heldCacheWriteLogger) Debugf(format string, args ...interface{}) {
	if l.armed.Load() && format == "Updated flags for message %s in cache key %s" && len(args) == 2 && args[1] == l.key {
		l.once.Do(func() { close(l.entered); <-l.release })
	}
	l.Logger.Debugf(format, args...)
}

// An optional change tracker has already answered, so the session's connection
// is available for a newer write. Pause the write after its metadata changed
// and before its page changed: the page's row-identity guard still passes,
// but must not let the older full flag set overwrite that newer metadata.
func TestHTTP_DeltaFlagsDoNotOverwriteANewerOwnMetadataWrite(t *testing.T) {
	version := &atomic.Uint64{}
	version.Store(7)
	id := &heldDeltaID{entered: make(chan struct{}), release: make(chan struct{}), once: &sync.Once{}}
	log := &heldCacheWriteLogger{Logger: alps.NewLogger(), entered: make(chan struct{}), release: make(chan struct{})}
	var releaseID, releaseWrite sync.Once
	defer releaseID.Do(func() { close(id.release) })
	defer releaseWrite.Do(func() { close(log.release) })
	s := newTestServerWithOptionsWrapping(t, "smtp://127.0.0.1:1", log,
		func(o *alps.Options) { o.CondStore = true },
		func(p provider.MailProvider) provider.MailProvider { return heldDeltaProvider{p, version, id} })
	s.login()
	page := s.mailbox("INBOX")
	uid := page.Messages[0].UID
	parsed, err := s.store.ParseMessageID(uid)
	if err != nil {
		t.Fatal(err)
	}
	id.MessageID = parsed
	log.key = "message:INBOX:" + uid + ":[]"
	version.Store(8)
	s.expect(s.do("GET", "/mailboxes/INBOX/status", nil), http.StatusOK)
	pageDone := make(chan response, 1)
	go func() { pageDone <- s.do("GET", "/mailboxes/INBOX?page=0", nil) }()
	wait := func(entered <-chan struct{}, what string) {
		t.Helper()
		select {
		case <-entered:
		case <-time.After(5 * time.Second):
			t.Fatalf("timed out waiting for %s", what)
		}
	}
	wait(id.entered, "the answered delta outside its mail callback")
	log.armed.Store(true)
	writeDone := make(chan response, 1)
	go func() {
		writeDone <- s.do("PUT", "/mailboxes/INBOX/messages/flag", map[string]any{
			"uids": []string{uid}, "flags": []string{`\Flagged`}, "action": "add",
		})
	}()
	wait(log.entered, "the newer metadata write before its page patch")
	releaseID.Do(func() { close(id.release) })
	s.expect(<-pageDone, http.StatusOK)
	releaseWrite.Do(func() { close(log.release) })
	s.expect(<-writeDone, http.StatusOK)
	// The completed write is shown by the HTTP listing. Its metadata must also
	// remain current (or be invalidated), rather than retaining the old flags.
	if flags := flagsListed(t, s.mailbox("INBOX"), page.Messages[0].Envelope.Subject); !strings.Contains(strings.Join(flags, ","), `\Flagged`) {
		t.Fatalf("the completed write is absent from the listing: %v", flags)
	}
	session, err := s.server.Sessions.Get(s.sessionToken())
	if err != nil {
		t.Fatal(err)
	}
	if cached, ok := session.Cache().Get(log.key); ok {
		part := cached.(CachedMessagePart)
		var flagged bool
		for _, flag := range part.Message.Flags {
			flagged = flagged || flag == provider.Flag(`\Flagged`)
		}
		if !flagged {
			t.Fatalf("older delta overwrote the newer metadata flags: %v", part.Message.Flags)
		}
	}
}
