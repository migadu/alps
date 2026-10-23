package alpsbase

import (
	"context"
	"net/http"
	"net/url"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapserver"
)

func plainMessage(subject string) string {
	return "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: " + subject +
		"\r\nDate: Mon, 02 Jan 2006 15:04:05 +0000\r\n\r\nbody of " + subject + "\r\n"
}

// A move or a copy counts the messages it moved or copied, as the mail server
// names them, not those it was asked for. A message gone since the page
// listed it is passed over by an IMAP server without an error, and was
// counted all the same: the page said two messages had moved, of which one
// had.
func TestHTTP_AMoveCountsWhatMoved(t *testing.T) {
	for _, verb := range []string{"move", "copy"} {
		t.Run(verb, func(t *testing.T) {
			caps := imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapMove: {}, imap.CapUIDPlus: {}}
			s := newIMAPTestServerWith(t, caps, nil, plainMessage("Engines"))
			s.login()
			s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Archive"}}), http.StatusOK)
			msgs := s.mailbox("INBOX").Messages
			if len(msgs) != 1 {
				t.Fatalf("INBOX holds %d messages", len(msgs))
			}

			r := s.do("PUT", "/mailboxes/INBOX/messages/"+verb, map[string]any{"uids": []string{msgs[0].UID, "999"}, "to": "Archive"})
			s.expect(r, http.StatusOK)
			var answer struct {
				Count      int
				UIDMapping map[string]string
			}
			r.json(t, &answer)
			if answer.Count != 1 || len(answer.UIDMapping) != 1 {
				t.Errorf("the %s answered %s, want a count of 1", verb, r.body)
			}
		})
	}
}

// A move or a copy of messages that are all gone, on a server with UIDPLUS,
// moved or copied nothing, and says so. The server names nothing then, as one
// without UIDPLUS names nothing, and the two were taken for one: the batch
// was counted as asked, and the page said a message had moved that had gone
// long before.
func TestHTTP_AMoveOfMessagesThatAreGoneCountsNothing(t *testing.T) {
	for _, verb := range []string{"move", "copy"} {
		t.Run(verb, func(t *testing.T) {
			// Without MOVE, so that a move is a copy and a delete: the
			// in-memory server answers a MOVE of nothing with a COPYUID that
			// names nothing, which no client can read.
			caps := imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapUIDPlus: {}}
			s := newIMAPTestServerWith(t, caps, func(inner imapserver.Session) imapserver.Session {
				return copyUIDOnlyForCopies{inner}
			}, plainMessage("Engines"))
			s.login()
			s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Archive"}}), http.StatusOK)

			r := s.do("PUT", "/mailboxes/INBOX/messages/"+verb, map[string]any{"uids": []string{"999"}, "to": "Archive"})
			s.expect(r, http.StatusOK)
			var answer struct{ Count int }
			r.json(t, &answer)
			if answer.Count != 0 {
				t.Errorf("the %s answered %s, want a count of 0", verb, r.body)
			}
			if got := s.mailbox("Archive").Total; got != 0 {
				t.Errorf("Archive holds %d messages", got)
			}
		})
	}
}

// copyUIDOnlyForCopies answers COPYUID, as a server with UIDPLUS does, only
// when it copied something.
type copyUIDOnlyForCopies struct{ imapserver.Session }

func (s copyUIDOnlyForCopies) Copy(ctx context.Context, numSet imap.NumSet, dest string) (*imap.CopyData, error) {
	data, err := s.Session.Copy(ctx, numSet, dest)
	if data != nil && len(data.SourceUIDs) == 0 {
		return nil, err
	}
	return data, err
}

// noCopyUID is a mail server without UIDPLUS: it copies, and names none of
// the copies.
type noCopyUID struct{ imapserver.Session }

func (s noCopyUID) Copy(ctx context.Context, numSet imap.NumSet, dest string) (*imap.CopyData, error) {
	_, err := s.Session.Copy(ctx, numSet, dest)
	return nil, err
}

// A server that names none of the messages it moved has not said that none
// moved: the messages asked for are counted, as before.
func TestHTTP_AMoveTheServerDoesNotNameIsCountedAsAsked(t *testing.T) {
	s := newIMAPTestServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}}, func(inner imapserver.Session) imapserver.Session {
		return noCopyUID{inner}
	}, plainMessage("Engines"), plainMessage("Looms"))
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Archive"}}), http.StatusOK)
	var uids []string
	for _, m := range s.mailbox("INBOX").Messages {
		uids = append(uids, m.UID)
	}

	r := s.do("PUT", "/mailboxes/INBOX/messages/move", map[string]any{"uids": uids, "to": "Archive"})
	s.expect(r, http.StatusOK)
	var answer struct{ Count int }
	r.json(t, &answer)
	if answer.Count != 2 {
		t.Errorf("the move answered %s, want a count of 2", r.body)
	}
	if got := s.mailbox("Archive").Total; got != 2 {
		t.Errorf("Archive holds %d messages", got)
	}
}
