package multi

import (
	"fmt"
	"strings"
	"testing"

	"github.com/BurntSushi/toml"
	"github.com/migadu/alps/provider"
)

func TestBackendProbeRejectsWrongValueTypes(t *testing.T) {
	for _, table := range []string{`domains."example.test"`, "default"} {
		for _, field := range []string{"smtp", "caldav", "carddav", "managesieve", "password"} {
			t.Run(table+"/"+field, func(t *testing.T) {
				var raw toml.Primitive
				meta, err := toml.Decode(fmt.Sprintf("[%s]\ntype = \"imap\"\nserver = \"imaps://mail.example.test\"\n%s = 5\n", table, field), &raw)
				if err != nil {
					t.Fatal(err)
				}
				cfg, err := provider.LoadConfig("multi", &meta, &raw)
				if err != nil {
					t.Fatal(err)
				}
				_, err = cfg.ToOptions()
				if err == nil || !strings.Contains(err.Error(), field) || !strings.Contains(err.Error(), strings.Split(table, ".")[0]) {
					t.Fatalf("invalid %s %s accepted or lost context: %v", table, field, err)
				}
			})
		}
	}
}

func TestBackendProbePreservesUndecodedKeys(t *testing.T) {
	var raw toml.Primitive
	meta, err := toml.Decode("[default]\ntype = \"imap\"\nserver = \"imaps://mail.example.test\"\nmisspelled_option = true\n", &raw)
	if err != nil {
		t.Fatal(err)
	}
	cfg, err := provider.LoadConfig("multi", &meta, &raw)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := cfg.ToOptions(); err != nil {
		t.Fatal(err)
	}
	var found bool
	for _, key := range meta.Undecoded() {
		if key.String() == "default.misspelled_option" {
			found = true
		}
	}
	if !found {
		t.Fatalf("undecoded keys=%v, want default.misspelled_option preserved", meta.Undecoded())
	}
}
