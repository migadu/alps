package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"path"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/emersion/go-ical"
	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav"
	"github.com/emersion/go-webdav/caldav"
	"github.com/emersion/go-webdav/carddav"
)

// The DAV server gives every account one calendar and one address book, at
// fixed paths, created on first use:
//
//	/caldav/{user}/calendars/default/{uid}.ics
//	/carddav/{user}/contacts/default/{uid}.vcf
//
// The go-webdav handlers tell a principal, a home set, a collection and an
// object apart by path depth under their prefix, which is what fixes the
// shape. The calendar holds both events and tasks, as a single-calendar
// account on a real server does.
const (
	calDAVPrefix  = "/caldav"
	cardDAVPrefix = "/carddav"
)

type davObject struct {
	data    []byte
	etag    string
	modTime time.Time
}

// davStore holds every account's objects, keyed by full path.
type davStore struct {
	mu      sync.Mutex
	objects map[string]davObject
}

func newDAVStore() *davStore {
	return &davStore{objects: make(map[string]davObject)}
}

func (s *davStore) get(p string) (davObject, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	o, ok := s.objects[p]
	return o, ok
}

// put stores data at p, honouring the request's preconditions the way a
// server must: If-None-Match: * refuses to overwrite, If-Match refuses a stale
// version. Clients rely on the 412 to avoid losing a concurrent edit.
func (s *davStore) put(p string, data []byte, ifNoneMatch, ifMatch webdav.ConditionalMatch) (davObject, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	existing, exists := s.objects[p]
	if ifNoneMatch.IsWildcard() && exists {
		return davObject{}, webdav.NewHTTPError(http.StatusPreconditionFailed, errors.New("object already exists"))
	}
	if ifMatch.IsSet() && !ifMatch.IsWildcard() {
		want, err := ifMatch.ETag()
		if err != nil {
			return davObject{}, webdav.NewHTTPError(http.StatusBadRequest, err)
		}
		if !exists || existing.etag != want {
			return davObject{}, webdav.NewHTTPError(http.StatusPreconditionFailed, errors.New("etag mismatch"))
		}
	}
	if ifMatch.IsWildcard() && !exists {
		return davObject{}, webdav.NewHTTPError(http.StatusPreconditionFailed, errors.New("object does not exist"))
	}

	sum := sha256.Sum256(data)
	o := davObject{data: data, etag: hex.EncodeToString(sum[:8]), modTime: time.Now().UTC()}
	s.objects[p] = o
	return o, nil
}

func (s *davStore) delete(p string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.objects[p]; !ok {
		return webdav.NewHTTPError(http.StatusNotFound, errors.New("no such object"))
	}
	delete(s.objects, p)
	return nil
}

// list returns the objects directly inside collection, sorted by path so a
// listing is stable from one request to the next.
func (s *davStore) list(collection string) []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	var paths []string
	for p := range s.objects {
		if path.Dir(p)+"/" == collection {
			paths = append(paths, p)
		}
	}
	sort.Strings(paths)
	return paths
}

// dropUser forgets everything an account holds, for a test that wants a
// clean calendar and address book.
func (s *davStore) dropUser(user string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for p := range s.objects {
		for _, prefix := range []string{calDAVPrefix, cardDAVPrefix} {
			if strings.HasPrefix(p, prefix+"/"+user+"/") {
				delete(s.objects, p)
			}
		}
	}
}

type davUserKey struct{}

func davUser(ctx context.Context) (string, error) {
	user, ok := ctx.Value(davUserKey{}).(string)
	if !ok || user == "" {
		return "", webdav.NewHTTPError(http.StatusUnauthorized, errors.New("not authenticated"))
	}
	return user, nil
}

// davHandler authenticates each request with Basic credentials and routes it
// to the CalDAV or CardDAV handler.
func davHandler(creds *credentials, store *davStore) http.Handler {
	cal := &caldav.Handler{Backend: &calendarBackend{store: store}, Prefix: calDAVPrefix}
	card := &carddav.Handler{Backend: &addressBookBackend{store: store}, Prefix: cardDAVPrefix}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if !ok || creds.check(user, pass) != nil {
			w.Header().Set("WWW-Authenticate", `Basic realm="dav"`)
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		r = r.WithContext(context.WithValue(r.Context(), davUserKey{}, user))

		switch {
		case r.URL.Path == "/.well-known/caldav":
			http.Redirect(w, r, calDAVPrefix+"/"+user+"/", http.StatusPermanentRedirect)
		case r.URL.Path == "/.well-known/carddav":
			http.Redirect(w, r, cardDAVPrefix+"/"+user+"/", http.StatusPermanentRedirect)
		case under(r.URL.Path, calDAVPrefix):
			cal.ServeHTTP(w, r)
		case under(r.URL.Path, cardDAVPrefix):
			card.ServeHTTP(w, r)
		default:
			http.NotFound(w, r)
		}
	})
}

// under reports whether p is prefix itself or inside it. A client given the
// server as ".../caldav/" may still ask for ".../caldav".
func under(p, prefix string) bool {
	return p == prefix || strings.HasPrefix(p, prefix+"/")
}

