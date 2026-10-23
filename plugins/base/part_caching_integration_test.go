package alpsbase

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/emersion/go-imap/v2"
)

// A listing/status which detects renumbering must invalidate the validator
// before /raw's early revalidation check can confirm an old browser copy.
func TestHTTP_RawPartRevalidationAfterObservedRenumbering(t *testing.T) {
	for _, discover := range []string{"/mailboxes/Work/status", "/mailboxes/Work?page=0&refresh=true", "/mailboxes/INBOX?page=0&refresh=true"} {
		for _, pages := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s/pages=%t", discover, pages), func(t *testing.T) {
				ps := newPartsServer(t, testUser)
				if err := ps.users[testUser].Create(context.Background(), "Work", nil); err != nil {
					t.Fatal(err)
				}
				ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
				ps.deliver(testUser, "Work", withPhoto("iVBORw0KGgpvbGQ="))
				ps.login()
				const part = "/mailboxes/Work/messages/1/raw?part=2"
				old := ps.do("GET", part, nil)
				ps.expect(old, http.StatusOK)
				etag := old.header.Get("ETag")
				if etag == "" {
					t.Fatal("no ETag")
				}
				if pages {
					ps.expect(ps.do("GET", "/mailboxes/Work?page=0", nil), http.StatusOK)
				} else {
					// Only the raw validator and bodies survive; no page/status baseline.
					ps.forget("status:Work")
				}
				ps.remakeWork("New message.")
				ps.expect(ps.do("GET", discover, nil), http.StatusOK)
				renewed := ps.do("GET", part, nil, "If-None-Match", etag)
				ps.expect(renewed, http.StatusOK)
				if string(renewed.body) != "\x89PNG\r\n\x1a\nnew" || renewed.header.Get("ETag") == etag {
					t.Fatalf("revalidated old part: body %q, ETag %q", renewed.body, renewed.header.Get("ETag"))
				}
				// The new validator stays cheap after the repaired read.
				before := ps.commands.snapshot()
				ps.expect(ps.do("GET", part, nil, "If-None-Match", renewed.header.Get("ETag")), http.StatusNotModified)
				if commands := ps.commands.since(before); len(commands) != 0 {
					t.Fatalf("warm revalidation issued commands: %v", commands)
				}
			})
		}
	}
}

// On a server with LIST-EXTENDED and without LIST-STATUS, the folder list
// reads the counts of subscribed folders only, and forgets those the session
// held of the others. An unsubscribed folder's validator was then left with
// nothing to be checked against: after a refresh, a part of the folder made
// again elsewhere was confirmed to the browser with a 304, and the old photo
// was shown for the new message.
func TestHTTP_AnUnsubscribedFolderMadeAgainIsNotConfirmed(t *testing.T) {
	ps := newPartsServerWith(t, imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapListExtended: {}}, testUser)
	if err := ps.users[testUser].Create(context.Background(), "Work", nil); err != nil {
		t.Fatal(err)
	}
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
	ps.deliver(testUser, "Work", withPhoto("iVBORw0KGgpvbGQ="))
	ps.login()
	const part = "/mailboxes/Work/messages/1/raw?part=2"
	old := ps.do("GET", part, nil)
	ps.expect(old, http.StatusOK)
	etag := old.header.Get("ETag")
	if etag == "" {
		t.Fatal("no ETag")
	}

	ps.remakeWork("New message.")
	ps.expect(ps.do("GET", "/mailboxes/INBOX?page=0&refresh=true", nil), http.StatusOK)

	renewed := ps.do("GET", part, nil, "If-None-Match", etag)
	if renewed.status != http.StatusOK || string(renewed.body) != "\x89PNG\r\n\x1a\nnew" {
		t.Fatalf("the part of the folder made again answered %d %q, want the new photo", renewed.status, renewed.body)
	}
}

// A folder made again elsewhere is noticed when it is opened, page or no
// page: its new counts are read then, under a new UIDVALIDITY. Without a page
// held, only a refresh compared them with what the session held, and a
// conversation read from the old folder went on answering for the new
// folder's message under the same UID.
func TestHTTP_AFolderMadeAgainIsNoticedWhenOpened(t *testing.T) {
	ps := newPartsServer(t, testUser)
	if err := ps.users[testUser].Create(context.Background(), "Work", nil); err != nil {
		t.Fatal(err)
	}
	ps.deliver(testUser, "INBOX", withPhoto("iVBORw0KGgphZGE="))
	ps.deliver(testUser, "Work", strings.Replace(withPhoto("iVBORw0KGgpvbGQ="), "Subject: Photo", "Subject: Old photo", 1))
	ps.login()
	ps.expect(ps.do("GET", "/mailboxes/Work/messages/1/raw?part=2", nil), http.StatusOK)
	if got := threadOf(t, ps.testServer, "Work", "1").Messages; len(got) != 1 || got[0].Envelope.Subject != "Old photo" {
		t.Fatalf("the conversation of UID 1 is %+v, want the old photo", got)
	}

	// The counts the folder was read at have gone, as they do on their own.
	ps.forget("status:Work")
	ps.remakeWork("New message.")
	ps.expect(ps.do("GET", "/mailboxes/Work?page=0", nil), http.StatusOK)

	if got := threadOf(t, ps.testServer, "Work", "1").Messages; len(got) != 1 || got[0].Envelope.Subject != "Photo" {
		t.Errorf("the conversation of UID 1 in the folder made again is %+v, want its new message", got)
	}
}
