package alpsbase

import (
	"encoding/json"
	"errors"
	"fmt"
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
