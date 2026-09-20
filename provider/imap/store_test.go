package imap

import (
	"encoding/json"
	"errors"
	"reflect"
	"testing"

	"github.com/emersion/go-imap/v2"
	"github.com/migadu/alps/provider"
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

// An entry that does not decode is an error, not a missing entry: callers take
// a missing entry for a new account, and wrote their defaults over the record.
func TestStoreEntryThatDoesNotDecodeIsNotMissing(t *testing.T) {
	p := memIMAP(t, &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapMetadata: {}}})
	for key, raw := range map[string]string{
		"broken":  `{"signature": "Ada"`,
		"drifted": `{"signature": "Ada", "messages_per_page": "fifty"}`,
	} {
		value := []byte(raw)
		if err := p.client.SetMetadata("", map[string]*[]byte{"/private/vendor/alps/" + key: &value}).Wait(); err != nil {
			t.Fatal(err)
		}
	}
	fresh, err := newIMAPStore(p.client)
	if err != nil {
		t.Fatal(err)
	}

	type settings struct {
		Signature       string `json:"signature"`
		MessagesPerPage int    `json:"messages_per_page"`
	}
	var broken settings
	var syntaxErr *json.SyntaxError
	if err := fresh.Get("broken", &broken); !errors.As(err, &syntaxErr) {
		t.Errorf("reading an entry that is not JSON: %v, want a syntax error", err)
	}
	// Which a caller can then remove.
	if err := fresh.Put("broken", nil); err != nil {
		t.Fatal(err)
	}
	if err := fresh.Get("broken", &broken); !errors.Is(err, provider.ErrNoStoreEntry) {
		t.Errorf("after removing it, reading the entry: %v", err)
	}

	// A field of another type, as another version of alps may write: the error
	// says so, and the rest of the entry is read.
	drifted := settings{MessagesPerPage: 50}
	var typeErr *json.UnmarshalTypeError
	if err := fresh.Get("drifted", &drifted); !errors.As(err, &typeErr) {
		t.Errorf("reading a field of the wrong type: %v, want a type error", err)
	}
	if drifted != (settings{Signature: "Ada", MessagesPerPage: 50}) {
		t.Errorf("around the field of the wrong type, read %+v", drifted)
	}
	var signature struct {
		Signature string `json:"signature"`
	}
	if err := fresh.Get("drifted", &signature); err != nil || signature.Signature != "Ada" {
		t.Errorf("a reader that skips the field of the wrong type got %+v, %v", signature, err)
	}
}

// A connection's copy of an entry is only what it last saw. GetFresh reads
// what the server holds now, including an entry another client removed, and
// what it read is what the connection reads from then on.
func TestStoreFreshReadSeesAnotherClientsWrite(t *testing.T) {
	p := memIMAP(t, &memServer{caps: imap.CapSet{imap.CapIMAP4rev1: {}, imap.CapMetadata: {}}})
	mine, err := newIMAPStore(p.client)
	if err != nil {
		t.Fatal(err)
	}
	other, err := newIMAPStore(p.client)
	if err != nil {
		t.Fatal(err)
	}

	if err := mine.Put("base.settings", storedSettings{Language: "de"}); err != nil {
		t.Fatal(err)
	}
	if err := other.Put("base.settings", storedSettings{Language: "fr"}); err != nil {
		t.Fatal(err)
	}

	var got storedSettings
	if err := mine.Get("base.settings", &got); err != nil || got.Language != "de" {
		t.Fatalf("the cached read got %q, %v", got.Language, err)
	}
	if err := provider.GetFresh(mine, "base.settings", &got); err != nil || got.Language != "fr" {
		t.Fatalf("the fresh read got %q, %v", got.Language, err)
	}
	got = storedSettings{}
	if err := mine.Get("base.settings", &got); err != nil || got.Language != "fr" {
		t.Errorf("after a fresh read, the cached read got %q, %v", got.Language, err)
	}

	if err := other.Put("base.settings", nil); err != nil {
		t.Fatal(err)
	}
	if err := provider.GetFresh(mine, "base.settings", &got); !errors.Is(err, provider.ErrNoStoreEntry) {
		t.Errorf("a removed entry read fresh: %v", err)
	}
	if err := mine.Get("base.settings", &got); !errors.Is(err, provider.ErrNoStoreEntry) {
		t.Errorf("a removed entry read from the cache after a fresh read: %v", err)
	}
}
