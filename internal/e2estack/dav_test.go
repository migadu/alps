package main

import (
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav"
	"github.com/emersion/go-webdav/caldav"
	"github.com/emersion/go-webdav/carddav"
)

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

var davTestPasswords = map[string]string{
	"a@example.test": "a-password",
	"b@example.test": "b-password",
}

// davTestServer serves the DAV handler to the accounts in davTestPasswords.
// Their passwords are taken as already checked: there is no IMAP server here
// to ask.
func davTestServer(t *testing.T) (*httptest.Server, *davStore) {
	t.Helper()
	creds := newCredentials("127.0.0.1:0")
	for user, pass := range davTestPasswords {
		creds.cache[sha256.Sum256([]byte(user+"\x00"+pass))] = time.Now().Add(time.Hour)
	}
	store := newDAVStore()
	srv := httptest.NewServer(davHandler(creds, store))
	t.Cleanup(srv.Close)
	return srv, store
}

func calendarHome(user string) string {
	return calDAVPrefix + "/" + user + "/calendars/"
}

// davDo sends one request as user and returns the status it was answered with.
func davDo(t *testing.T, srv *httptest.Server, user, method, p, contentType, body string) int {
	t.Helper()
	req, err := http.NewRequest(method, srv.URL+p, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	req.SetBasicAuth(user, davTestPasswords[user])
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	resp, err := srv.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	_, _ = io.Copy(io.Discard, resp.Body)
	resp.Body.Close()
	return resp.StatusCode
}

// mkcalendarBody is the MKCALENDAR request alps's caldav plugin sends.
func mkcalendarBody(name string, components ...string) string {
	var comps string
	if len(components) > 0 {
		comps = "\n      <C:supported-calendar-component-set>"
		for _, comp := range components {
			comps += `<C:comp name="` + comp + `"/>`
		}
		comps += "</C:supported-calendar-component-set>"
	}
	return `<?xml version="1.0" encoding="utf-8" ?>
<C:mkcalendar xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:set>
    <D:prop>
      <D:displayname>` + name + `</D:displayname>` + comps + `
    </D:prop>
  </D:set>
</C:mkcalendar>`
}

// renameBody is the PROPPATCH alps's caldav plugin sends to rename a calendar.
func renameBody(name string) string {
	return `<?xml version="1.0" encoding="utf-8" ?>
<D:propertyupdate xmlns:D="DAV:">
  <D:set>
    <D:prop>
      <D:displayname>` + name + `</D:displayname>
    </D:prop>
  </D:set>
</D:propertyupdate>`
}

func eventBody(uid string) string {
	return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//alps//e2e//EN\r\nBEGIN:VEVENT\r\nUID:" + uid +
		"\r\nDTSTAMP:20260101T000000Z\r\nDTSTART:20260616T090000Z\r\nSUMMARY:" + uid + "\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
}

// calendarsOf is what alps reads: the calendars go-webdav's client finds in
// the account's home set, as "name [components] path" lines.
func calendarsOf(t *testing.T, srv *httptest.Server, user string) []string {
	t.Helper()
	c, err := caldav.NewClient(webdav.HTTPClientWithBasicAuth(srv.Client(), user, davTestPasswords[user]), srv.URL+calDAVPrefix+"/")
	if err != nil {
		t.Fatal(err)
	}
	cals, err := c.FindCalendars(context.Background(), calendarHome(user))
	if err != nil {
		t.Fatalf("FindCalendars: %v", err)
	}
	var out []string
	for _, cal := range cals {
		out = append(out, fmt.Sprintf("%s %v %s", cal.Name, cal.SupportedComponentSet, cal.Path))
	}
	return out
}

func sameLines(t *testing.T, what string, got, want []string) {
	t.Helper()
	if strings.Join(got, "\n") != strings.Join(want, "\n") {
		t.Fatalf("%s:\n  got  %q\n  want %q", what, got, want)
	}
}

// The browser tests make, rename and delete calendars from the Calendar page.
// These are the requests the caldav plugin sends for each, answered as a
// CalDAV server answers them, and the listing alps reads after each.
func TestCalendarsAreMadeRenamedAndDeleted(t *testing.T) {
	srv, _ := davTestServer(t)
	const user = "a@example.test"
	home := calendarHome(user)
	const xmlType = "application/xml; charset=utf-8"

	sameLines(t, "a new account's calendars", calendarsOf(t, srv, user), []string{
		"Calendar [VEVENT VTODO] " + home + "default/",
	})

	if got := davDo(t, srv, user, "MKCALENDAR", home+"trips/", xmlType, mkcalendarBody("Trips")); got != http.StatusCreated {
		t.Fatalf("MKCALENDAR: got %d, want 201", got)
	}
	if got := davDo(t, srv, user, "MKCALENDAR", home+"chores/", xmlType, mkcalendarBody("Chores", "VTODO")); got != http.StatusCreated {
		t.Fatalf("MKCALENDAR of a task list: got %d, want 201", got)
	}
	// In the order they were made, the account's own first. Given no
	// components, a calendar takes what the account's own does.
	sameLines(t, "after two were made", calendarsOf(t, srv, user), []string{
		"Calendar [VEVENT VTODO] " + home + "default/",
		"Trips [VEVENT VTODO] " + home + "trips/",
		"Chores [VTODO] " + home + "chores/",
	})

	if got := davDo(t, srv, user, http.MethodPut, home+"trips/flight.ics", "text/calendar", eventBody("flight")); got != http.StatusCreated {
		t.Fatalf("PUT into a calendar made: got %d, want 201", got)
	}
	if got := davDo(t, srv, user, http.MethodGet, home+"trips/flight.ics", "", ""); got != http.StatusOK {
		t.Fatalf("GET of its event: got %d, want 200", got)
	}

	if got := davDo(t, srv, user, "PROPPATCH", home+"trips/", xmlType, renameBody("Journeys")); got != http.StatusMultiStatus {
		t.Fatalf("PROPPATCH of the display name: got %d, want 207", got)
	}
	if got := davDo(t, srv, user, "PROPPATCH", home+"default/", xmlType, renameBody("Mine")); got != http.StatusMultiStatus {
		t.Fatalf("PROPPATCH of the account's own calendar: got %d, want 207", got)
	}
	sameLines(t, "after the renames", calendarsOf(t, srv, user), []string{
		"Mine [VEVENT VTODO] " + home + "default/",
		"Journeys [VEVENT VTODO] " + home + "trips/",
		"Chores [VTODO] " + home + "chores/",
	})

	if got := davDo(t, srv, user, http.MethodDelete, home+"trips/", "", ""); got != http.StatusNoContent {
		t.Fatalf("DELETE of a calendar made: got %d, want 204", got)
	}
	sameLines(t, "after the delete", calendarsOf(t, srv, user), []string{
		"Mine [VEVENT VTODO] " + home + "default/",
		"Chores [VTODO] " + home + "chores/",
	})
	// Its events went with it, and nothing can be filed into it any more.
	if got := davDo(t, srv, user, http.MethodGet, home+"trips/flight.ics", "", ""); got != http.StatusNotFound {
		t.Fatalf("GET of the deleted calendar's event: got %d, want 404", got)
	}
	if got := davDo(t, srv, user, http.MethodPut, home+"trips/later.ics", "text/calendar", eventBody("later")); got != http.StatusConflict {
		t.Fatalf("PUT into the deleted calendar: got %d, want 409", got)
	}
}

func TestCalendarRequestsRefused(t *testing.T) {
	srv, _ := davTestServer(t)
	const a, b = "a@example.test", "b@example.test"
	home := calendarHome(a)
	const xmlType = "application/xml; charset=utf-8"
	if got := davDo(t, srv, b, "MKCALENDAR", calendarHome(b)+"theirs/", xmlType, mkcalendarBody("Theirs")); got != http.StatusCreated {
		t.Fatalf("MKCALENDAR for b: got %d, want 201", got)
	}

	for _, c := range []struct {
		what, method, path, body string
		want                     int
	}{
		{"MKCALENDAR where a calendar is", "MKCALENDAR", home + "default/", mkcalendarBody("Again"), http.StatusMethodNotAllowed},
		{"MKCALENDAR inside a calendar", "MKCALENDAR", home + "default/inner/", mkcalendarBody("Inner"), http.StatusForbidden},
		{"MKCALENDAR outside the home set", "MKCALENDAR", calDAVPrefix + "/" + a + "/elsewhere/", mkcalendarBody("Elsewhere"), http.StatusForbidden},
		{"MKCALENDAR in another account's home set", "MKCALENDAR", calendarHome(b) + "mine/", mkcalendarBody("Mine"), http.StatusForbidden},
		{"MKCALENDAR with a body that is not XML", "MKCALENDAR", home + "broken/", "<C:mkcalendar", http.StatusBadRequest},
		{"PROPPATCH of a calendar never made", "PROPPATCH", home + "missing/", renameBody("Missing"), http.StatusNotFound},
		{"PROPPATCH of another account's calendar", "PROPPATCH", calendarHome(b) + "theirs/", renameBody("Mine now"), http.StatusForbidden},
		{"PROPPATCH of a property other than the name", "PROPPATCH", home + "default/", `<D:propertyupdate xmlns:D="DAV:"><D:set><D:prop><X:color xmlns:X="urn:x">red</X:color></D:prop></D:set></D:propertyupdate>`, http.StatusForbidden},
		{"PROPPATCH removing the name", "PROPPATCH", home + "default/", `<D:propertyupdate xmlns:D="DAV:"><D:remove><D:prop><D:displayname/></D:prop></D:remove></D:propertyupdate>`, http.StatusForbidden},
		{"DELETE of the account's own calendar", http.MethodDelete, home + "default/", "", http.StatusForbidden},
		{"DELETE of a calendar never made", http.MethodDelete, home + "missing/", "", http.StatusNotFound},
		{"DELETE of another account's calendar", http.MethodDelete, calendarHome(b) + "theirs/", "", http.StatusForbidden},
	} {
		contentType := ""
		if c.body != "" {
			contentType = xmlType
		}
		if got := davDo(t, srv, a, c.method, c.path, contentType, c.body); got != c.want {
			t.Errorf("%s: got %d, want %d", c.what, got, c.want)
		}
	}

	sameLines(t, "a's calendars", calendarsOf(t, srv, a), []string{
		"Calendar [VEVENT VTODO] " + home + "default/",
	})
	sameLines(t, "b's calendars", calendarsOf(t, srv, b), []string{
		"Calendar [VEVENT VTODO] " + calendarHome(b) + "default/",
		"Theirs [VEVENT VTODO] " + calendarHome(b) + "theirs/",
	})
}

// A browser test that resets the account starts again from the account's own
// calendar, under its first name and empty, with nothing it made beside it.
func TestResetDropsTheCalendarsMade(t *testing.T) {
	srv, store := davTestServer(t)
	const a, b = "a@example.test", "b@example.test"
	const xmlType = "application/xml; charset=utf-8"
	for _, user := range []string{a, b} {
		if got := davDo(t, srv, user, "MKCALENDAR", calendarHome(user)+"trips/", xmlType, mkcalendarBody("Trips")); got != http.StatusCreated {
			t.Fatalf("MKCALENDAR for %s: got %d, want 201", user, got)
		}
	}
	if got := davDo(t, srv, a, "PROPPATCH", calendarHome(a)+"default/", xmlType, renameBody("Mine")); got != http.StatusMultiStatus {
		t.Fatalf("PROPPATCH: got %d, want 207", got)
	}
	if got := davDo(t, srv, a, http.MethodPut, calendarHome(a)+"default/seeded.ics", "text/calendar", eventBody("seeded")); got != http.StatusCreated {
		t.Fatalf("PUT: got %d, want 201", got)
	}

	store.dropUser(a)

	sameLines(t, "a's calendars after the reset", calendarsOf(t, srv, a), []string{
		"Calendar [VEVENT VTODO] " + calendarHome(a) + "default/",
	})
	if got := davDo(t, srv, a, http.MethodGet, calendarHome(a)+"default/seeded.ics", "", ""); got != http.StatusNotFound {
		t.Fatalf("GET of an event from before the reset: got %d, want 404", got)
	}
	sameLines(t, "b's calendars", calendarsOf(t, srv, b), []string{
		"Calendar [VEVENT VTODO] " + calendarHome(b) + "default/",
		"Trips [VEVENT VTODO] " + calendarHome(b) + "trips/",
	})
}

// vcardBody is a contact with a name and any number of addresses.
func vcardBody(uid, name string, emails ...string) string {
	body := "BEGIN:VCARD\r\nVERSION:3.0\r\nUID:" + uid + "\r\nFN:" + name + "\r\n"
	for _, email := range emails {
		body += "EMAIL:" + email + "\r\n"
	}
	return body + "END:VCARD\r\n"
}

// alps's contacts search asks for the cards whose name or any address holds
// the text, and a CardDAV server compares text in any case unless the query
// names another collation (RFC 6352, section 8.3). The stack compared the
// first address alone, case by case, so a card was found by its second
// address only when its name held the text too.
func TestAddressBookQueryMatchesEveryAddressInAnyCase(t *testing.T) {
	srv, _ := davTestServer(t)
	const user = "a@example.test"
	book := cardDAVPrefix + "/" + user + "/contacts/default/"
	for uid, card := range map[string]string{
		"other":    vcardBody("other", "Other Person", "other@remote.test", "Bob@Remote.Test"),
		"superbob": vcardBody("superbob", "Super", "superbob@remote.test"),
		"ada":      vcardBody("ada", "Ada Lovelace", "ada@example.test"),
	} {
		if got := davDo(t, srv, user, http.MethodPut, book+uid+".vcf", "text/vcard", card); got != http.StatusCreated {
			t.Fatalf("PUT %s: got %d, want 201", uid, got)
		}
	}
	c, err := carddav.NewClient(webdav.HTTPClientWithBasicAuth(srv.Client(), user, davTestPasswords[user]), srv.URL+cardDAVPrefix+"/")
	if err != nil {
		t.Fatal(err)
	}
	found := func(query *carddav.AddressBookQuery) []string {
		t.Helper()
		aos, err := c.QueryAddressBook(context.Background(), book, query)
		if err != nil {
			t.Fatalf("QueryAddressBook: %v", err)
		}
		var uids []string
		for _, ao := range aos {
			uids = append(uids, strings.TrimSuffix(path.Base(ao.Path), ".vcf"))
		}
		sort.Strings(uids)
		return uids
	}
	// What alps's search sends: the name or any address holding the text.
	search := func(text string, match carddav.MatchType) *carddav.AddressBookQuery {
		return &carddav.AddressBookQuery{PropFilters: []carddav.PropFilter{
			{Name: vcard.FieldFormattedName, TextMatches: []carddav.TextMatch{{Text: text, MatchType: match}}},
			{Name: vcard.FieldEmail, TextMatches: []carddav.TextMatch{{Text: text, MatchType: match}}},
		}}
	}

	sameLines(t, "a second address, in another case", found(search("bob@remote.test", "")), []string{"other", "superbob"})
	sameLines(t, "a name, in another case", found(search("LOVELACE", "")), []string{"ada"})
	sameLines(t, "a whole address, in another case", found(search("BOB@remote.test", carddav.MatchEquals)), []string{"other"})

	// What alps's duplicate check sends: every card with an address, its
	// addresses alone, every one of them.
	aos, err := c.QueryAddressBook(context.Background(), book, &carddav.AddressBookQuery{
		DataRequest: carddav.AddressDataRequest{Props: []string{vcard.FieldEmail}},
		PropFilters: []carddav.PropFilter{{Name: vcard.FieldEmail}},
	})
	if err != nil {
		t.Fatalf("QueryAddressBook: %v", err)
	}
	var addresses []string
	for _, ao := range aos {
		if ao.Card.Value(vcard.FieldFormattedName) != "" {
			t.Errorf("%s: the name came back, asked for its addresses alone", ao.Path)
		}
		for _, field := range ao.Card[vcard.FieldEmail] {
			addresses = append(addresses, field.Value)
		}
	}
	sort.Strings(addresses)
	sameLines(t, "the addresses", addresses, []string{"Bob@Remote.Test", "ada@example.test", "other@remote.test", "superbob@remote.test"})
}
