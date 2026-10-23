package alpsbase

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
)

func newServerWithoutUIDPlus(t *testing.T) *testServer {
	t.Helper()
	s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
		return noAppendUID{inner}
	})
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
	return s
}

func draftForm(text string) url.Values {
	return url.Values{
		"to": {"charles@remote.test"}, "subject": {"Notes"}, "text": {text},
		"message_id": {"<notes@example.com>"}, "save_as_draft": {"1"},
	}
}

// A server without UIDPLUS does not say under which UID it stored a draft, so
// the save looks for it, and answers its UID: the next save replaces it. It
// answered none, the composer had nothing to send back, and every autosave
// left one more copy of the draft in Drafts.
func TestHTTP_ADraftSavedWithoutUIDPlusIsNamedAndReplaced(t *testing.T) {
	s := newServerWithoutUIDPlus(t)

	r, first := saveDraft(t, s, draftForm("first"))
	s.expect(r, http.StatusOK)
	if first.UID == "" {
		t.Fatal("the save named no draft")
	}
	form := draftForm("second")
	form.Set("draft_uid", first.UID)
	form.Set("draft_mailbox", first.Mailbox)
	r, second := saveDraft(t, s, form)
	s.expect(r, http.StatusOK)

	drafts := s.mailbox(first.Mailbox).Messages
	if len(drafts) != 1 || drafts[0].UID != second.UID {
		t.Errorf("%s holds %d drafts, want the second save, %q, alone", first.Mailbox, len(drafts), second.UID)
	}
}

// Every save of a draft has the draft's Message-ID, and an earlier copy may
// still be in Drafts, as one left by a save whose answer was lost. The save
// names the copy it has just stored, not that one.
func TestHTTP_ADraftSavedWithoutUIDPlusIsTheCopyJustStored(t *testing.T) {
	s := newServerWithoutUIDPlus(t)

	r, earlier := saveDraft(t, s, draftForm("earlier"))
	s.expect(r, http.StatusOK)
	// Saved again as if afresh, the earlier copy's UID unknown to the
	// composer.
	r, now := saveDraft(t, s, draftForm("now"))
	s.expect(r, http.StatusOK)
	if now.UID == "" || now.UID == earlier.UID {
		t.Fatalf("the second save is named %q, the first %q", now.UID, earlier.UID)
	}

	r = s.do("GET", "/mailboxes/"+now.Mailbox+"/messages/"+now.UID, nil)
	s.expect(r, http.StatusOK)
	var opened struct{ Body string }
	r.json(t, &opened)
	if opened.Body != "now" {
		t.Errorf("the draft named holds %q, want the one just saved", opened.Body)
	}
}

// twiceStored is a server without UIDPLUS at which another client stores the
// same draft while this one does: every APPEND leaves two copies.
type twiceStored struct{ imapserver.Session }

type literal struct {
	*bytes.Reader
}

func (l literal) Size() int64 { return l.Reader.Size() }

func (s twiceStored) Append(ctx context.Context, mailbox string, r imap.LiteralReader, options *imap.AppendOptions) (*imap.AppendData, error) {
	b, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	for range 2 {
		if _, err := s.Session.Append(ctx, mailbox, literal{bytes.NewReader(b)}, options); err != nil {
			return nil, err
		}
	}
	return nil, nil
}

// When two copies were stored since the save began, either could be the one
// it stored: the save is answered without a UID rather than with a guess.
func TestHTTP_ADraftSavedWithoutUIDPlusBesideAnotherIsNotGuessed(t *testing.T) {
	s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
		return twiceStored{inner}
	})
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)

	r, saved := saveDraft(t, s, draftForm("now"))
	s.expect(r, http.StatusOK)
	if saved.UID != "" {
		t.Errorf("the save named %q, one of two copies stored at once", saved.UID)
	}
}

type substringTwin struct {
	imapserver.Session
	removeOriginal bool
}

