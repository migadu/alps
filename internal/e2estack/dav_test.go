package main

import (
	"context"
	"fmt"
	"net/http"
	"testing"

	"github.com/emersion/go-webdav"
)

// statusOf reads the status go-webdav will answer with. Its error type is
// internal to the module; the message is the only exported view of the code.
func statusOf(err error) int {
	var code int
	if err != nil {
		fmt.Sscanf(err.Error(), "%d", &code)
	}
	return code
}

// The browser tests rely on these answers to see alps handle a conflicting
// edit; a store that accepted every write would hide that path entirely.
func TestDAVStorePreconditions(t *testing.T) {
	s := newDAVStore()
	const p = "/caldav/a@example.test/calendars/default/x.ics"

	first, err := s.put(p, []byte("one"), "*", "")
	if err != nil {
		t.Fatalf("create with If-None-Match: *: %v", err)
	}
	if _, err := s.put(p, []byte("two"), "*", ""); statusOf(err) != http.StatusPreconditionFailed {
		t.Fatalf("second create: got %v, want 412", err)
	}
	if _, err := s.put(p, []byte("two"), "", `"stale"`); statusOf(err) != http.StatusPreconditionFailed {
		t.Fatalf("stale If-Match: got %v, want 412", err)
	}
	second, err := s.put(p, []byte("two"), "", webdav.ConditionalMatch(`"`+first.etag+`"`))
	if err != nil {
		t.Fatalf("current If-Match: %v", err)
	}
	if second.etag == first.etag {
		t.Fatal("an update kept the old etag")
	}
	if _, err := s.put(p+".missing", []byte("x"), "", "*"); statusOf(err) != http.StatusPreconditionFailed {
		t.Fatalf("If-Match: * on a missing object: got %v, want 412", err)
	}
}

func TestDAVStoreListIsDirectChildrenOnly(t *testing.T) {
	s := newDAVStore()
	for _, p := range []string{
		"/caldav/a@example.test/calendars/default/b.ics",
		"/caldav/a@example.test/calendars/default/a.ics",
		"/caldav/a@example.test/calendars/other/c.ics",
		"/caldav/b@example.test/calendars/default/d.ics",
	} {
		if _, err := s.put(p, []byte(p), "", ""); err != nil {
			t.Fatal(err)
		}
	}
	got := s.list("/caldav/a@example.test/calendars/default/")
	want := []string{
		"/caldav/a@example.test/calendars/default/a.ics",
		"/caldav/a@example.test/calendars/default/b.ics",
	}
	if len(got) != len(want) || got[0] != want[0] || got[1] != want[1] {
		t.Fatalf("list = %v, want %v", got, want)
	}

	s.dropUser("a@example.test")
	if len(s.list("/caldav/a@example.test/calendars/default/")) != 0 {
		t.Fatal("dropUser left objects behind")
	}
	if len(s.list("/caldav/b@example.test/calendars/default/")) != 1 {
		t.Fatal("dropUser removed another account's objects")
	}
}

func TestOwnPathRefusesAnotherAccount(t *testing.T) {
	ctx := context.WithValue(context.Background(), davUserKey{}, "a@example.test")
	cases := map[string]int{
		"/caldav/a@example.test/calendars/default/x.ics":           0,
		"/caldav/b@example.test/calendars/default/x.ics":           http.StatusForbidden,
		"/caldav/a@example.test.evil/calendars/default/x.ics":      http.StatusForbidden,
		"/caldav/a@example.test/../b@example.test/calendars/x.ics": http.StatusForbidden,
	}
	for p, want := range cases {
		if got := statusOf(ownPath(ctx, calDAVPrefix, p)); got != want {
			t.Errorf("ownPath(%q) = %d, want %d", p, got, want)
		}
	}
	if got := statusOf(ownPath(context.Background(), calDAVPrefix, "/caldav/a@example.test/x")); got != http.StatusUnauthorized {
		t.Errorf("unauthenticated ownPath = %d, want 401", got)
	}
}

func TestUnder(t *testing.T) {
	for p, want := range map[string]bool{
		"/caldav":      true,
		"/caldav/":     true,
		"/caldav/a/b":  true,
		"/caldavx":     false,
		"/carddav/a/b": false,
	} {
		if got := under(p, calDAVPrefix); got != want {
			t.Errorf("under(%q) = %v, want %v", p, got, want)
		}
	}
}
