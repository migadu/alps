package alpsbase

import (
	"github.com/migadu/alps"
	"net/http"
	"testing"
	"time"
)

func TestSettingsUseServerIdleDefaultWithoutPersistingIt(t *testing.T) {
	for _, minutes := range []int{10, 37, 120} {
		t.Run(time.Duration(minutes).String(), func(t *testing.T) {
			s := newTestServerWithOptions(t, "smtp://127.0.0.1:1", alps.NewLogger(), func(o *alps.Options) { o.SessionDuration = time.Duration(minutes) * time.Minute })
			s.login()
			read := func() {
				r := s.do("GET", "/settings", nil)
				s.expect(r, http.StatusOK)
				var data struct {
					Settings struct {
						AutoLogout *int `json:"auto_logout"`
					}
					AutoLogout int
				}
				r.json(t, &data)
				if data.AutoLogout != minutes || data.Settings.AutoLogout == nil || *data.Settings.AutoLogout != minutes {
					t.Fatalf("default: %s", r.body)
				}
			}
			read()
			s.expect(s.do("PUT", "/settings", map[string]any{"ui": map[string]any{"themeMode": "dark"}}), http.StatusOK)
			store, err := s.store.GetStore()
			if err != nil {
				t.Fatal(err)
			}
			var record map[string]any
			if err := store.Get(settingsKey, &record); err != nil {
				t.Fatal(err)
			}
			if _, ok := record["auto_logout"]; ok {
				t.Fatalf("unrelated save persisted auto_logout: %+v", record)
			}
			read()
		})
	}
}
