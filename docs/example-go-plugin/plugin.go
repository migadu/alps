// Package exampleplugin is an example Go plugin for koushin.
//
// To enable it, import this package from cmd/koushin/main.go.
package exampleplugin

import (
	"fmt"
	"net/http"

	"git.sr.ht/~emersion/koushin"
	koushinbase "git.sr.ht/~emersion/koushin/plugins/base"
)

func init() {
	p := koushin.GoPlugin{Name: "example"}

	// Setup a function called when the mailbox view is rendered
	p.Inject("mailbox.html", func(ctx *koushin.Context, kdata koushin.RenderData) error {
		data := kdata.(*koushinbase.MailboxRenderData)
		fmt.Println("The mailbox view for " + data.Mailbox.Name + " is being rendered")
		// Set extra data that can be accessed from the mailbox.html template
		data.Extra["Example"] = "Hi from Go"
		return nil
	})

	// Wire up a new route
	p.GET("/example", func(ctx *koushin.Context) error {
		return ctx.String(http.StatusOK, "This is an example page.")
	})

	// Register a helper function that can be called from templates
	p.TemplateFuncs(map[string]interface{}{
		"example_and": func(a, b string) string {
			return a + " and " + b
		},
	})

	koushin.RegisterPluginLoader(p.Loader())
}
