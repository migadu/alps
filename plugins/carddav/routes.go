package koushincarddav

import (
	"fmt"
	"net/http"
	"net/url"

	"git.sr.ht/~emersion/koushin"
	"github.com/emersion/go-vcard"
	"github.com/emersion/go-webdav/carddav"
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

func registerRoutes(p *koushin.GoPlugin, u *url.URL) {
	p.GET("/contacts", func(ctx *koushin.Context) error {
		queryText := ctx.QueryParam("query")

		c, addressBook, err := getAddressBook(u, ctx.Session)
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

		c, addressBook, err := getAddressBook(u, ctx.Session)
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
}
