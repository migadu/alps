// "Use threading" has three states: on, off, and never saved. Never saved
// means threaded wherever the server can thread, and that has to hold from the
// first page a session lists, in agreement with the settings page.
//
// A session made by signing in keeps the IMAP connection it signed in with, so
// nothing about the server is learned again until that connection is dropped
// and replaced. The cached pages of its listings are named by whether they are
// threaded, and that name has to be right from the first page too.
package alpsbase

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
)

// conversationSession answers THREAD with the one conversation the tests
// deliver; the in-memory server's own answer is a fixed placeholder. It passes
// METADATA through to the in-memory server, which keeps it per account: that
// is where alps keeps the settings, read by every session of the account.
type conversationSession struct {
	imapserver.Session
}

func (s conversationSession) Thread(ctx context.Context, numKind imapserver.NumKind, algorithm imap.ThreadAlgorithm, charset string, criteria *imap.SearchCriteria) ([]imap.ThreadData, error) {
	return []imap.ThreadData{{Chain: []uint32{1, 2, 3}}}, nil
}

func (s conversationSession) GetMetadata(ctx context.Context, mailbox string, entries []string, options *imap.GetMetadataOptions) (*imap.GetMetadataData, error) {
	return s.Session.(imapserver.SessionMetadata).GetMetadata(ctx, mailbox, entries, options)
}

func (s conversationSession) SetMetadata(ctx context.Context, mailbox string, entries map[string]*[]byte) error {
	return s.Session.(imapserver.SessionMetadata).SetMetadata(ctx, mailbox, entries)
}

// newConversationServer serves an account whose INBOX holds one conversation
// of three messages, on an IMAP server that can thread it.
func newConversationServer(t *testing.T) *testServer {
	t.Helper()
	return newIMAPTestServerWith(t,
		imap.CapSet{imap.CapIMAP4rev1: {}, imap.Cap("THREAD=REFERENCES"): {}, imap.CapMetadata: {}},
		func(sess imapserver.Session) imapserver.Session { return conversationSession{sess} },
		"From: Ada <ada@remote.test>\r\nSubject: Engines\r\nMessage-ID: <one@remote.test>\r\n\r\nfirst\r\n",
		"From: Charles <charles@remote.test>\r\nSubject: Re: Engines\r\nMessage-ID: <two@remote.test>\r\nIn-Reply-To: <one@remote.test>\r\n\r\nsecond\r\n",
		"From: Mary <mary@remote.test>\r\nSubject: Re: Engines\r\nMessage-ID: <three@remote.test>\r\nIn-Reply-To: <two@remote.test>\r\n\r\nthird\r\n",
	)
}

// anotherSession signs in to the same server as s, as a second browser would.
func (s *testServer) anotherSession() *testServer {
	s.t.Helper()
	jar, _ := cookiejar.New(nil)
	other := &testServer{t: s.t, url: s.url, client: &http.Client{Jar: jar}}
	other.login()
	return other
}

// inbox lists the first page of the INBOX and reports whether it is threaded,
// how many rows it has, and how many earlier messages those rows carry.
func inbox(t *testing.T, s *testServer) (threaded bool, rows, earlier int) {
	t.Helper()
	r := s.do("GET", "/mailboxes/INBOX?page=0", nil)
	s.expect(r, http.StatusOK)
	var page struct {
		Threaded bool
		Messages []struct {
			SubMessages []json.RawMessage
		}
	}
	r.json(t, &page)
	for _, m := range page.Messages {
		earlier += len(m.SubMessages)
	}
	return page.Threaded, len(page.Messages), earlier
}

// threadingShown is what the settings page shows for "Use threading".
func threadingShown(t *testing.T, s *testServer) string {
	t.Helper()
	r := s.do("GET", "/settings", nil)
	s.expect(r, http.StatusOK)
	var settings struct {
		Settings struct {
			UI struct {
				EnableThreading *bool `json:"enableThreading"`
			} `json:"ui"`
		}
	}
	r.json(t, &settings)
	switch on := settings.Settings.UI.EnableThreading; {
	case on == nil:
		return "unset"
	case *on:
		return "on"
	default:
		return "off"
	}
}

func TestHTTP_ANewSessionThreadsWithoutASavedPreference(t *testing.T) {
	// A listing sorted by date is answered by a search, one sorted by arrival
	// by a plain listing, and each decides on its own whether to thread.
	for _, criteria := range []string{"date", "uid"} {
		t.Run(criteria, func(t *testing.T) {
			s := newConversationServer(t)
			s.login()
			if criteria != "date" {
				s.expect(s.do("PUT", "/settings", map[string]any{"message_sort_criteria": criteria}), http.StatusOK)
			}

			if threaded, rows, earlier := inbox(t, s); !threaded || rows != 1 || earlier != 2 {
				t.Fatalf("the first listing of a new session: Threaded %v, %d rows carrying %d earlier messages; want one threaded row carrying 2",
					threaded, rows, earlier)
			}
			if shown := threadingShown(t, s); shown != "on" {
				t.Errorf("the settings page shows threading %s beside a threaded listing, want on", shown)
			}
		})
	}
}

// Threading turned off in one browser is turned off in another as soon as its
// settings page has read the change. That browser's next listing used to be
// served from the threaded page it had cached before: a session that signed in
// filed its pages as unthreaded until its connection was replaced, so the
// unthreaded listing it now asked for found the old threaded page under the
// same name, while the settings page beside it said threading was off.
func TestHTTP_ThreadingTurnedOffElsewhereIsNotServedFromAnOlderPage(t *testing.T) {
	a := newConversationServer(t)
	a.login()
	if threaded, rows, _ := inbox(t, a); !threaded || rows != 1 {
		t.Fatalf("the first listing: Threaded %v with %d rows; want one threaded row", threaded, rows)
	}

	b := a.anotherSession()
	b.expect(b.do("PUT", "/settings", map[string]any{"ui": map[string]any{"enableThreading": false}}), http.StatusOK)

	if shown := threadingShown(t, a); shown != "off" {
		t.Fatalf("the first browser's settings page shows threading %s after the second turned it off, want off", shown)
	}
	if threaded, rows, _ := inbox(t, a); threaded || rows != 3 {
		t.Errorf("with threading off, the first browser lists Threaded %v with %d rows; want three unthreaded rows", threaded, rows)
	}
}
