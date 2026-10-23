package alpsbase

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/url"
	"sync"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

// faults are what a lossy provider fails. Each count is how many more times
// the command fails.
type faults struct {
	mu sync.Mutex
	// appendLost stores the message, and loses the answer: the connection
	// drops before the server's OK arrives.
	appendLost map[provider.MailboxType]int
	// appendBefore fails before anything is stored, as on a connection the
	// server had already dropped.
	appendBefore map[provider.MailboxType]int
	// deleteLost and deleteRefused fail a delete, deleting nothing: with a
	// dropped connection, and with the server's refusal.
	deleteLost, deleteRefused int
}

func (f *faults) take(counts map[provider.MailboxType]int, t provider.MailboxType) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	if counts[t] > 0 {
		counts[t]--
		return true
	}
	return false
}

func (f *faults) takeOne(count *int) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	if *count > 0 {
		*count--
		return true
	}
	return false
}

// lossy is a connection to the maildir that fails as faults say.
type lossy struct {
	provider.MailProvider
	f *faults
}

func (l lossy) AppendMessage(mailbox string, msg provider.OutgoingMessageWriter, t provider.MailboxType) (*provider.Mailbox, provider.MessageID, uint32, error) {
	if l.f.take(l.f.appendBefore, t) {
		return nil, nil, 0, io.ErrUnexpectedEOF
	}
	mbox, id, size, err := l.MailProvider.AppendMessage(mailbox, msg, t)
	if err == nil && l.f.take(l.f.appendLost, t) {
		return nil, nil, 0, io.ErrUnexpectedEOF
	}
	return mbox, id, size, err
}

func (l lossy) DeleteMessages(mailbox string, ids []provider.MessageID) error {
	if l.f.takeOne(&l.f.deleteLost) {
		return io.ErrUnexpectedEOF
	}
	if l.f.takeOne(&l.f.deleteRefused) {
		return errors.New("NO the server refuses")
	}
	return l.MailProvider.DeleteMessages(mailbox, ids)
}

func (l lossy) FindByReferences(mailbox string, ids []string) ([]provider.Message, error) {
	return l.MailProvider.(provider.ReferenceFinder).FindByReferences(mailbox, ids)
}

func newLossyTestServer(t *testing.T, smtpServer string) (*testServer, *faults) {
	t.Helper()
	f := &faults{appendLost: map[provider.MailboxType]int{}, appendBefore: map[provider.MailboxType]int{}}
	s := newTestServerWrapping(t, smtpServer, alps.NewLogger(), func(p provider.MailProvider) provider.MailProvider {
		return lossy{p, f}
	})
	return s, f
}

type draftSaved struct {
	UID         string           `json:"draft_uid"`
	Mailbox     string           `json:"draft_mailbox"`
	Attachments []map[string]any `json:"attachments"`
}

func saveDraft(t *testing.T, s *testServer, form url.Values) (response, draftSaved) {
	t.Helper()
	r := s.do("POST", "/messages", form)
	var saved draftSaved
	if r.status == http.StatusOK {
		r.json(t, &saved)
	}
	return r, saved
}

// A draft whose APPEND was answered with no UID, as by a server without
// UIDPLUS, is saved, without a UID to name it by. Its read-back asked the
// provider for a nil ID, which panicked, and every draft save on such a server
// failed with 500.
func TestHTTP_ADraftSavedWithoutUIDPlusIsSaved(t *testing.T) {
	s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
		return noAppendUID{inner}
	})
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)

	r, saved := saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"first"}, "save_as_draft": {"1"}})
	s.expect(r, http.StatusOK)
	if saved.UID != "" {
		t.Errorf("the draft is named %q, which the server never said", saved.UID)
	}
	if got := s.mailbox("Drafts").Total; got != 1 {
		t.Errorf("Drafts holds %d drafts", got)
	}
}

// noAppendUID is a mail server without UIDPLUS: it stores what is appended,
// and does not say under which UID.
type noAppendUID struct{ imapserver.Session }

func (s noAppendUID) Append(ctx context.Context, mailbox string, r imap.LiteralReader, options *imap.AppendOptions) (*imap.AppendData, error) {
	_, err := s.Session.Append(ctx, mailbox, r, options)
	return nil, err
}

