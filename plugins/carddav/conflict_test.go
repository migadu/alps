package alpscarddav

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

	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav"
	"github.com/emersion/go-webdav/carddav"
	"github.com/fernet/fernet-go"
	"github.com/migadu/alps"
	_ "github.com/migadu/alps/plugins/base"
	"github.com/migadu/alps/provider/maildir"
)

// These run the real server, with this plugin pointed at go-webdav's own
// CardDAV server over storage in memory, and talk to it over HTTP the way the
// frontend does.

const (
	testUser     = "ada@example.com"
	testPassword = "correct horse"
	testHome     = "/ada/contacts/"
	testBook     = "/ada/contacts/default/"
)

// memBooks versions cards the way a CardDAV server does: every write gets a
// new ETag, and a PUT carrying If-Match is refused with 412 unless it names
// the stored version.
type memBooks struct {
	mu      sync.Mutex
	version int
	objects map[string]carddav.AddressObject
	// ifMatch records the If-Match of every PUT, in order.
	ifMatch []string
	// beforePut, when set, runs inside each PUT before its precondition is
	// checked: another device saving between alps's read and its write.
	beforePut func()
}

func (b *memBooks) CurrentUserPrincipal(context.Context) (string, error)   { return "/ada/", nil }
func (b *memBooks) AddressBookHomeSetPath(context.Context) (string, error) { return testHome, nil }

func (b *memBooks) ListAddressBooks(context.Context) ([]carddav.AddressBook, error) {
	return []carddav.AddressBook{{
		Path:                 testBook,
		Name:                 "Contacts",
		SupportedAddressData: []carddav.AddressDataType{{ContentType: vcard.MIMEType, Version: "4.0"}},
	}}, nil
}

func (b *memBooks) GetAddressBook(ctx context.Context, p string) (*carddav.AddressBook, error) {
	books, _ := b.ListAddressBooks(ctx)
	for _, book := range books {
		if path.Clean(book.Path) == path.Clean(p) {
			return &book, nil
		}
	}
	return nil, webdav.NewHTTPError(http.StatusNotFound, nil)
}

func (b *memBooks) CreateAddressBook(context.Context, *carddav.AddressBook) error {
	return webdav.NewHTTPError(http.StatusForbidden, nil)
}

func (b *memBooks) DeleteAddressBook(context.Context, string) error {
	return webdav.NewHTTPError(http.StatusForbidden, nil)
}

func (b *memBooks) GetAddressObject(_ context.Context, p string, _ *carddav.AddressDataRequest) (*carddav.AddressObject, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	ao, ok := b.objects[p]
	if !ok {
		return nil, webdav.NewHTTPError(http.StatusNotFound, nil)
	}
	return &ao, nil
}

func (b *memBooks) ListAddressObjects(_ context.Context, p string, _ *carddav.AddressDataRequest) ([]carddav.AddressObject, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	var out []carddav.AddressObject
	for key, ao := range b.objects {
		if strings.HasPrefix(key, p) {
			out = append(out, ao)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Path < out[j].Path })
	return out, nil
}

func (b *memBooks) QueryAddressObjects(ctx context.Context, p string, query *carddav.AddressBookQuery) ([]carddav.AddressObject, error) {
	all, err := b.ListAddressObjects(ctx, p, nil)
	if err != nil {
		return nil, err
	}
	return carddav.Filter(query, all)
}

func (b *memBooks) PutAddressObject(_ context.Context, p string, card vcard.Card, opts *carddav.PutAddressObjectOptions) (*carddav.AddressObject, error) {
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
	ao := b.store(p, card)
	return &ao, nil
}

func (b *memBooks) DeleteAddressObject(_ context.Context, p string) error {
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.objects, p)
	return nil
}

// store writes unconditionally; the caller holds the lock.
func (b *memBooks) store(p string, card vcard.Card) carddav.AddressObject {
	b.version++
	ao := carddav.AddressObject{Path: p, ModTime: time.Now(), ETag: fmt.Sprintf("v%d", b.version), Card: card}
	b.objects[p] = ao
	return ao
}

// save is another client writing: no precondition, a new version.
func (b *memBooks) save(p string, card vcard.Card) string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.store(p, card).ETag
}

func (b *memBooks) get(t *testing.T, p string) carddav.AddressObject {
	t.Helper()
	b.mu.Lock()
	defer b.mu.Unlock()
	ao, ok := b.objects[p]
	if !ok {
		t.Fatalf("no card at %s", p)
	}
	return ao
}

func grace(phone string, categories ...string) vcard.Card {
	card := vcard.Card{}
	card.SetValue(vcard.FieldVersion, "4.0")
	card.SetValue(vcard.FieldUID, "urn:uuid:grace")
	card.SetValue(vcard.FieldFormattedName, "Grace Hopper")
	card.SetValue(vcard.FieldEmail, "grace@example.com")
	card.SetValue(vcard.FieldTelephone, phone)
	if len(categories) > 0 {
		card.SetValue(vcard.FieldCategories, strings.Join(categories, ","))
	}
	return card
}

func valueOf(card vcard.Card, field string) string {
	if f := card.Preferred(field); f != nil {
		return f.Value
	}
	return ""
}

type harness struct {
	t      *testing.T
	url    string
	client *http.Client
	dav    *memBooks
}

