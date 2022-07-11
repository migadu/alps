package alpsviewhtml

import (
	"bytes"
	"fmt"
	"html/template"
	"io/ioutil"
	"strings"

	"git.sr.ht/~migadu/alps"
	alpsbase "git.sr.ht/~migadu/alps/plugins/base"
	"github.com/emersion/go-message"
)

const tplSrc = `
<!-- allow-same-origin is required to resize the frame with its content -->
<!-- allow-popups is required for target="_blank" links -->
<iframe id="email-frame" src="{{.}}" sandbox="allow-same-origin allow-popups"></iframe>
<script src="/plugins/viewhtml/assets/script.js"></script>
<link rel="stylesheet" href="/plugins/viewhtml/assets/style.css">
`

var tpl = template.Must(template.New("view-html.html").Parse(tplSrc))

type viewer struct{}

func (viewer) ViewMessagePart(ctx *alps.Context, msg *alpsbase.IMAPMessage, part *message.Entity) (interface{}, error) {
	allowRemoteResources := ctx.QueryParam("allow-remote-resources") == "1"

	mimeType, _, err := part.Header.ContentType()
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(mimeType, "text/html") {
		return nil, alpsbase.ErrViewUnsupported
	}

	body, err := ioutil.ReadAll(part.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read part body: %v", err)
	}

	san := sanitizer{
		msg:                  msg,
		allowRemoteResources: allowRemoteResources,
	}
	body, err = san.sanitizeHTML(body)
	if err != nil {
		return nil, fmt.Errorf("failed to sanitize HTML part: %v", err)
	}

	if ctx.QueryParam("src") == "1" {
		return template.HTML(string(body)), nil
	} else {
		ctx.Set("viewhtml.hasRemoteResources", san.hasRemoteResources)

		u := ctx.Request().URL
		q := u.Query()
		q.Set("src", "1")
		u.RawQuery = q.Encode()

		var buf bytes.Buffer
		err = tpl.Execute(&buf, u.String())
		if err != nil {
			return nil, err
		}

		return template.HTML(buf.String()), nil
	}
}

func init() {
	alpsbase.RegisterViewer(viewer{})
}
