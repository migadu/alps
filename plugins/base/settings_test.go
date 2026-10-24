package alpsbase

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"testing"

	"github.com/migadu/alps/provider"
)

// rawStore keeps each entry as the bytes a server holds, and decodes them as
// the IMAP store does.
type rawStore map[string]string

func (s rawStore) Get(key string, out interface{}) error {
	raw, ok := s[key]
	if !ok {
		return provider.ErrNoStoreEntry
	}
	if err := json.Unmarshal([]byte(raw), out); err != nil {
		return fmt.Errorf("store entry %q: %w", key, err)
	}
	return nil
}

func (s rawStore) Put(key string, v interface{}) error {
	b, err := json.Marshal(v)
	if err != nil {
		return err
	}
	s[key] = string(b)
	return nil
}

// A value of a type this version does not expect, as another version of alps
// may write, keeps its default, and the rest of the record is read.
func TestLoadSettingsReadsAroundAValueOfAnotherType(t *testing.T) {
	settings, err := loadSettings(rawStore{settingsKey: `{"signature": "Ada", "language": "de", "messages_per_page": "fifty", "ui": {"layoutMode": "horizontal", "customMailboxOrder": "INBOX"}}`})
	if err != nil {
		t.Fatal(err)
	}
	if settings.Signature != "Ada" || settings.Language != "de" || settings.MessagesPerPage != 50 || settings.UI.LayoutMode != "horizontal" || settings.UI.CustomMailboxOrder != nil {
		t.Errorf("read %+v", settings)
	}
}

// A record that does not decode is not taken for a missing one, which the
// settings page answered by saving this browser's settings over it.
func TestLoadSettingsRefusesARecordThatDoesNotDecode(t *testing.T) {
	for _, raw := range []string{`{"signature": "Ada"`, `not json`, `"Ada"`, `[1, 2]`} {
		if _, err := loadSettings(rawStore{settingsKey: raw}); !errors.Is(err, errUnreadableSettings) {
			t.Errorf("loading %s: %v, want errUnreadableSettings", raw, err)
		}
	}
	settings, err := loadSettings(rawStore{})
	if err != nil || settings.MessagesPerPage != 50 || settings.UI.LayoutMode != "vertical" {
		t.Errorf("without a record: %+v, %v", settings, err)
	}
}

// The folders unsubscribed here are held to their caps, and to one entry per
// folder; a list within them passes, an empty one included.
func TestSettingsCheckUnsubscribedFolders(t *testing.T) {
	many := func(n int, name func(i int) string) []string {
		names := make([]string, n)
		for i := range names {
			names[i] = name(i)
		}
		return names
	}
	numbered := func(i int) string { return fmt.Sprintf("Folder %d", i) }
	long := func(i int) string { return fmt.Sprintf("%04d%s", i, strings.Repeat("x", 1020)) }

	cases := []struct {
		what  string
		names []string
		ok    bool
	}{
		{"none", nil, true},
		{"an empty list", []string{}, true},
		{"a few", []string{"Old", "Work/2019", "Архива"}, true},
		{"as many as allowed", many(maxUnsubscribedFolders, numbered), true},
		{"one too many", many(maxUnsubscribedFolders+1, numbered), false},
		{"names up to the byte cap", many(maxUnsubscribedFoldersBytes/1024, long), true},
		{"names over the byte cap", many(maxUnsubscribedFoldersBytes/1024+1, long), false},
		{"a name twice", []string{"Old", "Work", "Old"}, false},
		{"an empty name", []string{"Old", ""}, false},
	}
	for _, tc := range cases {
		s := &Settings{MessagesPerPage: 50, UI: UIPreferences{UnsubscribedFolders: tc.names}}
		if err := s.check(); (err == nil) != tc.ok {
			t.Errorf("%s: check() = %v, want ok %v", tc.what, err, tc.ok)
		}
	}
}
