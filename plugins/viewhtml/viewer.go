package koushinviewhtml

import (
	"bytes"
	"fmt"
	"html/template"
	"io/ioutil"
	"strings"

	"git.sr.ht/~emersion/koushin"
	koushinbase "git.sr.ht/~emersion/koushin/plugins/base"
	"github.com/emersion/go-message"
)

const tpl = `
<!-- allow-same-origin is required to resize the frame with its content -->
<!-- allow-popups is required for target="_blank" links -->
<iframe id="email-frame" srcdoc="{{.}}" sandbox="allow-same-origin allow-popups"></iframe>
<script src="/plugins/viewhtml/assets/script.js"></script>
<link rel="stylesheet" href="/plugins/viewhtml/assets/style.css">
`

type viewer struct{}

func (viewer) ViewMessagePart(ctx *koushin.Context, msg *koushinbase.IMAPMessage, part *message.Entity) (interface{}, error) {
	mimeType, _, err := part.Header.ContentType()
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(mimeType, "text/html") {
		return nil, koushinbase.ErrViewUnsupported
	}

	body, err := ioutil.ReadAll(part.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read part body: %v", err)
	}

	body, err = sanitizeHTML(body)
	if err != nil {
		return nil, fmt.Errorf("failed to sanitize HTML part: %v", err)
	}

	t := template.Must(template.New("view-html.html").Parse(tpl))

	var buf bytes.Buffer
	err = t.Execute(&buf, string(body))
	if err != nil {
		return nil, err
	}

	return template.HTML(buf.String()), nil
}

func init() {
	koushinbase.RegisterViewer(viewer{})
}