// ownPath refuses a path outside the authenticated account's tree. The
// handlers pass request paths straight through, and nothing else stops one
// account naming another's objects.
func ownPath(ctx context.Context, prefix, p string) error {
	user, err := davUser(ctx)
	if err != nil {
		return err
	}
	if !strings.HasPrefix(path.Clean(p)+"/", prefix+"/"+user+"/") {
		return webdav.NewHTTPError(http.StatusForbidden, errors.New("not your collection"))
	}
	return nil
}

type calendarBackend struct {
	store *davStore
}

func (b *calendarBackend) CurrentUserPrincipal(ctx context.Context) (string, error) {
	user, err := davUser(ctx)
	if err != nil {
		return "", err
	}
	return calDAVPrefix + "/" + user + "/", nil
}

func (b *calendarBackend) CalendarHomeSetPath(ctx context.Context) (string, error) {
	principal, err := b.CurrentUserPrincipal(ctx)
	if err != nil {
		return "", err
	}
	return principal + "calendars/", nil
}

func (b *calendarBackend) calendar(ctx context.Context) (*caldav.Calendar, error) {
	home, err := b.CalendarHomeSetPath(ctx)
	if err != nil {
		return nil, err
	}
	return &caldav.Calendar{
		Path:                  home + "default/",
		Name:                  "Calendar",
		SupportedComponentSet: []string{ical.CompEvent, ical.CompToDo},
		MaxResourceSize:       1 << 20,
	}, nil
}

func (b *calendarBackend) CreateCalendar(context.Context, *caldav.Calendar) error {
	return webdav.NewHTTPError(http.StatusForbidden, errors.New("one calendar per account"))
}

func (b *calendarBackend) ListCalendars(ctx context.Context) ([]caldav.Calendar, error) {
	cal, err := b.calendar(ctx)
	if err != nil {
		return nil, err
	}
	return []caldav.Calendar{*cal}, nil
}

func (b *calendarBackend) GetCalendar(ctx context.Context, p string) (*caldav.Calendar, error) {
	cal, err := b.calendar(ctx)
	if err != nil {
		return nil, err
	}
	if strings.TrimSuffix(p, "/") != strings.TrimSuffix(cal.Path, "/") {
		return nil, webdav.NewHTTPError(http.StatusNotFound, fmt.Errorf("no calendar at %s", p))
	}
	return cal, nil
}

func (b *calendarBackend) decode(p string, o davObject) (*caldav.CalendarObject, error) {
	data, err := ical.NewDecoder(bytes.NewReader(o.data)).Decode()
	if err != nil {
		return nil, err
	}
	return &caldav.CalendarObject{
		Path:          p,
		ModTime:       o.modTime,
		ContentLength: int64(len(o.data)),
		ETag:          o.etag,
		Data:          data,
	}, nil
}

func (b *calendarBackend) GetCalendarObject(ctx context.Context, p string, _ *caldav.CalendarCompRequest) (*caldav.CalendarObject, error) {
	if err := ownPath(ctx, calDAVPrefix, p); err != nil {
		return nil, err
	}
	o, ok := b.store.get(p)
	if !ok {
		return nil, webdav.NewHTTPError(http.StatusNotFound, fmt.Errorf("no object at %s", p))
	}
	return b.decode(p, o)
}

func (b *calendarBackend) ListCalendarObjects(ctx context.Context, p string, _ *caldav.CalendarCompRequest) ([]caldav.CalendarObject, error) {
	cal, err := b.GetCalendar(ctx, p)
	if err != nil {
		return nil, err
	}
	var out []caldav.CalendarObject
	for _, objPath := range b.store.list(cal.Path) {
		o, ok := b.store.get(objPath)
		if !ok {
			continue
		}
		co, err := b.decode(objPath, o)
		if err != nil {
			return nil, err
		}
		out = append(out, *co)
	}
	return out, nil
}

func (b *calendarBackend) QueryCalendarObjects(ctx context.Context, p string, query *caldav.CalendarQuery) ([]caldav.CalendarObject, error) {
	all, err := b.ListCalendarObjects(ctx, p, &query.CompRequest)
	if err != nil {
		return nil, err
	}
	return caldav.Filter(query, all)
}

func (b *calendarBackend) PutCalendarObject(ctx context.Context, p string, cal *ical.Calendar, opts *caldav.PutCalendarObjectOptions) (*caldav.CalendarObject, error) {
	if err := ownPath(ctx, calDAVPrefix, p); err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	if err := ical.NewEncoder(&buf).Encode(cal); err != nil {
		return nil, webdav.NewHTTPError(http.StatusBadRequest, err)
	}
	o, err := b.store.put(p, buf.Bytes(), opts.IfNoneMatch, opts.IfMatch)
	if err != nil {
		return nil, err
	}
	return b.decode(p, o)
}

