package alpsviewtext

import (
	"bufio"
	"fmt"
	"html/template"
	"net/url"
	"strings"

	"git.sr.ht/~emersion/alps"
	alpsbase "git.sr.ht/~emersion/alps/plugins/base"
	"github.com/emersion/go-message"
	"gitlab.com/golang-commonmark/linkify"
)

// TODO: dim quotes and "On xxx, xxx wrote:" lines

const (
	tplStr     = `<pre>{{range .}}{{.}}{{end}}</pre>`
	linkTplStr = `<a href="{{.Href}}" target="_blank" rel="nofollow noopener">{{.Text}}</a>`
)

var tpl *template.Template

func init() {
	tpl = template.Must(template.New("view-text.html").Parse(tplStr))
	template.Must(tpl.New("view-text-link.html").Parse(linkTplStr))
}

type linkRenderData struct {
	Href string
	Text string
}

var allowedSchemes = map[string]bool{
	"http":   true,
	"https":  true,
	"mailto": true,
	"ftp":    true,
	"sftp":   true,
	"ftps":   true,
	"tel":    true,
}

func executeTemplate(name string, data interface{}) (template.HTML, error) {
	var sb strings.Builder
	err := tpl.ExecuteTemplate(&sb, name, data)
	if err != nil {
		return "", err
	}
	return template.HTML(sb.String()), nil
}

type viewer struct{}

func (viewer) ViewMessagePart(ctx *alps.Context, msg *alpsbase.IMAPMessage, part *message.Entity) (interface{}, error) {
	mimeType, _, err := part.Header.ContentType()
	if err != nil {
		return nil, err
	}
	if !strings.EqualFold(mimeType, "text/plain") {
		return nil, alpsbase.ErrViewUnsupported
	}

	var tokens []interface{}
	scanner := bufio.NewScanner(part.Body)
	for scanner.Scan() {
		l := scanner.Text()

		i := 0
		for _, link := range linkify.Links(l) {
			href := l[link.Start:link.End]
			if link.Scheme == "" {
				href = "https://" + href
			} else if !strings.HasPrefix(href, link.Scheme) {
				href = link.Scheme + href
			}

			u, err := url.Parse(href)
			if err != nil {
				continue
			}

			if !allowedSchemes[u.Scheme] {
				continue
			}

			// TODO: redirect mailto links to the composer

			if i < link.Start {
				tokens = append(tokens, l[i:link.Start])
			}
			tok, err := executeTemplate("view-text-link.html", linkRenderData{
				Href: href,
				Text: l[link.Start:link.End],
			})
			if err != nil {
				return nil, err
			}
			tokens = append(tokens, tok)
			i = link.End
		}
		if i < len(l) {
			tokens = append(tokens, l[i:])
		}

		tokens = append(tokens, "\n")
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("failed to read part body: %v", err)
	}

	return executeTemplate("view-text.html", tokens)
}

func init() {
	alpsbase.RegisterViewer(viewer{})
}
