package koushincarddav

import (
	"fmt"
	"net/http"
	"path"
	"strings"

	"git.sr.ht/~emersion/koushin"
	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav/carddav"
	"github.com/google/uuid"
)

type AddressBookRenderData struct {
	koushin.BaseRenderData
	AddressBook    *carddav.AddressBook
	AddressObjects []carddav.AddressObject
	Query          string
}

type AddressObjectRenderData struct {
	koushin.BaseRenderData
	AddressObject *carddav.AddressObject
}

type UpdateAddressObjectRenderData struct {
	koushin.BaseRenderData
	AddressObject *carddav.AddressObject // nil if creating a new contact
	Card vcard.Card
}

func registerRoutes(p *plugin) {
	p.GET("/contacts", func(ctx *koushin.Context) error {
		queryText := ctx.QueryParam("query")

		c, addressBook, err := p.clientWithAddressBook(ctx.Session)
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

		addrs, err := c.QueryAddressBook(addressBook.Path, &query)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV addresses: %v", err)
		}

		return ctx.Render(http.StatusOK, "address-book.html", &AddressBookRenderData{
			BaseRenderData: *koushin.NewBaseRenderData(ctx),
			AddressBook:    addressBook,
			AddressObjects: addrs,
			Query:          queryText,
		})
	})

	p.GET("/contacts/:uid", func(ctx *koushin.Context) error {
		uid := ctx.Param("uid")

		c, addressBook, err := p.clientWithAddressBook(ctx.Session)
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
				Name: vcard.FieldUID,
				TextMatches: []carddav.TextMatch{{
					Text:      uid,
					MatchType: carddav.MatchEquals,
				}},
			}},
		}
		addrs, err := c.QueryAddressBook(addressBook.Path, &query)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV address: %v", err)
		}
		if len(addrs) != 1 {
			return fmt.Errorf("expected exactly one address object with UID %q, got %v", uid, len(addrs))
		}
		addr := &addrs[0]

		return ctx.Render(http.StatusOK, "address-object.html", &AddressObjectRenderData{
			BaseRenderData: *koushin.NewBaseRenderData(ctx),
			AddressObject:  addr,
		})
	})

	createContact := func(ctx *koushin.Context) error {
		card := make(vcard.Card)

		if ctx.Request().Method == "POST" {
			fn := ctx.FormValue("fn")
			emails := strings.Split(ctx.FormValue("emails"), ",")

			// Some CardDAV servers (e.g. Google) don't support vCard 4.0
			// TODO: get supported formats from server, use highest version
			if _, ok := card[vcard.FieldVersion]; !ok {
				card.SetValue(vcard.FieldVersion, "3.0")
			}

			if field := card.Preferred(vcard.FieldFormattedName); field != nil {
				field.Value = fn
			} else {
				card.Add(vcard.FieldFormattedName, &vcard.Field{Value: fn})
			}

			// TODO: Google wants a "N" field, fails with a 400 otherwise

			// TODO: params are lost here
			var emailFields []*vcard.Field
			for _, email := range emails {
				emailFields = append(emailFields, &vcard.Field{
					Value: strings.TrimSpace(email),
				})
			}
			card[vcard.FieldEmail] = emailFields

			id := uuid.New()
			if _, ok := card[vcard.FieldUID]; !ok {
				card.SetValue(vcard.FieldUID, id.URN())
			}

			c, addressBook, err := p.clientWithAddressBook(ctx.Session)
			if err != nil {
				return err
			}

			p := path.Join(addressBook.Path, id.String() + ".vcf")
			_, err = c.PutAddressObject(p, card)
			if err != nil {
				return fmt.Errorf("failed to put address object: %v", err)
			}
			// TODO: check if the returned AddressObject's path matches, if not
			// fetch the new UID (the server may mutate it)

			return ctx.Redirect(http.StatusFound, "/contacts/" + card.Value(vcard.FieldUID))
		}

		return ctx.Render(http.StatusOK, "update-address-object.html", &UpdateAddressObjectRenderData{
			BaseRenderData: *koushin.NewBaseRenderData(ctx),
		})
	}
	p.GET("/contacts/create", createContact)
	p.POST("/contacts/create", createContact)
}
