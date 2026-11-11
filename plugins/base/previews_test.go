package alpsbase

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"testing"

	"github.com/migadu/go-imap"
	"github.com/migadu/go-imap/imapserver"
)

var previewCaps = imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapPreview: {}}

var previewTestMessages = []string{
	"From: a@example.test\r\nSubject: one\r\n\r\nFirst message\r\n",
	"From: b@example.test\r\nSubject: two\r\n\r\nSecond message\r\n",
}

// previewsNotToHand answers PREVIEW (LAZY) without the item, which a client
// reads as it reads NIL: the server would have to fetch the body to say.
type previewsNotToHand struct {
	imapserver.Session
}

func (s previewsNotToHand) Fetch(ctx context.Context, w *imapserver.FetchWriter, numSet imap.NumSet, options *imap.FetchOptions) error {
	if options.Preview != nil && options.Preview.Lazy {
		withoutPreview := *options
		withoutPreview.Preview = nil
		options = &withoutPreview
	}
	return s.Session.Fetch(ctx, w, numSet, options)
}

type previewsPage struct {
	Previews  map[string]string
	Scope     string
	Supported bool
}

type listedPreviews struct {
	Messages []struct {
		UID            string
		Preview        string
		PreviewPending bool
	}
}

func listInbox(t *testing.T, s *testServer) listedPreviews {
	t.Helper()
	r := s.do("GET", "/mailboxes/INBOX?page=0&refresh=1", nil)
	s.expect(r, http.StatusOK)
	var page listedPreviews
	r.json(t, &page)
	return page
}

func TestHTTP_ListingCarriesPreviews(t *testing.T) {
	s := newIMAPTestServerWith(t, previewCaps, nil, previewTestMessages...)
	s.login()
	page := listInbox(t, s)
	if len(page.Messages) != 2 {
		t.Fatalf("%d messages listed, want 2", len(page.Messages))
	}
	for _, m := range page.Messages {
		if !strings.HasSuffix(m.Preview, "message") || m.PreviewPending {
			t.Errorf("message %s: preview %q, pending %v; want its text", m.UID, m.Preview, m.PreviewPending)
		}
	}
}

func TestHTTP_PendingPreviews(t *testing.T) {
	s := newIMAPTestServerWith(t, previewCaps, func(sess imapserver.Session) imapserver.Session {
		return previewsNotToHand{sess}
	}, previewTestMessages...)
	s.login()

	page := listInbox(t, s)
	var uids []string
	for _, m := range page.Messages {
		if !m.PreviewPending || m.Preview != "" {
			t.Errorf("message %s: preview %q, pending %v; want pending", m.UID, m.Preview, m.PreviewPending)
		}
		uids = append(uids, m.UID)
	}

	r := s.do("GET", "/mailboxes/INBOX/previews?uids="+strings.Join(uids, ",")+",99", nil)
	s.expect(r, http.StatusOK)
	var previews previewsPage
	r.json(t, &previews)
	if !previews.Supported || previews.Scope == "" {
		t.Fatalf("previews %+v; want supported, with a scope", previews)
	}
	if len(previews.Previews) != 2 || previews.Previews["1"] != "First message" || previews.Previews["2"] != "Second message" {
		t.Fatalf("previews %v; want both texts and nothing for 99", previews.Previews)
	}

	// The session keeps them, so the next listing carries them.
	for _, m := range listInbox(t, s).Messages {
		if m.PreviewPending || !strings.HasSuffix(m.Preview, "message") {
			t.Errorf("relisted message %s: preview %q, pending %v; want the text", m.UID, m.Preview, m.PreviewPending)
		}
	}
}

func TestHTTP_PreviewsRequestLimits(t *testing.T) {
	s := newIMAPTestServerWith(t, previewCaps, nil, previewTestMessages...)
	s.login()

	r := s.do("GET", "/mailboxes/INBOX/previews", nil)
	s.expect(r, http.StatusOK)
	var page previewsPage
	r.json(t, &page)
	if len(page.Previews) != 0 {
		t.Fatalf("previews %v for no uids", page.Previews)
	}

	many := make([]string, maxPreviewUIDs+1)
	for i := range many {
		many[i] = strconv.Itoa(i + 1)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX/previews?uids="+strings.Join(many, ","), nil), http.StatusBadRequest)
	s.expect(s.do("GET", "/mailboxes/INBOX/previews?uids=1,not-a-uid", nil), http.StatusBadRequest)
}

func TestHTTP_PreviewsUnsupported(t *testing.T) {
	t.Run("IMAP server without PREVIEW", func(t *testing.T) {
		s := newIMAPTestServer(t, previewTestMessages...)
		s.login()
		for _, m := range listInbox(t, s).Messages {
			if m.Preview != "" || m.PreviewPending {
				t.Errorf("message %s: preview %q, pending %v; want none", m.UID, m.Preview, m.PreviewPending)
			}
		}
		r := s.do("GET", "/mailboxes/INBOX/previews?uids=1", nil)
		s.expect(r, http.StatusOK)
		var page previewsPage
		r.json(t, &page)
		if page.Supported || len(page.Previews) != 0 {
			t.Fatalf("previews %+v from a server without PREVIEW", page)
		}
	})
	t.Run("provider without previews", func(t *testing.T) {
		s := newTestServer(t)
		s.login()
		r := s.do("GET", "/mailboxes/INBOX/previews?uids=1", nil)
		s.expect(r, http.StatusOK)
		var page previewsPage
		r.json(t, &page)
		if page.Supported || len(page.Previews) != 0 {
			t.Fatalf("maildir answered previews %+v", page)
		}
	})
}
