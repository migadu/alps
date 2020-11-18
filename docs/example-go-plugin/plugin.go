// Package exampleplugin is an example Go plugin for alps.
//
// To enable it, import this package from cmd/alps/main.go.
package exampleplugin

import (
	"fmt"
	"net/http"

	"git.sr.ht/~migadu/alps"
	alpsbase "git.sr.ht/~migadu/alps/plugins/base"
)

func init() {
	p := alps.GoPlugin{Name: "example"}

	// Setup a function called when the mailbox view is rendered
	p.Inject("mailbox.html", func(ctx *alps.Context, kdata alps.RenderData) error {
		data := kdata.(*alpsbase.MailboxRenderData)
		fmt.Println("The mailbox view for " + data.Mailbox.Name + " is being rendered")
		// Set extra data that can be accessed from the mailbox.html template
		data.Extra["Example"] = "Hi from Go"
		return nil
	})

	// Wire up a new route
	p.GET("/example", func(ctx *alps.Context) error {
		return ctx.String(http.StatusOK, "This is an example page.")
	})

	// Register a helper function that can be called from templates
	p.TemplateFuncs(map[string]interface{}{
		"example_and": func(a, b string) string {
			return a + " and " + b
		},
	})

	alps.RegisterPluginLoader(p.Loader())
}
