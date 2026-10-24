package alpscarddav

import (
	"bytes"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav/carddav"
	"github.com/google/uuid"
	"github.com/migadu/alps"
	"github.com/migadu/alps/internal/davsave"
)

type ContactProperty struct {
	Value string `json:"value"`
	Type  string `json:"type,omitempty"`
	// Position among the last saved nonempty copies; -1 adds a new copy.
	// Only newer editors send it. Legacy clients retain value/order matching.
	SourceIndex *int `json:"source_index,omitempty"`
}

type ContactData struct {
	UID          string            `json:"uid"`
	Name         string            `json:"name"`
	Email        string            `json:"email"`
	Emails       []ContactProperty `json:"emails,omitempty"`
	Phone        string            `json:"phone,omitempty"`
	Phones       []ContactProperty `json:"phones,omitempty"`
	Organization string            `json:"organization,omitempty"`
	Title        string            `json:"title,omitempty"`
	Address      string            `json:"address,omitempty"`
	Birthday     string            `json:"birthday,omitempty"`
	Note         string            `json:"note,omitempty"`
	URL          string            `json:"url,omitempty"`
	Nickname     string            `json:"nickname,omitempty"`
	Avatar       string            `json:"avatar,omitempty"`
	Categories   []string          `json:"categories,omitempty"`
	Revision     string            `json:"revision,omitempty"`
	PublicKey    string            `json:"public_key,omitempty"`
	Path         string            `json:"path"`
	// The version this was read at. An edit sends it back, and is refused
	// with 412 if the card has been saved elsewhere since.
	ETag string `json:"etag,omitempty"`
}

type ContactDetailData struct {
	ContactData
	VCard string `json:"vcard"`
}

func extractTypedProperties(fields []*vcard.Field) []ContactProperty {
	var props []ContactProperty
	for _, f := range fields {
		val := strings.TrimSpace(f.Value)
		if val == "" {
			continue
		}
		props = append(props, ContactProperty{
			Value: val,
			Type:  shownType(f),
		})
	}
	return props
}

// shownType is the one type the page shows for an address or a number: the
// first that is not "pref", in lower case.
func shownType(f *vcard.Field) string {
	for _, t := range f.Params.Types() {
		t = strings.TrimSpace(t)
		if strings.EqualFold(t, "pref") || t == "" {
			continue
		}
		return strings.ToLower(t)
	}
	return ""
}

// setShownType gives f the type the page sent for it, when that is not the
// one it showed. The page shows one type, so a new one replaces them all,
// but for "pref", which says which address is preferred rather than what
// kind it is. The field's other parameters stay.
func setShownType(f *vcard.Field, t string) {
	t = strings.ToLower(strings.TrimSpace(t))
	if t == shownType(f) {
		return
	}
	var types []string
	for _, old := range f.Params[vcard.ParamType] {
		if strings.EqualFold(strings.TrimSpace(old), "pref") {
			types = append(types, old)
		}
	}
	if t != "" {
		types = append(types, strings.ToUpper(t))
	}
	if len(types) == 0 {
		delete(f.Params, vcard.ParamType)
		return
	}
	if f.Params == nil {
		f.Params = vcard.Params{}
	}
	f.Params[vcard.ParamType] = types
}