func newHarness(t *testing.T) *harness {
	t.Helper()
	dav := &memBooks{objects: map[string]carddav.AddressObject{}}
	davServer := httptest.NewServer(&carddav.Handler{Backend: dav})
	t.Cleanup(davServer.Close)

	base := t.TempDir()
	passwd := filepath.Join(base, "passwd")
	if err := os.WriteFile(passwd, []byte(testUser+":{PLAIN}"+testPassword+"\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := maildir.NewProvider(filepath.Join(base, "ada"), testUser).CreateMailbox("INBOX"); err != nil {
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
		SMTP:     alps.SMTPOptions{Server: "smtp://127.0.0.1:1"},
		LoginKey: &key,
		Plugins:  map[string]alps.PluginConfig{"carddav": {Server: davServer.URL}},
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
	h := &harness{t: t, url: ts.URL, client: &http.Client{Jar: jar}, dav: dav}
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

// opened is the card as the contacts page shows it.
func (h *harness) opened(objectPath string) ContactData {
	h.t.Helper()
	r := h.do("GET", "/contacts/"+pathParam(objectPath), nil)
	h.expect(r, http.StatusOK)
	var contact ContactData
	h.decode(r, &contact)
	return contact
}

func TestContactSaveRefusedWhenChangedElsewhere(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("+1 555 0100"))

	// The list carries the version too, as the open card does.
	r := h.do("GET", "/contacts", nil)
	h.expect(r, http.StatusOK)
	var list struct{ Contacts []ContactData }
	h.decode(r, &list)
	if len(list.Contacts) != 1 || list.Contacts[0].ETag == "" {
		t.Fatalf("the listing carries no version: %s", r.body)
	}

	contact := h.opened(objectPath)
	h.dav.save(objectPath, grace("+1 555 0199"))

	contact.Note = "Met at the conference"
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusPreconditionFailed)
	stored := h.dav.get(t, objectPath)
	if valueOf(stored.Card, vcard.FieldTelephone) != "+1 555 0199" || valueOf(stored.Card, vcard.FieldNote) != "" {
		t.Fatalf("the phone's change was overwritten: %v", stored.Card)
	}

	reopened := h.opened(objectPath)
	reopened.Note = "Met at the conference"
	r = h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", reopened)
	h.expect(r, http.StatusOK)
	var saved struct{ ETag string }
	h.decode(r, &saved)
	stored = h.dav.get(t, objectPath)
	if valueOf(stored.Card, vcard.FieldNote) != "Met at the conference" || saved.ETag != stored.ETag {
		t.Fatalf("returned version %q, stored %q: %v", saved.ETag, stored.ETag, stored.Card)
	}
}

func TestContactSaveCarriesIfMatch(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("+1 555 0100"))
	contact := h.opened(objectPath)

	once := sync.Once{}
	h.dav.beforePut = func() { once.Do(func() { h.dav.save(objectPath, grace("+1 555 0199")) }) }

	contact.Note = "Met at the conference"
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/edit", contact), http.StatusPreconditionFailed)
	if got := valueOf(h.dav.get(t, objectPath).Card, vcard.FieldTelephone); got != "+1 555 0199" {
		t.Fatalf("telephone is %q", got)
	}
	if len(h.dav.ifMatch) != 1 || h.dav.ifMatch[0] != `"`+contact.ETag+`"` {
		t.Fatalf("PUT preconditions %q, want one If-Match on %q", h.dav.ifMatch, contact.ETag)
	}
}

// A star sends the categories alone, so a card changed elsewhere since the list
// was loaded keeps that change: the gesture is applied on top of it.
func TestCategoriesGestureKeepsOtherChanges(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("+1 555 0100", "Work"))
	h.dav.save(objectPath, grace("+1 555 0199", "Work"))

	r := h.do("POST", "/contacts/"+pathParam(objectPath)+"/categories", map[string]any{"categories": []string{"Work", "Favorites"}})
	h.expect(r, http.StatusOK)
	var saved struct{ ETag string }
	h.decode(r, &saved)

	stored := h.dav.get(t, objectPath)
	if valueOf(stored.Card, vcard.FieldTelephone) != "+1 555 0199" || valueOf(stored.Card, vcard.FieldCategories) != "Work,Favorites" {
		t.Fatalf("stored %v", stored.Card)
	}
	if saved.ETag != stored.ETag {
		t.Fatalf("returned version %q, stored %q", saved.ETag, stored.ETag)
	}
}

// A card saved elsewhere between the gesture's read and its write is read again
// and the categories re-applied, once.
func TestCategoriesGestureRetriesOnce(t *testing.T) {
	h := newHarness(t)
	objectPath := testBook + "grace.vcf"
	h.dav.save(objectPath, grace("+1 555 0100"))

	once := sync.Once{}
	h.dav.beforePut = func() { once.Do(func() { h.dav.save(objectPath, grace("+1 555 0199")) }) }
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/categories", map[string]any{"categories": []string{"Favorites"}}), http.StatusOK)

	stored := h.dav.get(t, objectPath)
	if valueOf(stored.Card, vcard.FieldTelephone) != "+1 555 0199" || valueOf(stored.Card, vcard.FieldCategories) != "Favorites" {
		t.Fatalf("stored %v", stored.Card)
	}
	if len(h.dav.ifMatch) != 2 {
		t.Fatalf("%d PUTs, want the refused one and its retry", len(h.dav.ifMatch))
	}

	// Refused on every attempt, it stops after the retry and says so.
	h.dav.ifMatch = nil
	h.dav.beforePut = func() { h.dav.save(objectPath, grace("+1 555 0142")) }
	h.expect(h.do("POST", "/contacts/"+pathParam(objectPath)+"/categories", map[string]any{"categories": []string{}}), http.StatusPreconditionFailed)
	if len(h.dav.ifMatch) != 2 {
		t.Fatalf("%d PUTs against a card that keeps changing, want 2", len(h.dav.ifMatch))
	}
}
