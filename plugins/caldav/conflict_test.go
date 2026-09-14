package alpscaldav

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-webdav"
	"github.com/emersion/go-webdav/caldav"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	_ "github.com/migadu/alps/plugins/base"
	"github.com/migadu/alps/provider/maildir"
)

// These run the real server, with this plugin pointed at go-webdav's own
// CalDAV server over storage in memory, and talk to it over HTTP the way the
// frontend does.

const (
	testUser     = "ada@example.com"
	testPassword = "correct horse"
	testHome     = "/ada/calendars/"
	testCalendar = "/ada/calendars/work/"
)

// memCalendars stores objects the way a CalDAV server versions them: every
// write gets a new ETag, and a PUT carrying If-Match is refused with 412 unless
// it names the stored version.
type memCalendars struct {
	mu      sync.Mutex
	version int
	objects map[string]caldav.CalendarObject
	// ifMatch records the If-Match of every PUT, in order.
	ifMatch []string
	// beforePut, when set, runs inside each PUT before its precondition is
	// checked: another device saving in the instant between alps's read and
	// its write.
	beforePut func()
	// withholdETag answers PUTs with no ETag, as RFC 4791 lets a server do
	// when it stored something other than what it was sent.
	withholdETag bool
	// calendars replaces the one "Work" calendar, when set.
	calendars []caldav.Calendar
	// queried records every collection a REPORT asked about.
	queried []string
}

func (b *memCalendars) CurrentUserPrincipal(context.Context) (string, error) { return "/ada/", nil }
func (b *memCalendars) CalendarHomeSetPath(context.Context) (string, error)  { return testHome, nil }

func (b *memCalendars) CreateCalendar(context.Context, *caldav.Calendar) error {
	return webdav.NewHTTPError(http.StatusForbidden, nil)
}

func (b *memCalendars) ListCalendars(context.Context) ([]caldav.Calendar, error) {
	if b.calendars != nil {
		return b.calendars, nil
	}
	return []caldav.Calendar{{Path: testCalendar, Name: "Work", SupportedComponentSet: []string{"VEVENT", "VTODO"}}}, nil
}

func (b *memCalendars) GetCalendar(ctx context.Context, p string) (*caldav.Calendar, error) {
	cals, _ := b.ListCalendars(ctx)
	for _, cal := range cals {
		if path.Clean(cal.Path) == path.Clean(p) {
			return &cal, nil
		}
	}
	return nil, webdav.NewHTTPError(http.StatusNotFound, nil)
}

func (b *memCalendars) GetCalendarObject(_ context.Context, p string, _ *caldav.CalendarCompRequest) (*caldav.CalendarObject, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	co, ok := b.objects[p]
	if !ok {
		return nil, webdav.NewHTTPError(http.StatusNotFound, nil)
	}
	return &co, nil
}

func (b *memCalendars) ListCalendarObjects(_ context.Context, p string, _ *caldav.CalendarCompRequest) ([]caldav.CalendarObject, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	var out []caldav.CalendarObject
	for key, co := range b.objects {
		if strings.HasPrefix(key, p) {
			out = append(out, co)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Path < out[j].Path })
	return out, nil
}

func (b *memCalendars) QueryCalendarObjects(ctx context.Context, p string, query *caldav.CalendarQuery) ([]caldav.CalendarObject, error) {
	b.mu.Lock()
	b.queried = append(b.queried, p)
	b.mu.Unlock()
	all, err := b.ListCalendarObjects(ctx, p, nil)
	if err != nil {
		return nil, err
	}
	return caldav.Filter(query, all)
}

func (b *memCalendars) PutCalendarObject(_ context.Context, p string, cal *ical.Calendar, opts *caldav.PutCalendarObjectOptions) (*caldav.CalendarObject, error) {
	if b.beforePut != nil {
		b.beforePut()
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	b.ifMatch = append(b.ifMatch, string(opts.IfMatch))
	current, exists := b.objects[p]
	if opts.IfMatch.IsSet() {
		if ok, err := opts.IfMatch.MatchETag(current.ETag); err != nil || !exists || !ok {
			return nil, webdav.NewHTTPError(http.StatusPreconditionFailed, nil)
		}
	}
	co := b.store(p, cal)
	if b.withholdETag {
		co.ETag = ""
	}
	return &co, nil
}

func (b *memCalendars) DeleteCalendarObject(_ context.Context, p string) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.objects, p)
	return nil
}

// store writes unconditionally; the caller holds the lock.
func (b *memCalendars) store(p string, cal *ical.Calendar) caldav.CalendarObject {
	b.version++
	co := caldav.CalendarObject{Path: p, ModTime: time.Now(), ETag: fmt.Sprintf("v%d", b.version), Data: cal}
	b.objects[p] = co
	return co
}

// save is another client writing: no precondition, a new version.
func (b *memCalendars) save(p string, cal *ical.Calendar) string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.store(p, cal).ETag
}

func (b *memCalendars) get(t *testing.T, p string) caldav.CalendarObject {
	t.Helper()
	b.mu.Lock()
	defer b.mu.Unlock()
	co, ok := b.objects[p]
	if !ok {
		t.Fatalf("no object at %s", p)
	}
	return co
}