func extractContactData(card vcard.Card, path string) ContactData {
	fn := ""
	if f := card.Preferred(vcard.FieldFormattedName); f != nil {
		fn = f.Value
	}
	emails := extractTypedProperties(card[vcard.FieldEmail])
	email := ""
	if f := card.Preferred(vcard.FieldEmail); f != nil {
		email = f.Value
	} else if len(emails) > 0 {
		email = emails[0].Value
	}
	uid := ""
	if f := card.Preferred(vcard.FieldUID); f != nil {
		uid = f.Value
	}
	phones := extractTypedProperties(card[vcard.FieldTelephone])
	phone := ""
	if f := card.Preferred(vcard.FieldTelephone); f != nil {
		phone = f.Value
	} else if len(phones) > 0 {
		phone = phones[0].Value
	}
	org := ""
	if f := card.Preferred(vcard.FieldOrganization); f != nil {
		org = f.Value
	}
	title := ""
	if f := card.Preferred(vcard.FieldTitle); f != nil {
		title = f.Value
	}
	note := ""
	if f := card.Preferred(vcard.FieldNote); f != nil {
		note = f.Value
	}
	urlVal := ""
	if f := card.Preferred(vcard.FieldURL); f != nil {
		urlVal = f.Value
	}
	nickname := ""
	if f := card.Preferred(vcard.FieldNickname); f != nil {
		nickname = shownListValue(f.Value)
	}
	avatar := ""
	if f := card.Preferred(vcard.FieldPhoto); f != nil {
		avatar = f.Value
		if !strings.HasPrefix(avatar, "data:") && !strings.HasPrefix(avatar, "http") {
			mime := "image/jpeg"
			if types, ok := f.Params["TYPE"]; ok && len(types) > 0 {
				mime = "image/" + strings.ToLower(types[0])
			}
			avatar = "data:" + mime + ";base64," + avatar
		}
	}
	birthday := ""
	if f := card.Preferred(vcard.FieldBirthday); f != nil {
		birthday = birthdayOf(f)
	}

	addrStr := ""
	if f := card.Preferred(vcard.FieldAddress); f != nil {
		addrStr = addressLine(f)
	}

	categories := cardCategories(card)

	revision := ""
	if f := card.Preferred(vcard.FieldRevision); f != nil {
		revision = f.Value
	}

	publicKey := ""
	if f := card.Preferred(vcard.FieldKey); f != nil {
		publicKey = f.Value
	}

	return ContactData{
		UID:          uid,
		Name:         fn,
		Email:        email,
		Emails:       emails,
		Phone:        phone,
		Phones:       phones,
		Organization: org,
		Title:        title,
		Address:      addrStr,
		Birthday:     birthday,
		Note:         note,
		URL:          urlVal,
		Nickname:     nickname,
		Avatar:       avatar,
		Categories:   categories,
		Revision:     revision,
		PublicKey:    publicKey,
		Path:         path,
	}
}

// appleDate is a date in the form Apple's apps write a birthday in, extended
// or basic, with whatever follows the day left out.
var appleDate = regexp.MustCompile(`^(\d{4})-?(\d{2})-?(\d{2})`)

// yearlessDate is a date without a year as the page writes it, `--1031`
// (RFC 6350), or `--10-31`.
var yearlessDate = regexp.MustCompile(`^--(\d{2})-?(\d{2})$`)

// birthdayOf is a BDAY field's value as the page is given it. Apple's apps
// write a birthday without a year as one in 1604 and name that year in a
// parameter, `BDAY;X-APPLE-OMIT-YEAR=1604:1604-10-31`. Such a birthday is
// given in the vCard form of a date without a year, `--1031`, which the page
// shows as a day and a month; passed on as it was, it read as a date in 1604.
func birthdayOf(f *vcard.Field) string {
	if omitted := f.Params.Get("X-APPLE-OMIT-YEAR"); omitted != "" {
		if m := appleDate.FindStringSubmatch(strings.TrimSpace(f.Value)); m != nil && m[1] == omitted {
			return "--" + m[2] + m[3]
		}
	}
	return f.Value
}

func parseObjectPath(s string) (string, error) {
	p, err := url.PathUnescape(s)
	if err != nil {
		err = fmt.Errorf("failed to parse path: %v", err)
		return "", alps.NewHTTPError(http.StatusBadRequest, err)
	}
	return p, nil
}

// errChangedElsewhere answers a save made against a version that is no longer
// the stored one: most often the user's own phone saved the card while it was
// open here.
var errChangedElsewhere = alps.NewHTTPError(http.StatusPreconditionFailed, "changed elsewhere since it was opened")

// deleteFailed answers a delete the CardDAV server did not carry out. A card
// already gone is not one: davsave.Delete takes it as deleted, since that is
// what was asked for, and a second click or a delete made on another device
// no longer reads as a failure. A refusal keeps its status, so the browser
// can tell a read-only address book (403) or a version conflict (409, 412)
// from an outage; anything else is an internal error.
func deleteFailed(what string, err error) error {
	if errors.Is(err, davsave.ErrConflict) {
		return errChangedElsewhere
	}
	var refused *davsave.StatusError
	if errors.As(err, &refused) {
		switch refused.Code {
		case http.StatusForbidden:
			return alps.NewHTTPError(http.StatusForbidden, "the server does not allow deleting it")
		case http.StatusConflict:
			return alps.NewHTTPError(http.StatusConflict, "the server cannot delete it as it is")
		}
	}
	return fmt.Errorf("failed to delete %s: %w", what, err)
}

