package alpscarddav

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"

	"git.sr.ht/~emersion/alps"
	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav/carddav"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type AddressBookRenderData struct {
	alps.BaseRenderData
	AddressBook    *carddav.AddressBook
	AddressObjects []AddressObject
	Query          string
}

type AddressObjectRenderData struct {
	alps.BaseRenderData
	AddressObject AddressObject
}

type UpdateAddressObjectRenderData struct {
	alps.BaseRenderData
	AddressObject *carddav.AddressObject // nil if creating a new contact
	Card          vcard.Card
}

func parseObjectPath(s string) (string, error) {
	p, err := url.PathUnescape(s)
	if err != nil {
		err = fmt.Errorf("failed to parse path: %v", err)
		return "", echo.NewHTTPError(http.StatusBadRequest, err)
	}
	return string(p), nil
}

func registerRoutes(p *plugin) {
	p.GET("/contacts", func(ctx *alps.Context) error {
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

		aos, err := c.QueryAddressBook(addressBook.Path, &query)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV addresses: %v", err)
		}

		return ctx.Render(http.StatusOK, "address-book.html", &AddressBookRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			AddressBook:    addressBook,
			AddressObjects: newAddressObjectList(aos),
			Query:          queryText,
		})
	})

	p.GET("/contacts/:path", func(ctx *alps.Context) error {
		path, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, err := p.client(ctx.Session)
		if err != nil {
			return err
		}

		multiGet := carddav.AddressBookMultiGet{
			DataRequest: carddav.AddressDataRequest{
				Props: []string{
					vcard.FieldFormattedName,
					vcard.FieldEmail,
					vcard.FieldUID,
				},
			},
		}
		aos, err := c.MultiGetAddressBook(path, &multiGet)
		if err != nil {
			return fmt.Errorf("failed to query CardDAV address: %v", err)
		}
		if len(aos) != 1 {
			return fmt.Errorf("expected exactly one address object with path %q, got %v", path, len(aos))
		}
		ao := &aos[0]

		return ctx.Render(http.StatusOK, "address-object.html", &AddressObjectRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			AddressObject:  AddressObject{ao},
		})
	})

	updateContact := func(ctx *alps.Context) error {
		addressObjectPath, err := parseObjectPath(ctx.Param("path"))
		if err != nil {
			return err
		}

		c, addressBook, err := p.clientWithAddressBook(ctx.Session)
		if err != nil {
			return err
		}

		var ao *carddav.AddressObject
		var card vcard.Card
		if addressObjectPath != "" {
			ao, err := c.GetAddressObject(addressObjectPath)
			if err != nil {
				return fmt.Errorf("failed to query CardDAV address: %v", err)
			}
			card = ao.Card
		} else {
			card = make(vcard.Card)
		}

		if ctx.Request().Method == "POST" {
			fn := ctx.FormValue("fn")
			emails := strings.Split(ctx.FormValue("emails"), ",")

			if _, ok := card[vcard.FieldVersion]; !ok {
				// Some CardDAV servers (e.g. Google) don't support vCard 4.0
				var version = "4.0"
				if !addressBook.SupportsAddressData(vcard.MIMEType, version) {
					version = "3.0"
				}
				if !addressBook.SupportsAddressData(vcard.MIMEType, version) {
					return fmt.Errorf("upstream CardDAV server doesn't support vCard %v", version)
				}
				card.SetValue(vcard.FieldVersion, version)
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

			var p string
			if ao != nil {
				p = ao.Path
			} else {
				p = path.Join(addressBook.Path, id.String()+".vcf")
			}
			ao, err = c.PutAddressObject(p, card)
			if err != nil {
				return fmt.Errorf("failed to put address object: %v", err)
			}

			return ctx.Redirect(http.StatusFound, AddressObject{ao}.URL())
		}

		return ctx.Render(http.StatusOK, "update-address-object.html", &UpdateAddressObjectRenderData{
			BaseRenderData: *alps.NewBaseRenderData(ctx),
			AddressObject:  ao,
			Card:           card,
		})
	}

	p.GET("/contacts/create", updateContact)
	p.POST("/contacts/create", updateContact)

	p.GET("/contacts/:path/edit", updateContact)
	p.POST("/contacts/:path/edit", updateContact)
}
