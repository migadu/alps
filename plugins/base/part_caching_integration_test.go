package alpsbase

import (
	"context"
	"fmt"
	"net/http"
	"testing"
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
