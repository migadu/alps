package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
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

// The DAV server gives every account a calendar and an address book, at
// fixed paths, created on first use:
//
//	/caldav/{user}/calendars/default/{uid}.ics
//	/carddav/{user}/contacts/default/{uid}.vcf
//
// The account can make more calendars beside its own, at
// /caldav/{user}/calendars/{name}/, rename them and delete them; its own
// calendar it can rename but not delete, so a seeded event always has
// somewhere to go.
//
// The go-webdav handlers tell a principal, a home set, a collection and an
// object apart by path depth under their prefix, which is what fixes the
// shape. The account's own calendar holds both events and tasks, as a
// single-calendar account on a real server does.
const (
	calDAVPrefix  = "/caldav"
	cardDAVPrefix = "/carddav"
)

type davObject struct {
	data    []byte
	etag    string
	modTime time.Time
}

// davCalendar is a calendar collection.
type davCalendar struct {
	path       string
	name       string
	components []string
	// made orders a listing. Calendars are listed in the order they were
	// made, so the account's own comes first, and alps offers it first.
	made uint64
}

func (c davCalendar) caldav() caldav.Calendar {
	return caldav.Calendar{
		Path:                  c.path,
		Name:                  c.name,
		SupportedComponentSet: c.components,
		MaxResourceSize:       1 << 20,
	}
}

// davStore holds every account's objects, keyed by full path, and their
// calendars, keyed by the collection's path with its trailing slash.
type davStore struct {
	mu        sync.Mutex
	objects   map[string]davObject
	calendars map[string]davCalendar
	made      uint64
}

func newDAVStore() *davStore {
	return &davStore{objects: make(map[string]davObject), calendars: make(map[string]davCalendar)}
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

// collectionPath is p as calendars are keyed: cleaned, with a trailing slash.
func collectionPath(p string) string {
	return path.Clean(p) + "/"
}

func (s *davStore) calendar(p string) (davCalendar, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.calendars[p]
	return c, ok
}

// makeCalendar adds c, refusing a path that already holds a calendar: an
// MKCALENDAR makes a new collection and never replaces one (RFC 4791 section
// 5.3.1).
func (s *davStore) makeCalendar(c davCalendar) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.calendars[c.path]; ok {
		return webdav.NewHTTPError(http.StatusMethodNotAllowed, errors.New("a calendar is already there"))
	}
	s.made++
	c.made = s.made
	s.calendars[c.path] = c
	return nil
}

// ensureCalendar adds c unless its path already holds a calendar.
func (s *davStore) ensureCalendar(c davCalendar) {
	if _, ok := s.calendar(c.path); ok {
		return
	}
	// A request in between may have made it first, which is as good.
	_ = s.makeCalendar(c)
}

func (s *davStore) renameCalendar(p, name string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.calendars[p]
	if !ok {
		return webdav.NewHTTPError(http.StatusNotFound, fmt.Errorf("no calendar at %s", p))
	}
	c.name = name
	s.calendars[p] = c
	return nil
}

// deleteCalendar removes the calendar at p and every object in it.
func (s *davStore) deleteCalendar(p string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.calendars[p]; !ok {
		return webdav.NewHTTPError(http.StatusNotFound, fmt.Errorf("no calendar at %s", p))
	}
	delete(s.calendars, p)
	for objPath := range s.objects {
		if path.Dir(objPath)+"/" == p {
			delete(s.objects, objPath)
		}
	}
	return nil
}

// calendarsIn returns the calendars directly inside home, in the order they
// were made.
func (s *davStore) calendarsIn(home string) []davCalendar {
	s.mu.Lock()
	defer s.mu.Unlock()
	var cals []davCalendar
	for p, c := range s.calendars {
		if path.Dir(strings.TrimSuffix(p, "/"))+"/" == home {
			cals = append(cals, c)
		}
	}
	sort.Slice(cals, func(i, j int) bool { return cals[i].made < cals[j].made })
	return cals
}

