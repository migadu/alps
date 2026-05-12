package alpscarddav

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"

	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav/carddav"
	"github.com/google/uuid"
	"github.com/migadu/alps"
)

type ContactData struct {
	UID          string   `json:"uid"`
	Name         string   `json:"name"`
	Email        string   `json:"email"`
	Phone        string   `json:"phone,omitempty"`
	Organization string   `json:"organization,omitempty"`
	Title        string   `json:"title,omitempty"`
	Address      string   `json:"address,omitempty"`
	Birthday     string   `json:"birthday,omitempty"`
	Note         string   `json:"note,omitempty"`
	URL          string   `json:"url,omitempty"`
	Nickname     string   `json:"nickname,omitempty"`
	Avatar       string   `json:"avatar,omitempty"`
	Categories   []string `json:"categories,omitempty"`
	Revision     string   `json:"revision,omitempty"`
	PublicKey    string   `json:"public_key,omitempty"`
	Path         string   `json:"path"`
}

type ContactDetailData struct {
	ContactData
	VCard string `json:"vcard"`
}

func extractContactData(card vcard.Card, path string) ContactData {
	fn := ""
	if f := card.Preferred(vcard.FieldFormattedName); f != nil {
		fn = f.Value
	}
	email := ""
	if f := card.Preferred(vcard.FieldEmail); f != nil {
		email = f.Value
	}
	uid := ""
	if f := card.Preferred(vcard.FieldUID); f != nil {
		uid = f.Value
	}
	phone := ""
	if f := card.Preferred(vcard.FieldTelephone); f != nil {
		phone = f.Value
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
		nickname = f.Value
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
		birthday = f.Value
	}

	addrStr := ""
	if addr := card.Address(); addr != nil {
		var parts []string
		if addr.StreetAddress != "" {
			parts = append(parts, addr.StreetAddress)
		}
		if addr.ExtendedAddress != "" {
			parts = append(parts, addr.ExtendedAddress)
		}
		if addr.Locality != "" {
			parts = append(parts, addr.Locality)
		}
		if addr.Region != "" {
			parts = append(parts, addr.Region)
		}
		if addr.PostalCode != "" {
			parts = append(parts, addr.PostalCode)
		}
		if addr.Country != "" {
			parts = append(parts, addr.Country)
		}
		addrStr = strings.Join(parts, ", ")
	}

	var categories []string
	if f := card.Preferred(vcard.FieldCategories); f != nil && f.Value != "" {
		for _, cat := range strings.Split(f.Value, ",") {
			cat = strings.TrimSpace(cat)
			if cat != "" {
				categories = append(categories, cat)
			}
		}
	}

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
		Phone:        phone,
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

func parseObjectPath(s string) (string, error) {
	p, err := url.PathUnescape(s)
	if err != nil {
		err = fmt.Errorf("failed to parse path: %v", err)
		return "", alps.NewHTTPError(http.StatusBadRequest, err)
	}
	return p, nil
}

func registerRoutes(p *plugin) {
	p.GET("/contacts", func(ctx *alps.Context) error {
		queryText := ctx.QueryParam("query")

		c, addressBook, err := p.clientWithAddressBook(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		query := carddav.AddressBookQuery{
			DataRequest: carddav.AddressDataRequest{
				Props: []string{
					vcard.FieldFormattedName,
					vcard.FieldEmail,
					vcard.FieldUID,
				},
			},
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
			contacts = append(contacts, extractContactData(ao.Card, ao.Path))
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

		return ctx.JSON(http.StatusOK, ContactDetailData{
			ContactData: extractContactData(ao.Card, ao.Path),
			// Note: Full vCard could be useful if editing is implemented
		})
	})

	updateContact := func(ctx *alps.Context) error {
		var req ContactData
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON payload"})
		}

		addressObjectPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			// For /contacts/create, path is empty which parseObjectPath might fail on if not handled.
			// Actually parseObjectPath doesn't fail on empty param if ctx.Param("path") is just empty string.
		}

		c, addressBook, err := p.clientWithAddressBook(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		// Deduplication check for new contacts
		if addressObjectPath == "" && req.Email != "" {
			query := carddav.AddressBookQuery{
				DataRequest: carddav.AddressDataRequest{
					Props: []string{vcard.FieldEmail},
				},
				PropFilters: []carddav.PropFilter{
					{
						Name:        vcard.FieldEmail,
						TextMatches: []carddav.TextMatch{{Text: req.Email}},
					},
				},
			}
			if aos, err := c.QueryAddressBook(ctx.Request.Context(), addressBook.Path, &query); err == nil {
				for _, existingAo := range aos {
					if existingEmailField := existingAo.Card.Preferred(vcard.FieldEmail); existingEmailField != nil {
						if strings.EqualFold(strings.TrimSpace(existingEmailField.Value), strings.TrimSpace(req.Email)) {
							// Contact already exists. Do not overwrite.
							return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "path": existingAo.Path})
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

		setSimpleField(vcard.FieldEmail, req.Email)
		setSimpleField(vcard.FieldTelephone, req.Phone)
		setSimpleField(vcard.FieldOrganization, req.Organization)
		setSimpleField(vcard.FieldTitle, req.Title)
		setSimpleField(vcard.FieldBirthday, req.Birthday)
		setSimpleField(vcard.FieldNote, req.Note)
		setSimpleField(vcard.FieldURL, req.URL)
		setSimpleField(vcard.FieldNickname, req.Nickname)

		if strings.TrimSpace(req.PublicKey) == "" {
			delete(card, vcard.FieldKey)
		} else {
			// RFC 6350 specifies KEY can be a URI, text, etc. We will prefix with data:application/pgp-keys if not present to ensure compliance, or just store it as text if it's already a full block.
			val := strings.TrimSpace(req.PublicKey)
			card[vcard.FieldKey] = []*vcard.Field{{Value: val}}
		}

		if len(req.Categories) > 0 {
			var validCats []string
			for _, cat := range req.Categories {
				cat = strings.TrimSpace(cat)
				if cat != "" {
					validCats = append(validCats, cat)
				}
			}
			if len(validCats) > 0 {
				card[vcard.FieldCategories] = []*vcard.Field{{Value: strings.Join(validCats, ",")}}
			} else {
				delete(card, vcard.FieldCategories)
			}
		} else {
			delete(card, vcard.FieldCategories)
		}

		if strings.TrimSpace(req.Address) == "" {
			delete(card, vcard.FieldAddress)
		} else {
			safeAddr := strings.ReplaceAll(req.Address, ";", ",")
			card[vcard.FieldAddress] = []*vcard.Field{{Value: ";;" + safeAddr + ";;;;"}}
		}

		id := uuid.New()
		if _, ok := card[vcard.FieldUID]; !ok {
			card.SetValue(vcard.FieldUID, id.URN())
		}

		var p string
		if ao != nil {
			p = ao.Path
		} else {
			p = path.Join(addressBook.Path, id.String()+".vcf")
		}

		card[vcard.FieldRevision] = []*vcard.Field{{Value: time.Now().UTC().Format("20060102T150405Z")}}

		ao, err = c.PutAddressObject(ctx.Request.Context(), p, card)
		if err != nil {
			return fmt.Errorf("failed to put address object: %v", err)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true", "path": ao.Path})
	}

	p.POST("/contacts/create", updateContact)
	p.POST("/contacts/{path}/edit", updateContact)

	p.DELETE("/contacts/{path}", func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, err := p.client(ctx.Request.Context(), ctx.Session)
		if err != nil {
			return err
		}

		if err := c.RemoveAll(ctx.Request.Context(), path); err != nil {
			return fmt.Errorf("failed to delete address object: %v", err)
		}

		return ctx.JSON(http.StatusOK, map[string]string{"ok": "true"})
	})
}
