package koushinviewtext

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

// TODO: dim quotes and "On xxx, xxx wrote:" lines
// TODO: turn URLs into links

const tpl = `<pre>{{.}}</pre>`

type viewer struct{}

func (viewer) ViewMessagePart(ctx *koushin.Context, msg *koushinbase.IMAPMessage, part *message.Entity) (interface{}, error) {
	mimeType, _, err := part.Header.ContentType()
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(mimeType, "text/plain") {
		return nil, koushinbase.ErrViewUnsupported
	}

	body, err := ioutil.ReadAll(part.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read part body: %v", err)
	}

	t := template.Must(template.New("view-text.html").Parse(tpl))

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