// A draft whose APPEND was stored, and whose answer the connection lost, is
// not stored again. The save was run again from the top on another
// connection, and Drafts held the draft twice.
func TestHTTP_ADraftWhoseAnswerWasLostIsNotStoredTwice(t *testing.T) {
	s, f := newLossyTestServer(t, "smtp://127.0.0.1:1")
	s.login()
	f.appendLost[provider.MailboxTypeDrafts] = 1

	saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"first"}, "save_as_draft": {"1"}})
	if got := s.mailbox("Drafts").Total; got != 1 {
		t.Errorf("Drafts holds %d copies of the draft, want 1", got)
	}
}

// A draft whose connection failed before anything was stored, as one the
// server had dropped, is still saved on another.
func TestHTTP_ADraftWhoseConnectionHadGoneIsSaved(t *testing.T) {
	s, f := newLossyTestServer(t, "smtp://127.0.0.1:1")
	s.login()
	f.appendBefore[provider.MailboxTypeDrafts] = 1

	r, saved := saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"first"}, "save_as_draft": {"1"}})
	s.expect(r, http.StatusOK)
	drafts := s.mailbox("Drafts").Messages
	if len(drafts) != 1 || drafts[0].UID != saved.UID {
		t.Errorf("Drafts holds %d drafts, want the one saved, %q", len(drafts), saved.UID)
	}
}

// A save whose draft was stored, and whose removal of the draft before it
// lost its answer, finishes the removal without storing the draft again. The
// save was run again from the top: Drafts kept a second copy of the new
// draft, and the answer named every attachment twice.
func TestHTTP_ADraftSaveFinishesWithoutStoringAgain(t *testing.T) {
	s, f := newLossyTestServer(t, "smtp://127.0.0.1:1")
	s.login()
	notes := s.upload("notes.txt", "remember the milk")
	form := draftWith(notes)
	r, first := saveDraft(t, s, form)
	s.expect(r, http.StatusOK)

	f.deleteLost = 1
	form = url.Values{"to": {"mary@remote.test"}, "subject": {"Notes"}, "text": {"See the file."}, "save_as_draft": {"1"},
		"draft_uid": {first.UID}, "draft_mailbox": {first.Mailbox}, "prev_attachments": {"2"}}
	r, second := saveDraft(t, s, form)
	s.expect(r, http.StatusOK)
	if len(second.Attachments) != 1 {
		t.Errorf("the answer names %d attachments, want 1: %v", len(second.Attachments), second.Attachments)
	}
	drafts := s.mailbox(first.Mailbox).Messages
	if len(drafts) != 1 || drafts[0].UID != second.UID {
		t.Errorf("%s holds %d drafts, want the second save, %q, alone", first.Mailbox, len(drafts), second.UID)
	}
}

// A save that stored its draft and then failed has the folder read again,
// for the draft it stored. The listing went on without it.
func TestHTTP_ADraftSaveThatFailsAfterStoringIsListed(t *testing.T) {
	s, f := newLossyTestServer(t, "smtp://127.0.0.1:1")
	s.login()
	r, first := saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"first"}, "save_as_draft": {"1"}})
	s.expect(r, http.StatusOK)
	if got := s.mailbox(first.Mailbox).Total; got != 1 {
		t.Fatalf("Drafts holds %d drafts", got)
	}

	f.deleteRefused = 1
	r, _ = saveDraft(t, s, url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"second"}, "save_as_draft": {"1"},
		"draft_uid": {first.UID}, "draft_mailbox": {first.Mailbox}})
	if r.status == http.StatusOK {
		t.Fatalf("the save answered %d", r.status)
	}
	if got := s.mailbox(first.Mailbox).Total; got != 2 {
		t.Errorf("Drafts lists %d drafts, want both the old and the new", got)
	}
}

// The copy in Sent of a message sent is filed once, whatever the connection
// does: one whose answer was lost is found in Sent, and one that failed before
// anything was stored is filed again. The filing was run again from the top,
// and Sent held the message twice.
func TestHTTP_TheSentCopyIsFiledOnce(t *testing.T) {
	for name, arm := range map[string]func(*faults){
		"the answer lost":     func(f *faults) { f.appendLost[provider.MailboxTypeSent] = 1 },
		"the connection gone": func(f *faults) { f.appendBefore[provider.MailboxTypeSent] = 1 },
	} {
		t.Run(name, func(t *testing.T) {
			smtpServer, _ := listenRecorder(t)
			s, f := newLossyTestServer(t, smtpServer)
			s.login()
			arm(f)

			s.expect(s.do("POST", "/messages", url.Values{"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {"See you."}}), http.StatusOK)
			if got := s.mailbox("Sent").Total; got != 1 {
				t.Errorf("Sent holds %d copies, want 1", got)
			}
		})
	}
}