func (s substringTwin) Append(ctx context.Context, mailbox string, r imap.LiteralReader, options *imap.AppendOptions) (*imap.AppendData, error) {
	b, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	ours := *options
	ours.Flags = append([]imap.Flag(nil), options.Flags...)
	if s.removeOriginal {
		ours.Flags = append(ours.Flags, imap.FlagDeleted)
	}
	stored, err := s.Session.Append(ctx, mailbox, literal{bytes.NewReader(b)}, &ours)
	if err != nil {
		return nil, err
	}
	if s.removeOriginal {
		if _, err := s.Session.Select(ctx, mailbox, &imap.SelectOptions{}); err != nil {
			return nil, err
		}
		set := imap.UIDSetNum(stored.UID)
		if err := s.Session.Expunge(ctx, nil, &set); err != nil {
			return nil, err
		}
	}
	// Another client stores a different message whose Message-ID happens to
	// contain ours. IMAP HEADER SEARCH matches the substring, not the ID.
	other := strings.Replace(string(b), "<notes@example.com>", "<xnotes@example.com>", 1)
	other = strings.Replace(other, "our draft", "another message", 1)
	_, err = s.Session.Append(ctx, mailbox, literal{bytes.NewReader([]byte(other))}, options)
	return nil, err
}

func TestHTTP_ADraftUIDLookupRequiresAnExactMessageID(t *testing.T) {
	for _, removed := range []bool{false, true} {
		name := "beside a substring match"
		if removed {
			name = "our draft removed before lookup"
		}
		t.Run(name, func(t *testing.T) {
			s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
				return substringTwin{inner, removed}
			})
			s.login()
			s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
			r, saved := saveDraft(t, s, draftForm("our draft"))
			s.expect(r, http.StatusOK)
			if removed {
				if saved.UID != "" {
					t.Errorf("the removed draft was assigned unrelated UID%s", saved.UID)
				}
				return
			}
			if saved.UID == "" {
				t.Fatal("a substring-only match hid our uniquely identified draft")
			}
			r = s.do("GET", "/mailboxes/"+saved.Mailbox+"/messages/"+saved.UID, nil)
			s.expect(r, http.StatusOK)
			var opened struct{ Body string }
			r.json(t, &opened)
			if opened.Body != "our draft" {
				t.Errorf("the named draft holds %q", opened.Body)
			}
		})
	}
}

type refusedDraftLookup struct {
	imapserver.Session
	refuse    *atomic.Bool
	ambiguous bool
}

func (s refusedDraftLookup) Append(ctx context.Context, mailbox string, r imap.LiteralReader, options *imap.AppendOptions) (*imap.AppendData, error) {
	b, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	count := 1
	if s.ambiguous && s.refuse.Load() {
		count = 2
	}
	for range count {
		if _, err := s.Session.Append(ctx, mailbox, literal{bytes.NewReader(b)}, options); err != nil {
			return nil, err
		}
	}
	return nil, nil
}

func (s refusedDraftLookup) Search(ctx context.Context, kind imapserver.NumKind, criteria *imap.SearchCriteria, options *imap.SearchOptions) (*imap.SearchData, error) {
	if s.refuse.Load() && !s.ambiguous {
		return nil, &imap.Error{Type: imap.StatusResponseTypeNo, Text: "lookup unavailable"}
	}
	return s.Session.Search(ctx, kind, criteria, options)
}

func TestHTTP_AnEditedDraftKeepsItsSourceWhenTheNewUIDCannotBeRecovered(t *testing.T) {
	for _, ambiguous := range []bool{false, true} {
		name := "refused lookup"
		if ambiguous {
			name = "ambiguous exact matches"
		}
		t.Run(name, func(t *testing.T) {
			var refuse atomic.Bool
			s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
				return refusedDraftLookup{inner, &refuse, ambiguous}
			})
			s.login()
			s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
			notes := s.upload("notes.txt", "Keep this attachment source.")
			form := draftWith(notes)
			form.Set("message_id", "<notes@example.com>")
			r, first := saveDraft(t, s, form)
			s.expect(r, http.StatusOK)
			if first.UID == "" {
				t.Fatal("the first draft was not named")
			}
			refuse.Store(true)
			form = draftForm("newer text")
			form.Set("draft_uid", first.UID)
			form.Set("draft_mailbox", first.Mailbox)
			form.Set("prev_attachments", "2")
			r, _ = saveDraft(t, s, form)
			if r.status == http.StatusOK {
				t.Error("an unidentifiable replacement draft was reported as complete")
			}
			refuse.Store(false)
			r = s.do("GET", "/mailboxes/"+first.Mailbox+"/messages/"+first.UID+"/raw?part=2", nil)
			s.expect(r, http.StatusOK)
			if !strings.Contains(string(r.body), "Keep this attachment source.") {
				t.Errorf("the old attachment source was lost: %s", r.body)
			}
			want := 2
			if ambiguous {
				want = 3
			}
			if got := s.mailbox(first.Mailbox).Total; got != want {
				t.Errorf("Drafts holds %d messages, want %d including preserved original", got, want)
			}
		})
	}
}
