package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-sasl"
	"github.com/migadu/alps/plugins/managesieve"
)

// The control API is what browser tests call to put an account into a known
// state or to read what the stack saw. It works through the same protocols alps
// uses, as the account itself, so a reset cannot reach anything the
// account could not.
//
//	GET    /healthz
//	GET    /outbox           every accepted submission, oldest first
//	DELETE /outbox
//	POST   /reset/settings   {"username","password"}  drop alps's IMAP METADATA
//	POST   /reset/sieve      {"username","password"}  deactivate and delete every script
//	POST   /reset/dav        {"username"}             empty the calendar and address book

// settingsRoot is where alps keeps its per-account state.
const settingsRoot = "/private/vendor/alps"

type account struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type control struct {
	creds     *credentials
	outbox    *outbox
	dav       *davStore
	sieveAddr string
}

func (c *control) handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /outbox", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, c.outbox.list())
	})
	mux.HandleFunc("DELETE /outbox", func(w http.ResponseWriter, _ *http.Request) {
		c.outbox.clear()
		w.WriteHeader(http.StatusNoContent)
	})
	mux.HandleFunc("POST /reset/settings", c.withAccount(c.resetSettings))
	mux.HandleFunc("POST /reset/sieve", c.withAccount(c.resetSieve))
	mux.HandleFunc("POST /reset/dav", c.withAccount(func(a account) error {
		c.dav.dropUser(a.Username)
		return nil
	}))
	return mux
}

func (c *control) withAccount(fn func(account) error) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var a account
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil || a.Username == "" {
			http.Error(w, "expected {\"username\", \"password\"}", http.StatusBadRequest)
			return
		}
		if err := fn(a); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

// resetSettings removes every METADATA entry alps wrote, so the next
// session starts from its defaults.
func (c *control) resetSettings(a account) error {
	client, err := c.creds.login(a.Username, a.Password)
	if err != nil {
		return fmt.Errorf("imap login: %w", err)
	}
	defer client.Close()
	defer client.Logout()

	data, err := client.GetMetadata("", []string{settingsRoot}, &imap.GetMetadataOptions{
		Depth: imap.GetMetadataDepthInfinity,
	}).Wait()
	if err != nil {
		return fmt.Errorf("getmetadata: %w", err)
	}

	entries := make(map[string]*[]byte)
	for name := range data.Entries {
		if name == settingsRoot || strings.HasPrefix(name, settingsRoot+"/") {
			entries[name] = nil
		}
	}
	if len(entries) == 0 {
		return nil
	}
	if err := client.SetMetadata("", entries).Wait(); err != nil {
		return fmt.Errorf("setmetadata: %w", err)
	}
	return nil
}

// resetSieve leaves the account with no scripts at all. The active one has to
// be switched off first: a server refuses to delete the script it is running.
func (c *control) resetSieve(a account) error {
	client, err := managesieve.Dial(c.sieveAddr)
	if err != nil {
		return fmt.Errorf("managesieve dial: %w", err)
	}
	defer client.Close()

	if err := client.Authenticate(sasl.NewPlainClient("", a.Username, a.Password)); err != nil {
		return err
	}
	if err := client.SetActive(""); err != nil {
		return fmt.Errorf("setactive: %w", err)
	}
	scripts, err := client.ListScripts()
	if err != nil {
		return err
	}
	for _, s := range scripts {
		if err := client.DeleteScript(s.Name); err != nil {
			return fmt.Errorf("deletescript %q: %w", s.Name, err)
		}
	}
	return nil
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}