// putCard writes card to objectPath, conditional on etag when there is one, and
// returns the ETag of the version written.
func (p *plugin) putCard(ctx *alps.Context, c *carddav.Client, objectPath string, card vcard.Card, etag string) (string, error) {
	var buf bytes.Buffer
	if err := encodeCard(&buf, card); err != nil {
		return "", fmt.Errorf("failed to encode address object: %v", err)
	}
	newETag, err := davsave.Put(ctx.Request.Context(), p.httpClient(ctx.Session), davsave.URL(p.urlFor(ctx.Session.Username()), objectPath), vcard.MIMEType, buf.Bytes(), etag)
	if errors.Is(err, davsave.ErrConflict) {
		return "", errChangedElsewhere
	}
	if err != nil {
		return "", fmt.Errorf("failed to put address object: %v", err)
	}
	if newETag == "" {
		// Withheld (see davsave.Put). Read back, or the next save from the same
		// editor would carry no version to be checked against.
		if fresh, err := c.GetAddressObject(ctx.Request.Context(), objectPath); err == nil {
			newETag = fresh.ETag
		}
	}
	return newETag, nil
}

// cardCategories is every category of a card: RFC 6350 allows several
// CATEGORIES lines, and each counts. Read from the preferred line alone, the
// others' categories were not shown, and the next write dropped them.
func cardCategories(card vcard.Card) []string {
	var categories []string
	seen := make(map[string]bool)
	for _, f := range categoryFields(card) {
		for _, cat := range listElements(f.Value) {
			if !seen[cat] {
				seen[cat] = true
				categories = append(categories, cat)
			}
		}
	}
	return categories
}

// categoryFields are a card's CATEGORIES lines, the preferred one first.
func categoryFields(card vcard.Card) []*vcard.Field {
	first := card.Preferred(vcard.FieldCategories)
	if first == nil {
		return nil
	}
	fields := []*vcard.Field{first}
	for _, f := range card[vcard.FieldCategories] {
		if f != first {
			fields = append(fields, f)
		}
	}
	return fields
}

// setCategories gives a card the categories the page sent, blank names
// dropped, and drops the property when none are left.
//
// The stored lines are changed in place, as setShownField changes a field
// the page shows: replaced by one bare CATEGORIES, they lost Apple's group,
// which ties the property to its label, their parameters, and every line but
// one. A line other than the preferred one keeps what it holds but the
// categories removed, and goes when none are left; the preferred line holds
// the rest, a category added among them, and is left as written when they
// are the ones it held.
func setCategories(card vcard.Card, categories []string) {
	wanted := make(map[string]bool)
	var valid []string
	for _, cat := range categories {
		cat = strings.TrimSpace(cat)
		if cat != "" && !wanted[cat] {
			wanted[cat] = true
			valid = append(valid, cat)
		}
	}
	fields := categoryFields(card)
	if len(fields) == 0 {
		if len(valid) > 0 {
			card.Add(vcard.FieldCategories, &vcard.Field{Value: listValue(valid)})
		}
		return
	}

	held := make(map[string]bool)
	dropped := make(map[*vcard.Field]bool)
	for _, f := range fields[1:] {
		elements := listElements(f.Value)
		var still []string
		for _, cat := range elements {
			if wanted[cat] {
				still = append(still, cat)
				held[cat] = true
			}
		}
		if len(still) == 0 {
			dropped[f] = true
		} else if len(still) < len(elements) {
			f.Value = listValue(still)
		}
	}

	first := fields[0]
	var rest []string
	// A name may belong to several stored properties (for example the same
	// word in two ALTID language variants). Keep it in every property where
	// it was retained; only genuinely new names go into the preferred one.
	for _, cat := range listElements(first.Value) {
		if wanted[cat] {
			rest = append(rest, cat)
			held[cat] = true
		}
	}
	for _, cat := range valid {
		if !held[cat] {
			rest = append(rest, cat)
		}
	}
	if len(rest) == 0 {
		dropped[first] = true
	} else if !sameSet(listElements(first.Value), rest) {
		first.Value = listValue(rest)
	}

	var kept []*vcard.Field
	for _, f := range card[vcard.FieldCategories] {
		if !dropped[f] {
			kept = append(kept, f)
		}
	}
	if len(kept) == 0 {
		delete(card, vcard.FieldCategories)
		return
	}
	card[vcard.FieldCategories] = kept
}

// sameSet reports whether a and b hold the same strings, in any order.
func sameSet(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	in := make(map[string]int)
	for _, s := range a {
		in[s]++
	}
	for _, s := range b {
		if in[s] == 0 {
			return false
		}
		in[s]--
	}
	return true
}

// addressShown is the order the page shows an address's parts in, as
// indexes into an ADR value's seven: the street, the extended address, the
// locality, the region, the postal code and the country. The post office
// box, the first, is not shown.
var addressShown = []int{2, 1, 3, 4, 5, 6}

