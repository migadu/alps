package multi

import (
	"fmt"
	"strings"
	"testing"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps/provider"
)

func TestBackendServiceURLsAreValidatedBeforeStartup(t *testing.T) {
	for _, table := range []string{`[domains."example.test"]`, "[default]", "[[routes]]\ndomains = [\"example.test\"]"} {
		for _, service := range []string{"smtp", "caldav", "carddav", "managesieve"} {
			t.Run(table+"/"+service, func(t *testing.T) {
				var raw toml.Primitive
				meta, err := toml.Decode(fmt.Sprintf("%s\ntype = \"imap\"\nserver = \"imaps://mail.example.test\"\n%s = \"submission://wrong.example.test\"\n", table, service), &raw)
				if err != nil {
					t.Fatal(err)
				}
				cfg, err := provider.LoadConfig("multi", &meta, &raw)
				if err != nil {
					t.Fatal(err)
				}
				_, err = cfg.ToOptions()
				context := "domain"
				if strings.Contains(table, "default") {
					context = "default"
				}
				if strings.Contains(table, "routes") {
					context = "route"
				}
				if err == nil || !strings.Contains(err.Error(), service) || !strings.Contains(err.Error(), context) {
					t.Fatalf("bad backend endpoint accepted or context missing: %v", err)
				}
			})
		}
	}
}
