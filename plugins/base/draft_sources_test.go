package alpsbase

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"strings"
	"testing"

	"github.com/emersion/go-message"
)

// upload posts a file to /attachments as the composer does, and returns the
// id the session keeps it under.
func (s *testServer) upload(name, content string) string {
	s.t.Helper()
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	part, err := w.CreateFormFile("attachments", name)
	if err != nil {
		s.t.Fatal(err)
	}
	if _, err := io.WriteString(part, content); err != nil {
		s.t.Fatal(err)
	}
	if err := w.Close(); err != nil {
		s.t.Fatal(err)
	}
	req, err := http.NewRequest("POST", s.url+"/attachments?composer_id=c1", &body)
	if err != nil {
		s.t.Fatal(err)
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Origin", s.url)
	res, err := s.client.Do(req)
	if err != nil {
		s.t.Fatal(err)
	}
	defer res.Body.Close()
	data, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		s.t.Fatalf("upload: status %d: %s", res.StatusCode, data)
	}
	var ids []string
	if err := json.Unmarshal(data, &ids); err != nil || len(ids) != 1 {
		s.t.Fatalf("upload: %q, %v", data, err)
	}
	return ids[0]
}

type storedPart struct {
	Name     string `json:"name"`
	PartPath string `json:"partPath"`
	Inline   bool   `json:"inline"`
	Source   *struct {
		UUID     string `json:"uuid"`
		PartPath string `json:"partPath"`
	} `json:"source"`
}

type savedDraft struct {
	UID         string       `json:"draft_uid"`
	Mailbox     string       `json:"draft_mailbox"`
	Attachments []storedPart `json:"attachments"`
}

func (s *testServer) saveDraft(form url.Values) savedDraft {
	s.t.Helper()
	form.Set("save_as_draft", "1")
	r := s.do("POST", "/messages", form)
	s.expect(r, http.StatusOK)
	var saved savedDraft
	r.json(s.t, &saved)
	return saved
}

// partBody is a stored draft's part, decoded, as the reader downloads it.
func (s *testServer) partBody(mailbox, uid, path string) string {
	s.t.Helper()
	r := s.do("GET", "/mailboxes/"+url.PathEscape(url.PathEscape(mailbox))+"/messages/"+uid+"/raw?part="+path, nil)
	s.expect(r, http.StatusOK)
	return string(r.body)
}

func byName(t *testing.T, parts []storedPart) map[string]storedPart {
	t.Helper()
	out := make(map[string]storedPart, len(parts))
	for _, p := range parts {
		out[p.Name] = p
	}
	return out
}

// A draft save answers with the parts of the new draft, and says which upload
// or which earlier part each of them is. Without that the composer could not
// follow its entries into the new draft: it rebuilt its list from the answer,
// so an entry removed while the save was out came back, and the list lost
// its order.
func TestHTTP_ADraftSaveSaysWhereEachPartCameFrom(t *testing.T) {
	// Over IMAP: the maildir provider cannot say which message an append
	// stored, so its saves answer with no parts at all.
	s := newIMAPTestServer(t, figuresMessage)
	s.login()
	s.expect(s.do("POST", "/mailboxes", url.Values{"name": {"Drafts"}}), http.StatusOK)
	uid := s.mailbox("INBOX").Messages[0].UID
	notes := s.upload("notes.txt", "remember the milk")

	// A forward: an upload, and the file and the image it carries from the
	// original. The new draft numbers them afresh, so the original's part 2
	// is not the draft's part 2.
	form := forwardForm(uid)
	form.Set("attachment-uuids", notes)
	first := s.saveDraft(form)

	parts := byName(t, first.Attachments)
	for name, want := range map[string]string{"notes.txt": "uuid " + notes, "ledger.txt": "part 2", "chart.png": "part 1.2"} {
		p, ok := parts[name]
		if !ok {
			t.Fatalf("%s is not in the answer: %+v", name, first.Attachments)
		}
		got := "none"
		switch {
		case p.Source != nil && p.Source.UUID != "":
			got = "uuid " + p.Source.UUID
		case p.Source != nil && p.Source.PartPath != "":
			got = "part " + p.Source.PartPath
		}
		if got != want {
			t.Errorf("%s (stored as %s): source %s, want %s", name, p.PartPath, got, want)
		}
	}
	// Each stored part is the file its source names.
	s.checkContents(first, parts)

	// Saved again from that draft, in another order: each part is named by
	// where the draft before held it.
	again := url.Values{
		"to":               {"mary@remote.test"},
		"subject":          {"Fwd: Figures"},
		"text":             {"See below."},
		"html":             {`<p>See below.</p><blockquote><img src="cid:chart@remote.test"></blockquote>`},
		"prev_attachments": {parts["chart.png"].PartPath + "," + parts["ledger.txt"].PartPath + "," + parts["notes.txt"].PartPath},
		"draft_mailbox":    {first.Mailbox},
		"draft_uid":        {first.UID},
	}
	second := s.saveDraft(again)
	if len(second.Attachments) != 3 {
		t.Fatalf("the second draft holds %+v", second.Attachments)
	}
	for _, p := range second.Attachments {
		if p.Source == nil || p.Source.PartPath != parts[p.Name].PartPath || p.Source.UUID != "" {
			t.Errorf("%s: source %+v, want part %s", p.Name, p.Source, parts[p.Name].PartPath)
		}
	}
	s.checkContents(second, byName(t, second.Attachments))
}

