package gpg

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/migadu/alps"
	"github.com/migadu/alps/provider"
)

type Keyring struct {
	PublicKey           string `json:"public_key"`
	EncryptedPrivateKey string `json:"encrypted_private_key"`
}

func registerRoutes(p *alps.GoPlugin) {
	p.GET("/gpg/keys", func(ctx *alps.Context) error {
		if ctx.Session == nil {
			return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
		}

		// Read as the server holds it now: a keyring saved from another
		// session since this one first looked is the one to show, and the one
		// a client that saves the whole keyring back must start from.
		var keyring Keyring
		err := provider.GetFresh(ctx.Session.Store(), "gpg_keys", &keyring)
		if errors.Is(err, provider.ErrNoStoreEntry) {
			// Return empty 200 OK if no keys are found
			return ctx.JSON(http.StatusOK, Keyring{})
		} else if err != nil {
			return fmt.Errorf("failed to get gpg keys: %v", err)
		}

		return ctx.JSON(http.StatusOK, keyring)
	})

	p.POST("/gpg/keys", func(ctx *alps.Context) error {
		if ctx.Session == nil {
			return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
		}

		var req Keyring
		if err := ctx.BindJSON(&req); err != nil {
			return ctx.RespondBindError(err)
		}

		// A stored keypair is replaced only by a request that says so. Its
		// private key may be the only copy there is, and the settings page
		// offers a new keypair when it shows none: a save from a page that
		// read none while one was stored, or could not read it, keeps it.
		if ctx.QueryParam("replace") != "1" {
			var stored Keyring
			err := provider.GetFresh(ctx.Session.Store(), "gpg_keys", &stored)
			if err != nil && !errors.Is(err, provider.ErrNoStoreEntry) {
				return fmt.Errorf("failed to get gpg keys: %v", err)
			}
			if stored != (Keyring{}) {
				return alps.NewHTTPError(http.StatusConflict, "a keypair is stored already")
			}
		}

		if err := ctx.Session.Store().Put("gpg_keys", req); err != nil {
			return fmt.Errorf("failed to save gpg keys: %v", err)
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{"success": true})
	})

	p.DELETE("/gpg/keys", func(ctx *alps.Context) error {
		if ctx.Session == nil {
			return alps.NewHTTPError(http.StatusUnauthorized, "not logged in")
		}

		// To delete, we can put an empty keyring
		if err := ctx.Session.Store().Put("gpg_keys", Keyring{}); err != nil {
			return fmt.Errorf("failed to delete gpg keys: %v", err)
		}

		return ctx.JSON(http.StatusOK, map[string]interface{}{"success": true})
	})
}