func eventCalendar(uid, summary string) *ical.Calendar {
	event := ical.NewEvent()
	event.Props.SetText(ical.PropUID, uid)
	event.Props.SetText(ical.PropSummary, summary)
	event.Props.SetDateTime(ical.PropDateTimeStamp, time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC))
	event.Props.SetDateTime(ical.PropDateTimeStart, time.Date(2026, 9, 14, 9, 0, 0, 0, time.UTC))
	event.Props.SetDateTime(ical.PropDateTimeEnd, time.Date(2026, 9, 14, 10, 0, 0, 0, time.UTC))
	cal := ical.NewCalendar()
	cal.Props.SetText(ical.PropProductID, "-//phone//EN")
	cal.Props.SetText(ical.PropVersion, "2.0")
	cal.Children = append(cal.Children, event.Component)
	return cal
}

func summaryOf(t *testing.T, co caldav.CalendarObject) string {
	t.Helper()
	events := co.Data.Events()
	if len(events) != 1 {
		t.Fatalf("%s holds %d events", co.Path, len(events))
	}
	s, _ := events[0].Props.Text(ical.PropSummary)
	return s
}

type harness struct {
	t      *testing.T
	url    string
	client *http.Client
	dav    *memCalendars
	// mailDir is the user's maildir.
	mailDir string
}

type harnessOptions struct {
	// smtp is the submission server; none reachable when empty.
	smtp string
	// wrap stands in front of the CalDAV server, to say or record what
	// go-webdav's own handler does not.
	wrap func(http.Handler) http.Handler
}

func newHarness(t *testing.T) *harness {
	return startHarness(t, harnessOptions{})
}

// testNow is when the tests run, as far as the plugin can tell: the Monday
// before the meetings they arrange, whatever the machine's clock says.
var testNow = time.Date(2026, 9, 14, 12, 0, 0, 0, time.UTC)