// checkContents reads each file of a saved draft back by the part path its
// save answered with, and compares it with the file that was sent.
func (s *testServer) checkContents(draft savedDraft, parts map[string]storedPart) {
	s.t.Helper()
	for name, body := range map[string]string{
		"notes.txt":  "remember the milk",
		"ledger.txt": "one two three",
		"chart.png":  "\x89PNG\r\n\x1a\n",
	} {
		p, ok := parts[name]
		if !ok {
			s.t.Errorf("%s is not in draft %s", name, draft.UID)
			continue
		}
		if got := s.partBody(draft.Mailbox, draft.UID, p.PartPath); strings.TrimRight(got, "\r\n") != strings.TrimRight(body, "\r\n") {
			s.t.Errorf("%s: part %s of draft %s holds %q", name, p.PartPath, draft.UID, got)
		}
	}
}

// filePaths is where each file of a written message is, as IMAP numbers the
// message's parts, by file name.
func filePaths(t *testing.T, raw string) map[string]string {
	t.Helper()
	e, err := message.Read(strings.NewReader(raw))
	if err != nil {
		t.Fatal(err)
	}
	paths := map[string]string{}
	var walk func(e *message.Entity, path []int)
	walk = func(e *message.Entity, path []int) {
		if mr := e.MultipartReader(); mr != nil {
			for n := 1; ; n++ {
				p, err := mr.NextPart()
				if err == io.EOF {
					return
				}
				if err != nil {
					t.Fatal(err)
				}
				walk(p, append(append([]int(nil), path...), n))
			}
		}
		if _, params, _ := e.Header.ContentDisposition(); params["filename"] != "" {
			paths[params["filename"]] = formatPartPath(path)
		}
	}
	walk(e, nil)
	return paths
}

// The paths a draft save names its parts' sources by are worked out from the
// layout WriteTo writes, so the two have to agree on every layout, or a part
// is said to come from another's source.
func TestOutgoingMessage_PartPathsAreWhereTheAttachmentsAre(t *testing.T) {
	pdf := memAttachment{name: "report.pdf", mimeType: "application/pdf", body: []byte("%PDF")}
	notes := memAttachment{name: "notes.txt", mimeType: "text/plain", body: []byte("milk")}
	chart := chartImage("chart@remote.test")
	logo := &imapAttachment{
		Node:   &IMAPPartNode{MIMEType: "image/png", Filename: "logo.png"},
		Body:   []byte("\x89PNG\r\n"),
		CID:    "logo@remote.test",
		Inline: true,
	}
	images := `<img src="cid:chart@remote.test"><img src="cid:logo@remote.test">`

	for name, tc := range map[string]struct {
		html        string
		attachments []Attachment
	}{
		"text and files":                  {"", []Attachment{pdf, notes}},
		"HTML and files":                  {"<p>hi</p>", []Attachment{pdf, notes}},
		"images only":                     {images, []Attachment{chart, logo}},
		"images and files, interleaved":   {images, []Attachment{pdf, chart, notes, logo}},
		"an image without HTML is a file": {"", []Attachment{chart, pdf}},
	} {
		t.Run(name, func(t *testing.T) {
			msg := outgoing()
			msg.HTML = tc.html
			msg.Attachments = tc.attachments
			var buf bytes.Buffer
			if _, err := msg.WriteTo(&buf); err != nil {
				t.Fatal(err)
			}
			written := filePaths(t, buf.String())
			for i, path := range msg.partPaths() {
				file := tc.attachments[i].Filename()
				if written[file] != path {
					t.Errorf("%s: partPaths says %s, written at %s", file, path, written[file])
				}
			}
		})
	}
}
