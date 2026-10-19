package alpsbase

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/emersion/go-message/mail"
	"github.com/migadu/alps"
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
		if err := store.Get(settingsKey, &record); !errors.Is(err, provider.ErrNoStoreEntry) {
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

// The display name is free text, and whatever it holds, a message sent or a
// draft saved under it says From that name and the account's address. Pasted
// in front of the address, a comma in it ("Doe, Jane") made From two
// addresses, the first with none, and every send and every draft save failed.
func TestHTTP_TheDisplayNameIsSentAsWritten(t *testing.T) {
	smtpServer, rec := listenRecorder(t)
	s := newTestServerWithSMTP(t, smtpServer)
	s.login()

	fromOf := func(raw string) (*mail.Address, error) {
		r, err := mail.CreateReader(strings.NewReader(raw))
		if err != nil {
			return nil, err
		}
		list, err := r.Header.AddressList("From")
		if err != nil || len(list) != 1 {
			return nil, errors.New("From is " + r.Header.Get("From"))
		}
		return list[0], nil
	}
	for i, name := range []string{
		"Doe, Jane",
		`Jane "JJ" Doe`,
		"Jane (work) Doe",
		`Back\slash`,
		"Ada <ada@elsewhere.test>",
		"Jöhn Døe",
		"Døe, Jöhn",
	} {
		s.expect(s.do("PUT", "/settings", map[string]any{"from": name}), http.StatusOK)
		subject := "Notes " + strconv.Itoa(i)
		form := url.Values{"to": {"charles@remote.test"}, "subject": {subject}, "text": {"See you."}}

		s.expect(s.do("POST", "/messages", form), http.StatusOK)
		rec.mu.Lock()
		data, envelopeFrom := rec.data, rec.from
		rec.mu.Unlock()
		if addr, err := fromOf(data); err != nil || addr.Name != name || addr.Address != testUser {
			t.Errorf("sent under %q: From %+v, %v", name, addr, err)
		}
		if envelopeFrom != testUser {
			t.Errorf("sent under %q: MAIL FROM %q", name, envelopeFrom)
		}

		form.Set("save_as_draft", "1")
		r := s.do("POST", "/messages", form)
		s.expect(r, http.StatusOK)
		var saved struct {
			Mailbox string `json:"draft_mailbox"`
		}
		r.json(t, &saved)
		uid := ""
		for _, m := range s.mailbox(saved.Mailbox).Messages {
			if m.Envelope.Subject == subject {
				uid = m.UID
			}
		}
		if uid == "" {
			t.Errorf("the draft saved under %q is not in %s", name, saved.Mailbox)
			continue
		}
		r = s.do("GET", "/mailboxes/"+url.PathEscape(url.PathEscape(saved.Mailbox))+"/messages/"+uid+"/raw", nil)
		s.expect(r, http.StatusOK)
		if addr, err := fromOf(string(r.body)); err != nil || addr.Name != name || addr.Address != testUser {
			t.Errorf("draft saved under %q: From %+v, %v", name, addr, err)
		}
	}
}

func TestHTTP_SettingsWeekStart(t *testing.T) {
	s := newTestServer(t)
	s.login()

	saved := func() *int {
		t.Helper()
		var got struct {
			Settings struct {
				WeekStart *int `json:"week_start"`
			} `json:"Settings"`
		}
		r := s.do("GET", "/settings", nil)
		s.expect(r, http.StatusOK)
		r.json(t, &got)
		return got.Settings.WeekStart
	}

	// Defaults to 1 (Monday) when unspecified
	if v := saved(); v == nil || *v != 1 {
		t.Fatalf("default week_start = %v, want 1", v)
	}

	// Update to 0 (Sunday)
	s.expect(s.do("PUT", "/settings", map[string]any{"week_start": 0}), http.StatusOK)
	if v := saved(); v == nil || *v != 0 {
		t.Fatalf("after update to Sunday, week_start = %v, want 0", v)
	}

	// Update back to 1 (Monday)
	s.expect(s.do("PUT", "/settings", map[string]any{"week_start": 1}), http.StatusOK)
	if v := saved(); v == nil || *v != 1 {
		t.Fatalf("after update to Monday, week_start = %v, want 1", v)
	}
}

func TestHTTP_SettingsWeekStartFromCaldavOptions(t *testing.T) {
	s := newTestServer(t)
	s.server.Options.Plugins = map[string]alps.PluginConfig{
		"caldav": {
			Enabled: true,
			Options: map[string]interface{}{
				"week_start": 0,
			},
		},
	}
	s.login()

	var got struct {
		Settings struct {
			WeekStart *int `json:"week_start"`
		} `json:"Settings"`
	}
	r := s.do("GET", "/settings", nil)
	s.expect(r, http.StatusOK)
	r.json(t, &got)
	if got.Settings.WeekStart == nil || *got.Settings.WeekStart != 0 {
		t.Fatalf("week_start from caldav plugin config = %v, want 0", got.Settings.WeekStart)
	}
}

func TestParseWeekStartOption(t *testing.T) {
	cases := []struct {
		in   any
		want int
	}{
		{0, 0},
		{1, 1},
		{int64(0), 0},
		{int64(1), 1},
		{float64(0), 0},
		{float64(1), 1},
		{"0", 0},
		{"1", 1},
		{"sunday", 0},
		{"Sunday", 0},
		{"SUN", 0},
		{"monday", 1},
		{"Monday", 1},
		{"MON", 1},
		{nil, 1},
		{"tuesday", 1},
		{2, 1},
		{-1, 1},
	}
	for _, tc := range cases {
		if got := parseWeekStartOption(tc.in); got != tc.want {
			t.Errorf("parseWeekStartOption(%v) = %d, want %d", tc.in, got, tc.want)
		}
	}
}

func TestSettingsCheckWeekStart(t *testing.T) {
	bad := 2
	s := &Settings{
		MessagesPerPage: 25,
		WeekStart:       &bad,
	}
	if err := s.check(); err == nil {
		t.Fatalf("check() allowed invalid week_start = %d, want error", bad)
	}
}