func startHarness(t *testing.T, o harnessOptions) *harness {
	t.Helper()
	clock = func() time.Time { return testNow }
	t.Cleanup(func() { clock = time.Now })
	dav := &memCalendars{objects: map[string]caldav.CalendarObject{}}
	var handler http.Handler = &caldav.Handler{Backend: dav}
	if o.wrap != nil {
		handler = o.wrap(handler)
	}
	davServer := httptest.NewServer(handler)
	t.Cleanup(davServer.Close)
	if o.smtp == "" {
		o.smtp = "smtp://127.0.0.1:1"
	}

	base := t.TempDir()
	passwd := filepath.Join(base, "passwd")
	if err := os.WriteFile(passwd, []byte(testUser+":{PLAIN}"+testPassword+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	mailDir := filepath.Join(base, "ada")
	if err := maildir.NewProvider(mailDir, testUser).CreateMailbox("INBOX"); err != nil {
		t.Fatal(err)
	}
	var key fernet.Key
	if err := key.Generate(); err != nil {
		t.Fatal(err)
	}
	opts := &alps.Options{
		Provider: alps.ProviderOptions{
			Type:    "maildir",
			IMAP:    alps.IMAPProviderOptions{Server: "imap://127.0.0.1:1"},
			Maildir: alps.MaildirProviderOptions{Path: filepath.Join(base, "%u"), AuthPasswdFile: passwd},
		},
		SMTP:     alps.SMTPOptions{Server: o.smtp},
		LoginKey: &key,
		Plugins:  map[string]alps.PluginConfig{"caldav": {Server: davServer.URL}},
	}
	srv, err := alps.New(alps.NewLogger(), opts)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv)
	t.Cleanup(func() {
		ts.Close()
		srv.Close()
	})

	jar, _ := cookiejar.New(nil)
	h := &harness{t: t, url: ts.URL, client: &http.Client{Jar: jar}, dav: dav, mailDir: mailDir}
	h.expect(h.do("POST", "/session", map[string]string{"username": testUser, "password": testPassword}), http.StatusOK)
	return h
}

type response struct {
	status int
	body   []byte
}

func (h *harness) do(method, p string, body any) response {
	h.t.Helper()
	var reader io.Reader
	if body != nil {
		data, err := json.Marshal(body)
		if err != nil {
			h.t.Fatal(err)
		}
		reader = bytes.NewReader(data)
	}
	req, err := http.NewRequest(method, h.url+p, reader)
	if err != nil {
		h.t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if method != http.MethodGet {
		req.Header.Set("Origin", h.url)
	}
	res, err := h.client.Do(req)
	if err != nil {
		h.t.Fatal(err)
	}
	defer res.Body.Close()
	data, _ := io.ReadAll(res.Body)
	return response{status: res.StatusCode, body: data}
}

func (h *harness) expect(r response, status int) {
	h.t.Helper()
	if r.status != status {
		h.t.Fatalf("status %d, want %d: %s", r.status, status, r.body)
	}
}

func (h *harness) decode(r response, v any) {
	h.t.Helper()
	if err := json.Unmarshal(r.body, v); err != nil {
		h.t.Fatalf("decoding %q: %v", r.body, err)
	}
}

// pathParam encodes an object path as the frontend's encodePathParam does.
func pathParam(p string) string {
	return url.PathEscape(url.PathEscape(p))
}

// listed is the event as the calendar page loaded it.
func (h *harness) listed(objectPath string) EventData {
	h.t.Helper()
	r := h.do("GET", "/calendar/events?start=2026-09-01T00:00:00Z&end=2026-10-01T00:00:00Z", nil)
	h.expect(r, http.StatusOK)
	var page struct{ Events []EventData }
	h.decode(r, &page)
	for _, ev := range page.Events {
		if ev.Path == objectPath {
			return ev
		}
	}
	h.t.Fatalf("%s is not listed in %s", objectPath, r.body)
	return EventData{}
}

func (h *harness) saveEvent(ev EventData, summary string) response {
	h.t.Helper()
	ev.Summary = summary
	return h.do("POST", "/calendar/events/"+pathParam(ev.Path)+"/edit", ev)
}

func TestEventSaveRefusedWhenChangedElsewhere(t *testing.T) {
	h := newHarness(t)
	objectPath := testCalendar + "standup.ics"
	h.dav.save(objectPath, eventCalendar("standup", "Standup"))

	opened := h.listed(objectPath)
	if opened.ETag == "" {
		t.Fatal("the listing carries no version to save against")
	}

	// The phone renames it while the editor here is open.
	h.dav.save(objectPath, eventCalendar("standup", "Standup (moved to Zoom)"))

	h.expect(h.saveEvent(opened, "Daily standup"), http.StatusPreconditionFailed)
	if got := summaryOf(t, h.dav.get(t, objectPath)); got != "Standup (moved to Zoom)" {
		t.Fatalf("the phone's change was overwritten: summary is %q", got)
	}

	// Reopened, the same edit goes through, and says which version it wrote.
	reopened := h.listed(objectPath)
	r := h.saveEvent(reopened, "Daily standup")
	h.expect(r, http.StatusOK)
	var saved struct{ Path, ETag string }
	h.decode(r, &saved)
	stored := h.dav.get(t, objectPath)
	if summaryOf(t, stored) != "Daily standup" || saved.ETag != stored.ETag {
		t.Fatalf("saved %q as %q, stored %q as %q", "Daily standup", saved.ETag, summaryOf(t, stored), stored.ETag)
	}
}

// The comparison with the editor's version covers the time it was open; only
// If-Match covers the instant between alps's own read and its write.
func TestEventSaveCarriesIfMatch(t *testing.T) {
	h := newHarness(t)
	objectPath := testCalendar + "standup.ics"
	h.dav.save(objectPath, eventCalendar("standup", "Standup"))
	opened := h.listed(objectPath)

	once := sync.Once{}
	h.dav.beforePut = func() {
		once.Do(func() { h.dav.save(objectPath, eventCalendar("standup", "Renamed on the phone")) })
	}

	h.expect(h.saveEvent(opened, "Daily standup"), http.StatusPreconditionFailed)
	if got := summaryOf(t, h.dav.get(t, objectPath)); got != "Renamed on the phone" {
		t.Fatalf("summary is %q", got)
	}
	if len(h.dav.ifMatch) != 1 || h.dav.ifMatch[0] != `"`+opened.ETag+`"` {
		t.Fatalf("PUT preconditions %q, want one If-Match on %q", h.dav.ifMatch, opened.ETag)
	}
}

// A page loaded before this change sends no version. Its save still works, and
// is still guarded between alps's read and write.
func TestEventSaveWithoutVersion(t *testing.T) {
	h := newHarness(t)
	objectPath := testCalendar + "standup.ics"
	h.dav.save(objectPath, eventCalendar("standup", "Standup"))
	ev := h.listed(objectPath)
	stale := ev.ETag
	ev.ETag = ""
	h.dav.save(objectPath, eventCalendar("standup", "Renamed on the phone"))

	h.expect(h.saveEvent(ev, "Daily standup"), http.StatusOK)
	if len(h.dav.ifMatch) != 1 || h.dav.ifMatch[0] == "" || h.dav.ifMatch[0] == `"`+stale+`"` {
		t.Fatalf("PUT preconditions %q, want If-Match on the version just read", h.dav.ifMatch)
	}
}

// A server may answer a PUT without an ETag. The version is then read back, so
// the editor's next save still has one to be checked against.
func TestEventSaveReadsBackAWithheldETag(t *testing.T) {
	h := newHarness(t)
	objectPath := testCalendar + "standup.ics"
	h.dav.save(objectPath, eventCalendar("standup", "Standup"))
	opened := h.listed(objectPath)
	h.dav.withholdETag = true

	r := h.saveEvent(opened, "Daily standup")
	h.expect(r, http.StatusOK)
	var saved struct{ ETag string }
	h.decode(r, &saved)
	if stored := h.dav.get(t, objectPath).ETag; saved.ETag != stored {
		t.Fatalf("returned version %q, stored %q", saved.ETag, stored)
	}
}