// addressComponents is an ADR value's seven components, as written: an ADR
// is held with its escapes in place (see structuredProperties).
func addressComponents(value string) []string {
	components := splitAt(value, ';')
	for len(components) < 7 {
		components = append(components, "")
	}
	return components
}

// addressLine is an address as the page shows it: its parts on one line,
// their escapes undone.
func addressLine(f *vcard.Field) string {
	components := addressComponents(f.Value)
	var parts []string
	for _, i := range addressShown {
		if components[i] != "" {
			parts = append(parts, unescapeText(components[i]))
		}
	}
	return strings.Join(parts, ", ")
}

// componentValue is a component written for text the page sent: one value,
// a comma in it escaped.
var componentValue = strings.NewReplacer(`\`, `\\`, "\n", `\n`, ",", `\,`, ";", `\;`).Replace

// addShown adds f to a field the page shows one copy of, as the copy it
// shows from then on: the page reads the preferred copy, so f goes first and
// is marked preferred when another copy is. Appended, a value typed in place
// of a cleared copy was not the one the page read back, and the next edit of
// it changed another copy.
func addShown(card vcard.Card, field string, f *vcard.Field) {
	for _, other := range card[field] {
		if other.Params.Get(vcard.ParamPreferred) != "" {
			if f.Params == nil {
				f.Params = vcard.Params{}
			}
			f.Params.Set(vcard.ParamPreferred, "1")
		} else if other.Params.HasType("pref") && !f.Params.HasType("pref") {
			if f.Params == nil {
				f.Params = vcard.Params{}
			}
			f.Params.Add(vcard.ParamType, "pref")
		}
	}
	card[field] = append([]*vcard.Field{f}, card[field]...)
}

// setAddress writes the line the page sent in place of the address it
// showed, f, or as the card's address when it had none; an empty line
// removes f. The card's other addresses stay.
//
// The line is split back into the parts it was made of while it still has
// one part per part of f and none of those parts holds a comma, which the
// line's own commas could not be told from: an edit of the city is an edit
// of the city. A line of another shape cannot be split reliably, so it is
// the street, as the page gives no other way to say which part is which.
// The address keeps its parameters, its type among them, but for a label
// and a position, which describe the address it was.
func setAddress(card vcard.Card, f *vcard.Field, line string) {
	line = strings.TrimSpace(line)
	if f == nil {
		if line != "" {
			addShown(card, vcard.FieldAddress, &vcard.Field{Value: ";;" + componentValue(line) + ";;;;"})
		}
		return
	}
	if line == "" {
		var kept []*vcard.Field
		for _, other := range card[vcard.FieldAddress] {
			if other != f {
				kept = append(kept, other)
			}
		}
		if len(kept) == 0 {
			delete(card, vcard.FieldAddress)
		} else {
			card[vcard.FieldAddress] = kept
		}
		return
	}

	old := addressComponents(f.Value)
	var shown []int
	splittable := true
	for _, i := range addressShown {
		if old[i] != "" {
			shown = append(shown, i)
			splittable = splittable && !strings.Contains(old[i], ",")
		}
	}
	components := []string{"", "", componentValue(line), "", "", "", ""}
	if parts := strings.Split(line, ","); splittable && len(parts) == len(shown) {
		components = append([]string(nil), old[:7]...)
		for k, i := range shown {
			components[i] = componentValue(strings.TrimSpace(parts[k]))
		}
	}
	f.Value = strings.Join(components, ";")
	delete(f.Params, "LABEL")
	delete(f.Params, "GEO")
}

// A changed key can use a different representation from the old value. Keep
// identity and preference parameters, but make the value's encoding match it.
// v3 binary keys stay binary when their edited value is still valid base64;
// otherwise v3 uses text. v4 distinguishes a URI (including data:) from text.
func setKeyRepresentation(card vcard.Card, f *vcard.Field, value string) {
	if f.Params == nil {
		f.Params = make(vcard.Params)
	}
	delete(f.Params, "MEDIATYPE") // describes the previous value's data
	if card.Value(vcard.FieldVersion) == "3.0" && strings.EqualFold(f.Params.Get("ENCODING"), "b") {
		if _, err := base64.StdEncoding.DecodeString(value); err == nil {
			f.Params.Set("ENCODING", "b")
			delete(f.Params, "VALUE") // binary is v3's default
			return
		}
	}
	delete(f.Params, "ENCODING")
	if uri, err := url.Parse(value); card.Value(vcard.FieldVersion) != "3.0" && err == nil && uri.IsAbs() {
		f.Params.Set("VALUE", "uri")
	} else {
		f.Params.Set("VALUE", "text")
	}
}

func touchRevision(card vcard.Card) {
	card[vcard.FieldRevision] = []*vcard.Field{{Value: time.Now().UTC().Format("20060102T150405Z")}}
}

func registerRoutes(p *plugin) {
	p.GET("/contacts", func(ctx *alps.Context) error {
		queryText := ctx.QueryParam("query")

		c, addressBook, err := p.clientWithAddressBook(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		// The whole card, which an empty address-data request asks for. The
		// listing is read for more than its rows' names and addresses: the
		// sidebar's categories and Favorites, the rows' photos, nicknames,
		// organisations and dates, and the key the composer encrypts to. It
		// asked for FN, EMAIL, TEL and UID only, and a server that answers
		// with just the properties asked for (RFC 6352, 10.4), as go-webdav's
		// does, gave every card without the rest.
		query := carddav.AddressBookQuery{
			DataRequest: carddav.AddressDataRequest{},
			PropFilters: []carddav.PropFilter{{
				Name: vcard.FieldFormattedName,
			}},
		}

		if queryText != "" {
			query.PropFilters = []carddav.PropFilter{
				{
					Name:        vcard.FieldFormattedName,
					TextMatches: []carddav.TextMatch{{Text: queryText}},
				},
				{
					Name:        vcard.FieldEmail,
					TextMatches: []carddav.TextMatch{{Text: queryText}},
				},
			}
		}

		aos, err := c.QueryAddressBook(ctx.Request.Context(), addressBook.Path, &query)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV addresses: %v", err)
		}

		var contacts []ContactData
		for _, ao := range aos {
			contact := extractContactData(ao.Card, ao.Path)
			contact.ETag = ao.ETag
			contacts = append(contacts, contact)
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{
			"contacts": contacts,
			"query":    queryText,
		})
	})

	p.GET("/contacts/{path}", func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, _, err := p.clientWithAddressBook(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		ao, err := c.GetAddressObject(ctx.Request.Context(), path)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV address: %v", err)
		}

		contact := extractContactData(ao.Card, ao.Path)
		contact.ETag = ao.ETag
		return ctx.JSON(http.StatusOK, ContactDetailData{
			ContactData: contact,
			// Note: Full vCard could be useful if editing is implemented
		})
	})

	updateContact := func(ctx *alps.Context) error {
		var req struct {
			ContactData
			// What the page last held for each field in ChangedFields.
			// Clearing the copy the page shows makes the server's next copy
			// the preferred one, which the page never showed; a value typed
			// into the empty field is then a new copy, not that one's
			// replacement.
			ChangedFrom map[string]string `json:"changed_from"`
			// Nil retains the whole-form contract for older clients. An empty
			// list means that none of the displayed single-copy fields changed.
			ChangedFields []string `json:"changed_fields"`
			// A create that wants the card it describes, whoever else has its
			// address: the contact editor's. Without it a create of an address
			// the book already holds leaves that card alone and answers with
			// its path, which suits the composer saving each recipient but not
			// a contact the user is typing in.
			AllowDuplicate bool `json:"allow_duplicate"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		changed := func(field string) bool {
			if req.ChangedFields == nil {
				return true
			}
			for _, name := range req.ChangedFields {
				if name == field {
					return true
				}
			}
			return false
		}
		// unseen reports whether the copy the server would change for the
		// field the page calls name is one the page did not show: its value,
		// as the page reads it, is not the one the page last held.
		unseen := func(name, shown string) bool {
			from, ok := req.ChangedFrom[name]
			return ok && strings.TrimSpace(from) != strings.TrimSpace(shown)
		}

		// The empty case is /contacts/create, where there is no {path} at all and
		// url.PathUnescape("") returns "" with no error. A non-nil error here is
		// therefore a genuinely malformed path, and it was DISCARDED — the
		// comment said so and then did nothing. addressObjectPath was left "",
		// which every branch below reads as "this is a create", so editing a
		// contact through a malformed path silently made a second one instead.
		// The stale err was then shadowed on the next line and gone.
		addressObjectPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, addressBook, err := p.clientWithAddressBook(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		// An edit addresses an existing object, and the object it addresses is
		// then written back through PutAddressObject. Unconstrained, that writes
		// a vCard over whatever the path names — including an object in another
		// collection the DAV server lets this user touch.
		if addressObjectPath != "" {
			collection := ""
			if addressBook != nil {
				collection = addressBook.Path
			}
			addressObjectPath, err = requireObjectPath(addressObjectPath, collection)
			if err != nil {
				return err
			}
		}

		// Deduplication check for new contacts
		var candidateEmails []string
		if req.Email != "" {
			candidateEmails = append(candidateEmails, req.Email)
		}
		for _, em := range req.Emails {
			v := strings.TrimSpace(em.Value)
			if v != "" {
				already := false
				for _, c := range candidateEmails {
					if strings.EqualFold(c, v) {
						already = true
						break
					}
				}
				if !already {
					candidateEmails = append(candidateEmails, v)
				}
			}
		}

		if addressObjectPath == "" && !req.AllowDuplicate && len(candidateEmails) > 0 {
			query := carddav.AddressBookQuery{
				DataRequest: carddav.AddressDataRequest{
					Props: []string{vcard.FieldEmail},
				},
				PropFilters: []carddav.PropFilter{
					{
						Name: vcard.FieldEmail,
					},
				},
			}
			if aos, err := c.QueryAddressBook(ctx.Request.Context(), addressBook.Path, &query); err == nil {
				for _, existingAo := range aos {
					for _, existingEmailField := range existingAo.Card[vcard.FieldEmail] {
						for _, candidate := range candidateEmails {
							if strings.EqualFold(strings.TrimSpace(existingEmailField.Value), strings.TrimSpace(candidate)) {
								// Contact already exists. Do not overwrite.
								return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "path": existingAo.Path})
							}
						}
					}
				}
			}
		}

		var ao *carddav.AddressObject
		var card vcard.Card
		if addressObjectPath != "" {
			ao, err = c.GetAddressObject(ctx.Request.Context(), addressObjectPath)
			if err != nil {
				return fmt.Errorf("failed to query CardDAV address: %v", err)
			}
			// Compared here as well as sent as If-Match below, because they
			// cover different spans: If-Match only the moment between this read
			// and the write, this the whole time the editor was open.
			if req.ETag != "" && !davsave.Same(req.ETag, ao.ETag) {
				return errChangedElsewhere
			}
			card = ao.Card
		} else {
			card = make(vcard.Card)
		}

		if _, ok := card[vcard.FieldVersion]; !ok {
			var version = "4.0"
			if !addressBook.SupportsAddressData(vcard.MIMEType, version) {
				version = "3.0"
			}
			if !addressBook.SupportsAddressData(vcard.MIMEType, version) {
				return fmt.Errorf("CardDAV server doesn't support vCard %v", version)
			}
			card.SetValue(vcard.FieldVersion, version)
		}

		if field := card.Preferred(vcard.FieldFormattedName); field != nil {
			field.Value = req.Name
		} else {
			card.Add(vcard.FieldFormattedName, &vcard.Field{Value: req.Name})
		}

		setSimpleField := func(field string, val string) {
			val = strings.TrimSpace(val)
			if val == "" {
				delete(card, field)
			} else {
				card[field] = []*vcard.Field{{Value: val}}
			}
		}

		// setShownField writes the value the page sent for a field it shows
		// one copy of: the preferred one, as extractContactData gives it.
		// Sent back as the page was given it, the field is left as stored.
		// Changed, the new value takes that copy's place and keeps its
		// parameters (except a key's changed representation); cleared, that
		// copy goes. The other copies stay either
		// way. Through setSimpleField, a save kept one bare copy of each of
		// these fields: a second URL or key was dropped, and so were the
		// types and languages of the rest, whatever had been edited.
		setShownField := func(field, name, val string) {
			if name != "" && !changed(name) {
				return
			}
			val = strings.TrimSpace(val)
			// A list property is held as written (see listProperties), and the
			// page shows and sends it as one line of text.
			shown, written := func(f *vcard.Field) string { return f.Value }, val
			if listProperties[field] {
				shown, written = func(f *vcard.Field) string { return shownListValue(f.Value) }, writtenListValue(val)
			}
			f := card.Preferred(field)
			if f != nil && name != "" && unseen(name, shown(f)) {
				f = nil
				if val == "" {
					return
				}
			}
			switch {
			case f == nil:
				if val != "" {
					added := &vcard.Field{Value: written}
					if field == vcard.FieldKey {
						setKeyRepresentation(card, added, val)
					}
					addShown(card, field, added)
				}
			case strings.TrimSpace(shown(f)) == val:
			case val == "":
				var kept []*vcard.Field
				for _, other := range card[field] {
					if other != f {
						kept = append(kept, other)
					}
				}
				if len(kept) == 0 {
					delete(card, field)
				} else {
					card[field] = kept
				}
			default:
				if field == vcard.FieldKey {
					setKeyRepresentation(card, f, val)
				}
				f.Value = written
			}
		}

		updateMultiField := func(field string, explicitProps []ContactProperty, fallbackVal string) error {
			if explicitProps != nil {
				// The page lists every copy with a value, in the card's order,
				// and sends the list back. Rebuilt from the list's values and
				// one type each, a save dropped a second type, a preference and
				// an Apple group (and left the group's label behind), whatever
				// had been edited. An entry sent back as it was given is now
				// that copy, as stored. New editors identify the previous copy
				// by position under the checked ETag: a debounce can combine a
				// removal and an edit, so value/order matching is ambiguous.
				// Legacy clients retain that matching. A copy with no entry
				// was removed; an explicit -1 is a new, bare copy.
				var given []*vcard.Field
				for _, f := range card[field] {
					if strings.TrimSpace(f.Value) != "" {
						given = append(given, f)
					}
				}
				var props []ContactProperty
				for _, p := range explicitProps {
					if strings.TrimSpace(p.Value) != "" {
						props = append(props, p)
					}
				}
				used := make(map[*vcard.Field]bool)
				copies := make([]*vcard.Field, len(props))
				indexed := false
				for _, p := range props {
					indexed = indexed || p.SourceIndex != nil
				}
				if indexed && ao != nil && req.ETag == "" {
					return alps.NewHTTPError(http.StatusBadRequest, "indexed contact fields require an etag")
				}
				for i, p := range props {
					if indexed {
						if p.SourceIndex == nil || *p.SourceIndex < -1 || *p.SourceIndex >= len(given) {
							return alps.NewHTTPError(http.StatusBadRequest, "invalid contact field source index")
						}
						if *p.SourceIndex >= 0 {
							f := given[*p.SourceIndex]
							if used[f] {
								return alps.NewHTTPError(http.StatusBadRequest, "duplicate contact field source index")
							}
							copies[i], used[f] = f, true
						}
						continue
					}
					for _, f := range given {
						if !used[f] && strings.TrimSpace(f.Value) == strings.TrimSpace(p.Value) {
							copies[i], used[f] = f, true
							break
						}
					}
				}
				var fields []*vcard.Field
				next := 0
				for i, p := range props {
					f := copies[i]
					if f == nil && !indexed {
						for next < len(given) && used[given[next]] {
							next++
						}
						if next < len(given) {
							f, used[given[next]] = given[next], true
						}
					}
					if f == nil {
						f = &vcard.Field{Value: strings.TrimSpace(p.Value)}
					} else if strings.TrimSpace(f.Value) != strings.TrimSpace(p.Value) {
						f.Value = strings.TrimSpace(p.Value)
					}
					setShownType(f, p.Type)
					fields = append(fields, f)
				}
				if len(fields) > 0 {
					card[field] = fields
				} else {
					delete(card, field)
				}
			} else if fallbackVal != "" {
				if len(card[field]) > 1 {
					found := false
					for i, f := range card[field] {
						if strings.EqualFold(strings.TrimSpace(f.Value), strings.TrimSpace(fallbackVal)) {
							found = true
							if i > 0 {
								match := card[field][i]
								card[field] = append([]*vcard.Field{match}, append(card[field][:i], card[field][i+1:]...)...)
							}
							break
						}
					}
					if !found {
						setShownField(field, "", fallbackVal)
					}
				} else {
					setShownField(field, "", fallbackVal)
				}
			} else {
				setSimpleField(field, fallbackVal)
			}
			return nil
		}

		if err := updateMultiField(vcard.FieldEmail, req.Emails, req.Email); err != nil {
			return err
		}
		if err := updateMultiField(vcard.FieldTelephone, req.Phones, req.Phone); err != nil {
			return err
		}
		setShownField(vcard.FieldOrganization, "organization", req.Organization)
		setShownField(vcard.FieldTitle, "title", req.Title)
		// A birthday sent back as the page was given it is left as stored, its
		// parameters with it: written bare, Apple's birthday without a year
		// became one in 1604, in Apple's own apps too, after any edit here.
		if f := card.Preferred(vcard.FieldBirthday); f == nil || strings.TrimSpace(birthdayOf(f)) != strings.TrimSpace(req.Birthday) {
			// vCard 3.0 has no form for a date without a year (RFC 2426 takes
			// a complete date), so one goes into a 3.0 card as Apple's apps
			// write it, which birthdayOf reads back as a day and a month.
			if m := yearlessDate.FindStringSubmatch(strings.TrimSpace(req.Birthday)); m != nil && card.Value(vcard.FieldVersion) == "3.0" {
				card[vcard.FieldBirthday] = []*vcard.Field{{
					Value:  "1604-" + m[1] + "-" + m[2],
					Params: vcard.Params{"X-APPLE-OMIT-YEAR": []string{"1604"}},
				}}
			} else {
				setSimpleField(vcard.FieldBirthday, req.Birthday)
			}
		}
		setShownField(vcard.FieldNote, "note", req.Note)
		setShownField(vcard.FieldURL, "url", req.URL)
		setShownField(vcard.FieldNickname, "nickname", req.Nickname)
		setShownField(vcard.FieldKey, "public_key", req.PublicKey)

		// A save that sends no categories leaves them as stored. The editor
		// sends none: the toolbar writes them on its own, and the form's copy,
		// sent back, undid a star made while editing.
		if req.Categories != nil {
			setCategories(card, req.Categories)
		}

		// An address sent back as the page was given it is left as stored.
		// Written back as the page's one line on every save, the city,
		// region, postal code and country became part of the street, and the
		// address lost its type and the card its other addresses.
		if changed("address") {
			if f := card.Preferred(vcard.FieldAddress); f != nil && unseen("address", addressLine(f)) {
				setAddress(card, nil, req.Address)
			} else if f == nil || strings.TrimSpace(addressLine(f)) != strings.TrimSpace(req.Address) {
				setAddress(card, f, req.Address)
			}
		}

		id := uuid.New()
		if _, ok := card[vcard.FieldUID]; !ok {
			card.SetValue(vcard.FieldUID, id.URN())
		}

		var objectPath, baseETag string
		if ao != nil {
			objectPath, baseETag = ao.Path, ao.ETag
		} else {
			objectPath = path.Join(addressBook.Path, id.String()+".vcf")
		}

		touchRevision(card)

		etag, err := p.putCard(ctx, c, objectPath, card, baseETag)
		if err != nil {
			return err
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "path": objectPath, "etag": etag})
	}

	p.POST("/contacts/create", updateContact)
	p.POST("/contacts/{path}/edit", updateContact)

	// A field gesture rather than a form save: starring, or adding, renaming or
	// removing a category, on one card or across a selection. Those went through
	// the edit route with the whole card as the LIST had it, so every other
	// field was written back from the version the list was loaded at: a phone
	// number changed elsewhere since was reverted by a star.
	//
	// Only the categories travel. A card saved elsewhere in the meantime is read
	// again and the categories set on top of that, once: the gesture has no
	// opinion about the rest of the card, so there is nothing to lose by
	// re-applying it. A second refusal in a row is reported.
	p.POST("/contacts/{path}/categories", func(ctx *alps.Context) error {
		var req struct {
			Categories []string `json:"categories"`
		}
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}
		rawPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, addressBook, err := p.clientWithAddressBook(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}
		collection := ""
		if addressBook != nil {
			collection = addressBook.Path
		}
		objectPath, err := requireObjectPath(rawPath, collection)
		if err != nil {
			return err
		}

		for attempt := 1; ; attempt++ {
			ao, err := c.GetAddressObject(ctx.Request.Context(), objectPath)
			if err != nil {
				return fmt.Errorf("failed to query CardDAV address: %v", err)
			}
			setCategories(ao.Card, req.Categories)
			touchRevision(ao.Card)
			etag, err := p.putCard(ctx, c, objectPath, ao.Card, ao.ETag)
			if errors.Is(err, errChangedElsewhere) && attempt == 1 {
				continue
			}
			if err != nil {
				return err
			}
			return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "path": objectPath, "etag": etag})
		}
	})

	p.DELETE("/contacts/{path}", func(ctx *alps.Context) error {
		rawPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		// clientWithAddressBook rather than client: the guard below needs the
		// collection this object must live in, and a DELETE takes children
		// with it, so an unconstrained path turns "delete one contact" into
		// "delete the address book".
		_, addressBook, err := p.clientWithAddressBook(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		collection := ""
		if addressBook != nil {
			collection = addressBook.Path
		}
		path, err := requireObjectPath(rawPath, collection)
		if err != nil {
			return err
		}

		// davsave.Delete rather than go-webdav's RemoveAll, whose error keeps
		// the server's status in a type nothing outside go-webdav can read:
		// see deleteFailed.
		err = davsave.Delete(ctx.Request.Context(), p.httpClient(ctx.Session), davsave.URL(p.urlFor(ctx.Session.Username()), path), "", nil)
		if err != nil {
			return deleteFailed("address object", err)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
	})
}
