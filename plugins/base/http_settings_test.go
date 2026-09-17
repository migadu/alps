package alpsbase

import (
	"net/http"
	"testing"

	"github.com/migadu/alps/provider"
)

// The sender avatar choice is kept with the account, so it follows the user to
// another browser. The handler copies each UI field by name, and one it does not
// name is dropped without an error.
func TestHTTP_SettingsKeepTheSenderAvatarChoice(t *testing.T) {
	s := newTestServer(t)
	s.login()

	saved := func() *bool {
		t.Helper()
		var got struct {
			Settings struct {
				UI struct {
					ShowSenderAvatars *bool `json:"showSenderAvatars"`
				} `json:"ui"`
			}
		}
		r := s.do("GET", "/settings", nil)
		s.expect(r, http.StatusOK)
		r.json(t, &got)
		return got.Settings.UI.ShowSenderAvatars
	}
	save := func(ui map[string]any) {
		t.Helper()
		if r := s.do("PUT", "/settings", map[string]any{"ui": ui}); r.status >= 300 {
			t.Fatalf("saving settings: status %d: %s", r.status, r.body)
		}
	}

	if v := saved(); v != nil {
		t.Fatalf("a new account already has a sender avatar choice: %v", *v)
	}

	save(map[string]any{"showSenderAvatars": false})
	if v := saved(); v == nil || *v {
		t.Fatal("turning sender avatars off was not kept")
	}

	save(map[string]any{"themeMode": "dark"})
	if v := saved(); v == nil || *v {
		t.Fatal("a save that did not name sender avatars turned them back on")
	}
}

// A record with a value this version reads as another type is read around
// that value, and a save keeps the rest of the record.
func TestHTTP_SettingsWithAValueOfAnotherTypeKeepTheRest(t *testing.T) {
	s := newTestServer(t)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put(settingsKey, map[string]any{"signature": "Ada", "language": "de", "messages_per_page": "fifty"}); err != nil {
		t.Fatal(err)
	}
	s.login()

	var got struct {
		Settings struct {
			Signature       string `json:"signature"`
			Language        string `json:"language"`
			MessagesPerPage int    `json:"messages_per_page"`
		}
	}
	r := s.do("GET", "/settings", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &got)
	if got.Settings.Signature != "Ada" || got.Settings.Language != "de" || got.Settings.MessagesPerPage != 50 {
		t.Errorf("read %+v", got.Settings)
	}

	s.expect(s.do("PUT", "/settings", map[string]any{"signature": "Ada L."}), http.StatusOK)
	var saved map[string]any
	if err := store.Get(settingsKey, &saved); err != nil {
		t.Fatal(err)
	}
	if saved["signature"] != "Ada L." || saved["language"] != "de" || saved["messages_per_page"] != 50.0 {
		t.Errorf("saved %v", saved)
	}
}

// A record that does not decode is removed, and the account starts again from
// the defaults. Kept, it read as no record, and the settings page saved this
// browser's settings over it; refused, it kept the account from saving any.
func TestHTTP_SettingsThatDoNotDecodeAreRemoved(t *testing.T) {
	s := newTestServer(t)
	store, err := s.store.GetStore()
	if err != nil {
		t.Fatal(err)
	}
	if err := store.Put(settingsKey, "not a settings record"); err != nil {
		t.Fatal(err)
	}
	multipart := "From: Charles <charles@remote.test>\r\nTo: " + testUser + "\r\nSubject: Gears\r\nDate: Tue, 03 Jan 2006 15:04:05 +0000\r\nMIME-Version: 1.0\r\nContent-Type: multipart/alternative; boundary=b\r\n\r\n--b\r\nContent-Type: text/plain\r\n\r\nbody of Gears\r\n--b--\r\n"
	if _, _, _, err := s.store.AppendMessage("INBOX", rawMessage(multipart), 0); err != nil {
		t.Fatal(err)
	}
	s.login()

	gone := func() {
		t.Helper()
		var record any
		if err := store.Get(settingsKey, &record); err != provider.ErrNoStoreEntry {
			t.Errorf("the record is still %v, %v", record, err)
		}
	}
	page := s.mailbox("INBOX")
	if len(page.Messages) != 3 || page.Messages[0].Envelope.Subject != "Gears" {
		t.Fatalf("the inbox lists %+v", page.Messages)
	}
	s.expect(s.do("GET", "/mailboxes/INBOX/messages/"+page.Messages[0].UID, nil), http.StatusOK)
	gone()

	if err := store.Put(settingsKey, "not a settings record"); err != nil {
		t.Fatal(err)
	}
	var got struct {
		Settings struct {
			MessagesPerPage int `json:"messages_per_page"`
		}
	}
	r := s.do("GET", "/settings", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &got)
	if got.Settings.MessagesPerPage != 50 {
		t.Errorf("read %+v, want the defaults", got.Settings)
	}
	gone()

	s.expect(s.do("PUT", "/settings", map[string]any{"signature": "Ada"}), http.StatusOK)
	var saved map[string]any
	if err := store.Get(settingsKey, &saved); err != nil || saved["signature"] != "Ada" {
		t.Errorf("saved %v, %v", saved, err)
	}
}
