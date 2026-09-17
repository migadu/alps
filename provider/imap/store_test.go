package imap

import (
	"reflect"
	"testing"

	"github.com/emersion/go-imap/v2"
)

type storedSettings struct {
	Signature  string `json:"signature"`
	Language   string `json:"language"`
	AutoLogout *int   `json:"auto_logout"`
	UI         struct {
		LayoutMode string `json:"layoutMode"`
	} `json:"ui"`
}

// A store entry is read by callers that want different parts of it: signing
// in reads only auto_logout from the settings, listing reads only threading,
// and the settings page reads all of it, on the same connection. The store
// used to cache what the first caller decoded, so everyone after it got that
// caller's part and defaults for the rest, and the settings page then saved
// those defaults over the account's settings (#53).
func TestStoreReadersOfOnePartLeaveTheRestForOthers(t *testing.T) {
	p := memIMAP(t, &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapMetadata: {}}})
	if _, ok := p.store.(*imapStore); !ok {
		t.Fatalf("the store is %T, not the server's", p.store)
	}
	fifteen := 15
	saved := storedSettings{Signature: "Ada", Language: "de", AutoLogout: &fifteen}
	saved.UI.LayoutMode = "horizontal"
	if err := p.store.Put("base.settings", &saved); err != nil {
		t.Fatal(err)
	}

	// A fresh connection's store, as after a restart: nothing cached yet.
	fresh, err := newIMAPStore(p.client)
	if err != nil {
		t.Fatal(err)
	}
	var session struct {
		AutoLogout *int `json:"auto_logout"`
	}
	if err := fresh.Get("base.settings", &session); err != nil || session.AutoLogout == nil || *session.AutoLogout != 15 {
		t.Fatalf("the sign-in read got %+v, %v", session, err)
	}
	var listing struct {
		UI struct {
			LayoutMode string `json:"layoutMode"`
		} `json:"ui"`
	}
	if err := fresh.Get("base.settings", &listing); err != nil || listing.UI.LayoutMode != "horizontal" {
		t.Fatalf("the listing read got %+v, %v", listing, err)
	}

	var page storedSettings
	if err := fresh.Get("base.settings", &page); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(page, saved) {
		t.Errorf("after narrower reads, the whole entry reads as %+v, want %+v", page, saved)
	}

	// A caller's defaults stay where the entry has nothing to say, and a
	// caller changing what it got does not change what the next one gets.
	defaults := storedSettings{Signature: "unset", Language: "unset"}
	defaults.UI.LayoutMode = "vertical"
	var withDefaults struct {
		storedSettings
		Theme string `json:"theme"`
	}
	withDefaults.storedSettings = defaults
	withDefaults.Theme = "auto"
	if err := fresh.Get("base.settings", &withDefaults); err != nil {
		t.Fatal(err)
	}
	if withDefaults.Theme != "auto" || withDefaults.Signature != "Ada" {
		t.Errorf("read over defaults = %+v", withDefaults)
	}
	*page.AutoLogout = 99
	var again storedSettings
	if err := fresh.Get("base.settings", &again); err != nil || *again.AutoLogout != 15 {
		t.Errorf("a caller's change leaked into the cache: %+v, %v", again, err)
	}

	// What this connection writes is what it then reads, whoever reads it.
	saved.Language = "fr"
	if err := fresh.Put("base.settings", &saved); err != nil {
		t.Fatal(err)
	}
	var language struct {
		Language string `json:"language"`
	}
	if err := fresh.Get("base.settings", &language); err != nil || language.Language != "fr" {
		t.Errorf("after a write, the language reads %q, %v", language.Language, err)
	}
}