func (b *calendarBackend) DeleteCalendarObject(ctx context.Context, p string) error {
	if err := ownPath(ctx, calDAVPrefix, p); err != nil {
		return err
	}
	return b.store.delete(p)
}

type addressBookBackend struct {
	store *davStore
}

func (b *addressBookBackend) CurrentUserPrincipal(ctx context.Context) (string, error) {
	user, err := davUser(ctx)
	if err != nil {
		return "", err
	}
	return cardDAVPrefix + "/" + user + "/", nil
}

func (b *addressBookBackend) AddressBookHomeSetPath(ctx context.Context) (string, error) {
	principal, err := b.CurrentUserPrincipal(ctx)
	if err != nil {
		return "", err
	}
	return principal + "contacts/", nil
}

func (b *addressBookBackend) addressBook(ctx context.Context) (*carddav.AddressBook, error) {
	home, err := b.AddressBookHomeSetPath(ctx)
	if err != nil {
		return nil, err
	}
	return &carddav.AddressBook{
		Path:            home + "default/",
		Name:            "Contacts",
		MaxResourceSize: 1 << 20,
		SupportedAddressData: []carddav.AddressDataType{
			{ContentType: vcard.MIMEType, Version: "3.0"},
			{ContentType: vcard.MIMEType, Version: "4.0"},
		},
	}, nil
}

func (b *addressBookBackend) ListAddressBooks(ctx context.Context) ([]carddav.AddressBook, error) {
	ab, err := b.addressBook(ctx)
	if err != nil {
		return nil, err
	}
	return []carddav.AddressBook{*ab}, nil
}

func (b *addressBookBackend) GetAddressBook(ctx context.Context, p string) (*carddav.AddressBook, error) {
	ab, err := b.addressBook(ctx)
	if err != nil {
		return nil, err
	}
	if strings.TrimSuffix(p, "/") != strings.TrimSuffix(ab.Path, "/") {
		return nil, webdav.NewHTTPError(http.StatusNotFound, fmt.Errorf("no address book at %s", p))
	}
	return ab, nil
}

func (b *addressBookBackend) CreateAddressBook(context.Context, *carddav.AddressBook) error {
	return webdav.NewHTTPError(http.StatusForbidden, errors.New("one address book per account"))
}

func (b *addressBookBackend) DeleteAddressBook(context.Context, string) error {
	return webdav.NewHTTPError(http.StatusForbidden, errors.New("the address book cannot be deleted"))
}

func (b *addressBookBackend) decode(p string, o davObject) (*carddav.AddressObject, error) {
	card, err := vcard.NewDecoder(bytes.NewReader(o.data)).Decode()
	if err != nil {
		return nil, err
	}
	return &carddav.AddressObject{
		Path:          p,
		ModTime:       o.modTime,
		ContentLength: int64(len(o.data)),
		ETag:          o.etag,
		Card:          card,
	}, nil
}

func (b *addressBookBackend) GetAddressObject(ctx context.Context, p string, _ *carddav.AddressDataRequest) (*carddav.AddressObject, error) {
	if err := ownPath(ctx, cardDAVPrefix, p); err != nil {
		return nil, err
	}
	o, ok := b.store.get(p)
	if !ok {
		return nil, webdav.NewHTTPError(http.StatusNotFound, fmt.Errorf("no object at %s", p))
	}
	return b.decode(p, o)
}

func (b *addressBookBackend) ListAddressObjects(ctx context.Context, p string, _ *carddav.AddressDataRequest) ([]carddav.AddressObject, error) {
	ab, err := b.GetAddressBook(ctx, p)
	if err != nil {
		return nil, err
	}
	var out []carddav.AddressObject
	for _, objPath := range b.store.list(ab.Path) {
		o, ok := b.store.get(objPath)
		if !ok {
			continue
		}
		ao, err := b.decode(objPath, o)
		if err != nil {
			return nil, err
		}
		out = append(out, *ao)
	}
	return out, nil
}

func (b *addressBookBackend) QueryAddressObjects(ctx context.Context, p string, query *carddav.AddressBookQuery) ([]carddav.AddressObject, error) {
	all, err := b.ListAddressObjects(ctx, p, &query.DataRequest)
	if err != nil {
		return nil, err
	}
	return carddav.Filter(query, all)
}

func (b *addressBookBackend) PutAddressObject(ctx context.Context, p string, card vcard.Card, opts *carddav.PutAddressObjectOptions) (*carddav.AddressObject, error) {
	if err := ownPath(ctx, cardDAVPrefix, p); err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	if err := vcard.NewEncoder(&buf).Encode(card); err != nil {
		return nil, webdav.NewHTTPError(http.StatusBadRequest, err)
	}
	o, err := b.store.put(p, buf.Bytes(), opts.IfNoneMatch, opts.IfMatch)
	if err != nil {
		return nil, err
	}
	return b.decode(p, o)
}

func (b *addressBookBackend) DeleteAddressObject(ctx context.Context, p string) error {
	if err := ownPath(ctx, cardDAVPrefix, p); err != nil {
		return err
	}
	return b.store.delete(p)
}