// dropUser forgets everything an account holds, the calendars it made as
// well as the objects, for a test that wants to start from an empty calendar
// and address book. The account's own calendar comes back, under its first
// name, the next time it is asked for.
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
	for p := range s.calendars {
		if strings.HasPrefix(p, calDAVPrefix+"/"+user+"/") {
			delete(s.calendars, p)
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
	calendars := &calendarBackend{store: store}
	cal := &caldav.Handler{Backend: calendars, Prefix: calDAVPrefix}
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
			// Calendars are made and renamed here: go-webdav's handler has no
			// MKCALENDAR, and answers every PROPPATCH 501.
			switch r.Method {
			case "MKCALENDAR":
				calendars.serveMkcalendar(w, r)
			case "PROPPATCH":
				calendars.serveProppatch(w, r)
			default:
				cal.ServeHTTP(w, r)
			}
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

// defaultCalendar is the account's own calendar, inside its home set.
const defaultCalendar = "default/"

// calendarComponents are what a calendar takes when whoever made it did not
// say: events and tasks, as the account's own calendar does.
var calendarComponents = []string{ical.CompEvent, ical.CompToDo}

// home returns the account's calendar home set, with the account's own
// calendar in it.
func (b *calendarBackend) home(ctx context.Context) (string, error) {
	home, err := b.CalendarHomeSetPath(ctx)
	if err != nil {
		return "", err
	}
	b.store.ensureCalendar(davCalendar{path: home + defaultCalendar, name: "Calendar", components: calendarComponents})
	return home, nil
}

func (b *calendarBackend) CreateCalendar(ctx context.Context, cal *caldav.Calendar) error {
	home, err := b.home(ctx)
	if err != nil {
		return err
	}
	// In the home set, where a listing looks, and nowhere deeper: go-webdav
	// takes whatever is inside a calendar for one of its objects.
	p := collectionPath(cal.Path)
	if path.Dir(strings.TrimSuffix(p, "/"))+"/" != home {
		return webdav.NewHTTPError(http.StatusForbidden, errors.New("calendars are made in the calendar home set"))
	}
	components := cal.SupportedComponentSet
	if len(components) == 0 {
		components = calendarComponents
	}
	return b.store.makeCalendar(davCalendar{path: p, name: cal.Name, components: components})
}

func (b *calendarBackend) ListCalendars(ctx context.Context) ([]caldav.Calendar, error) {
	home, err := b.home(ctx)
	if err != nil {
		return nil, err
	}
	var out []caldav.Calendar
	for _, c := range b.store.calendarsIn(home) {
		out = append(out, c.caldav())
	}
	return out, nil
}

func (b *calendarBackend) GetCalendar(ctx context.Context, p string) (*caldav.Calendar, error) {
	if _, err := b.home(ctx); err != nil {
		return nil, err
	}
	if err := ownPath(ctx, calDAVPrefix, p); err != nil {
		return nil, err
	}
	c, ok := b.store.calendar(collectionPath(p))
	if !ok {
		return nil, webdav.NewHTTPError(http.StatusNotFound, fmt.Errorf("no calendar at %s", p))
	}
	cal := c.caldav()
	return &cal, nil
}

// mkcalendarRequest is the body of an MKCALENDAR (RFC 4791 section 5.3.1):
// the new calendar's name and, optionally, the components it takes. Any
// other property it sets is ignored.
type mkcalendarRequest struct {
	XMLName xml.Name `xml:"urn:ietf:params:xml:ns:caldav mkcalendar"`
	Set     []struct {
		Prop struct {
			DisplayName *string `xml:"DAV: displayname"`
			Components  *struct {
				Comp []struct {
					Name string `xml:"name,attr"`
				} `xml:"urn:ietf:params:xml:ns:caldav comp"`
			} `xml:"urn:ietf:params:xml:ns:caldav supported-calendar-component-set"`
		} `xml:"DAV: prop"`
	} `xml:"DAV: set"`
}

// serveMkcalendar makes a calendar, which is what alps asks for when the user
// adds one. go-webdav's handler would answer 405, as for any method it does
// not know.
func (b *calendarBackend) serveMkcalendar(w http.ResponseWriter, r *http.Request) {
	var req mkcalendarRequest
	if err := decodeDAVBody(r, &req); err != nil {
		serveDAVError(w, err)
		return
	}
	cal := caldav.Calendar{Path: r.URL.Path}
	for _, set := range req.Set {
		if set.Prop.DisplayName != nil {
			cal.Name = *set.Prop.DisplayName
		}
		if set.Prop.Components != nil {
			for _, comp := range set.Prop.Components.Comp {
				cal.SupportedComponentSet = append(cal.SupportedComponentSet, strings.ToUpper(comp.Name))
			}
		}
	}
	if err := b.CreateCalendar(r.Context(), &cal); err != nil {
		serveDAVError(w, err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

// propertyUpdate is the body of a PROPPATCH (RFC 4918 section 14.19).
type propertyUpdate struct {
	XMLName xml.Name      `xml:"DAV: propertyupdate"`
	Set     []davPropList `xml:"DAV: set"`
	Remove  []davPropList `xml:"DAV: remove"`
}

type davPropList struct {
	Prop struct {
		Values []struct {
			XMLName xml.Name
			Text    string `xml:",chardata"`
		} `xml:",any"`
	} `xml:"DAV: prop"`
}

var displayNameName = xml.Name{Space: "DAV:", Local: "displayname"}

// proppatchDone is the answer to a PROPPATCH that set a calendar's name.
type proppatchDone struct {
	XMLName  xml.Name `xml:"DAV: multistatus"`
	Response struct {
		Href     string `xml:"DAV: href"`
		Propstat struct {
			Prop struct {
				DisplayName struct{} `xml:"DAV: displayname"`
			} `xml:"DAV: prop"`
			Status string `xml:"DAV: status"`
		} `xml:"DAV: propstat"`
	} `xml:"DAV: response"`
}

// serveProppatch renames a calendar, which is what alps asks for when the
// user renames one. Its name is the one property a calendar here has that can
// be changed, so a request to change any other is refused whole.
func (b *calendarBackend) serveProppatch(w http.ResponseWriter, r *http.Request) {
	var req propertyUpdate
	if err := decodeDAVBody(r, &req); err != nil {
		serveDAVError(w, err)
		return
	}
	cal, err := b.GetCalendar(r.Context(), r.URL.Path)
	if err != nil {
		serveDAVError(w, err)
		return
	}
	var name *string
	for _, set := range req.Set {
		for _, v := range set.Prop.Values {
			if v.XMLName != displayNameName {
				http.Error(w, "only a calendar's name can be changed", http.StatusForbidden)
				return
			}
			name = &v.Text
		}
	}
	if name == nil || len(req.Remove) > 0 {
		http.Error(w, "only a calendar's name can be changed", http.StatusForbidden)
		return
	}
	if err := b.store.renameCalendar(cal.Path, *name); err != nil {
		serveDAVError(w, err)
		return
	}

	var done proppatchDone
	done.Response.Href = (&url.URL{Path: cal.Path}).EscapedPath()
	done.Response.Propstat.Status = "HTTP/1.1 200 OK"
	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.WriteHeader(http.StatusMultiStatus)
	_, _ = io.WriteString(w, xml.Header)
	_ = xml.NewEncoder(w).Encode(done)
}

// decodeDAVBody reads an XML request body into v. An empty body leaves v as
// it is: an MKCALENDAR need not carry one.
func decodeDAVBody(r *http.Request, v any) error {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		return webdav.NewHTTPError(http.StatusBadRequest, err)
	}
	if len(bytes.TrimSpace(body)) == 0 {
		return nil
	}
	if err := xml.Unmarshal(body, v); err != nil {
		return webdav.NewHTTPError(http.StatusBadRequest, err)
	}
	return nil
}

// statusOf reads the status go-webdav will answer with. Its error type is
// internal to the module; the message is the only exported view of the code.
func statusOf(err error) int {
	var code int
	if err != nil {
		fmt.Sscanf(err.Error(), "%d", &code)
	}
	return code
}

// serveDAVError answers err as go-webdav's handlers do, with the status it
// carries.
func serveDAVError(w http.ResponseWriter, err error) {
	code := statusOf(err)
	if http.StatusText(code) == "" {
		code = http.StatusInternalServerError
	}
	http.Error(w, err.Error(), code)
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
	if _, err := b.home(ctx); err != nil {
		return nil, err
	}
	if err := ownPath(ctx, calDAVPrefix, p); err != nil {
		return nil, err
	}
	// Into one of the account's calendars, as a server insists (RFC 4918
	// section 9.7.1). An object put into a calendar since deleted would be
	// listed nowhere.
	if _, ok := b.store.calendar(path.Dir(p) + "/"); !ok {
		return nil, webdav.NewHTTPError(http.StatusConflict, fmt.Errorf("no calendar at %s", path.Dir(p)))
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

// DeleteCalendarObject is where go-webdav sends every DELETE, of a calendar
// as well as of an object in one.
func (b *calendarBackend) DeleteCalendarObject(ctx context.Context, p string) error {
	home, err := b.home(ctx)
	if err != nil {
		return err
	}
	if err := ownPath(ctx, calDAVPrefix, p); err != nil {
		return err
	}
	if c, ok := b.store.calendar(collectionPath(p)); ok {
		if c.path == home+defaultCalendar {
			return webdav.NewHTTPError(http.StatusForbidden, errors.New("the account's own calendar cannot be deleted"))
		}
		return b.store.deleteCalendar(c.path)
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
	// Matched here, not by carddav.Filter, which compares a property's first
	// value alone, and case by case. A CardDAV server compares every value of
	// a repeated property, as EMAIL is, and in any case unless the query names
	// another collation (RFC 6352, sections 8.3 and 10.5): alps's search found
	// a card by its second address only when its name held the text too.
	var matched []carddav.AddressObject
	for _, ao := range all {
		ok, err := matchCard(query, ao.Card)
		if err != nil {
			return nil, err
		}
		if ok {
			matched = append(matched, ao)
		}
	}
	// carddav.Filter still gives each card the properties asked for, and
	// keeps to the limit: with no filter left, every card meets all of them.
	return carddav.Filter(&carddav.AddressBookQuery{
		DataRequest: query.DataRequest,
		FilterTest:  carddav.FilterAllOf,
		Limit:       query.Limit,
	}, matched)
}

// matchCard reports whether card meets any of the query's property filters,
// or all of them, as the query says.
func matchCard(query *carddav.AddressBookQuery, card vcard.Card) (bool, error) {
	allOf, err := allOfTest(query.FilterTest)
	if err != nil {
		return false, err
	}
	for _, prop := range query.PropFilters {
		ok, err := matchProp(prop, card)
		if err != nil {
			return false, err
		}
		// Settled by the first filter met, for any of them, or missed, for all.
		if ok != allOf {
			return ok, nil
		}
	}
	return allOf, nil
}

// matchProp reports whether card meets one property filter. A property can
// be repeated, and the filter is met when any of its values meets it.
// Parameter filters are not looked at, as go-webdav does not; alps sends none.
func matchProp(prop carddav.PropFilter, card vcard.Card) (bool, error) {
	fields := card[strings.ToUpper(prop.Name)]
	if len(fields) == 0 {
		return prop.IsNotDefined, nil
	}
	if prop.IsNotDefined {
		return false, nil
	}
	if len(prop.TextMatches) == 0 {
		return true, nil
	}
	allOf, err := allOfTest(prop.Test)
	if err != nil {
		return false, err
	}
	for _, field := range fields {
		met := allOf
		for _, txt := range prop.TextMatches {
			ok, err := matchText(txt, field.Value)
			if err != nil {
				return false, err
			}
			if ok != allOf {
				met = ok
				break
			}
		}
		if met {
			return true, nil
		}
	}
	return false, nil
}

// matchText compares as i;unicode-casemap, the default collation, does: in
// any case.
func matchText(txt carddav.TextMatch, value string) (bool, error) {
	text, value := strings.ToLower(txt.Text), strings.ToLower(value)
	var ok bool
	switch txt.MatchType {
	case carddav.MatchEquals:
		ok = value == text
	case carddav.MatchContains, "":
		ok = strings.Contains(value, text)
	case carddav.MatchStartsWith:
		ok = strings.HasPrefix(value, text)
	case carddav.MatchEndsWith:
		ok = strings.HasSuffix(value, text)
	default:
		return false, fmt.Errorf("unknown text-match type %q", txt.MatchType)
	}
	return ok != txt.NegateCondition, nil
}

// allOfTest reads a filter's test: any of its parts, the default, or all.
func allOfTest(test carddav.FilterTest) (bool, error) {
	switch test {
	case carddav.FilterAnyOf, "":
		return false, nil
	case carddav.FilterAllOf:
		return true, nil
	}
	return false, fmt.Errorf("unknown filter test %q", test)
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
